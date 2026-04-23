/**
 * ChildActionSheet — the "3-dot" overflow menu that opens when a teacher
 * taps the `⋯` trailing button on a child row on the home screen.
 *
 * Each row here is a shortcut to an action the teacher would otherwise
 * have to scroll / re-pick a child for. Selecting any of the "log X"
 * rows closes this sheet and asks the parent to open a `QuickLogSheet`
 * pre-filled with that activity type + this child — i.e. the teacher's
 * next tap saves the entry (1-tap log from the home screen).
 *
 * Non-log actions (send message, view profile) route away from the home
 * screen entirely and are handed back as a typed `action` string so the
 * parent screen can decide whether to `router.push()` or noop for now.
 *
 * The "checkin" / "checkout" row is contextual: if the child is already
 * checked in we surface "Check out" at the top; otherwise "Check in".
 * Tapping that row delegates to the parent (same handler the inline
 * check-in pill uses) so there's exactly one check-in code path.
 */
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Heart,
  LogIn,
  LogOut,
  MessageSquare,
  Moon,
  User2,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Avatar, Badge, SheetModal } from '@/components/ui';
import type { ActivityType, Child } from '@/firebase/types';

/**
 * Every action the sheet can emit. `checkin` / `checkout` are separate
 * from `quick-log:*` because they don't go through the activity-log
 * writer — they use `childrenApi.checkIn|checkOut` (source-of-truth
 * field on the child doc). The parent handler dispatches accordingly.
 */
export type ChildAction =
  | { kind: 'checkin' }
  | { kind: 'checkout' }
  | { kind: 'quick-log'; type: ActivityType }
  | { kind: 'message' }
  | { kind: 'profile' };

export type ChildActionSheetProps = {
  visible: boolean;
  child: Child | null;
  onClose: () => void;
  onSelect: (action: ChildAction) => void;
};

type Row = {
  icon: LucideIcon;
  label: string;
  caption?: string;
  action: ChildAction;
  /** Visual tint for the icon bubble. Keeps rows scannable. */
  iconBg: string;
  iconColor: string;
};

function buildRows(child: Child): Row[] {
  const isCheckedIn = child.status === 'checked-in';

  const rows: Row[] = [
    isCheckedIn
      ? {
          icon: LogOut,
          label: 'Check out',
          caption: 'Mark pickup',
          action: { kind: 'checkout' },
          iconBg: 'bg-info-100 dark:bg-info-900/30',
          iconColor: '#0891B2',
        }
      : {
          icon: LogIn,
          label: 'Check in',
          caption: 'Mark drop-off',
          action: { kind: 'checkin' },
          iconBg: 'bg-success-100 dark:bg-success-900/30',
          iconColor: '#16A34A',
        },
    {
      icon: Utensils,
      label: 'Log meal',
      action: { kind: 'quick-log', type: 'meal' },
      iconBg: 'bg-warning-100 dark:bg-warning-900/30',
      iconColor: '#D97706',
    },
    {
      icon: Moon,
      label: 'Log nap',
      action: { kind: 'quick-log', type: 'nap' },
      iconBg: 'bg-info-100 dark:bg-info-900/30',
      iconColor: '#0891B2',
    },
    {
      icon: BookOpen,
      label: 'Log activity',
      action: { kind: 'quick-log', type: 'activity' },
      iconBg: 'bg-success-100 dark:bg-success-900/30',
      iconColor: '#16A34A',
    },
    {
      icon: FileText,
      label: 'Log observation',
      action: { kind: 'quick-log', type: 'note' },
      iconBg: 'bg-surface-100 dark:bg-surface-800',
      iconColor: '#475569',
    },
    {
      icon: Heart,
      label: 'Log health',
      action: { kind: 'quick-log', type: 'health' },
      iconBg: 'bg-danger-100 dark:bg-danger-900/30',
      iconColor: '#DC2626',
    },
    {
      icon: MessageSquare,
      label: 'Message parent',
      action: { kind: 'message' },
      iconBg: 'bg-teacher-100 dark:bg-teacher-900/30',
      iconColor: '#0D9488',
    },
    {
      icon: User2,
      label: 'View profile',
      action: { kind: 'profile' },
      iconBg: 'bg-surface-100 dark:bg-surface-800',
      iconColor: '#475569',
    },
  ];

  return rows;
}

export function ChildActionSheet({
  visible,
  child,
  onClose,
  onSelect,
}: ChildActionSheetProps) {
  if (!child) return null;

  const rows = buildRows(child);

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      // No title here — the child header under the grab handle IS the
      // title. Keeps the sheet feeling direct.
      dismissible>
      <View className="flex-row items-center gap-3 mb-5">
        <Avatar name={`${child.firstName} ${child.lastName}`} size="lg" />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {child.firstName} {child.lastName}
            </Text>
            {child.allergies && child.allergies.length > 0 ? (
              <Badge variant="danger">
                <AlertTriangle size={10} color="#B91C1C" />
              </Badge>
            ) : null}
          </View>
          <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {child.status === 'checked-in'
              ? child.checkInTime
                ? `Checked in at ${new Date(child.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                : 'Checked in'
              : child.status === 'checked-out'
                ? 'Checked out'
                : 'Not in today'}
          </Text>
        </View>
      </View>

      <View className="gap-1">
        {rows.map((row, idx) => {
          const RowIcon = row.icon;
          return (
            <Pressable
              key={`${row.action.kind}-${idx}`}
              onPress={() => {
                onSelect(row.action);
                onClose();
              }}
              className="flex-row items-center gap-3 py-3 px-2 rounded-xl active:bg-surface-50 dark:active:bg-surface-800">
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center ${row.iconBg}`}>
                <RowIcon size={20} color={row.iconColor} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  {row.label}
                </Text>
                {row.caption ? (
                  <Text className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {row.caption}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </SheetModal>
  );
}
