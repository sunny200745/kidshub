/**
 * /aria — Premium Aria AI assistant (Sprint 7 / D9).
 *
 * MVP scaffold: in-app chat with a templated prompt flow for teachers.
 * We deliberately don't hit the public landing endpoint from the app
 * (CORS is allowlisted to getkidshub.com). Instead we run a local
 * deterministic "assistant" that drafts:
 *   • parent-facing message for an incident
 *   • daily report blurb
 *   • activity description
 *
 * When the billing + auth-forwarded /api/aria endpoint ships, we swap
 * the local `draft()` for a fetch call.
 */
import { Sparkles, Send, Copy, MessageSquarePlus } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { UpgradeCTA } from '@/components/upgrade-cta';
import { ActionButton, Card, CardBody, LoadingState, Pill, TierBadge } from '@/components/ui';
import { useFeature } from '@/hooks';

type Mode = 'parent-message' | 'daily-report' | 'activity';

const MODES: { id: Mode; label: string; placeholder: string }[] = [
  {
    id: 'parent-message',
    label: 'Parent message',
    placeholder: "e.g. Ellie had a small bump on the forehead during free play. Iced it. She's fine now.",
  },
  {
    id: 'daily-report',
    label: 'Daily report',
    placeholder: 'e.g. Today we did water play, read a story about the farm, and practiced sharing.',
  },
  {
    id: 'activity',
    label: 'Activity description',
    placeholder: 'e.g. Finger painting with homemade paint for toddlers.',
  },
];

function draft(mode: Mode, input: string): string {
  const text = input.trim();
  if (!text) return '';
  switch (mode) {
    case 'parent-message':
      return `Hi! Just a quick update from today — ${text}\n\nShe was comfortable and cheerful the rest of the day. Please let us know if you have any questions at pickup.`;
    case 'daily-report':
      return `Today was a great day! Here's what we got up to:\n\n• ${text.split(/\.[\s]+/).filter(Boolean).join('\n• ')}\n\nEveryone ate well, napped, and had lots of fun. See you tomorrow!`;
    case 'activity':
      return `${text}\n\nGoals: encourages fine-motor skills, sensory exploration, and creative expression.\nMaterials: child-safe, washable, easily cleaned up.\nAges: adjust complexity to your classroom's developmental stage.`;
  }
}

export default function TeacherAria() {
  const feature = useFeature('ariaAiInApp');
  const [mode, setMode] = useState<Mode>('parent-message');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);

  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setBusy(true);
    try {
      // Simulate a tiny think-pause so the UI feels real.
      await new Promise((r) => setTimeout(r, 300));
      setOutput(draft(mode, input));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(output);
      } catch {
        // silent — clipboard blocked
      }
    }
    // Native: we skip clipboard for now — the next app-store build will add
    // expo-clipboard so teachers can one-tap copy on phones.
  };

  if (feature.loading) {
    return (
      <ScreenContainer
        title="Aria AI"
        subtitle="Your writing assistant"
        headerBadge={<TierBadge feature="ariaAiInApp" />}>
        <LoadingState message="Checking your plan" />
      </ScreenContainer>
    );
  }

  if (!feature.enabled) {
    return (
      <ScreenContainer
        title="Aria AI"
        subtitle="Your writing assistant"
        headerBadge={<TierBadge feature="ariaAiInApp" />}>
        <UpgradeCTA
          feature="ariaAiInApp"
          upgradeTo={feature.upgradeTo}
          variant="card"
          description="Aria drafts parent messages, daily reports, and activity descriptions in seconds so you can get back to the kids."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Aria AI"
      subtitle="Your writing assistant"
      headerBadge={<TierBadge feature="ariaAiInApp" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2 mb-4">
          <Sparkles size={18} color="#8b5cf6" />
          <Text className="text-sm text-surface-600 dark:text-surface-300">
            Pick a task, drop in the details, and Aria drafts the copy.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 px-4 mb-3"
          contentContainerStyle={{ gap: 8 }}>
          {MODES.map((m) => {
            const selected = m.id === mode;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                className={`rounded-full px-3 py-2 border ${
                  selected
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    selected ? 'text-white' : 'text-surface-700 dark:text-surface-200'
                  }`}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card>
          <CardBody>
            <View className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                What happened?
              </Text>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={active.placeholder}
                placeholderTextColor="#94a3b8"
                multiline
                className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50 min-h-[88px]"
              />
              <ActionButton
                label={busy ? 'Drafting…' : 'Generate draft'}
                onPress={handleGenerate}
                icon={Send}
                tone="pink"
                size="md"
                loading={busy}
                disabled={!input.trim()}
              />
            </View>
          </CardBody>
        </Card>

        {output ? (
          <View className="mt-4">
            <Card>
              <CardBody>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <MessageSquarePlus size={16} color="#8b5cf6" />
                    <Text className="font-semibold text-surface-900 dark:text-surface-50">
                      Draft
                    </Text>
                  </View>
                  <Pill
                    icon={Copy}
                    label="Copy"
                    tone="pink"
                    variant="soft"
                    size="sm"
                    onPress={handleCopy}
                  />
                </View>
                <Text className="text-sm text-surface-800 dark:text-surface-100 leading-6">
                  {output}
                </Text>
              </CardBody>
            </Card>
            <Text className="text-[11px] text-surface-400 dark:text-surface-500 mt-2 px-1">
              Always review Aria&apos;s draft before sending. You&apos;re the expert.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
