/**
 * ChildSwitcher — horizontal sibling chip strip for multi-child parents.
 *
 * UX: a horizontally-scrollable row of round avatars with the child's
 * first name beneath. The selected child is wrapped in a colored ring
 * and the name turns brand-pink; tapping a non-selected chip switches
 * the active child globally (via SelectedChildContext) and every
 * sibling parent screen re-keys to the new child.
 *
 * The component renders NOTHING when there's only one child — single-
 * sibling parents see their existing UI unchanged. So the typical
 * cost of dropping <ChildSwitcher /> at the top of a parent screen is
 * zero pixels for the common case.
 *
 * Important: this only writes to context; it never reads or writes
 * Firestore directly. The parent context already has the live children
 * list; we just expose a way to choose between them.
 */
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useSelectedChild } from '@/contexts';

const BRAND_PINK = '#FF2D8A';

export function ChildSwitcher({ className = '' }: { className?: string }) {
  const { children, selectedChildId, setSelectedChildId } = useSelectedChild();

  // Single-sibling families: render nothing. Saves vertical space and
  // means screens can drop <ChildSwitcher /> in unconditionally without
  // worrying about layout collapse.
  if (children.length <= 1) return null;

  return (
    <View className={`px-1 ${className}`}>
      <Text className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
        Viewing
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
        {children.map((child) => {
          const isSelected = child.id === selectedChildId;
          return (
            <Pressable
              key={child.id}
              onPress={() => setSelectedChildId(child.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`View ${child.firstName}`}
              className="items-center"
              style={{ width: 64 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: isSelected ? 2.5 : 1,
                  borderColor: isSelected ? BRAND_PINK : 'transparent',
                  padding: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Avatar
                  name={`${child.firstName} ${child.lastName}`}
                  size="md"
                />
              </View>
              <Text
                numberOfLines={1}
                className={`text-xs mt-1 ${
                  isSelected
                    ? 'font-semibold text-brand-600 dark:text-brand-400'
                    : 'text-surface-600 dark:text-surface-300'
                }`}
                style={{ maxWidth: 64 }}>
                {child.firstName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
