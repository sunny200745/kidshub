/**
 * /messages — parent ↔ teacher conversation view.
 *
 * Ported from kidshub-legacy/src/pages/Messages.jsx. Layout:
 *   - Fixed teacher header (avatar + name + online dot)
 *   - Scrolling message list (auto-scrolls to bottom on new send)
 *   - Bottom composer (textarea + send button). KeyboardAvoidingView keeps
 *     the composer visible when the soft keyboard opens on iOS.
 *
 * Things that changed from web → RN:
 *   - `textarea` → `<TextInput multiline>`; Enter-to-send was web-only, on
 *     native we just require a tap on the send button (standard chat UX).
 *   - `scrollIntoView` → `ScrollView.scrollToEnd()` via a ref.
 *   - `animate-pulse` (green dot) → a static green dot; adding a native
 *     animation for a 4px indicator is not worth the complexity.
 *   - `bg-gradient-to-r from-brand-500 to-accent-500` → `LinearGradient`
 *     component wrapping the send button + the "from-me" bubble.
 *
 * Out of scope for p3-10 (deferred):
 *   - Image/attachment picker (Image + Paperclip icons). Legacy stubs were
 *     no-ops. We'll wire `expo-image-picker` when messaging is backed by
 *     Firestore + Storage in p3-15.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { ImageIcon, Palette, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
import { Avatar, Card } from '@/components/ui';
import {
  messages as initialMessages,
  myChildren,
  type Message,
} from '@/data/mockData';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function MessageBubble({ message }: { message: Message }) {
  const time = formatTime(message.timestamp);

  if (message.isFromMe) {
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
      <Avatar name={message.senderName} size="sm" className="mt-1" />
      <View className="max-w-[85%] flex-1">
        <Text className="text-xs text-surface-500 dark:text-surface-400 mb-1.5">
          {message.senderName}
        </Text>
        <View className="bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 rounded-2xl rounded-bl-md px-4 py-3">
          <Text className="text-sm text-surface-900 dark:text-surface-50">
            {message.content}
          </Text>
          {message.hasAttachment ? (
            <View className="mt-3 p-2 bg-surface-50 dark:bg-surface-900 rounded-xl">
              {/* Placeholder attachment preview. Real image preview comes
                  once messages live in Firestore + Storage (p3-15). */}
              <View
                style={{ width: 160, height: 160, borderRadius: 8 }}
                className="bg-surface-100 dark:bg-surface-700 items-center justify-center">
                <Palette size={32} color="#94A3B8" />
              </View>
              <Text className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                Art project photo
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="text-[11px] text-surface-400 dark:text-surface-500 mt-1.5">
          {time}
        </Text>
      </View>
    </View>
  );
}

export default function ParentMessages() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);
  const child = myChildren[0];

  // Auto-scroll to bottom whenever the message list grows. Using setTimeout
  // with 0ms lets RN flush the new bubble's layout before we measure the
  // scroll extent — without it scrollToEnd can miss the last bubble on iOS.
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'parent-1',
      senderName: 'Me',
      content: trimmed,
      timestamp: new Date().toISOString(),
      isFromMe: true,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const canSend = newMessage.trim().length > 0;

  return (
    <ScreenContainer title="Messages" subtitle="Chat with teachers" scrollable={false}>
      {/* Pin composer to the keyboard on iOS; Android handles it natively via
          windowSoftInputMode. verticalOffset matches the rough height of the
          custom header block so content doesn't jump. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}>
        <View className="flex-1 px-4 pb-4">
          <Card className="flex-1 overflow-hidden">
            {/* Teacher header */}
            <View className="bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700 p-4">
              <View className="flex-row items-center gap-3">
                <Avatar name="Sarah Mitchell" size="md" />
                <View className="flex-1">
                  <Text className="font-medium text-surface-900 dark:text-surface-50">
                    Sarah Mitchell
                  </Text>
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    Lead Teacher • {child.classroom}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 bg-success-500 rounded-full" />
                  <Text className="text-xs text-surface-500 dark:text-surface-400">
                    Online
                  </Text>
                </View>
              </View>
            </View>

            {/* Messages scroller */}
            <ScrollView
              ref={scrollRef}
              className="flex-1 bg-surface-50 dark:bg-surface-900"
              contentContainerStyle={{ padding: 16 }}>
              <View className="items-center mb-6">
                <View className="bg-white dark:bg-surface-800 px-3 py-1.5 rounded-full">
                  <Text className="text-xs text-surface-400 dark:text-surface-500">
                    Today
                  </Text>
                </View>
              </View>

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </ScrollView>

            {/* Composer */}
            <View className="bg-white dark:bg-surface-800 border-t border-surface-100 dark:border-surface-700 p-3">
              <View className="flex-row items-end gap-2">
                <Pressable
                  className="p-2.5 rounded-xl active:bg-surface-100 dark:active:bg-surface-700"
                  accessibilityLabel="Attach image"
                  // TODO(p3-15): wire expo-image-picker
                  onPress={() => undefined}>
                  <ImageIcon size={20} color="#94A3B8" />
                </Pressable>

                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
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
                    style={{
                      padding: 12,
                      borderRadius: 12,
                    }}>
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
