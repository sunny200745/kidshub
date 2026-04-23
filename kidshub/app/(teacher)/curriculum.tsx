/**
 * /curriculum — teacher-side curriculum library (Sprint 7 / D7).
 *
 * Pro-gated. Shows reusable activity templates teachers can reference
 * from the weekly planner. Each template has a category, age range,
 * materials list, and description. Teachers can create their own and
 * (phase 2) pull from a daycare-wide shared set + system seed.
 *
 * Filtering is a simple row of category pills. Search is intentionally
 * out of scope for v1 — at ~50 templates per daycare the pills + scroll
 * carry you.
 */
import {
  Book,
  Music,
  Palette,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  Users,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/layout';
import { UpgradeCTA } from '@/components/upgrade-cta';
import {
  ActionButton,
  Card,
  CardBody,
  EmptyState,
  LoadingState,
  Pill,
  SheetModal,
} from '@/components/ui';
import { useAuth } from '@/contexts';
import { activityTemplatesApi } from '@/firebase/api';
import type { ActivityTemplate } from '@/firebase/types';
import { useActivityTemplates, useFeature } from '@/hooks';

const CATEGORIES = ['all', 'art', 'music', 'outdoor', 'stem', 'story', 'circle', 'other'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const CATEGORY_META = {
  art: { label: 'Art', icon: Palette, color: '#E11D74' },
  music: { label: 'Music', icon: Music, color: '#8B5CF6' },
  outdoor: { label: 'Outdoor', icon: Sun, color: '#D97706' },
  stem: { label: 'STEM', icon: Sparkles, color: '#0891B2' },
  story: { label: 'Story time', icon: Book, color: '#16A34A' },
  circle: { label: 'Circle', icon: Users, color: '#DC2626' },
  other: { label: 'Other', icon: Sparkles, color: '#64748B' },
} as const;

function NewTemplateSheet({
  visible,
  onClose,
  onSave,
  submitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (draft: {
    title: string;
    category: ActivityTemplate['category'];
    description: string;
    ageRange: string;
    durationMinutes: number | undefined;
    materials: string[];
  }) => Promise<void>;
  submitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityTemplate['category']>('art');
  const [description, setDescription] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [duration, setDuration] = useState('');
  const [materials, setMaterials] = useState('');

  const reset = () => {
    setTitle('');
    setCategory('art');
    setDescription('');
    setAgeRange('');
    setDuration('');
    setMaterials('');
    onClose();
  };

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !submitting;

  return (
    <SheetModal visible={visible} onClose={reset} title="New activity template">
      <View className="gap-4">
        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Rainbow paper plates"
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((k) => {
              const active = category === k;
              const meta = CATEGORY_META[k];
              return (
                <Pressable
                  key={k}
                  onPress={() => setCategory(k)}
                  className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                    active
                      ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300'
                      : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                  }`}>
                  <meta.icon size={14} color={active ? meta.color : '#64748b'} />
                  <Text
                    className={`text-xs font-semibold ${
                      active
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-surface-700 dark:text-surface-200'
                    }`}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
              Age range
            </Text>
            <TextInput
              value={ageRange}
              onChangeText={setAgeRange}
              placeholder="2–3 yrs"
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
              Duration (min)
            </Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="20"
              keyboardType="numeric"
              className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Give each child a paper plate…"
            multiline
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50 min-h-[80px]"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Materials (comma-separated)
          </Text>
          <TextInput
            value={materials}
            onChangeText={setMaterials}
            placeholder="Paper plates, tempera paint, sponges"
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2.5 text-surface-900 dark:text-surface-50"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="flex-row gap-2 pt-2">
          <View className="flex-1">
            <ActionButton label="Cancel" onPress={reset} variant="outline" size="md" />
          </View>
          <View className="flex-1">
            <ActionButton
              label={submitting ? 'Saving…' : 'Save template'}
              onPress={async () => {
                if (!canSubmit) return;
                await onSave({
                  title: title.trim(),
                  category,
                  description: description.trim(),
                  ageRange: ageRange.trim(),
                  durationMinutes: duration.trim() ? Number(duration) : undefined,
                  materials: materials
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                });
                reset();
              }}
              icon={Plus}
              tone="teal"
              size="md"
              loading={submitting}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </View>
    </SheetModal>
  );
}

function TemplateCard({
  template,
  onRemove,
  canRemove,
}: {
  template: ActivityTemplate;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const meta = CATEGORY_META[template.category] ?? CATEGORY_META.other;
  const Icon = meta.icon;
  return (
    <Card>
      <CardBody>
        <View className="flex-row items-start gap-3">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${meta.color}22` }}>
            <Icon size={20} color={meta.color} />
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-semibold text-surface-900 dark:text-surface-50">
                  {template.title}
                </Text>
                <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                  <Text className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                  </Text>
                  {template.ageRange ? (
                    <Text className="text-xs text-surface-500 dark:text-surface-400">
                      · {template.ageRange}
                    </Text>
                  ) : null}
                  {template.durationMinutes ? (
                    <Text className="text-xs text-surface-500 dark:text-surface-400">
                      · {template.durationMinutes} min
                    </Text>
                  ) : null}
                </View>
              </View>
              {canRemove ? (
                <Pressable
                  onPress={onRemove}
                  className="w-8 h-8 rounded-full items-center justify-center bg-surface-100 dark:bg-surface-800">
                  <Trash2 size={14} color="#dc2626" />
                </Pressable>
              ) : null}
            </View>
            <Text className="text-sm text-surface-700 dark:text-surface-200 mt-2">
              {template.description}
            </Text>
            {template.materials && template.materials.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mt-2">
                {template.materials.slice(0, 5).map((m) => (
                  <Pill key={m} tone="neutral" variant="soft" size="sm" label={m} />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </CardBody>
    </Card>
  );
}

export default function TeacherCurriculum() {
  const { profile } = useAuth();
  const feature = useFeature('activityPlanner');
  const { data: templates, loading } = useActivityTemplates();

  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return templates;
    return templates.filter((t) => t.category === filter);
  }, [templates, filter]);

  const handleSave = async (draft: {
    title: string;
    category: ActivityTemplate['category'];
    description: string;
    ageRange: string;
    durationMinutes: number | undefined;
    materials: string[];
  }) => {
    if (!profile?.uid || !profile.daycareId) return;
    setSubmitting(true);
    try {
      await activityTemplatesApi.create({
        daycareId: profile.daycareId as string,
        ownerId: profile.uid as string,
        title: draft.title,
        category: draft.category,
        description: draft.description,
        ageRange: draft.ageRange || undefined,
        durationMinutes: draft.durationMinutes,
        materials: draft.materials,
      });
    } catch (err) {
      console.error('[teacher curriculum] create failed:', err);
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await activityTemplatesApi.remove(id);
    } catch (err) {
      console.error('[teacher curriculum] remove failed:', err);
    }
  };

  if (feature.loading) {
    return (
      <ScreenContainer title="Curriculum" subtitle="Activity templates">
        <LoadingState message="Checking your plan" />
      </ScreenContainer>
    );
  }

  if (!feature.enabled) {
    return (
      <ScreenContainer title="Curriculum" subtitle="Activity templates">
        <UpgradeCTA
          feature="activityPlanner"
          upgradeTo={feature.upgradeTo}
          variant="card"
          description="Build a reusable library of activities — save a great lesson once, drop it into any week."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Curriculum" subtitle={`${templates.length} templates`}>
      <View className="mb-4">
        <ActionButton
          label="New template"
          icon={Plus}
          tone="teal"
          size="md"
          onPress={() => setSheetOpen(true)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4 -mx-4 px-4"
        contentContainerStyle={{ gap: 8 }}>
        {CATEGORIES.map((c) => {
          const active = filter === c;
          const label = c === 'all' ? 'All' : CATEGORY_META[c].label;
          return (
            <Pressable
              key={c}
              onPress={() => setFilter(c)}
              className={`rounded-full border px-3 py-2 ${
                active
                  ? 'bg-brand-100 dark:bg-brand-900/40 border-brand-300'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  active
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-surface-700 dark:text-surface-200'
                }`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState message="Loading templates" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Book}
            title="No templates yet"
            description={
              filter === 'all'
                ? 'Tap New template to save your first reusable activity. The planner will pull from this library.'
                : 'Nothing in this category yet.'
            }
          />
        ) : (
          <View className="gap-3">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onRemove={() => handleRemove(t.id)}
                canRemove={t.ownerId === profile?.uid}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <NewTemplateSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        submitting={submitting}
      />
    </ScreenContainer>
  );
}
