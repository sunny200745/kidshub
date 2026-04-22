/**
 * /messages (teacher) — conversation picker + thread.
 *
 * Port of `kidshub-dashboard/src/pages/Messages.jsx` adapted for a phone
 * layout. The dashboard shows a two-pane split (list on left, thread on
 * right). On a phone we swap between two views:
 *   - "list" view: conversation cards with last message + unread count
 *   - "thread" view: tapping a conversation opens the full thread
 *     with a Back button
 *
 * Reuses the same bubble + composer pattern from `(parent)/messages.tsx`
 * for visual consistency across the two roles.
 *
 * Deferred: attachments, typing indicators, read receipts, conversation
 * search. Those land with the live Firestore wiring (p3-15).
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Avatar, Badge, Card, CardBody } from '@/components/ui';
import {
  classroomRoster,
  teacherConversations,
  type Message,
  type TeacherConversation,
} from '@/data/mockData';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return formatTime(iso);
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

type ConversationListProps = {
  conversations: TeacherConversation[];
  onSelect: (c: TeacherConversation) => void;
};

function ConversationList({ conversations, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <Card>
        <CardBody className="p-8 items-center">
          <Text className="text-base font-semibold text-surface-900 dark:text-surface-50">
            No conversations yet
          </Text>
          <Text className="text-sm text-surface-500 dark:text-surface-400 mt-1 text-center">
            Parent threads will appear here.
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        {conversations.map((c, idx) => {
          const child = classroomRoster.find((k) => k.id === c.childId);
          return (
            <Pressable
              key={c.id}
              onPress={() => onSelect(c)}
              className={`flex-row items-center gap-3 p-4 ${
                idx < conversations.length - 1
                  ? 'border-b border-surface-100 dark:border-surface-800'
                  : ''
              }`}>
              <Avatar name={c.parentName} size="md" />
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    className="font-semibold text-surface-900 dark:text-surface-50 text-sm flex-1"
                    numberOfLines={1}>
                    {c.parentName}
                  </Text>
                  <Text className="text-xs text-surface-400">
                    {formatDay(c.lastTimestamp)}
                  </Text>
                </View>
                {child ? (
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    Parent of {child.firstName} {child.lastName}
                  </Text>
                ) : null}
                <Text
                  className="text-sm text-surface-600 dark:text-surface-300 mt-1"
                  numberOfLines={1}>
                  {c.lastMessage}
                </Text>
              </View>
              {c.unreadCount > 0 ? (
                <Badge variant="brand">{String(c.unreadCount)}</Badge>
              ) : null}
            </Pressable>
          );
        })}
      </CardBody>
    </Card>
  );
}

type ThreadProps = {
  conversation: TeacherConversation;
  onBack: () => void;
  onSend: (content: string) => void;
};

function Thread({ conversation, onBack, onSend }: ThreadProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Small delay so the ScrollView has measured its content before we
    // scroll to the bottom.
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    return () => clearTimeout(t);
  }, [conversation.messages.length]);

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
  };

  const child = classroomRoster.find((k) => k.id === conversation.childId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={80}>
      {/* Header */}
      <View className="flex-row items-center gap-3 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 px-4 py-3">
        <Pressable onPress={onBack} className="p-1">
          <ArrowLeft size={20} color="#111827" />
        </Pressable>
        <Avatar name={conversation.parentName} size="md" />
        <View className="flex-1 min-w-0">
          <Text
            className="font-semibold text-surface-900 dark:text-surface-50 text-sm"
            numberOfLines={1}>
            {conversation.parentName}
          </Text>
          {child ? (
            <Text className="text-xs text-surface-500 dark:text-surface-400">
              Parent of {child.firstName} {child.lastName}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-surface-50 dark:bg-surface-900"
        contentContainerStyle={{ padding: 16, gap: 8 }}>
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </ScrollView>

      {/* Composer */}
      <View className="bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 px-4 py-3 flex-row items-end gap-3">
        <View className="flex-1 bg-surface-50 dark:bg-surface-800 rounded-2xl px-4 py-2.5">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            className="text-surface-900 dark:text-surface-50 text-sm"
            style={{ maxHeight: 120 }}
          />
        </View>
        <Pressable onPress={submit} disabled={!draft.trim()}>
          <LinearGradient
            colors={draft.trim() ? ['#FF2D8A', '#8B5CF6'] : ['#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Send size={18} color={draft.trim() ? 'white' : '#9CA3AF'} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.isFromMe) {
    return (
      <View className="self-end max-w-[80%]">
        <LinearGradient
          colors={['#FF2D8A', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text className="text-white text-sm">{message.content}</Text>
        </LinearGradient>
        <Text className="text-[10px] text-surface-400 mt-0.5 text-right">
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  }

  return (
    <View className="self-start max-w-[80%]">
      <View className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl px-3.5 py-2.5">
        <Text className="text-surface-900 dark:text-surface-50 text-sm">
          {message.content}
        </Text>
      </View>
      <Text className="text-[10px] text-surface-400 mt-0.5 ml-1">
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

export default function TeacherMessages() {
  const [conversations, setConversations] = useState<TeacherConversation[]>(
    teacherConversations
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const handleOpen = (conversation: TeacherConversation) => {
    setActiveId(conversation.id);
    // Mark as read locally.
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSend = (content: string) => {
    if (!active) return;
    const nowIso = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              lastMessage: content,
              lastTimestamp: nowIso,
              messages: [
                ...c.messages,
                {
                  id: `tmsg-${Date.now()}`,
                  senderId: 'staff-1',
                  senderName: 'Me',
                  content,
                  timestamp: nowIso,
                  isFromMe: true,
                },
              ],
            }
          : c
      )
    );
  };

  if (active) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-900">
        <Thread
          conversation={active}
          onBack={() => setActiveId(null)}
          onSend={handleSend}
        />
      </View>
    );
  }

  return (
    <ScreenContainer title="Messages" subtitle="Parent conversations">
      <ConversationList conversations={conversations} onSelect={handleOpen} />
    </ScreenContainer>
  );
}
