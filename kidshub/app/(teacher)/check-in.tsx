/**
 * /check-in — kid-by-kid attendance management for the classroom.
 *
 * Port of `kidshub-dashboard/src/pages/CheckIn.jsx`. Key adaptations:
 *   - Live `useChildrenData` hook → local `useState` initialized from
 *     `classroomRoster` mock. Lets us exercise the UI (tap "Check in" →
 *     status flips) without Firestore wiring. p3-15 swaps the state
 *     setter for `childrenApi.checkIn(...)`.
 *   - Web `<input>` / `<textarea>` → `<TextInput>`; bottom sheet "modal"
 *     uses React Native's `<Modal>` with slide-up animation.
 *   - Stats strip and filter chips kept; classroom filter removed
 *     (everything already scoped to one classroom).
 *   - Allergy alerts shown inline on the card AND inside the modal.
 */
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  UserCheck,
  UserX,
  XCircle,
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
import { Avatar, Badge, Card, CardBody } from '@/components/ui';
import { classroomRoster, type Child } from '@/data/mockData';

type FilterValue = 'all' | 'in' | 'out';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type ActionType = 'in' | 'out';

type ChildCardProps = {
  child: Child;
  onAction: (c: Child, type: ActionType) => void;
};

function ChildCheckRow({ child, onAction }: ChildCardProps) {
  const isCheckedIn = child.status === 'checked-in';

  return (
    <Card className={isCheckedIn ? 'border-success-300 dark:border-success-500/40' : ''}>
      <CardBody className="p-4 flex-row items-center gap-3">
        <Avatar name={`${child.firstName} ${child.lastName}`} size="lg" />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="font-semibold text-surface-900 dark:text-surface-50 text-base">
              {child.firstName} {child.lastName}
            </Text>
            {child.allergies && child.allergies.length > 0 ? (
              <Badge variant="danger">
                <AlertTriangle size={10} color="#B91C1C" />
              </Badge>
            ) : null}
          </View>
          {isCheckedIn && child.checkInTime ? (
            <View className="flex-row items-center gap-1 mt-1">
              <Clock size={12} color="#9CA3AF" />
              <Text className="text-xs text-surface-400">
                Since {formatTime(child.checkInTime)}
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-surface-400 mt-1">Not yet today</Text>
          )}
        </View>
        {isCheckedIn ? (
          <Pressable
            onPress={() => onAction(child, 'out')}
            className="bg-surface-100 dark:bg-surface-800 flex-row items-center gap-1.5 px-3 py-2 rounded-xl">
            <UserX size={14} color="#6B7280" />
            <Text className="text-surface-700 dark:text-surface-100 font-semibold text-sm">
              Out
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => onAction(child, 'in')}
            className="bg-teacher-500 flex-row items-center gap-1.5 px-3 py-2 rounded-xl">
            <UserCheck size={14} color="white" />
            <Text className="text-white font-semibold text-sm">In</Text>
          </Pressable>
        )}
      </CardBody>
    </Card>
  );
}

type ModalProps = {
  child: Child | null;
  type: ActionType;
  onClose: () => void;
  onConfirm: (data: { person: string; notes: string }) => Promise<void>;
  isProcessing: boolean;
};

