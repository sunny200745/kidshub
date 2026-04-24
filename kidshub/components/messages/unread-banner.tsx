/**
 * UnreadMessagesBanner — "You have N new messages" pill on the home screen.
 *
 * Why on the home screen and not just on the Messages tab:
 *   - The Messages tab badge tells you "there's something to look at"
 *     once you've scanned the tab bar — but parents and teachers spend
 *     most of their first 30 seconds in the app on Home (parent) or
 *     /classroom (teacher). A second, larger surface on the home screen
 *     means you don't have to know where to look.
 *
 *   - On real mobile this complements the OS push notification (which
 *     fires only while the app is backgrounded — Track G follow-up). On
 *     web (which has no native push) the banner is the *only* visible
 *     "you got a message" cue, so it has to live somewhere obvious.
 *
 * Behavior:
 *   - Renders nothing when count = 0. The whole banner disappears the
 *     instant the user opens /messages and the screen calls
 *     `markAsRead` on the inbound thread (we share the same Firestore
 *     subscription as `useUnreadMessageCount`, so it's one snapshot tick).
 *   - Counts ≥100 collapse to "99+" so the layout never shifts.
 *   - Whole banner is one large tap target → /messages.
 *
 * Both roles consume the same component — colors stay neutral so the
 * teacher (teal) and parent (pink) themes both read it as "secondary
 * notification" rather than fighting their primary palette.
 */
import { Link } from 'expo-router';
import { ChevronRight, MessageSquare } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useUnreadMessageCount } from '@/hooks';

export function UnreadMessagesBanner({ className = '' }: { className?: string }) {
  const { data: count } = useUnreadMessageCount();
  if (count <= 0) return null;

  // 99+ stops the badge growing past two characters and keeps the
  // banner width predictable across phones.
  const displayCount = count > 99 ? '99+' : String(count);
  const noun = count === 1 ? 'message' : 'messages';

  return (
    <Link href="/messages" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${count} new ${noun}. Open Messages.`}
        className={`bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-2xl p-4 ${className}`}>
        <View className="flex-row items-center gap-3">
          <View
            style={{ width: 40, height: 40, borderRadius: 12 }}
            className="bg-brand-100 dark:bg-brand-900/50 items-center justify-center">
            <MessageSquare size={20} color="#E11D74" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-semibold text-brand-900 dark:text-brand-100">
              You have {displayCount} new {noun}
            </Text>
            <Text
              numberOfLines={1}
              className="text-xs text-brand-700 dark:text-brand-300 mt-0.5">
              Tap to open the conversation
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
            <Text className="text-xs font-bold text-white">{displayCount}</Text>
          </View>
          <ChevronRight size={18} color="#E11D74" />
        </View>
      </Pressable>
    </Link>
  );
}
