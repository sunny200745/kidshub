/**
 * QuickLogSheet — the 2-tap quick-log bottom sheet shared by:
 *
 *   (A) The Add Entry tab's 2-col grid  (Sprint 2 / B4). Tapping a
 *       grid card opens the sheet with `type` pre-filled; the user
 *       picks a child, types notes, saves.
 *
 *   (B) The Home tab's per-child 3-dot action menu (Sprint 2 / B3).
 *       Tapping "Log meal" on a child row opens this sheet with BOTH
 *       `type` AND `preselectedChild` pre-filled — the user's first
 *       and only action is typing notes and hitting save.
 *
 * Case (A) is 2 taps: grid card → save. Case (B) is 1 tap: save.
 *
 * The old 3-step modal (type → child → notes) still lives in
 * `(teacher)/activities.tsx`'s NewActivityModal and will be retired
 * once Sprint 2 fully ships the grid. Until then, keep this file
 * independent — it should not import from that modal.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertTriangle, Check, Search } from 'lucide-react-native';

import { Avatar, Badge, SheetModal } from '@/components/ui';
import { ActivityIcon, activityLabels } from '@/components/icons/activity-icon';
import type { ActivityType, Child } from '@/firebase/types';

export type QuickLogSubmit = {
  childId: string;
  type: ActivityType;
  notes: string;
};

export type QuickLogSheetProps = {
  visible: boolean;
  /** Pre-filled activity type. Required — callers always know the type. */
  type: ActivityType | null;
  /** Optional pre-filled child. When set, the picker step is skipped. */
  preselectedChild?: Child | null;
  roster: Child[];
  /** Returns a promise so the sheet can show a spinner + inline errors. */
  onSubmit: (payload: QuickLogSubmit) => Promise<void>;
  onClose: () => void;
  errorMessage?: string | null;
  /** Optional overrides for the sheet header (defaults derived from `type`). */
  title?: string;
  subtitle?: string;
};

export function QuickLogSheet({
  visible,
  type,
  preselectedChild = null,
  roster,
  onSubmit,
  onClose,
  errorMessage = null,
  title,
  subtitle,
}: QuickLogSheetProps) {
  const [child, setChild] = useState<Child | null>(preselectedChild);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset state every time the sheet opens so we don't leak notes between
  // two unrelated quick-log flows.
  useEffect(() => {
    if (visible) {
      setChild(preselectedChild);
      setNotes('');
      setSearch('');
      setSaving(false);
    }
  }, [visible, preselectedChild]);

  const filteredRoster = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.trim().toLowerCase();
    return roster.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q),
    );
  }, [roster, search]);

  const close = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!type || !child) return;
    setSaving(true);
    try {
      await onSubmit({
        childId: child.id,
        type,
        notes: notes.trim() || `${activityLabels[type] ?? type} logged`,
      });
    } finally {
      setSaving(false);
    }
  };

  const effectiveTitle =
    title ?? (type ? `Log ${activityLabels[type] ?? type}` : 'Quick log');
  const effectiveSubtitle =
    subtitle ??
    (child
      ? `For ${child.firstName} ${child.lastName}`
      : 'Choose a child to continue');

  return (
    <SheetModal
      visible={visible}
      onClose={close}
      title={effectiveTitle}
      subtitle={effectiveSubtitle}
      dismissible={!saving}>
      {type ? (
        <View className="flex-row items-center gap-3 mb-4 bg-surface-50 dark:bg-surface-800 p-3 rounded-2xl">
          <ActivityIcon type={type} size="md" />
          <View className="flex-1">
            <Text className="text-xs uppercase tracking-wider font-bold text-surface-500 dark:text-surface-400">
              Entry type
            </Text>
            <Text className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {activityLabels[type]}
            </Text>
          </View>
        </View>
      ) : null}

      {!child ? (
        <>
          <View className="flex-row items-center gap-2 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-xl px-3 mb-3">
            <Search size={16} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search children..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 py-3 text-surface-900 dark:text-surface-50"
            />
          </View>
          <ScrollView className="max-h-[340px]" showsVerticalScrollIndicator={false}>
            {filteredRoster.length === 0 ? (
              <Text className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">
                No children match &ldquo;{search}&rdquo;
              </Text>
            ) : (
              filteredRoster.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setChild(c)}
                  className="flex-row items-center gap-3 p-3 rounded-xl mb-1 active:bg-surface-50 dark:active:bg-surface-800">
                  <Avatar name={`${c.firstName} ${c.lastName}`} size="md" />
                  <View className="flex-1 min-w-0">
                    <Text className="font-semibold text-surface-900 dark:text-surface-50">
                      {c.firstName} {c.lastName}
                    </Text>
                    {c.age ? (
                      <Text className="text-xs text-surface-500 dark:text-surface-400">
                        {c.age}
                      </Text>
                    ) : null}
                  </View>
                  {c.allergies && c.allergies.length > 0 ? (
                    <Badge variant="danger">
                      <AlertTriangle size={10} color="#B91C1C" />
                    </Badge>
                  ) : null}
                </Pressable>
              ))
            )}
          </ScrollView>
          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={close}
              className="flex-1 border border-surface-200 dark:border-surface-700 rounded-2xl py-3 items-center">
              <Text className="font-semibold text-surface-700 dark:text-surface-100">
                Cancel
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View className="bg-surface-50 dark:bg-surface-800 rounded-2xl p-3 flex-row items-center gap-3 mb-4">
            <Avatar name={`${child.firstName} ${child.lastName}`} size="md" />
            <View className="flex-1 min-w-0">
              <Text className="font-semibold text-surface-900 dark:text-surface-50">
                {child.firstName} {child.lastName}
              </Text>
              {child.age ? (
                <Text className="text-xs text-surface-500 dark:text-surface-400">
                  {child.age}
                </Text>
              ) : null}
            </View>
            {!preselectedChild ? (
              <Pressable onPress={() => setChild(null)} hitSlop={8}>
                <Text className="text-xs font-semibold text-teacher-600 dark:text-teacher-300">
                  Change
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={`Add details about this ${type ? activityLabels[type].toLowerCase() : 'entry'}...`}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            editable={!saving}
            className="border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 rounded-xl px-4 py-3 mb-3"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />

          {errorMessage ? (
            <Text className="text-sm text-danger-600 dark:text-danger-400 mb-3">
              {errorMessage}
            </Text>
          ) : null}

          <View className="flex-row gap-3 mt-2">
            <Pressable
              onPress={close}
              disabled={saving}
              className="flex-1 border border-surface-200 dark:border-surface-700 rounded-2xl py-3 items-center">
              <Text className="font-semibold text-surface-700 dark:text-surface-100">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={saving}
              className={`flex-1 rounded-2xl py-3 items-center flex-row justify-center gap-2 ${saving ? 'bg-teacher-400' : 'bg-teacher-500 active:opacity-80'}`}>
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Check size={18} color="white" />
              )}
              <Text className="text-white font-bold">Save entry</Text>
            </Pressable>
          </View>
        </>
      )}
    </SheetModal>
  );
}
