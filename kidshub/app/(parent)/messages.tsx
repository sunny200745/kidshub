/**
 * /messages — parent ↔ teacher conversation view.
 *
 * Layout:
 *   - Fixed teacher header (avatar + name + classroom)
 *   - Scrolling message list (auto-scrolls to bottom on new send)
 *   - Bottom composer (TextInput + send button). KeyboardAvoidingView keeps
 *     the composer visible when the soft keyboard opens on iOS.
 *
 * Data model (live):
 *   - The recipient is the *primary teacher* for the parent's child —
 *     resolved by joining `useStaffForDaycare()` against the child's
 *     classroom and picking the first staff member whose Auth account
 *     has linked (`appStatus == 'active'`). This keeps "messages" a
 *     real exchange between two real Firebase users.
 *   - Conversation id = `${childId}__${teacherUid}` so both sides of the
 *     conversation generate the same key without coordinating.
 *   - The message stream is `useMyMessages()` filtered to this thread.
 *
 * Empty / not-ready cases:
 *   - No child linked yet: HelpCircle + nudge.
 *   - Child has no staff with app access yet: Info + nudge to ask the
 *     daycare to invite a teacher.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { HelpCircle, Send, UserCheck } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { Avatar, Card, EmptyState, LoadingState, Pill } from '@/components/ui';
import { useAuth } from '@/contexts';
import { messagesApi } from '@/firebase/api';
import type { Message, Staff } from '@/firebase/types';
import {
  useClassroom,
  useMyChildren,
  useMyMessages,
  useStaffForDaycare,
} from '@/hooks';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDayDivider(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / msInDay);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function MessageBubble({ message, isMine, senderName }: { message: Message; isMine: boolean; senderName: string }) {
  const time = formatTime(message.timestamp);
  if (isMine) {
    return (
      <View className="items-end mb-4">
        <View className="max-w-[85%]">
          <LinearGradient
            colors={['#FF2D8A', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              borderBottomRightRadius: 4,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <Text className="text-sm text-white">{message.content}</Text>
          </LinearGradient>
          <Text className="text-[11px] text-surface-400 dark:text-surface-500 text-right mt-1.5">
            {time}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row gap-3 mb-4">
      <Avatar name={senderName} size="sm" className="mt-1" />
      <View className="max-w-[85%] flex-1">
        <Text className="text-xs text-surface-500 dark:text-surface-400 mb-1.5">
          {senderName}
        </Text>
        <View className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl rounded-bl-md px-4 py-3">
          <Text className="text-sm text-surface-900 dark:text-surface-50">
            {message.content}
          </Text>
        </View>
        <Text className="text-[11px] text-surface-400 dark:text-surface-500 mt-1.5">
          {time}
        </Text>
      </View>
    </View>
  );
}

function pickPrimaryTeacher(
  staff: Staff[],
  classroomId: string | undefined,
): Staff | null {
  if (!classroomId) return null;
  const inClassroom = staff.filter(
    (s) => (s.classroomId ?? s.classroom) === classroomId,
  );
  // Prefer an active linked teacher; fall back to any with linkedUserId so
  // we can still display the staff name even if their app access is pending.
  return (
    inClassroom.find((s) => s.appStatus === 'active' && s.linkedUserId) ??
    inClassroom.find((s) => !!s.linkedUserId) ??
    inClassroom[0] ??
    null
  );
}

export default function ParentMessages() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const daycareId = profile?.daycareId as string | undefined;

  const { data: children, loading: childrenLoading } = useMyChildren();
  const child = children[0] ?? null;
  const { data: classroom } = useClassroom(
    child?.classroomId ?? child?.classroom ?? null,
  );
  const { data: staff, loading: staffLoading } = useStaffForDaycare();

  const teacher = useMemo(
    () => pickPrimaryTeacher(staff, child?.classroomId ?? child?.classroom),
    [staff, child],
  );
  const teacherUid = teacher?.linkedUserId ?? null;

  const { data: allMessages, loading: messagesLoading } = useMyMessages();

  // Conversation id: deterministic key both sides produce. Including the
  // childId scopes the thread to one child even if a parent has multiple.
  const conversationId =
    child && teacherUid ? `${child.id}__${teacherUid}` : null;

  const thread = useMemo(() => {
    if (!conversationId) return [] as Message[];
    return allMessages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  }, [allMessages, conversationId]);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Auto-scroll on new messages. setTimeout(0) lets RN flush layout
  // before scrollToEnd measures — without it iOS occasionally misses
  // the last bubble.
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [thread.length]);

  // Mark inbound unread messages as read when they appear. Fire-and-
  // forget — failures here are non-fatal and the read state will
  // re-converge on the next render.
  useEffect(() => {
    if (!uid) return;
    for (const m of thread) {
      if (!m.read && m.recipientId === uid) {
        messagesApi.markAsRead(m.id).catch((err) => {
          console.warn('[parent messages] failed to mark read:', err);
        });
      }
    }
  }, [thread, uid]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !child || !teacherUid || !uid || !daycareId || !conversationId) return;
    setSending(true);
    try {
      await messagesApi.send({
        conversationId,
        senderId: uid,
        senderType: 'parent',
        recipientId: teacherUid,
        childId: child.id,
        content: trimmed,
        daycareId,
      });
      setDraft('');
    } catch (err) {
      console.error('[parent messages] send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const canSend = Boolean(
    draft.trim() && child && teacherUid && uid && daycareId && !sending,
  );

  // Loading + empty paths
  if (childrenLoading || staffLoading) {
    return (
      <ScreenContainer title="Messages" subtitle="Chat with teachers" scrollable={false}>
        <LoadingState message="Loading conversation" />
      </ScreenContainer>
    );
  }

  if (!child) {
    return (
      <ScreenContainer title="Messages" subtitle="Chat with teachers" scrollable={false}>
        <EmptyState
          icon={HelpCircle}
          title="No child linked yet"
          description="Once your daycare links your child to your account, you can message their teacher here."
        />
      </ScreenContainer>
    );
  }

  if (!teacher || !teacherUid) {
    return (
      <ScreenContainer title="Messages" subtitle="Chat with teachers" scrollable={false}>
        <EmptyState
          icon={UserCheck}
          title="No teacher available yet"
          description={`Your child's classroom (${classroom?.name ?? child.classroom ?? 'classroom'}) doesn't have a teacher with app access yet. Once one is invited, your conversation will appear here.`}
        />
      </ScreenContainer>
    );
  }

  const teacherName = `${teacher.firstName} ${teacher.lastName}`.trim();
  const teacherSubtitle = teacher.role === 'lead-teacher'
    ? `Lead Teacher · ${classroom?.name ?? child.classroom ?? ''}`
    : `Teacher · ${classroom?.name ?? child.classroom ?? ''}`;

  return (
    <ScreenContainer title="Messages" subtitle="Chat with teachers" scrollable={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}>
        <View className="flex-1 px-4 pb-4">
          <Card className="flex-1 overflow-hidden">
            {/* Teacher header */}
            <View className="bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name={teacherName} size="md" />
                <View className="flex-1">
                  <Text className="font-medium text-surface-900 dark:text-surface-50">
                    {teacherName}
                  </Text>
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    {teacherSubtitle}
                  </Text>
                </View>
              </View>
            </View>

            {/* Messages scroller */}
            <ScrollView
              ref={scrollRef}
              className="flex-1 bg-surface-50 dark:bg-surface-900"
              contentContainerStyle={{ padding: 16 }}>
              {messagesLoading ? (
                <LoadingState message="Loading messages" />
              ) : thread.length === 0 ? (
                <EmptyState
                  title="Start the conversation"
                  description={`Say hello to ${teacher.firstName}. They'll see your message in their teacher app.`}
                />
              ) : (
                <>
                  {thread.map((m, i) => {
                    const prev = thread[i - 1];
                    const showDivider = !prev || dayKey(prev.timestamp) !== dayKey(m.timestamp);
                    return (
                      <View key={m.id}>
                        {showDivider ? (
                          <View className="items-center my-4">
                            <Pill
                              tone="neutral"
                              variant="soft"
                              size="sm"
                              label={formatDayDivider(m.timestamp)}
                            />
                          </View>
                        ) : null}
                        <MessageBubble
                          message={m}
                          isMine={m.senderId === uid}
                          senderName={m.senderId === uid ? 'Me' : teacherName}
                        />
                      </View>
                    );
                  })}
                  {sending ? (
                    <View className="items-end mb-2">
                      <Text className="text-[11px] text-surface-400 dark:text-surface-500">
                        Sending…
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>

            {/* Composer */}
            <View className="bg-white dark:bg-surface-800 border-t border-surface-100 dark:border-surface-700 p-3">
              <View className="flex-row items-end gap-2">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Type a message..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  className="flex-1 px-4 py-3 bg-surface-100 dark:bg-surface-900 rounded-2xl text-sm text-surface-900 dark:text-surface-50"
                  style={{ maxHeight: 120, minHeight: 44 }}
                />

                <Pressable
                  onPress={handleSend}
                  disabled={!canSend}
                  style={{ opacity: canSend ? 1 : 0.5 }}
                  accessibilityLabel="Send message">
                  <LinearGradient
                    colors={['#FF2D8A', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ padding: 12, borderRadius: 12 }}>
                    <Send size={20} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
