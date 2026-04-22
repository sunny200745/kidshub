/**
 * Avatar — initials-on-brand-bg circle, optional image source.
 *
 * Ported from kidshub-legacy/src/components/ui/Avatar.jsx. The legacy sizes
 * used custom CSS classes (avatar-sm, avatar-md, etc.); we inline concrete
 * pixel sizes so there's no dependency on legacy index.css.
 */
import { Image, Text, View } from 'react-native';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, { box: number; font: number }> = {
  sm: { box: 32, font: 12 },
  md: { box: 40, font: 14 },
  lg: { box: 48, font: 16 },
  xl: { box: 64, font: 20 },
};

export type AvatarProps = {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const { box, font } = SIZES[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        accessibilityLabel={name}
        style={{ width: box, height: box, borderRadius: box / 2 }}
        className={className}
      />
    );
  }

  return (
    <View
      style={{ width: box, height: box, borderRadius: box / 2 }}
      className={`bg-brand-500 items-center justify-center ${className}`}>
      <Text style={{ fontSize: font }} className="text-white font-bold">
        {initials}
      </Text>
    </View>
  );
}
