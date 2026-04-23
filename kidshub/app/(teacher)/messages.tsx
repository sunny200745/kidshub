/**
 * /messages (teacher) — Lillio-style messages inbox (Sprint 4 / B6).
 *
 * Shape:
 *   - Top sticky chrome: title + Compose button + search bar + 3 tabs
 *       (Inbox / Sent / Archived). Inbox = unarchived; Sent = threads
 *       where the teacher sent the most recent message and it's
 *       unarchived; Archived = archived.
 *   - Conversation list below; tapping opens the thread.
 *   - Thread composer gets three reply actions:
 *       Submit                → send only
 *       Submit & Archive      → send + archive
 *       Archive               → archive (no message required)
 *   - Compose sheet (SheetModal) lets a teacher start a thread with any
 *     parent in the classroom who has app access. The conversationId
 *     follows the same `${childId}__${teacherUid}` convention the parent
 *     side uses, so both sides generate the same key independently.
 *
 * Archive model:
 *   Per-user archive state would ideally live on a separate threadState
 *   doc. For Sprint 4 we take the pragmatic path: flip
 *   `archivedByStaff`/`staffArchivedAt` on the *latest* message in the
 *   thread. Filtering is simple (check the latest message). When a
 *   parent sends a new message, the new doc has no archive field, so
 *   the thread naturally reappears in the Inbox. Firestore rules
 *   permit staff participants to diff these two fields only.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Inbox as InboxIcon,
  MessageSquare,
  Pencil,
  Search,
  Send,
  X,
  type LucideIcon,
} from 'lucide-react-native';
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
import {
  ActionButton,
  Avatar,
  Badge,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
  SheetModal,
} from '@/components/ui';
import { useAuth } from '@/contexts';
import { messagesApi } from '@/firebase/api';
import type { Child, Message } from '@/firebase/types';
import { useClassroomRoster, useMyMessages, useStaffForDaycare } from '@/hooks';

// ─── Thread derivation ────────────────────────────────────────────────

type Tab = 'inbox' | 'sent' | 'archived';

type TeacherThread = {
  id: string;
  parentUid: string;
  childId?: string;
  child?: Child;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: Message[];
  /** Set from the latest message's `archivedByStaff`. */
  archived: boolean;
  /** True when the teacher sent the most recent message. */
  sentByMeLast: boolean;
};

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

function buildTeacherThreads(
  allMessages: Message[],
  teacherUid: string,
  roster: Child[],
): TeacherThread[] {
  const mine = allMessages.filter(
    (m) =>
      m.senderId === teacherUid ||
      m.recipientId === teacherUid ||
      m.conversationId?.endsWith(`__${teacherUid}`),
  );

  const groups = new Map<string, Message[]>();
  for (const m of mine) {
    const key = m.conversationId || `${[m.senderId, m.recipientId ?? ''].sort().join('|')}`;
    const list = groups.get(key) ?? [];
    list.push(m);
    groups.set(key, list);
  }

  const threads: TeacherThread[] = [];
  for (const [id, msgs] of groups) {
    const sorted = [...msgs].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    const last = sorted[sorted.length - 1];
    const sample =
      sorted.find((m) => m.senderId !== teacherUid && m.senderType === 'parent') ??
      sorted.find((m) => m.senderId !== teacherUid) ??
      sorted[0];
    const parentUid =
      sample.senderId === teacherUid
        ? sample.recipientId ?? ''
        : sample.senderId;
    const childId = sample.childId;
    const child = childId ? roster.find((c) => c.id === childId) : undefined;
    threads.push({
      id,
      parentUid,
      childId,
      child,
      lastMessage: last.content,
      lastTimestamp: last.timestamp,
      unreadCount: sorted.filter((m) => m.recipientId === teacherUid && !m.read).length,
      messages: sorted,
      archived: !!last.archivedByStaff,
      sentByMeLast: last.senderId === teacherUid,
    });
  }
  return threads.sort((a, b) => (a.lastTimestamp < b.lastTimestamp ? 1 : -1));
}

