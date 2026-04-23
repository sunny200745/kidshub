/**
 * /weekly-planner — teacher-side weekly lesson plan (Sprint 7 / D6).
 *
 * Renders a Mon-Fri grid for the current ISO week. Teachers can add
 * items to any slot; parents see the same plan read-only on their
 * schedule screen (C5).
 *
 * MVP: we treat time-slots as free-form strings ("9:00 AM") and store
 * everything in a single `weeklyPlans/{classroomId}_{weekStart}` doc.
 * Drag-and-drop is a nice-to-have; for demo it's simpler to open a
 * sheet and add/delete items.
 */
import { Plus, Trash2, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { UpgradeCTA } from '@/components/upgrade-cta';
import {
  ActionButton,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
  SheetModal,
} from '@/components/ui';
import { useAuth } from '@/contexts';
import { isoWeekStart, weeklyPlansApi } from '@/firebase/api';
import type { WeeklyPlanItem } from '@/firebase/types';
import { useClassroomWeeklyPlan, useFeature } from '@/hooks';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function shiftWeek(weekStart: string, days: number): string {
  const d = new Date(weekStart + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function uniqueId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function NewItemSheet({
  visible,
  onClose,
  onSave,
  defaultDay,
  submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (item: WeeklyPlanItem) => Promise<void>;
  defaultDay: number;
  submitting: boolean;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(defaultDay);
  const [timeSlot, setTimeSlot] = useState('9:00 AM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setDayOfWeek(defaultDay);
    setTimeSlot('9:00 AM');
    setTitle('');
    setDescription('');
    onClose();
  };

  const canSubmit = title.trim().length > 0 && !submitting;

  return (
    <SheetModal visible={visible} onClose={reset} title="Add to plan">
      <View className="gap-4">
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Day
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DAY_LABELS.slice(0, 5).map((label, idx) => {
              const active = dayOfWeek === idx;
              return (
                <Pressable
                  key={label}
                  onPress={() => setDayOfWeek(idx)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      active
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-surface-700 dark:text-surface-200'
                    }`}>
                    {label.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Time slot
          </Text>
          <TextInput
            value={timeSlot}
            onChangeText={setTimeSlot}
            placeholder="9:00 AM"
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Finger painting"
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Materials needed, learning goals…"
            multiline
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50 min-h-[70px]"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="flex-row gap-2 pt-2">
          <View className="flex-1">
            <ActionButton label="Cancel" onPress={reset} variant="outline" size="md" />
          </View>
          <View className="flex-1">
            <ActionButton
              label={submitting ? 'Saving…' : 'Add to plan'}
              onPress={async () => {
                if (!canSubmit) return;
                await onSave({
                  id: uniqueId(),
                  dayOfWeek,
                  timeSlot: timeSlot.trim() || 'TBD',
                  title: title.trim(),
                  description: description.trim() || undefined,
                });
                reset();
              }}
              icon={Plus}
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

export default function TeacherWeeklyPlanner() {
  const { profile } = useAuth();
  const feature = useFeature('weeklyPlanner');
  const classroomId = profile?.classroomId as string | undefined;

  const [weekStart, setWeekStart] = useState(isoWeekStart());
  const { data: plan, loading } = useClassroomWeeklyPlan(classroomId, weekStart);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const byDay = useMemo(() => {
    const buckets: WeeklyPlanItem[][] = [[], [], [], [], [], [], []];
    for (const item of plan?.items ?? []) {
      if (item.dayOfWeek >= 0 && item.dayOfWeek <= 6) buckets[item.dayOfWeek].push(item);
    }
    for (const b of buckets) {
      b.sort((a, b) => (a.timeSlot < b.timeSlot ? -1 : 1));
    }
    return buckets;
  }, [plan]);

  const saveItems = async (items: WeeklyPlanItem[]) => {
    if (!profile?.uid || !profile.daycareId || !classroomId) return;
    setSubmitting(true);
    try {
      await weeklyPlansApi.upsert({
        daycareId: profile.daycareId as string,
        classroomId,
        weekStartDate: weekStart,
        items,
        updatedBy: profile.uid as string,
      });
    } catch (err) {
      console.error('[teacher weekly-planner] upsert failed:', err);
      Alert.alert('Save failed', 'Could not save the plan. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = async (item: WeeklyPlanItem) => {
    const next = [...(plan?.items ?? []), item];
    await saveItems(next);
  };

  const removeItem = async (itemId: string) => {
    const next = (plan?.items ?? []).filter((i) => i.id !== itemId);
    await saveItems(next);
  };

  if (feature.loading) {
    return (
      <ScreenContainer title="Weekly planner" subtitle="Plan the week">
        <LoadingState message="Checking your plan" />
      </ScreenContainer>
    );
  }

  if (!feature.enabled) {
    return (
      <ScreenContainer title="Weekly planner" subtitle="Plan the week">
        <UpgradeCTA
          feature="weeklyPlanner"
          upgradeTo={feature.upgradeTo}
          variant="card"
          description="Plan your classroom week, share it with parents, and pull activities from the curriculum library. Included with Pro."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Weekly planner" subtitle={formatWeekRange(weekStart)}>
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => setWeekStart(shiftWeek(weekStart, -7))}
          className="w-9 h-9 rounded-full items-center justify-center bg-surface-100 dark:bg-surface-800">
          <ChevronLeft size={18} color="#0f766e" />
        </Pressable>
        <Pill tone="teal" variant="soft" size="sm" label={`Week of ${formatWeekRange(weekStart)}`} icon={CalendarRange} />
        <Pressable
          onPress={() => setWeekStart(shiftWeek(weekStart, 7))}
          className="w-9 h-9 rounded-full items-center justify-center bg-surface-100 dark:bg-surface-800">
          <ChevronRight size={18} color="#0f766e" />
        </Pressable>
      </View>

      <View className="mb-4">
        <ActionButton
          label="Add to plan"
          icon={Plus}
          tone="teal"
          size="md"
          onPress={() => setSheetOpen(true)}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState message="Loading plan" />
        ) : (plan?.items ?? []).length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nothing planned this week"
            description="Tap Add to plan to start building this week's schedule. Parents will see the final plan read-only."
          />
        ) : (
          <View className="gap-4">
            {DAY_LABELS.slice(0, 5).map((label, idx) => {
              const items = byDay[idx];
              return (
                <View key={label}>
                  <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2 px-1">
                    {label}
                  </Text>
                  {items.length === 0 ? (
                    <Card className="opacity-80">
                      <CardBody>
                        <Text className="text-xs text-surface-400 dark:text-surface-500 text-center py-2">
                          No entries
                        </Text>
                      </CardBody>
                    </Card>
                  ) : (
                    <View className="gap-2">
                      {items.map((item) => (
                        <Card key={item.id}>
                          <CardBody>
                            <View className="flex-row items-start gap-3">
                              <View className="w-20">
                                <Text className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                                  {item.timeSlot}
                                </Text>
                              </View>
                              <View className="flex-1 min-w-0">
                                <Text className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                                  {item.title}
                                </Text>
                                {item.description ? (
                                  <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                    {item.description}
                                  </Text>
                                ) : null}
                              </View>
                              <Pressable
                                onPress={() => removeItem(item.id)}
                                className="w-8 h-8 rounded-full items-center justify-center bg-surface-100 dark:bg-surface-800">
                                <Trash2 size={14} color="#dc2626" />
                              </Pressable>
                            </View>
                          </CardBody>
                        </Card>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <NewItemSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={addItem}
        defaultDay={new Date().getDay() === 0 ? 4 : ((new Date().getDay() + 6) % 7)}
        submitting={submitting}
      />
    </ScreenContainer>
  );
}