function CheckInSheet({ child, type, onClose, onConfirm, isProcessing }: ModalProps) {
  const [person, setPerson] = useState('');
  const [notes, setNotes] = useState('');

  if (!child) return null;

  const close = () => {
    if (isProcessing) return;
    setPerson('');
    setNotes('');
    onClose();
  };

  const confirm = async () => {
    await onConfirm({ person, notes });
    setPerson('');
    setNotes('');
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={close}>
      <Pressable className="flex-1 bg-black/40" onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="bg-white dark:bg-surface-900 rounded-t-3xl p-6 pb-8">
          <View className="w-10 h-1 bg-surface-200 rounded-full self-center mb-4" />
          <Text className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-4">
            {type === 'in' ? 'Check in' : 'Check out'}
          </Text>

          <View className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 flex-row items-center gap-3 mb-4">
            <Avatar name={`${child.firstName} ${child.lastName}`} size="lg" />
            <View className="flex-1">
              <Text className="font-semibold text-surface-900 dark:text-surface-50 text-base">
                {child.firstName} {child.lastName}
              </Text>
              <Text className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                {child.age}
              </Text>
            </View>
          </View>

          {child.allergies && child.allergies.length > 0 ? (
            <View className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/30 rounded-xl p-4 mb-4 flex-row gap-2">
              <AlertTriangle size={18} color="#DC2626" />
              <View className="flex-1">
                <Text className="font-semibold text-danger-700 dark:text-danger-300">
                  Allergy alert
                </Text>
                <Text className="text-sm text-danger-600 dark:text-danger-300/80 mt-0.5">
                  {child.allergies.join(', ')}
                </Text>
              </View>
            </View>
          ) : null}

          <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
            {type === 'in' ? 'Dropped off by' : 'Picked up by'}
          </Text>
          <TextInput
            value={person}
            onChangeText={setPerson}
            placeholder="Parent/guardian name"
            placeholderTextColor="#9CA3AF"
            editable={!isProcessing}
            className="border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 rounded-xl px-4 py-3 mb-4"
          />

          <Text className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={
              type === 'in'
                ? 'Any notes about the child today...'
                : 'Any notes for pickup...'
            }
            placeholderTextColor="#9CA3AF"
            editable={!isProcessing}
            multiline
            numberOfLines={3}
            className="border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 rounded-xl px-4 py-3 mb-5"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={close}
              disabled={isProcessing}
              className="flex-1 border border-surface-200 dark:border-surface-700 rounded-xl py-3 items-center">
              <Text className="font-semibold text-surface-700 dark:text-surface-100">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={isProcessing}
              className="flex-1 bg-teacher-500 rounded-xl py-3 items-center flex-row justify-center gap-2">
              {isProcessing ? <ActivityIndicator color="white" /> : null}
              <Text className="text-white font-semibold">
                {type === 'in' ? 'Confirm check in' : 'Confirm check out'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TeacherCheckIn() {
  const [children, setChildren] = useState<Child[]>(classroomRoster);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [active, setActive] = useState<{ child: Child; type: ActionType } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const stats = useMemo(() => {
    const inCount = children.filter((c) => c.status === 'checked-in').length;
    return {
      in: inCount,
      out: children.length - inCount,
      total: children.length,
    };
  }, [children]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return children.filter((c) => {
      const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'in' && c.status === 'checked-in') ||
        (filter === 'out' && c.status !== 'checked-in');
      return matchesSearch && matchesFilter;
    });
  }, [children, filter, search]);

  const handleConfirm = async ({ person, notes: _notes }: { person: string; notes: string }) => {
    if (!active) return;
    setIsProcessing(true);
    try {
      // Simulate a Firestore round-trip so the spinner is perceptible.
      await new Promise<void>((r) => setTimeout(r, 450));
      const nowIso = new Date().toISOString();
      setChildren((prev) =>
        prev.map((c) =>
          c.id === active.child.id
            ? {
                ...c,
                status: active.type === 'in' ? 'checked-in' : 'absent',
                checkInTime: active.type === 'in' ? nowIso : c.checkInTime,
                droppedOffBy: active.type === 'in' ? person || c.droppedOffBy : c.droppedOffBy,
              }
            : c
        )
      );
      setActive(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const filterOptions: { value: FilterValue; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'in', label: 'In', count: stats.in },
    { value: 'out', label: 'Not in', count: stats.out },
  ];

  return (
    <ScreenContainer title="Check in / out" subtitle="Manage daily attendance">
      {/* Stats */}
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/20 items-center justify-center">
              <CheckCircle size={20} color="#047857" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.in}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400">In</Text>
            </View>
          </CardBody>
        </Card>
        <Card className="flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 items-center justify-center">
              <XCircle size={20} color="#6B7280" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.out}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400">Not in</Text>
            </View>
          </CardBody>
        </Card>
        <Card className="flex-1">
          <CardBody className="p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-teacher-100 dark:bg-teacher-500/20 items-center justify-center">
              <Clock size={20} color="#14B8A6" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                {stats.total}
              </Text>
              <Text className="text-xs text-surface-500 dark:text-surface-400">Total</Text>
            </View>
          </CardBody>
        </Card>
      </View>

      {/* Search + filters */}
      <Card className="mb-4">
        <CardBody className="p-4">
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {filterOptions.map((option) => {
                const isActive = filter === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setFilter(option.value)}
                    className={`px-4 py-2 rounded-xl ${
                      isActive
                        ? 'bg-teacher-500'
                        : 'bg-surface-100 dark:bg-surface-800'
                    }`}>
                    <Text
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-white'
                          : 'text-surface-600 dark:text-surface-300'
                      }`}>
                      {option.label} ({option.count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </CardBody>
      </Card>

      {/* List */}
      <View className="gap-3">
        {filtered.length === 0 ? (
          <Card>
            <CardBody className="p-8 items-center">
              <UserCheck size={32} color="#9CA3AF" />
              <Text className="text-base font-semibold text-surface-900 dark:text-surface-50 mt-3">
                No children found
              </Text>
              <Text className="text-sm text-surface-500 dark:text-surface-400 mt-1 text-center">
                Try adjusting your search or filters
              </Text>
            </CardBody>
          </Card>
        ) : (
          filtered.map((child) => (
            <ChildCheckRow
              key={child.id}
              child={child}
              onAction={(c, type) => setActive({ child: c, type })}
            />
          ))
        )}
      </View>

      {active ? (
        <CheckInSheet
          child={active.child}
          type={active.type}
          onClose={() => setActive(null)}
          onConfirm={handleConfirm}
          isProcessing={isProcessing}
        />
      ) : null}
    </ScreenContainer>
  );
}
