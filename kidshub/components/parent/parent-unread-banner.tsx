/**
 * ParentUnreadMessagesBanner — child-aware unread-message banner.
 *
 * Why a parent-specific variant of <UnreadMessagesBanner />:
 *   The teacher banner can stay role-blind ("you have N new messages,
 *   tap to open Messages") because the teacher's /messages screen
 *   shows every conversation across the whole classroom — there's no
 *   ambiguity about *who* the message is for.
 *
 *   On the parent side it's the opposite: a parent with two kids gets
 *   a generic "1 new message" banner, opens /messages, and lands on
 *   the currently-selected child's thread — which may not be the one
 *   that has the unread message at all. The user reported this exact
 *   confusion: "make sure the message properly says for proper child
 *   and there should be proper visible difference for which child the
 *   message has come".
 *
 * Behavior:
 *   - Renders nothing when there are zero unread inbound messages
 *     for the current parent.
 *   - When all unread messages are for ONE child:
 *       - That child's avatar is shown on the left.
 *       - Title reads "N new message(s) about <FirstName>".
 *       - Tapping the banner switches the active child to that one
 *         (so /messages opens the right thread) and routes to
 *         /messages. If they're already on that child, we just
 *         navigate — no needless context flip.
 *   - When unread messages span MULTIPLE children:
 *       - Generic message icon (no single child to feature).
 *       - Title reads "N new messages".
 *       - Subtitle lists each child with a count, e.g. "Ava (2), Noah (1)".
 *       - Tap navigates to /messages without auto-switching — the
 *         parent has to pick which child they want to read first
 *         (they'll use the ChildSwitcher chips, which now also carry
 *         per-child unread dots).
 *   - Counts ≥100 collapse to "99+" so the badge never overflows.
 *
 * One source of truth for unread counts: `useUnreadByChild()`. Same
 * Firestore stream as the tab badge and the switcher dots, so all three
 * surfaces drop to 0 atomically when the parent opens the conversation
 * and `markAsRead` writes.
 */
import { useRouter } from 'expo-router';
import { ChevronRight, MessageSquare } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useSelectedChild } from '@/contexts';
import { useUnreadByChild } from '@/hooks';

export function ParentUnreadMessagesBanner({
  className = '',
}: {
  className?: string;
}) {
  const router = useRouter();
  const { children, selectedChildId, setSelectedChildId } = useSelectedChild();
  const { data } = useUnreadByChild();
  const { byChild, total } = data;

  // Build the list of *this parent's* children that have unread messages,
  // preserving the order from `useSelectedChild().children`. We can't
  // trust the raw `byChild` keys to be siblings — Firestore could
  // hypothetically return childIds the parent isn't linked to (rules
  // shouldn't allow this, but the UI should never crash on it either).
  const childrenWithUnread = useMemo(
    () =>
      children
        .filter((c) => (byChild[c.id] ?? 0) > 0)
        .map((c) => ({ child: c, count: byChild[c.id] ?? 0 })),
    [children, byChild],
  );

  if (total <= 0) return null;

  const displayTotal = total > 99 ? '99+' : String(total);
  const single = childrenWithUnread.length === 1 ? childrenWithUnread[0] : null;
  const isForSelected = single ? single.child.id === selectedChildId : false;

  // Title + subtitle copy. Single-child case names the child directly so
  // the parent doesn't have to dig further; multi-child case lists each
  // sibling with their count so the parent can see at a glance who the
  // messages are split across.
  let title: string;
  let subtitle: string;
  if (single) {
    const noun = single.count === 1 ? 'message' : 'messages';
    title = `${single.count} new ${noun} about ${single.child.firstName}`;
    subtitle = isForSelected
      ? 'Tap to open the conversation'
      : `Tap to switch to ${single.child.firstName} and open Messages`;
  } else {
    const noun = total === 1 ? 'message' : 'messages';
    title = `${total} new ${noun}`;
    subtitle = childrenWithUnread
      .map((cw) => `${cw.child.firstName} (${cw.count})`)
      .join(', ');
  }

  const handlePress = () => {
    // Auto-switch only in the single-sibling case. With multiple kids
    // unread, we don't know which one the parent wants to read first —
    // the ChildSwitcher dots above the banner answer that question and
    // a tap there will land them on the right home screen.
    if (single && !isForSelected) {
      setSelectedChildId(single.child.id);
    }
    router.push('/messages');
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      className={`bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-2xl p-4 ${className}`}>
      <View className="flex-row items-center gap-3">
        {single ? (
          <Avatar
            name={`${single.child.firstName} ${single.child.lastName}`}
            size="md"
          />
        ) : (
          <View
            style={{ width: 40, height: 40, borderRadius: 12 }}
            className="bg-brand-100 dark:bg-brand-900/50 items-center justify-center">
            <MessageSquare size={20} color="#E11D74" />
          </View>
        )}
        <View className="flex-1 min-w-0">
          <Text
            numberOfLines={1}
            className="text-sm font-semibold text-brand-900 dark:text-brand-100">
            {title}
          </Text>
          <Text
            numberOfLines={1}
            className="text-xs text-brand-700 dark:text-brand-300 mt-0.5">
            {subtitle}
          </Text>
        </View>
        <View
          style={{
            minWidth: 28,
            height: 28,
            paddingHorizontal: 8,
            borderRadius: 14,
          }}
          className="bg-brand-500 items-center justify-center">
          <Text className="text-xs font-bold text-white">{displayTotal}</Text>
        </View>
        <ChevronRight size={18} color="#E11D74" />
      </View>
    </Pressable>
  );
}
