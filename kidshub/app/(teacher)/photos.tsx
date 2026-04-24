/**
 * /photos — teacher-side photo journal (Sprint 5 / D1).
 *
 * Displays every photo in the teacher's classroom (reverse-chronological,
 * grouped by day) and lets the teacher upload new photos tagged to one or
 * more children.
 *
 * Upload strategy — deliberately platform-aware until `expo-image-picker`
 * is wired into the native bundle (tracked under Track F prerequisites):
 *
 *   - Web → a hidden `<input type="file">` captures the blob and feeds
 *     `photosApi.uploadBlob()`. Works out-of-the-box in Expo Web.
 *   - Native → render a prompt that nudges the teacher to use the
 *     dashboard or web app. We surface a "Paste image URL" fallback so
 *     demos can still produce photos without a native build.
 *
 * Gated by `photoJournal` client-side and by `planAllows('photoJournal')`
 * in Firestore rules. Reads are not gated (teachers still see existing
 * photos even if the daycare downgrades) so nothing disappears from the
 * UI unexpectedly.
 *
 * NOTE(infra-lock): `photoJournal` currently lives in
 * `INFRA_LOCKED_FEATURES` (see config/product.ts) because Firebase
 * Storage requires the Blaze plan, which we haven't enabled. This forces
 * `useFeature('photoJournal').enabled === false` for every tier, so this
 * page always renders the upgrade CTA today — no user hits the actual
 * uploader (which would fail at the Storage layer). When infra is ready,
 * removing the key from that set instantly re-enables Pro+ uploads with
 * zero other changes.
 */
import { Image } from 'expo-image';
import {
  AlertCircle,
  Camera,
  Check,
  Image as ImageIcon,
  Plus,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { UpgradeCTA } from '@/components/upgrade-cta';
import {
  ActionButton,
  Avatar,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
  SheetModal,
} from '@/components/ui';
import { useAuth } from '@/contexts';
import { photosApi } from '@/firebase/api';
import type { Child, Photo } from '@/firebase/types';
import {
  useClassroomPhotos,
  useClassroomRoster,
  useFeature,
} from '@/hooks';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type DaySection = { label: string; photos: Photo[] };

function groupByDay(photos: Photo[]): DaySection[] {
  const groups = new Map<string, Photo[]>();
  for (const p of photos) {
    const key = p.timestamp.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, list]) => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterdayIso = new Date(Date.now() - 86_400_000)
        .toISOString()
        .slice(0, 10);
      const d = new Date(key + 'T12:00:00');
      const label =
        key === today
          ? 'Today'
          : key === yesterdayIso
            ? 'Yesterday'
            : d.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              });
      return { label, photos: list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)) };
    });
}

