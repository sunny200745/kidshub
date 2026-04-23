/**
 * /check-in — kid-by-kid attendance management for the classroom.
 *
 * Live Firestore wiring (live-data-11): the roster comes from the live
 * subscription `useClassroomRoster` so a check-in done by a co-teacher
 * shows up immediately on every device. Confirming a check-in / out
 * fires `childrenApi.checkIn|checkOut` (which writes to the
 * children/{id} doc using the same field whitelist as the dashboard)
 * AND logs an `activities` entry of type `checkin`/`checkout` so the
 * action shows up on the parent's timeline within seconds.
 *
 * Failure modes surfaced inline in the modal: any thrown error keeps
 * the sheet open and renders the message. The optimistic local state
 * we used previously is gone — Firestore subscription IS the truth.
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
import { Avatar, Badge, Card, CardBody, EmptyState, LoadingState } from '@/components/ui';
import { useAuth } from '@/contexts';
import { activitiesApi, childrenApi } from '@/firebase/api';
import type { Child } from '@/firebase/types';
import { useClassroomRoster } from '@/hooks';

type FilterValue = 'all' | 'in' | 'out';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ageOf(child: Child): string {
  if (child.age) return child.age;
  if (!child.dateOfBirth) return '';
  const dob = new Date(child.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return '';
  const yrs = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return yrs >= 2 ? `${yrs} years` : `${Math.max(1, Math.floor((Date.now() - dob.getTime()) / (30.44 * 24 * 60 * 60 * 1000)))} months`;
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
            <Text className="text-xs text-surface-400 mt-1">
              {child.status === 'checked-out' ? 'Checked out' : 'Not yet today'}
            </Text>
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
  errorMessage: string | null;
};

function CheckInSheet({ child, type, onClose, onConfirm, isProcessing, errorMessage }: ModalProps) {
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
    if (!errorMessage) {
      setPerson('');
      setNotes('');
    }
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
                {ageOf(child)}
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

          {errorMessage ? (
            <Text className="text-sm text-danger-600 dark:text-danger-400 mb-3">
              {errorMessage}
            </Text>
          ) : null}

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
  const { profile } = useAuth();
  const uid = profile?.uid;
  const daycareId = profile?.daycareId as string | undefined;
  const classroomId = profile?.classroomId as string | undefined;

  const { data: roster, loading } = useClassroomRoster();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [active, setActive] = useState<{ child: Child; type: ActionType } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stats = useMemo(() => {
    const inCount = roster.filter((c) => c.status === 'checked-in').length;
    return {
      in: inCount,
      out: roster.length - inCount,
      total: roster.length,
    };
  }, [roster]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter((c) => {
      const matchesSearch = `${c.firstName} ${c.lastName}`.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'in' && c.status === 'checked-in') ||
        (filter === 'out' && c.status !== 'checked-in');
      return matchesSearch && matchesFilter;
    });
  }, [roster, filter, search]);

  const handleConfirm = async ({ person, notes }: { person: string; notes: string }) => {
    if (!active || !uid || !daycareId || !classroomId) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (active.type === 'in') {
        await childrenApi.checkIn(active.child.id, person.trim() || 'Guardian', notes.trim());
      } else {
        await childrenApi.checkOut(active.child.id, person.trim() || 'Guardian', notes.trim());
      }
      // Best-effort activity log so the parent's timeline reflects the
      // event. Failure here is non-fatal — the children doc is the
      // source of truth for status; the activity is just the audit row.
      try {
        await activitiesApi.create({
          childId: active.child.id,
          classroomId,
          staffId: uid,
          type: active.type === 'in' ? 'checkin' : 'checkout',
          notes: notes.trim() || (active.type === 'in' ? `Dropped off by ${person.trim() || 'guardian'}` : `Picked up by ${person.trim() || 'guardian'}`),
          daycareId,
        });
      } catch (logErr) {
        console.warn('[check-in] activity log failed:', logErr);
      }
      setActive(null);
    } catch (err) {
      console.error('[check-in] write failed:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not save attendance. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const filterOptions: { value: FilterValue; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'in', label: 'In', count: stats.in },
    { value: 'out', label: 'Not in', count: stats.out },
  ];

  if (!classroomId) {
    return (
      <ScreenContainer title="Check in / out" subtitle="Manage daily attendance">
        <EmptyState
          icon={UserCheck}
          title="No classroom assigned"
          description="Ask your daycare owner to assign you to a classroom from the dashboard."
        />
      </ScreenContainer>
    );
  }

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
      {loading ? (
        <LoadingState message="Loading roster" />
      ) : (
        <View className="gap-3">
          {filtered.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={UserCheck}
                  title={
                    roster.length === 0
                      ? 'No children enrolled yet'
                      : 'No children found'
                  }
                  description={
                    roster.length === 0
                      ? 'Ask your owner to add children to this classroom from the dashboard.'
                      : 'Try adjusting your search or filters.'
                  }
                />
              </CardBody>
            </Card>
          ) : (
            filtered.map((child) => (
              <ChildCheckRow
                key={child.id}
                child={child}
                onAction={(c, type) => {
                  setErrorMessage(null);
                  setActive({ child: c, type });
                }}
              />
            ))
          )}
        </View>
      )}

      {active ? (
        <CheckInSheet
          child={active.child}
          type={active.type}
          onClose={() => {
            setActive(null);
            setErrorMessage(null);
          }}
          onConfirm={handleConfirm}
          isProcessing={isProcessing}
          errorMessage={errorMessage}
        />
      ) : null}
    </ScreenContainer>
  );
}
