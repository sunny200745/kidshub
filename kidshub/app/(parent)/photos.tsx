/**
 * /photos — the parent's photo gallery for the selected child.
 *
 * Ported from kidshub-legacy/src/pages/Photos.jsx. Behavior:
 *   - Photos are grouped by date heading (Today / Yesterday / etc as
 *     localized strings from Date.toLocaleDateString).
 *   - Grid: 2 cols on narrow phones. Legacy was 2/3/4 responsive; RN Web
 *     keeps 2 since we're phone-first and width breakpoints complicate RN.
 *   - Tap a thumbnail → full-screen Modal with previous/next chevrons.
 *   - No photos? Empty-state card with a muted message.
 *
 * Note on legacy-only features we skipped on purpose:
 *   - Heart (favorite) + Download buttons from the modal header. Both were
 *     no-op stubs in legacy. We'll bring them back when there's real
 *     persistence behind them.
 *   - Hover-to-reveal caption overlay — hover is web-only. Caption is shown
 *     in the modal instead.
 */
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Card, CardBody } from '@/components/ui';
import { myChildren, photos, type Photo } from '@/data/mockData';

// `ImageIcon` is lucide-react-native's export for the web's `Image` lucide
// icon; the plain name collides with RN's `Image` component so lucide chose
// the `Icon` suffix here. Keeping the distinction readable at call sites.
function PhotoModal({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  photo: Photo | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { width, height } = useWindowDimensions();
  if (!photo) return null;

  const caption = photo.caption;
  const dateLabel = new Date(photo.timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Modal
      visible={photo !== null}
      animationType="fade"
      onRequestClose={onClose}
      transparent={false}>
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-black">
        <View className="flex-row items-center justify-between p-4 pt-12">
          <Pressable onPress={onClose} hitSlop={12}>
            <X size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-4">
          {hasPrev ? (
            <Pressable
              onPress={onPrev}
              style={{ position: 'absolute', left: 8, zIndex: 10 }}
              className="bg-white/10 p-3 rounded-full">
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
          ) : null}

          <Image
            source={{ uri: photo.url }}
            accessibilityLabel={caption}
            style={{
              // Reserve ~25% of the height for the header + caption chrome.
              width: width - 32,
              height: height * 0.65,
              borderRadius: 12,
            }}
            resizeMode="contain"
          />

          {hasNext ? (
            <Pressable
              onPress={onNext}
              style={{ position: 'absolute', right: 8, zIndex: 10 }}
              className="bg-white/10 p-3 rounded-full">
              <ChevronRight size={24} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <View className="p-6 items-center">
          <Text className="text-white text-lg font-medium">{caption}</Text>
          <Text className="text-white/60 text-sm mt-1">{dateLabel}</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function ParentPhotos() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const child = myChildren[0];

  // Group-by-date needs to preserve the original array order so that
  // previous/next navigation in the modal keeps working via global index.
  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const photo of photos) {
      const date = new Date(photo.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const bucket = map.get(date);
      if (bucket) {
        bucket.push(photo);
      } else {
        map.set(date, [photo]);
      }
    }
    return Array.from(map.entries());
  }, []);

  const activePhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <ScreenContainer title="Photos" subtitle={`${photos.length} photos`}>
      {/* Header: colored avatar + name */}
      <View className="flex-row items-center gap-3 mb-6">
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: child.classroomColor,
          }}
          className="items-center justify-center">
          <Text className="text-white font-bold">{child.firstName[0]}</Text>
        </View>
        <View>
          <Text className="font-semibold text-surface-900 dark:text-surface-50">
            {child.firstName}&apos;s Photos
          </Text>
          <Text className="text-sm text-surface-500 dark:text-surface-400">
            {photos.length} photos from daycare
          </Text>
        </View>
      </View>

      {grouped.length === 0 ? (
        <Card>
          <CardBody className="py-16 items-center">
            <View
              style={{ width: 64, height: 64, borderRadius: 16 }}
              className="bg-surface-100 dark:bg-surface-800 items-center justify-center mb-4">
              <ImageIcon size={32} color="#94A3B8" />
            </View>
            <Text className="text-surface-500 dark:text-surface-400 font-medium">
              No photos yet
            </Text>
            <Text className="text-sm text-surface-400 dark:text-surface-500 mt-1">
              Photos from the daycare will appear here
            </Text>
          </CardBody>
        </Card>
      ) : (
        grouped.map(([date, datePhotos]) => (
          <View key={date} className="mb-8">
            <Text className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-3">
              {date}
            </Text>
            <View className="flex-row flex-wrap -m-1">
              {datePhotos.map((photo) => {
                const globalIndex = photos.findIndex((p) => p.id === photo.id);
                return (
                  <View key={photo.id} className="w-1/2 p-1" style={{ aspectRatio: 1 }}>
                    <Pressable
                      onPress={() => setSelectedIndex(globalIndex)}
                      style={{ flex: 1 }}>
                      <Image
                        source={{ uri: photo.url }}
                        accessibilityLabel={photo.caption}
                        style={{ flex: 1, borderRadius: 16 }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))
      )}

      <PhotoModal
        photo={activePhoto}
        onClose={() => setSelectedIndex(null)}
        onPrev={() => setSelectedIndex((i) => (i !== null ? Math.max(0, i - 1) : 0))}
        onNext={() =>
          setSelectedIndex((i) => (i !== null ? Math.min(photos.length - 1, i + 1) : 0))
        }
        hasPrev={selectedIndex !== null && selectedIndex > 0}
        hasNext={selectedIndex !== null && selectedIndex < photos.length - 1}
      />
    </ScreenContainer>
  );
}
