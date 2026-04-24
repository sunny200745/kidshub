/**
 * /screenings — teacher-side morning health screenings (Sprint 7 / D8).
 *
 * Pro-gated. At drop-off, teacher logs each child's temperature +
 * optional symptoms. One screening per (child, date). Parents see a
 * read-only feed of their child's screenings + can digitally acknowledge
 * from the parent app.
 */
import {
  CheckCircle2,
  ClipboardCheck,
  Plus,
  ThermometerSun,
} from 'lucide-react-native';
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
  TierBadge,
} from '@/components/ui';
import { useAuth } from '@/contexts';
import { screeningsApi } from '@/firebase/api';
import type { Child } from '@/firebase/types';
import {
  useClassroomRoster,
  useClassroomScreeningsForDate,
  useFeature,
} from '@/hooks';

const SYMPTOMS = ['Fever', 'Cough', 'Runny nose', 'Rash', 'Vomiting', 'Diarrhea', 'Fatigue'] as const;

function ComposeSheet({
  visible,
  onClose,
  onSubmit,
  child,
  submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    temperatureF: number | undefined;
    hasSymptoms: boolean;
    symptoms: string[];
    notes: string;
  }) => Promise<void>;
  child: Child | null;
  submitting: boolean;
}) {
  const [temp, setTemp] = useState('');
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  const reset = () => {
    setTemp('');
    setSymptoms(new Set());
    setNotes('');
    onClose();
  };

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const canSubmit = !submitting;

  return (
    <SheetModal
      visible={visible}
      onClose={reset}
      title={child ? `Screen ${child.firstName}` : 'Morning screening'}
      subtitle="Log temperature + any symptoms at drop-off"
    >
      <View className="gap-4">
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Temperature °F (optional)
          </Text>
          <TextInput
            value={temp}
            onChangeText={setTemp}
            placeholder="98.6"
            keyboardType="numeric"
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Symptoms
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const active = symptoms.has(s);
              return (
                <Pressable
                  key={s}
                  onPress={() => toggleSymptom(s)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? 'bg-warning-100 border-warning-300'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                  }`}>
                  <Text
                    className={`text-xs font-semibold ${
                      active
                        ? 'text-warning-700'
                        : 'text-surface-700 dark:text-surface-200'
                    }`}>
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Slept poorly per parent."
            multiline
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50 min-h-[60px]"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="flex-row gap-2 pt-2">
          <View className="flex-1">
            <ActionButton label="Cancel" onPress={reset} variant="outline" size="md" />
          </View>
          <View className="flex-1">
            <ActionButton
              label={submitting ? 'Saving…' : 'Save screening'}
              onPress={async () => {
                await onSubmit({
                  temperatureF: temp.trim() ? Number(temp) : undefined,
                  hasSymptoms: symptoms.size > 0,
                  symptoms: Array.from(symptoms),
                  notes: notes.trim(),
                });
                reset();
              }}
              icon={CheckCircle2}
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

export default function TeacherScreenings() {
  const { profile } = useAuth();
  const feature = useFeature('morningScreenings');
  const today = new Date().toISOString().slice(0, 10);

  const { data: roster, loading: rosterLoading } = useClassroomRoster();
  const { data: screenings } = useClassroomScreeningsForDate(today);

  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const screenedChildIds = useMemo(() => {
    const s = new Set<string>();
    for (const row of screenings) s.add(row.childId);
    return s;
  }, [screenings]);

  const handleSubmit = async (input: {
    temperatureF: number | undefined;
    hasSymptoms: boolean;
    symptoms: string[];
    notes: string;
  }) => {
    if (!profile?.uid || !profile.daycareId || !profile.classroomId || !activeChild) return;
    setSubmitting(true);
    try {
      await screeningsApi.create({
        daycareId: profile.daycareId as string,
        classroomId: profile.classroomId as string,
        childId: activeChild.id,
        staffId: profile.uid as string,
        date: today,
        temperatureF: input.temperatureF,
        hasSymptoms: input.hasSymptoms,
        symptoms: input.symptoms,
        notes: input.notes || undefined,
      });
      setActiveChild(null);
    } catch (err) {
      console.error('[teacher screenings] create failed:', err);
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (feature.loading) {
    return (
      <ScreenContainer
        title="Screenings"
        subtitle="Drop-off health check"
        headerBadge={<TierBadge feature="morningScreenings" />}>
        <LoadingState message="Checking your plan" />
      </ScreenContainer>
    );
  }

  if (!feature.enabled) {
    return (
      <ScreenContainer
        title="Screenings"
        subtitle="Drop-off health check"
        headerBadge={<TierBadge feature="morningScreenings" />}>
        <UpgradeCTA
          feature="morningScreenings"
          upgradeTo={feature.upgradeTo}
          variant="card"
          description="Log temperature and symptoms at drop-off. Parents can digitally acknowledge from their phones."
        />
      </ScreenContainer>
    );
  }

  const progress = `${screenedChildIds.size} of ${roster.length} done`;

  return (
    <ScreenContainer
      title="Screenings"
      subtitle="Today · drop-off health check"
      headerBadge={<TierBadge feature="morningScreenings" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <ClipboardCheck size={18} color="#0f766e" />
            <Text className="font-semibold text-surface-900 dark:text-surface-50">
              {progress}
            </Text>
          </View>
          <Pill tone="teal" variant="soft" size="sm" label={new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} />
        </View>

        {rosterLoading ? (
          <LoadingState message="Loading roster" />
        ) : roster.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No children enrolled yet"
            description="Add children to your classroom to start logging screenings."
          />
        ) : (
          <View className="gap-2">
            {roster.map((child) => {
              const screening = screenings.find((s) => s.childId === child.id);
              const done = !!screening;
              return (
                <Card key={child.id} className={done ? 'opacity-95' : ''}>
                  <CardBody>
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{ backgroundColor: done ? '#DCFCE7' : '#FEF3C7' }}>
                        {done ? (
                          <CheckCircle2 size={22} color="#16A34A" />
                        ) : (
                          <ThermometerSun size={22} color="#D97706" />
                        )}
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="font-semibold text-surface-900 dark:text-surface-50">
                          {child.firstName} {child.lastName}
                        </Text>
                        {done ? (
                          <View className="flex-row items-center gap-2 mt-0.5">
                            {screening.temperatureF ? (
                              <Pill
                                tone={screening.temperatureF >= 100.4 ? 'danger' : 'success'}
                                variant="soft"
                                size="sm"
                                label={`${screening.temperatureF}°F`}
                              />
                            ) : null}
                            {screening.hasSymptoms ? (
                              <Pill
                                tone="warning"
                                variant="soft"
                                size="sm"
                                label={`${screening.symptoms?.length ?? 0} symptoms`}
                              />
                            ) : (
                              <Pill tone="success" variant="soft" size="sm" label="No symptoms" />
                            )}
                          </View>
                        ) : (
                          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                            Not screened yet
                          </Text>
                        )}
                      </View>
                      {!done ? (
                        <Pill
                          tone="teal"
                          variant="solid"
                          size="sm"
                          label="Screen"
                          icon={Plus}
                          onPress={() => setActiveChild(child)}
                        />
                      ) : null}
                    </View>
                  </CardBody>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ComposeSheet
        visible={!!activeChild}
        onClose={() => setActiveChild(null)}
        onSubmit={handleSubmit}
        child={activeChild}
        submitting={submitting}
      />
    </ScreenContainer>
  );
}
