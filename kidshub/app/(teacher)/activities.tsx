/**
 * /activities — teacher's activity log with 3-step logging modal.
 *
 * Port of `kidshub-dashboard/src/pages/Activities.jsx`. Shows today's
 * classroom activity timeline + a type filter chip row + a floating FAB
 * that opens a 3-step bottom-sheet (type → child → notes).
 *
 * Adaptations from the dashboard version:
 *   - `activitiesApi.create(...)` call replaced with local state append;
 *     p3-15 swaps this back to Firestore.
 *   - Classroom filter dropped (already scoped to one classroom).
 *   - Quick-log chip row ported as horizontal ScrollView (instead of
 *     flex-wrap rows) — plays better with narrow phone widths and gives
 *     a familiar "story ring" feel.
 *   - 3-step modal is a bottom-sheet Modal instead of a centered dialog.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  type LucideIcon,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/layout';
import {
  ActivityIcon,
  activityColors,
  activityIcons,
  activityLabels,
} from '@/components/icons/activity-icon';
import { Avatar, Badge, Card, CardBody } from '@/components/ui';
import {
  classroomActivities,
  classroomRoster,
  staff,
  type ActivityType,
  type Child,
  type ClassroomActivity,
} from '@/data/mockData';

/** Activity types exposed in the logging modal. A strict subset of the full
 *  ActivityType union — skips checkin/checkout (logged via CheckIn tab) and
 *  read-only types (mood, note, photo) that don't map cleanly to a teacher
 *  quick-log entry. */
