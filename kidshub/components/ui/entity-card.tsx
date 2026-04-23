/**
 * EntityCard — roster row primitive used for child + staff lists.
 *
 * The shape is: Avatar (leading) → name + meta (center, flex-1) →
 * trailing slot (right). That covers every home-screen / directory
 * row in the teacher app:
 *
 *   - classroom roster row       (name + age + checked-in state + pill)
 *   - staff "who's here" row     (name + role + clock-in pill)
 *   - parent children list row   (name + age + status)
 *
 * We deliberately keep it un-opinionated about the trailing slot — that's
 * where callers drop pills, 3-dot menus, or anything else. Callers
 * should prefer composing <Pill onPress> in the trailing slot instead
 * of growing this component with 10 boolean props.
 */
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from './avatar';

export type EntityCardProps = {
  name: string;
  /** Optional meta line under the name (age, role, "Since 9:12am", …). */
  meta?: string;
  /** Optional explicit second meta line for richer rows. */
  metaSecondary?: ReactNode;
  /** If supplied, used instead of the generated avatar (staff photo, etc). */
  avatarSrc?: string | null;
  /** Badges rendered inline to the right of the name — allergies, status dots, … */
  nameAdornment?: ReactNode;
  /** Content rendered in the trailing slot (pill / icon button / 3-dot). */
  trailing?: ReactNode;
  /** Thin accent stripe across the left edge — used for classroom color. */
  accentColor?: string;
  /** If present, the whole row becomes pressable. */
  onPress?: () => void;
  /** Override the default white card bg (e.g. success-tinted when checked in). */
  className?: string;
};

export function EntityCard({
  name,
  meta,
  metaSecondary,
  avatarSrc,
  nameAdornment,
  trailing,
  accentColor,
  onPress,
  className = '',
}: EntityCardProps) {
  const content = (
    <View
      className={`flex-row items-center gap-3 bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden ${className}`}>
      {accentColor ? (
        <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: accentColor }} />
      ) : null}
      <View className="flex-row items-center gap-3 flex-1 py-3 pr-3 pl-3">
        <Avatar name={name} size="md" src={avatarSrc ?? undefined} />
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text
              className="font-semibold text-surface-900 dark:text-surface-50 text-base"
              numberOfLines={1}>
              {name}
            </Text>
            {nameAdornment}
          </View>
          {meta ? (
            <Text
              className="text-xs text-surface-500 dark:text-surface-400 mt-0.5"
              numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          {metaSecondary}
        </View>
        {trailing ? <View className="flex-row items-center gap-2">{trailing}</View> : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      {content}
    </Pressable>
  );
}
