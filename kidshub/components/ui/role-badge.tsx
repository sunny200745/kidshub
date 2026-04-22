/**
 * RoleBadge — tiny pill that sits in every screen header so the user always
 * knows whether they're looking at the Parent view or the Teacher view.
 *
 * Color + label both come from useRoleTheme, so this component has no
 * conditionals of its own — swap the hook return and the pill updates
 * everywhere.
 */
import { Text, View } from 'react-native';

import { useRoleTheme } from '@/hooks';

export type RoleBadgeProps = {
  /** Extra class names appended after the default layout. */
  className?: string;
};

export function RoleBadge({ className = '' }: RoleBadgeProps) {
  const theme = useRoleTheme();
  return (
    <View
      accessibilityLabel={`${theme.label} view`}
      className={`self-start flex-row items-center px-2.5 py-1 rounded-full ${theme.badgeBgClass} ${className}`}>
      <View
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: theme.accentHex }}
      />
      <Text className={`text-[11px] font-semibold tracking-wide uppercase ${theme.badgeTextClass}`}>
        {theme.label} view
      </Text>
    </View>
  );
}