const LOGGABLE_TYPES: ActivityType[] = [
  'meal',
  'snack',
  'nap',
  'diaper',
  'potty',
  'activity',
  'outdoor',
  'learning',
  'photo',
  'note',
  'incident',
  'medication',
  'milestone',
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type VariantName =
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

const TYPE_VARIANTS: Partial<Record<ActivityType, VariantName>> = {
  meal: 'warning',
  snack: 'warning',
  nap: 'info',
  diaper: 'neutral',
  potty: 'neutral',
  activity: 'success',
  outdoor: 'success',
  learning: 'brand',
  mood: 'brand',
  incident: 'danger',
  medication: 'danger',
  milestone: 'warning',
  photo: 'info',
  note: 'neutral',
  checkin: 'success',
  checkout: 'info',
};

function ActivityRow({
  activity,
  children,
}: {
  activity: ClassroomActivity;
  children: Child[];
}) {
  const child = children.find((c) => c.id === activity.childId);
  const staffMember = staff.find((s) => s.id === activity.staffId);
  const variant = TYPE_VARIANTS[activity.type] ?? 'neutral';
  const label = activityLabels[activity.type] ?? activity.type;

  return (
    <View className="flex-row gap-3 p-4">
      <ActivityIcon type={activity.type} size="md" />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="font-medium text-surface-900 dark:text-surface-50 text-sm">
                {child?.firstName} {child?.lastName}
              </Text>
              <Badge variant={variant}>{label}</Badge>
            </View>
            <Text
              className="text-sm text-surface-600 dark:text-surface-300 mt-0.5"
              numberOfLines={2}>
              {activity.notes}
            </Text>
            {staffMember ? (
              <Text className="text-xs text-surface-400 mt-1">
                by {staffMember.firstName} {staffMember.lastName}
              </Text>
            ) : null}
          </View>
          <Text className="text-xs text-surface-400">
            {formatTime(activity.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
}

type NewActivityModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    childId: string;
    type: ActivityType;
    notes: string;
  }) => Promise<void>;
  children: Child[];
  initialType?: ActivityType | null;
};

function NewActivityModal({
  visible,
  onClose,
  onSubmit,
  children,
  initialType,
}: NewActivityModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<ActivityType | null>(
    initialType ?? null
  );
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(initialType ? 2 : 1);
      setSelectedType(initialType ?? null);
      setSelectedChild(null);
      setNotes('');
      setSearch('');
      setLoading(false);
    }
  }, [visible, initialType]);

  const filteredChildren = children.filter((c) =>
    `${c.firstName} ${c.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const close = () => {
    if (loading) return;
    onClose();
  };

  const submit = async () => {
    if (!selectedType || !selectedChild) return;
    setLoading(true);
    try {
      await onSubmit({
        childId: selectedChild.id,
        type: selectedType,
        notes: notes || `${activityLabels[selectedType]} logged`,
      });
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<1 | 2 | 3, string> = {
    1: 'Select activity type',
    2: 'Select child',
    3: 'Add details',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <Pressable className="flex-1 bg-black/40" onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className="bg-white dark:bg-surface-900 rounded-t-3xl p-6 pb-8"
          style={{ maxHeight: '85%' }}>
          <View className="w-10 h-1 bg-surface-200 rounded-full self-center mb-4" />
          <Text className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4">
            {titles[step]}
          </Text>

          {step === 1 ? (
            <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap -mx-1">
                {LOGGABLE_TYPES.map((t) => {
                  const Icon: LucideIcon = activityIcons[t];
                  const colors = activityColors[t];
                  return (
                    <View key={t} className="w-1/3 p-1">
                      <Pressable
                        onPress={() => {
                          setSelectedType(t);
                          setStep(2);
                        }}
                        className="border border-surface-100 dark:border-surface-700 rounded-xl p-3 items-center">
                        <View
                          className={`w-10 h-10 rounded-xl items-center justify-center ${colors.bg}`}>
                          <Icon size={20} color={colors.icon} />
                        </View>
                        <Text className="text-xs font-medium text-surface-700 dark:text-surface-200 mt-2">
                          {activityLabels[t]}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}

          {step === 2 ? (
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
              <ScrollView className="max-h-[320px]" showsVerticalScrollIndicator={false}>
                {filteredChildren.map((child) => (
                  <Pressable
                    key={child.id}
                    onPress={() => {
                      setSelectedChild(child);
                      setStep(3);
                    }}
                    className="flex-row items-center gap-3 p-3 rounded-xl mb-1">
                    <Avatar
                      name={`${child.firstName} ${child.lastName}`}
                      size="md"
                    />
                    <View className="flex-1 min-w-0">
                      <Text className="font-medium text-surface-900 dark:text-surface-50">
                        {child.firstName} {child.lastName}
                      </Text>
                      <Text className="text-sm text-surface-500 dark:text-surface-400">
                        {child.age}
                      </Text>
                    </View>
                    {child.allergies && child.allergies.length > 0 ? (
                      <Badge variant="danger">
                        <AlertTriangle size={10} color="#B91C1C" />
                      </Badge>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
              <View className="flex-row gap-3 mt-3">
                <Pressable
                  onPress={() => setStep(1)}
                  className="flex-1 border border-surface-200 dark:border-surface-700 rounded-xl py-3 items-center">
                  <Text className="font-semibold text-surface-700 dark:text-surface-100">
                    Back
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {step === 3 && selectedType && selectedChild ? (
            <>
              <View className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 flex-row items-center gap-3 mb-4">
                <Avatar
                  name={`${selectedChild.firstName} ${selectedChild.lastName}`}
                  size="lg"
                />
                <View className="flex-1 min-w-0">
                  <Text className="font-semibold text-surface-900 dark:text-surface-50">
                    {selectedChild.firstName} {selectedChild.lastName}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <ActivityIcon type={selectedType} size="sm" />
                    <Text className="text-sm text-surface-500 dark:text-surface-400">
                      {activityLabels[selectedType]}
                    </Text>
                  </View>
                </View>
              </View>

              <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
                Notes
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add details about this activity..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                className="border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 rounded-xl px-4 py-3 mb-5"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 border border-surface-200 dark:border-surface-700 rounded-xl py-3 items-center">
                  <Text className="font-semibold text-surface-700 dark:text-surface-100">
                    Back
                  </Text>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={loading}
                  className="flex-1 bg-teacher-500 rounded-xl py-3 items-center flex-row justify-center gap-2">
                  {loading ? <ActivityIndicator color="white" /> : null}
                  <Text className="text-white font-semibold">Log activity</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TeacherActivities() {
  const [log, setLog] = useState<ClassroomActivity[]>(classroomActivities);
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<ActivityType | null>(
    null
  );

  const filtered = useMemo(() => {
    const sorted = [...log].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (filterType === 'all') return sorted;
    return sorted.filter((a) => a.type === filterType);
  }, [log, filterType]);

  const handleSubmit = async ({
    childId,
    type,
    notes,
  }: {
    childId: string;
    type: ActivityType;
    notes: string;
  }) => {
    await new Promise<void>((r) => setTimeout(r, 350));
    setLog((prev) => [
      {
        id: `cla-${Date.now()}`,
        childId,
        staffId: 'staff-1',
        type,
        notes,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
    setModalOpen(false);
    setModalInitialType(null);
  };

  const openModal = (prefill?: ActivityType) => {
    setModalInitialType(prefill ?? null);
    setModalOpen(true);
  };

  return (
    <ScreenContainer
      title="Activities"
      subtitle={`${log.length} activities logged today`}>
      {/* Quick log chips */}
      <Card className="mb-4">
        <CardBody className="p-4">
          <Text className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">
            Quick log
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {LOGGABLE_TYPES.slice(0, 8).map((t) => {
                const Icon: LucideIcon = activityIcons[t];
                const colors = activityColors[t];
                return (
                  <Pressable
                    key={t}
                    onPress={() => openModal(t)}
                    className={`flex-row items-center gap-1.5 px-4 py-2 rounded-xl ${colors.bg}`}>
                    <Icon size={14} color={colors.icon} />
                    <Text
                      className="text-sm font-medium"
                      style={{ color: colors.icon }}>
                      {activityLabels[t]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </CardBody>
      </Card>

      {/* Big log button */}
      <Pressable
        onPress={() => openModal()}
        className="bg-teacher-500 rounded-xl py-3 items-center flex-row justify-center gap-2 mb-4">
        <Plus size={18} color="white" />
        <Text className="text-white font-semibold">Log activity</Text>
      </Pressable>

      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
        contentContainerStyle={{ paddingHorizontal: 2 }}>
        <View className="flex-row gap-2">
          {(['all', ...LOGGABLE_TYPES] as const).map((t) => {
            const isActive = filterType === t;
            return (
              <Pressable
                key={t}
                onPress={() => setFilterType(t)}
                className={`px-4 py-2 rounded-xl ${
                  isActive ? 'bg-teacher-500' : 'bg-surface-100 dark:bg-surface-800'
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-white'
                      : 'text-surface-600 dark:text-surface-300'
                  }`}>
                  {t === 'all' ? 'All types' : activityLabels[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Timeline */}
      <Card>
        <CardBody className="p-0">
          <View className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            <Text className="font-semibold text-surface-900 dark:text-surface-50">
              Today&apos;s activities
            </Text>
          </View>
          {filtered.length > 0 ? (
            <View>
              {filtered.map((activity, idx) => (
                <View
                  key={activity.id}
                  className={
                    idx < filtered.length - 1
                      ? 'border-b border-surface-100 dark:border-surface-800'
                      : ''
                  }>
                  <ActivityRow activity={activity} children={classroomRoster} />
                </View>
              ))}
            </View>
          ) : (
            <View className="p-8 items-center">
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-50">
                No activities yet
              </Text>
              <Text className="text-sm text-surface-500 dark:text-surface-400 mt-1 text-center">
                Start logging activities using the Quick Log buttons above
              </Text>
            </View>
          )}
        </CardBody>
      </Card>

      <NewActivityModal
        visible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalInitialType(null);
        }}
        onSubmit={handleSubmit}
        children={classroomRoster}
        initialType={modalInitialType}
      />
    </ScreenContainer>
  );
}
