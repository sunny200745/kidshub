/**
 * /photos — parent-side photo gallery (Sprint 6 / C4).
 *
 * Shows every photo tagged to any of the parent's linked children. Photos
 * are only *uploaded* by staff (teachers or owners) through the teacher
 * app or the dashboard — this screen is read-only for parents.
 *
 * Tier behavior (Sprint 5 / D1 wiring):
 *   - Pro+ (demoMode on, trial, pro, premium): live gallery from the
 *     `photos` Firestore collection, reverse-chronological, tap-to-
 *     expand for full-size view.
 *   - Starter: gallery is replaced with an `<UpgradeCTA feature="photoJournal">`
 *     plus a dimmed preview so the parent knows what they'd unlock.
 *
 * We do NOT wrap the whole screen in <FeatureGate> — the empty-state
 * hero (avatar + classroom stripe) still renders so the screen never
 * looks broken for Starter users.
 *
 * NOTE(infra-lock): while `photoJournal` lives in INFRA_LOCKED_FEATURES
 * (config/product.ts), `useFeature('photoJournal').enabled` is false for
 * every tier — so every parent currently sees the UpgradeCTA path
 * regardless of their daycare's plan. Removing the key from that set
 * (once Firebase Storage is enabled + storage.rules is published)
 * restores the standard tier-based behavior above.
 */
import { Image } from 'expo-image';
import { Camera, HelpCircle, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { UpgradeCTA } from '@/components/upgrade-cta';
import {
  Avatar,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
} from '@/components/ui';
import {
  useClassroom,
  useFeature,
  useMyChildren,
  useMyChildrenPhotos,
} from '@/hooks';
import type { Photo } from '@/firebase/types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
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
      const d = new Date(key + 'T12:00:00');
      const today = new Date().toISOString().slice(0, 10);
      const yesterdayIso = new Date(Date.now() - 86_400_000)
        .toISOString()
        .slice(0, 10);
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

function PhotoGrid({ photos, onTap }: { photos: Photo[]; onTap: (p: Photo) => void }) {
  return (
    <View className="flex-row flex-wrap -mx-0.5">
      {photos.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onTap(p)}
          className="w-1/3 aspect-square p-0.5">
          <Image
            source={{ uri: p.thumbnailUrl ?? p.imageUrl }}
            style={{ flex: 1, borderRadius: 8 }}
            contentFit="cover"
            transition={150}
          />
        </Pressable>
      ))}
    </View>
  );
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
              {photo.uploadedByName
                ? `${photo.uploadedByName} · ${formatTime(photo.timestamp)}`
                : formatTime(photo.timestamp)}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function StarterPreview() {
  return (
    <Card className="opacity-60">
      <CardBody>
        <View className="flex-row items-center gap-2 mb-3">
          <Camera size={16} color="#94a3b8" />
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200">
            Sample gallery preview
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
          Real photos from your daycare will appear here once they upgrade
          their membership plan.
        </Text>
      </CardBody>
    </Card>
  );
}

export default function ParentPhotos() {
  const { data: children, loading: childrenLoading } = useMyChildren();
  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const child = children[0] ?? null;
  const { data: classroom } = useClassroom(
    child?.classroomId ?? child?.classroom ?? null,
  );

  const feature = useFeature('photoJournal');
  const { data: photos, loading: photosLoading } = useMyChildrenPhotos(childIds);
  const sections = useMemo(() => groupByDay(photos), [photos]);

  const [viewer, setViewer] = useState<Photo | null>(null);

  if (childrenLoading) {
    return (
      <ScreenContainer title="Photos">
        <LoadingState message="Loading photos" />
      </ScreenContainer>
    );
  }

  if (!child) {
    return (
      <ScreenContainer title="Photos">
        <EmptyState
          icon={HelpCircle}
          title="No child linked yet"
          description="Photos from the daycare will appear here once your child is linked to your account."
        />
      </ScreenContainer>
    );
  }

  const accentColor = classroom?.color ?? child.classroomColor ?? '#FF2D8A';

  return (
    <ScreenContainer title="Photos" subtitle={`${child.firstName}'s gallery`}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-5">
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: accentColor,
            }}
            className="items-center justify-center">
            <Avatar
              name={`${child.firstName} ${child.lastName}`}
              size="md"
              className="border-2 border-white"
            />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-surface-900 dark:text-surface-50">
              {child.firstName}&apos;s photos
            </Text>
            <Text className="text-xs text-surface-500 dark:text-surface-400">
              {classroom?.name ?? child.classroom ?? 'Classroom'}
            </Text>
          </View>
          {feature.enabled ? (
            <Pill tone="success" variant="soft" size="sm" label={`${photos.length} total`} />
          ) : null}
        </View>

        {feature.loading ? (
          <LoadingState message="Checking your plan" />
        ) : !feature.enabled ? (
          <View className="gap-4">
            <UpgradeCTA
              feature="photoJournal"
              upgradeTo={feature.upgradeTo}
              variant="card"
              description="Daily photo galleries from your daycare are part of our paid membership plans. Ask your daycare to upgrade to unlock photos of your child."
            />
            <StarterPreview />
          </View>
        ) : photosLoading ? (
          <LoadingState message="Loading photos" />
        ) : sections.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description="When your daycare uploads photos, you'll see them here — grouped by day."
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
                    {section.photos.length}{' '}
                    {section.photos.length === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
                <PhotoGrid photos={section.photos} onTap={setViewer} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <PhotoViewer photo={viewer} onClose={() => setViewer(null)} />
    </ScreenContainer>
  );
}