function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  if (!photo) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/95 items-center justify-center">
        <Pressable
          onPress={onClose}
          className="absolute top-12 right-5 w-10 h-10 rounded-full bg-black/60 items-center justify-center z-10">
          <X size={22} color="#ffffff" />
        </Pressable>
        <View className="w-full aspect-square">
          <Image
            source={{ uri: photo.imageUrl }}
            style={{ flex: 1 }}
            contentFit="contain"
          />
        </View>
        {photo.caption ? (
          <View className="absolute bottom-12 left-6 right-6">
            <Text className="text-white text-center text-base">{photo.caption}</Text>
            <Text className="text-white/60 text-center text-xs mt-1">
              {formatTime(photo.timestamp)}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function UploadSheet({
  visible,
  roster,
  onClose,
  onSubmitUrl,
  onSubmitBlob,
  submitting,
}: {
  visible: boolean;
  roster: Child[];
  onClose: () => void;
  onSubmitUrl: (url: string, caption: string, childIds: string[]) => Promise<void>;
  onSubmitBlob: (blob: Blob, filename: string, caption: string, childIds: string[]) => Promise<void>;
  submitting: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [pickedBlob, setPickedBlob] = useState<{ blob: Blob; filename: string; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleChild = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAndClose = () => {
    setSelected(new Set());
    setCaption('');
    setUrlInput('');
    setPickedBlob(null);
    onClose();
  };

  const isWeb = Platform.OS === 'web';

  const handleWebFilePick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const onFileSelected = (event: { target: HTMLInputElement }) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPickedBlob({ blob: file, filename: file.name, previewUrl });
  };

  const canSubmit =
    selected.size > 0 &&
    !submitting &&
    (pickedBlob !== null || urlInput.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const ids = Array.from(selected);
    if (pickedBlob) {
      await onSubmitBlob(pickedBlob.blob, pickedBlob.filename, caption.trim(), ids);
    } else {
      await onSubmitUrl(urlInput.trim(), caption.trim(), ids);
    }
    resetAndClose();
  };

  return (
    <SheetModal visible={visible} onClose={resetAndClose} title="New photo">
      <View className="gap-4">
        {/* Picker block */}
        {isWeb ? (
          <View>
            {/* Hidden native input; tap "Choose photo" to trigger it. */}
            {/* Rendered via react-native-web's DOM passthrough. */}
            {React.createElement('input', {
              ref: fileInputRef,
              type: 'file',
              accept: 'image/*',
              onChange: onFileSelected,
              style: { display: 'none' },
            })}
            <Pressable
              onPress={handleWebFilePick}
              className="rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700 p-6 items-center">
              {pickedBlob ? (
                <View className="items-center gap-2">
                  <View className="w-32 h-32 rounded-lg overflow-hidden">
                    <Image
                      source={{ uri: pickedBlob.previewUrl }}
                      style={{ flex: 1 }}
                      contentFit="cover"
                    />
                  </View>
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    {pickedBlob.filename}
                  </Text>
                  <Text className="text-xs text-brand-600 font-semibold">
                    Tap to pick a different photo
                  </Text>
                </View>
              ) : (
                <View className="items-center gap-2">
                  <ImageIcon size={28} color="#94a3b8" />
                  <Text className="font-semibold text-surface-700 dark:text-surface-200">
                    Choose a photo
                  </Text>
                  <Text className="text-xs text-surface-500 dark:text-surface-400 text-center">
                    JPG or PNG, up to ~10MB.
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="rounded-2xl bg-info-50 dark:bg-info-900/20 border border-info-100 dark:border-info-900/40 p-4 flex-row gap-2">
            <AlertCircle size={16} color="#0891B2" />
            <Text className="text-xs text-info-800 dark:text-info-200 flex-1">
              Native photo picker ships in the next app-store build. For now, paste
              an image URL below — photos uploaded from the web dashboard or the
              owner portal will still show up live on your gallery.
            </Text>
          </View>
        )}

        {/* URL fallback — always available, useful for demos + native. */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Or paste image URL
          </Text>
          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="https://…"
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Caption */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Caption (optional)
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Story time with Miss Chloe…"
            multiline
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50 min-h-[60px]"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Tag children */}
        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Tag children · at least 1
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {roster.map((c) => {
              const active = selected.has(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggleChild(c.id)}
                  className={`flex-row items-center gap-2 rounded-full px-3 py-2 border ${
                    active
                      ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                  }`}>
                  {active ? <Check size={14} color="#E11D74" /> : null}
                  <Text
                    className={`text-xs font-semibold ${
                      active
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-surface-700 dark:text-surface-200'
                    }`}>
                    {c.firstName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-2 pt-2">
          <View className="flex-1">
            <ActionButton
              label="Cancel"
              onPress={resetAndClose}
              variant="outline"
              size="md"
            />
          </View>
          <View className="flex-1">
            <ActionButton
              label={submitting ? 'Uploading…' : 'Post photo'}
              onPress={handleSubmit}
              icon={Upload}
              tone="teal"
              size="md"
              loading={submitting}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </View>
    </SheetModal>
  );
}

export default function TeacherPhotos() {
  const { profile } = useAuth();
  const feature = useFeature('photoJournal');
  const { data: photos, loading: photosLoading } = useClassroomPhotos();
  const { data: roster } = useClassroomRoster();

  const [viewer, setViewer] = useState<Photo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(() => groupByDay(photos), [photos]);

  const uploaderName = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || undefined
    : undefined;

  const submitUrl = async (url: string, caption: string, childIds: string[]) => {
    if (!profile?.daycareId || !profile.classroomId || !profile.uid) return;
    setSubmitting(true);
    try {
      await photosApi.createFromUrl({
        daycareId: profile.daycareId as string,
        classroomId: profile.classroomId as string,
        uploadedBy: profile.uid as string,
        uploadedByName: uploaderName,
        childIds,
        imageUrl: url,
        caption,
      });
    } catch (err) {
      console.error('[teacher photos] createFromUrl failed:', err);
      Alert.alert('Upload failed', 'Could not save the photo. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBlob = async (
    blob: Blob,
    filename: string,
    caption: string,
    childIds: string[],
  ) => {
    if (!profile?.daycareId || !profile.classroomId || !profile.uid) return;
    setSubmitting(true);
    try {
      await photosApi.uploadBlob({
        daycareId: profile.daycareId as string,
        classroomId: profile.classroomId as string,
        uploadedBy: profile.uid as string,
        uploadedByName: uploaderName,
        childIds,
        caption,
        blob,
        filename,
      });
    } catch (err) {
      console.error('[teacher photos] uploadBlob failed:', err);
      Alert.alert(
        'Upload failed',
        'Could not upload the photo. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (feature.loading) {
    return (
      <ScreenContainer title="Photos" subtitle="Classroom gallery">
        <LoadingState message="Checking your plan" />
      </ScreenContainer>
    );
  }

  if (!feature.enabled) {
    return (
      <ScreenContainer title="Photos" subtitle="Classroom gallery">
        <View className="gap-4">
          <UpgradeCTA
            feature="photoJournal"
            upgradeTo={feature.upgradeTo}
            variant="card"
            description="Photo and video sharing with parents is part of our paid membership plans. Ask your daycare to upgrade to unlock daily photo journals."
          />
          <Card>
            <CardBody>
              <View className="flex-row items-center gap-2 mb-2">
                <Camera size={16} color="#94a3b8" />
                <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                  Preview
                </Text>
              </View>
              <View className="flex-row -mx-0.5">
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{ aspectRatio: 1 }}
                    className="flex-1 mx-0.5 rounded-lg bg-surface-100 dark:bg-surface-800 items-center justify-center">
                    <Camera size={24} color="#cbd5e1" />
                  </View>
                ))}
              </View>
              <Text className="text-xs text-surface-500 dark:text-surface-400 mt-3">
                This is where today&apos;s classroom photos would appear. Parents
                see a matching gallery on their phones.
              </Text>
            </CardBody>
          </Card>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Photos" subtitle="Classroom gallery">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-3 mb-5">
          <View className="flex-1">
            <Text className="font-semibold text-surface-900 dark:text-surface-50">
              Today&apos;s classroom
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · visible
              to tagged parents
            </Text>
          </View>
          <Pill tone="teal" variant="soft" size="sm" label="Pro" />
        </View>

        <View className="mb-5">
          <ActionButton
            label="Upload photo"
            icon={Plus}
            tone="teal"
            size="lg"
            onPress={() => setSheetOpen(true)}
          />
        </View>

        {photosLoading ? (
          <LoadingState message="Loading gallery" />
        ) : sections.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description="Tap Upload photo to share your first classroom moment with parents."
          />
        ) : (
          <View className="gap-6">
            {sections.map((section) => (
              <View key={section.label}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-semibold text-surface-900 dark:text-surface-50">
                    {section.label}
                  </Text>
                  <Text className="text-[11px] uppercase tracking-wider text-surface-400 font-semibold">
                    {section.photos.length}
                  </Text>
                </View>
                <View className="flex-row flex-wrap -mx-0.5">
                  {section.photos.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => setViewer(p)}
                      className="w-1/3 aspect-square p-0.5">
                      <Image
                        source={{ uri: p.thumbnailUrl ?? p.imageUrl }}
                        style={{ flex: 1, borderRadius: 8 }}
                        contentFit="cover"
                        transition={150}
                      />
                      {p.childIds.length > 1 ? (
                        <View className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-0.5">
                          <Text className="text-[10px] font-semibold text-white">
                            +{p.childIds.length - 1}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick link to classroom roster in case it's empty. */}
        {roster.length === 0 ? (
          <Card className="mt-6">
            <CardBody>
              <View className="flex-row items-center gap-2">
                <Avatar name="?" size="sm" />
                <Text className="flex-1 text-xs text-surface-600 dark:text-surface-300">
                  Add children to your classroom before uploading photos so they
                  can be tagged.
                </Text>
              </View>
            </CardBody>
          </Card>
        ) : null}
      </ScrollView>

      <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />
      <UploadSheet
        visible={sheetOpen}
        roster={roster}
        onClose={() => setSheetOpen(false)}
        onSubmitUrl={submitUrl}
        onSubmitBlob={submitBlob}
        submitting={submitting}
      />
    </ScreenContainer>
  );
}
