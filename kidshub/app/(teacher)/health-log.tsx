/**
 * /health-log — teacher-side health compliance log (Sprint 7 / D5).
 *
 * Pro-gated. Surfaces every `healthLogs` entry for the teacher's
 * classroom, grouped by kind (symptom / medication / incident / injury).
 * Teachers can log new entries; owners can review + resolve follow-ups
 * from the dashboard.
 */
import {
  AlertTriangle,
  Check,
  HeartPulse,
  Pill as PillIcon,
  Plus,
  Stethoscope,
  Syringe,
  type LucideIcon,
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
import { healthLogsApi } from '@/firebase/api';
import type { Child, HealthLog, HealthLogKind } from '@/firebase/types';
import {
  useClassroomHealthLogs,
  useClassroomRoster,
  useFeature,
} from '@/hooks';

const KIND_META: Record<HealthLogKind, { label: string; icon: LucideIcon; tone: 'warning' | 'info' | 'danger' | 'brand' }> = {
  symptom: { label: 'Symptom', icon: HeartPulse, tone: 'warning' },
  medication: { label: 'Medication', icon: PillIcon, tone: 'info' },
  incident: { label: 'Incident', icon: AlertTriangle, tone: 'danger' },
  injury: { label: 'Injury', icon: Syringe, tone: 'danger' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  if (d.toDateString() === today) return `Today · ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`;
}

function LogCard({
  log,
  childName,
}: {
  log: HealthLog;
  childName: string;
}) {
  const meta = KIND_META[log.kind] ?? KIND_META.symptom;
  const Icon = meta.icon;
  return (
    <Card>
      <CardBody>
        <View className="flex-row items-start gap-3">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{
              backgroundColor:
                meta.tone === 'danger'
                  ? '#FEE2E2'
                  : meta.tone === 'warning'
                    ? '#FEF3C7'
                    : meta.tone === 'info'
                      ? '#CFFAFE'
                      : '#FCE7F3',
            }}>
            <Icon
              size={20}
              color={
                meta.tone === 'danger'
                  ? '#DC2626'
                  : meta.tone === 'warning'
                    ? '#D97706'
                    : meta.tone === 'info'
                      ? '#0891B2'
                      : '#E11D74'
              }
            />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-surface-900 dark:text-surface-50">
                {meta.label}
              </Text>
              <Text className="text-xs text-surface-400 dark:text-surface-500">
                {formatWhen(log.timestamp)}
              </Text>
            </View>
            <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {childName}
            </Text>
            <Text className="text-sm text-surface-700 dark:text-surface-200 mt-2">
              {log.summary}
            </Text>
            {log.details ? (
              <Text className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {log.details}
              </Text>
            ) : null}
            {log.followUpRequired ? (
              <View className="mt-2">
                <Pill tone="warning" variant="soft" size="sm" label="Follow-up required" />
              </View>
            ) : null}
          </View>
        </View>
      </CardBody>
    </Card>
  );
}

function ComposeSheet({
  visible,
  onClose,
  onSubmit,
  roster,
  submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    kind: HealthLogKind;
    childId: string;
    summary: string;
    details: string;
    followUpRequired: boolean;
  }) => Promise<void>;
  roster: Child[];
  submitting: boolean;
}) {
  const [kind, setKind] = useState<HealthLogKind>('symptom');
  const [childId, setChildId] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [followUp, setFollowUp] = useState(false);

  const reset = () => {
    setKind('symptom');
    setChildId(null);
    setSummary('');
    setDetails('');
    setFollowUp(false);
    onClose();
  };

  const canSubmit = !!childId && summary.trim().length > 0 && !submitting;

  return (
    <SheetModal visible={visible} onClose={reset} title="Log health entry">
      <View className="gap-4">
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(KIND_META) as HealthLogKind[]).map((k) => {
            const active = kind === k;
            const meta = KIND_META[k];
            return (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                  active
                    ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700'
                    : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                }`}>
                <meta.icon size={14} color={active ? '#E11D74' : '#64748b'} />
                <Text
                  className={`text-xs font-semibold ${
                    active
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-surface-700 dark:text-surface-200'
                  }`}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Child
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {roster.map((c) => {
              const active = childId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setChildId(c.id)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                  }`}>
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

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Summary
          </Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Runny nose since 9am"
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Details (optional)
          </Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Temperature, action taken, parent contact…"
            multiline
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50 min-h-[70px]"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Pressable
          onPress={() => setFollowUp((prev) => !prev)}
          className="flex-row items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-3">
          <View
            className={`w-5 h-5 rounded-md items-center justify-center border ${
              followUp
                ? 'bg-warning-500 border-warning-500'
                : 'border-surface-300 dark:border-surface-600'
            }`}>
            {followUp ? <Check size={14} color="#ffffff" /> : null}
          </View>
          <Text className="flex-1 text-sm text-surface-800 dark:text-surface-100">
            Mark as follow-up required
          </Text>
        </Pressable>

        <View className="flex-row gap-2 pt-2">
          <View className="flex-1">
            <ActionButton label="Cancel" onPress={reset} variant="outline" size="md" />
          </View>
          <View className="flex-1">
            <ActionButton
              label={submitting ? 'Saving…' : 'Save entry'}
              onPress={async () => {
                if (!canSubmit) return;
                await onSubmit({
                  kind,
                  childId: childId!,
                  summary: summary.trim(),
                  details: details.trim(),
                  followUpRequired: followUp,
                });
                reset();
              }}
              icon={Check}
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

export default function TeacherHealthLog() {
  const { profile } = useAuth();
  const feature = useFeature('healthReports');
  const { data: logs, loading } = useClassroomHealthLogs();
  const { data: roster } = useClassroomRoster();

  const [composeOpen, setComposeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const childNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of roster) map.set(c.id, `${c.firstName} ${c.lastName}`);
    return map;
  }, [roster]);

  const followUpCount = logs.filter((l) => l.followUpRequired).length;

  const handleSubmit = async (input: {
    kind: HealthLogKind;
    childId: string;
    summary: string;
    details: string;
    followUpRequired: boolean;
  }) => {
    if (!profile?.uid || !profile.daycareId || !profile.classroomId) return;
    setSubmitting(true);
    try {
      await healthLogsApi.create({
        daycareId: profile.daycareId as string,
        classroomId: profile.classroomId as string,
        childId: input.childId,
        staffId: profile.uid as string,
        kind: input.kind,
        summary: input.summary,
        details: input.details || undefined,
        followUpRequired: input.followUpRequired,
      });
    } catch (err) {
      console.error('[teacher health-log] create failed:', err);
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (feature.loading) {
    return (
      <ScreenContainer
        title="Health log"
        subtitle="Symptoms · medication · incidents"
        headerBadge={<TierBadge feature="healthReports" />}>
        <LoadingState message="Checking your plan" />
      </ScreenContainer>
    );
  }

  if (!feature.enabled) {
    return (
      <ScreenContainer
        title="Health log"
        subtitle="Symptoms · medication · incidents"
        headerBadge={<TierBadge feature="healthReports" />}>
        <UpgradeCTA
          feature="healthReports"
          upgradeTo={feature.upgradeTo}
          variant="card"
          description="Keep a compliance-ready record of symptoms, medication, and incidents. Available on Pro."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Health log"
      subtitle="Symptoms · medication · incidents"
      headerBadge={<TierBadge feature="healthReports" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Stethoscope size={18} color="#0f766e" />
            <Text className="font-semibold text-surface-900 dark:text-surface-50">
              {logs.length} entries this week
            </Text>
          </View>
          {followUpCount > 0 ? (
            <Pill
              tone="warning"
              variant="soft"
              size="sm"
              label={`${followUpCount} follow-up`}
            />
          ) : null}
        </View>

        <View className="mb-5">
          <ActionButton
            label="New entry"
            icon={Plus}
            tone="teal"
            size="lg"
            onPress={() => setComposeOpen(true)}
          />
        </View>

        {loading ? (
          <LoadingState message="Loading logs" />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No health entries yet"
            description="Tap New entry to log a symptom, medication, incident, or injury. Owners see every entry in the dashboard."
          />
        ) : (
          <View className="gap-3">
            {logs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                childName={childNameById.get(log.childId) ?? 'Child'}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ComposeSheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleSubmit}
        roster={roster}
        submitting={submitting}
      />
    </ScreenContainer>
  );
}