function filterThreads(
  threads: TeacherThread[],
  tab: Tab,
  searchTerm: string,
): TeacherThread[] {
  const q = searchTerm.trim().toLowerCase();
  return threads.filter((t) => {
    if (tab === 'archived' && !t.archived) return false;
    if (tab !== 'archived' && t.archived) return false;
    if (tab === 'sent' && !t.sentByMeLast) return false;
    if (!q) return true;
    const haystack = [
      t.child ? `${t.child.firstName} ${t.child.lastName}` : '',
      t.lastMessage,
      ...t.messages.map((m) => m.content),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────

type TabSpec = { id: Tab; label: string; icon: LucideIcon };
const TAB_SPECS: TabSpec[] = [
  { id: 'inbox', label: 'Inbox', icon: InboxIcon },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'archived', label: 'Archived', icon: Archive },
];

function TabBar({
  active,
  onChange,
  counts,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  counts: Record<Tab, number>;
}) {
  return (
    <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
      {TAB_SPECS.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
              selected
                ? 'bg-teacher-500'
                : 'bg-surface-100 dark:bg-surface-800'
            }`}>
            <Icon size={14} color={selected ? '#FFFFFF' : '#475569'} />
            <Text
              className={`text-xs font-semibold ${
                selected ? 'text-white' : 'text-surface-700 dark:text-surface-200'
              }`}>
              {tab.label}
            </Text>
            {counts[tab.id] > 0 ? (
              <View
                className={`rounded-full px-1.5 py-0.5 ${selected ? 'bg-white/25' : 'bg-surface-200 dark:bg-surface-700'}`}>
                <Text
                  className={`text-[10px] font-bold ${selected ? 'text-white' : 'text-surface-700 dark:text-surface-200'}`}>
                  {counts[tab.id]}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="px-4 pb-2">
      <View className="flex-row items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-full px-3 py-2">
        <Search size={16} color="#94A3B8" />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search conversations"
          placeholderTextColor="#94A3B8"
          className="flex-1 text-sm text-surface-900 dark:text-surface-50"
        />
        {value.length > 0 ? (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <X size={16} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ConversationRow({
  thread,
  onSelect,
}: {
  thread: TeacherThread;
  onSelect: (t: TeacherThread) => void;
}) {
  const headerName = thread.child
    ? `Parent of ${thread.child.firstName} ${thread.child.lastName}`
    : 'Parent';
  return (
    <Pressable
      onPress={() => onSelect(thread)}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-50 dark:active:bg-surface-800">
      <Avatar name={headerName} size="md" />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="font-semibold text-surface-900 dark:text-surface-50 text-sm flex-1"
            numberOfLines={1}>
            {headerName}
          </Text>
          <Text className="text-xs text-surface-400">
            {formatDay(thread.lastTimestamp)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 mt-0.5">
          {thread.sentByMeLast ? (
            <Pill size="sm" variant="soft" tone="neutral" label="You" />
          ) : null}
          <Text
            className="text-sm text-surface-600 dark:text-surface-300 flex-1"
            numberOfLines={1}>
            {thread.lastMessage}
          </Text>
        </View>
      </View>
      {thread.unreadCount > 0 ? (
        <Badge variant="brand">{String(thread.unreadCount)}</Badge>
      ) : null}
    </Pressable>
  );
}

function MessageBubble({ message, selfUid }: { message: Message; selfUid: string }) {
  const fromMe = message.senderId === selfUid;
  if (fromMe) {
    return (
      <View className="self-end max-w-[80%]">
        <LinearGradient
          colors={['#14B8A6', '#0D9488']}
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

// ─── Thread view ──────────────────────────────────────────────────────

type ThreadProps = {
  thread: TeacherThread;
  selfUid: string;
  onBack: () => void;
  onSend: (content: string) => Promise<void>;
  onArchive: (target: TeacherThread) => Promise<void>;
  onUnarchive: (target: TeacherThread) => Promise<void>;
};

function Thread({ thread, selfUid, onBack, onSend, onArchive, onUnarchive }: ThreadProps) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'submit' | 'submit-archive' | 'archive' | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    return () => clearTimeout(t);
  }, [thread.messages.length]);

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setBusy('submit');
    try {
      await onSend(trimmed);
      setDraft('');
    } finally {
      setBusy(null);
    }
  };

  const submitAndArchive = async () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setBusy('submit-archive');
    try {
      await onSend(trimmed);
      setDraft('');
      await onArchive(thread);
      onBack();
    } finally {
      setBusy(null);
    }
  };

  const archiveOnly = async () => {
    if (busy) return;
    setBusy('archive');
    try {
      await onArchive(thread);
      onBack();
    } finally {
      setBusy(null);
    }
  };

  const unarchive = async () => {
    if (busy) return;
    setBusy('archive');
    try {
      await onUnarchive(thread);
    } finally {
      setBusy(null);
    }
  };

  const headerName = thread.child
    ? `Parent of ${thread.child.firstName} ${thread.child.lastName}`
    : 'Parent';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      keyboardVerticalOffset={80}>
      <View className="flex-row items-center gap-3 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 px-4 py-3">
        <Pressable onPress={onBack} hitSlop={8} className="p-1">
          <ArrowLeft size={20} color="#111827" />
        </Pressable>
        <Avatar name={headerName} size="md" />
        <View className="flex-1 min-w-0">
          <Text
            className="font-semibold text-surface-900 dark:text-surface-50 text-sm"
            numberOfLines={1}>
            {headerName}
          </Text>
          {thread.child ? (
            <Text className="text-xs text-surface-500 dark:text-surface-400">
              {thread.child.firstName} {thread.child.lastName}
            </Text>
          ) : null}
        </View>
        {thread.archived ? (
          <Pill
            size="sm"
            tone="neutral"
            variant="soft"
            icon={Archive}
            label="Archived"
          />
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-surface-50 dark:bg-surface-900"
        contentContainerStyle={{ padding: 16, gap: 8 }}>
        {thread.messages.map((m) => (
          <MessageBubble key={m.id} message={m} selfUid={selfUid} />
        ))}
      </ScrollView>

      <View className="bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 px-4 py-3 gap-2">
        <View className="flex-row items-end gap-3">
          <View className="flex-1 bg-surface-50 dark:bg-surface-800 rounded-2xl px-4 py-2.5">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message…"
              placeholderTextColor="#9CA3AF"
              multiline
              editable={!busy}
              className="text-surface-900 dark:text-surface-50 text-sm"
              style={{ maxHeight: 120 }}
            />
          </View>
          <Pressable
            onPress={submit}
            disabled={!draft.trim() || busy !== null}
            accessibilityLabel="Submit">
            <LinearGradient
              colors={draft.trim() && !busy ? ['#14B8A6', '#0D9488'] : ['#E5E7EB', '#E5E7EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Send size={18} color={draft.trim() && !busy ? 'white' : '#9CA3AF'} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Secondary thread actions: Submit & Archive, plus Archive / Unarchive. */}
        <View className="flex-row items-center gap-2">
          <ActionButton
            label="Submit & Archive"
            icon={Archive}
            variant="ghost"
            size="md"
            disabled={!draft.trim() || busy !== null}
            loading={busy === 'submit-archive'}
            onPress={submitAndArchive}
            fullWidth={false}
            className="flex-1"
          />
          {thread.archived ? (
            <ActionButton
              label="Unarchive"
              icon={ArchiveRestore}
              variant="outline"
              size="md"
              loading={busy === 'archive'}
              onPress={unarchive}
              fullWidth={false}
              className="flex-1"
            />
          ) : (
            <ActionButton
              label="Archive"
              icon={Archive}
              variant="outline"
              size="md"
              disabled={busy !== null}
              loading={busy === 'archive'}
              onPress={archiveOnly}
              fullWidth={false}
              className="flex-1"
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Compose sheet ────────────────────────────────────────────────────

type ComposeSheetProps = {
  visible: boolean;
  onClose: () => void;
  roster: Child[];
  onStart: (input: { childId: string; parentUid: string; initialMessage: string }) => Promise<void>;
};

function ComposeSheet({ visible, onClose, roster, onStart }: ComposeSheetProps) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSelectedChildId(null);
      setDraft('');
      setSending(false);
    }
  }, [visible]);

  const candidates = roster.filter((c) => (c.parentIds?.length ?? 0) > 0);
  const selectedChild = candidates.find((c) => c.id === selectedChildId) ?? null;
  const parentUid = selectedChild?.parentIds?.[0] ?? null;

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !selectedChild || !parentUid) return;
    setSending(true);
    try {
      await onStart({
        childId: selectedChild.id,
        parentUid,
        initialMessage: trimmed,
      });
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Start a conversation"
      subtitle="Pick a family, then write your first message."
      dismissible={!sending}>
      <View className="gap-4">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
            Family
          </Text>
          {candidates.length === 0 ? (
            <Text className="text-sm text-surface-500">
              No children in your classroom have a linked parent yet. Once a parent accepts the invite, they&apos;ll show up here.
            </Text>
          ) : (
            <View className="gap-2">
              {candidates.map((child) => {
                const selected = child.id === selectedChildId;
                return (
                  <Pressable
                    key={child.id}
                    onPress={() => setSelectedChildId(child.id)}
                    className={`flex-row items-center gap-3 rounded-2xl border p-3 ${selected ? 'border-teacher-400 bg-teacher-50 dark:bg-teacher-900/20' : 'border-surface-100 dark:border-surface-700'}`}>
                    <Avatar name={`${child.firstName} ${child.lastName}`} size="md" />
                    <View className="flex-1 min-w-0">
                      <Text className="font-semibold text-surface-900 dark:text-surface-50" numberOfLines={1}>
                        Parent of {child.firstName} {child.lastName}
                      </Text>
                      {child.classroom ? (
                        <Text className="text-xs text-surface-500" numberOfLines={1}>
                          {child.classroom}
                        </Text>
                      ) : null}
                    </View>
                    {selected ? <Pill size="sm" tone="teal" variant="solid" label="Selected" /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View>
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
            Message
          </Text>
          <View className="rounded-2xl bg-surface-50 dark:bg-surface-800 px-4 py-3">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Hi! Just wanted to share a quick update…"
              placeholderTextColor="#9CA3AF"
              multiline
              editable={!sending}
              className="text-sm text-surface-900 dark:text-surface-50"
              style={{ minHeight: 80 }}
            />
          </View>
        </View>

        <ActionButton
          label="Start conversation"
          icon={Send}
          size="lg"
          tone="teal"
          loading={sending}
          disabled={!selectedChild || !parentUid || !draft.trim()}
          onPress={submit}
        />
      </View>
    </SheetModal>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────

export default function TeacherMessages() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const daycareId = profile?.daycareId as string | undefined;
  const classroomId = profile?.classroomId as string | undefined;

  const { data: allMessages, loading: msgsLoading } = useMyMessages();
  const { data: roster } = useClassroomRoster();
  const { data: staff } = useStaffForDaycare();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('inbox');
  const [search, setSearch] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);

  const threads = useMemo(() => {
    if (!uid) return [];
    return buildTeacherThreads(allMessages, uid, roster);
  }, [allMessages, uid, roster]);

  const counts = useMemo<Record<Tab, number>>(() => {
    const inboxThreads = threads.filter((t) => !t.archived);
    return {
      inbox: inboxThreads.length,
      sent: inboxThreads.filter((t) => t.sentByMeLast).length,
      archived: threads.filter((t) => t.archived).length,
    };
  }, [threads]);

  const visibleThreads = useMemo(
    () => filterThreads(threads, tab, search),
    [threads, tab, search],
  );

  const active = threads.find((t) => t.id === activeId) ?? null;

  // Mark unread inbound as read when the thread opens.
  useEffect(() => {
    if (!active || !uid) return;
    const unread = active.messages.filter(
      (m) => m.recipientId === uid && !m.read,
    );
    if (unread.length === 0) return;
    Promise.all(
      unread.map((m) =>
        messagesApi.markAsRead(m.id).catch((err) => {
          console.warn('[teacher messages] markAsRead failed:', err);
        }),
      ),
    );
  }, [active, uid]);

  const handleSend = async (content: string) => {
    if (!active || !uid || !daycareId) return;
    try {
      await messagesApi.send({
        conversationId: active.id,
        senderId: uid,
        senderType: 'staff',
        recipientId: active.parentUid || undefined,
        childId: active.childId,
        content,
        daycareId,
      });
    } catch (err) {
      console.error('[teacher messages] send failed:', err);
    }
  };

  const archiveThread = async (target: TeacherThread) => {
    const last = target.messages[target.messages.length - 1];
    if (!last) return;
    try {
      await messagesApi.setStaffArchived(last.id, true);
    } catch (err) {
      console.error('[teacher messages] archive failed:', err);
    }
  };

  const unarchiveThread = async (target: TeacherThread) => {
    const last = target.messages[target.messages.length - 1];
    if (!last) return;
    try {
      await messagesApi.setStaffArchived(last.id, false);
    } catch (err) {
      console.error('[teacher messages] unarchive failed:', err);
    }
  };

  const startCompose = async ({
    childId,
    parentUid,
    initialMessage,
  }: {
    childId: string;
    parentUid: string;
    initialMessage: string;
  }) => {
    if (!uid || !daycareId) return;
    const conversationId = `${childId}__${uid}`;
    try {
      await messagesApi.send({
        conversationId,
        senderId: uid,
        senderType: 'staff',
        recipientId: parentUid,
        childId,
        content: initialMessage,
        daycareId,
      });
      setActiveId(conversationId);
    } catch (err) {
      console.error('[teacher messages] compose failed:', err);
    }
  };

  if (!classroomId) {
    return (
      <ScreenContainer title="Messages" subtitle="Parent conversations">
        <EmptyState
          icon={MessageSquare}
          title="No classroom assigned"
          description="Ask your daycare owner to assign you to a classroom from the dashboard."
        />
      </ScreenContainer>
    );
  }

  if (active && uid) {
    return (
      <View className="flex-1 bg-surface-50 dark:bg-surface-900">
        <Thread
          thread={active}
          selfUid={uid}
          onBack={() => setActiveId(null)}
          onSend={handleSend}
          onArchive={archiveThread}
          onUnarchive={unarchiveThread}
        />
      </View>
    );
  }

  // Silence unused-var until we start resolving parent display names off
  // the staff directory (tracked on RESTRUCTURE_PLAN).
  void staff;

  return (
    <ScreenContainer title="Messages" subtitle="Parent conversations" scrollable={false}>
      <View className="flex-row items-center justify-between px-4 pb-1">
        <Text className="text-xs text-surface-500 dark:text-surface-400">
          {counts.inbox} in inbox · {counts.archived} archived
        </Text>
        <ActionButton
          label="Compose"
          icon={Pencil}
          size="md"
          tone="teal"
          fullWidth={false}
          onPress={() => setComposeOpen(true)}
        />
      </View>

      <SearchBar value={search} onChange={setSearch} />
      <TabBar active={tab} onChange={setTab} counts={counts} />

      <View className="flex-1 px-4 pb-4">
        <Card className="flex-1">
          {msgsLoading ? (
            <LoadingState message="Loading conversations" />
          ) : visibleThreads.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={
                  tab === 'archived' ? Archive : tab === 'sent' ? Send : MessageSquare
                }
                title={
                  search
                    ? 'No matches'
                    : tab === 'archived'
                      ? 'Nothing archived yet'
                      : tab === 'sent'
                        ? 'No conversations you sent last'
                        : 'No conversations yet'
                }
                description={
                  search
                    ? `Nothing matches “${search}”.`
                    : tab === 'archived'
                      ? 'Threads you archive will land here.'
                      : tab === 'sent'
                        ? 'Conversations where you sent the last message will appear here while you wait for a reply.'
                        : 'Parents from your classroom will show up here once they message you.'
                }
              />
            </CardBody>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingVertical: 4 }}
              keyboardShouldPersistTaps="handled">
              {visibleThreads.map((thread, idx) => (
                <View
                  key={thread.id}
                  className={idx < visibleThreads.length - 1 ? 'border-b border-surface-100 dark:border-surface-800' : ''}>
                  <ConversationRow thread={thread} onSelect={(t) => setActiveId(t.id)} />
                </View>
              ))}
            </ScrollView>
          )}
        </Card>
      </View>

      <ComposeSheet
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        roster={roster}
        onStart={startCompose}
      />
    </ScreenContainer>
  );
}
