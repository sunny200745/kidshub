/**
 * PlayfulMascots — kid-themed cartoon scene shown above the auth form
 * on the parent / staff app, mirroring the dashboard's `<PlayfulHero />`
 * so both surfaces of the brand share one visual identity.
 *
 * Composition (left → right): smiling cloud, beaming sun, friendly
 * brontosaurus, smiling flower, pink balloon, butterfly, purple star
 * with a face. Each bobs at a slightly different cadence so the row
 * feels alive, not metronomic.
 *
 * Why custom inline SVG (via react-native-svg) instead of a sprite or
 * stock illustration:
 *   - We don't ship third-party characters (no IP exposure on the
 *     "minions / anime" idea the owner floated — same playful vibe,
 *     fully original artwork).
 *   - Inline SVG renders identically across iOS / Android / web (RN-web)
 *     and is tiny (~6KB total), so there's no asset-loading flash on
 *     the most-visited screen in the app.
 *   - Each mascot is its own component, so the row can be re-arranged
 *     or trimmed cheaply (e.g. on small viewports where the wrap looks
 *     awkward).
 *
 * Layout: `flex-wrap` so on the very narrowest devices (< 360pt) the
 * row gracefully wraps to two lines instead of horizontally overflowing.
 *
 * Accessibility: the whole strip is `accessibilityRole="image"` with a
 * single `accessibilityLabel` so screen readers get one friendly
 * description instead of being told about seven separate decorative
 * SVGs.
 */
import { ReactNode, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
} from 'react-native-svg';

// ---------- shared float wrapper ----------
// Same idea as in `auth-decorations.tsx`: a Reanimated `Animated.View`
// that bobs vertically forever at the supplied cadence + delay.
// Repeated here (not imported) on purpose — keeps each component
// independently understandable, and the file is ~30 lines.

function Bob({
  delayMs,
  duration = 2400,
  range = 6,
  style,
  children,
}: {
  delayMs: number;
  duration?: number;
  range?: number;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delayMs, withRepeat(withTiming(-range, { duration }), -1, true));
    // intentionally empty deps — animation should start once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

// ---------- the row ----------

export function PlayfulMascots() {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="A friendly cartoon scene with a cloud, sun, dinosaur, flower, balloon, butterfly, and star"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
        paddingHorizontal: 4,
      }}>
      <Bob delayMs={0} duration={2200}>
        <SmilingCloud />
      </Bob>
      <Bob delayMs={1000} duration={2800}>
        <SmilingSun />
      </Bob>
      <Bob delayMs={300} duration={1800} range={8}>
        <Dinosaur />
      </Bob>
      <Bob delayMs={700} duration={2400}>
        <Flower />
      </Bob>
      <Bob delayMs={500} duration={1600} range={9}>
        <Balloon />
      </Bob>
      <Bob delayMs={1800} duration={3000}>
        <Butterfly />
      </Bob>
      <Bob delayMs={1500} duration={2200}>
        <StarFace />
      </Bob>
    </View>
  );
}

// ---------- mascots ----------
// Each mascot is a stand-alone <Svg> with hard-coded viewBox + size.
// All shapes use stroke + fill from the brand palette so they sit
// comfortably on top of the AuthShell's pink/purple gradient.

function SmilingCloud() {
  return (
    <Svg viewBox="0 0 80 60" width={64} height={50}>
      <Path
        d="M20 42 Q12 38 16 28 Q16 18 30 20 Q35 10 48 14 Q60 12 64 24 Q74 26 72 38 Q72 48 62 48 L24 48 Q14 48 20 42 Z"
        fill="#FFFFFF"
        stroke="#FFC2DF"
        strokeWidth={2.5}
      />
      <Circle cx={34} cy={32} r={2.2} fill="#475569" />
      <Circle cx={50} cy={32} r={2.2} fill="#475569" />
      <Path
        d="M36 38 Q42 43 48 38"
        stroke="#475569"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={30} cy={38} r={2} fill="#FFC2DF" opacity={0.7} />
      <Circle cx={54} cy={38} r={2} fill="#FFC2DF" opacity={0.7} />
    </Svg>
  );
}

function SmilingSun() {
  return (
    <Svg viewBox="0 0 80 80" width={56} height={56}>
      {/* Rays */}
      <G stroke="#F59E0B" strokeWidth={3.5} strokeLinecap="round">
        <Path d="M40 4 L40 14" />
        <Path d="M40 66 L40 76" />
        <Path d="M4 40 L14 40" />
        <Path d="M66 40 L76 40" />
        <Path d="M14 14 L21 21" />
        <Path d="M59 59 L66 66" />
        <Path d="M66 14 L59 21" />
        <Path d="M21 59 L14 66" />
      </G>
      <Circle cx={40} cy={40} r={20} fill="#FCD34D" stroke="#F59E0B" strokeWidth={2} />
      <Circle cx={33} cy={36} r={2.5} fill="#92400E" />
      <Circle cx={47} cy={36} r={2.5} fill="#92400E" />
      <Path
        d="M32 44 Q40 51 48 44"
        stroke="#92400E"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={29} cy={44} r={2} fill="#FB923C" opacity={0.6} />
      <Circle cx={51} cy={44} r={2} fill="#FB923C" opacity={0.6} />
    </Svg>
  );
}

function Balloon() {
  return (
    <Svg viewBox="0 0 50 90" width={38} height={68}>
      <Ellipse cx={25} cy={30} rx={20} ry={26} fill="#FF94C8" stroke="#E11D74" strokeWidth={1.5} />
      <Ellipse cx={18} cy={22} rx={5} ry={8} fill="#FFFFFF" opacity={0.45} />
      <Path d="M22 55 L25 60 L28 55 Z" fill="#E11D74" />
      <Path
        d="M25 60 Q30 70 22 78 Q18 84 26 88"
        stroke="#94A3B8"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StarFace() {
  return (
    <Svg viewBox="0 0 60 60" width={48} height={48}>
      <Path
        d="M30 4 L36.5 21 L54 22 L40 33 L45 50 L30 40 L15 50 L20 33 L6 22 L23.5 21 Z"
        fill="#A78BFA"
        stroke="#7C3AED"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={25} cy={27} r={2.2} fill="#FFFFFF" />
      <Circle cx={35} cy={27} r={2.2} fill="#FFFFFF" />
      <Path
        d="M26 32 Q30 36 34 32"
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Dinosaur — friendly brontosaurus mascot. Cartoon proportions
 * (oversized head, tiny legs, gentle smile) so it reads as cute, not
 * scary. Green palette so it doesn't fight the pink/purple gradient.
 */
function Dinosaur() {
  return (
    <Svg viewBox="0 0 110 80" width={72} height={56}>
      {/* Tail */}
      <Path
        d="M10 52 Q4 46 8 38 Q14 44 26 50 Z"
        fill="#86EFAC"
        stroke="#16A34A"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* Body */}
      <Ellipse cx={48} cy={50} rx={32} ry={18} fill="#86EFAC" stroke="#16A34A" strokeWidth={2} />
      {/* Belly */}
      <Ellipse cx={48} cy={56} rx={22} ry={9} fill="#BBF7D0" />
      {/* Spikes */}
      <Path
        d="M30 36 L33 30 L36 36 M42 33 L45 27 L48 33 M54 33 L57 27 L60 33 M66 36 L69 30 L72 36"
        fill="none"
        stroke="#16A34A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Neck + head */}
      <Path
        d="M72 42 Q88 30 86 14 Q82 12 80 18 Q72 30 66 38 Z"
        fill="#86EFAC"
        stroke="#16A34A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={86} cy={14} r={11} fill="#86EFAC" stroke="#16A34A" strokeWidth={2} />
      <Path
        d="M82 12 Q85 9 88 12"
        stroke="#1F2937"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M84 18 Q87 21 91 18"
        stroke="#1F2937"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={91} cy={16} r={1.6} fill="#FB7185" opacity={0.6} />
      {/* Legs */}
      <Rect x={32} y={64} width={7} height={12} rx={2} fill="#86EFAC" stroke="#16A34A" strokeWidth={1.6} />
      <Rect x={56} y={64} width={7} height={12} rx={2} fill="#86EFAC" stroke="#16A34A" strokeWidth={1.6} />
    </Svg>
  );
}

/**
 * Flower — five pink petals, yellow smiling center, green stem with
 * one leaf. Wider than tall so it pairs visually with the dinosaur.
 */
function Flower() {
  return (
    <Svg viewBox="0 0 70 90" width={50} height={68}>
      <Path
        d="M35 48 Q33 65 35 84"
        stroke="#16A34A"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M34 65 Q22 60 18 70 Q26 74 34 70 Z"
        fill="#86EFAC"
        stroke="#16A34A"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={35} cy={14} r={11} fill="#FF94C8" stroke="#E11D74" strokeWidth={1.6} />
      <Circle cx={55} cy={24} r={11} fill="#FF94C8" stroke="#E11D74" strokeWidth={1.6} />
      <Circle cx={48} cy={42} r={11} fill="#FF94C8" stroke="#E11D74" strokeWidth={1.6} />
      <Circle cx={22} cy={42} r={11} fill="#FF94C8" stroke="#E11D74" strokeWidth={1.6} />
      <Circle cx={15} cy={24} r={11} fill="#FF94C8" stroke="#E11D74" strokeWidth={1.6} />
      <Circle cx={35} cy={28} r={9} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.6} />
      <Circle cx={32} cy={26} r={1.4} fill="#92400E" />
      <Circle cx={38} cy={26} r={1.4} fill="#92400E" />
      <Path
        d="M32 30 Q35 33 38 30"
        stroke="#92400E"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Butterfly — small accent character. Two pairs of wings (large upper
 * + small lower) in purple/pink so it bridges the two brand hues, with
 * a thin black body and tiny antennae.
 */
function Butterfly() {
  return (
    <Svg viewBox="0 0 80 70" width={56} height={48}>
      <Path
        d="M40 36 Q14 6 6 22 Q4 36 22 38 Q34 38 40 36 Z"
        fill="#A78BFA"
        stroke="#7C3AED"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M40 36 Q66 6 74 22 Q76 36 58 38 Q46 38 40 36 Z"
        fill="#FF94C8"
        stroke="#E11D74"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M40 38 Q22 50 16 62 Q26 66 36 56 Q40 48 40 38 Z"
        fill="#C4B5FD"
        stroke="#7C3AED"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M40 38 Q58 50 64 62 Q54 66 44 56 Q40 48 40 38 Z"
        fill="#FBA8CF"
        stroke="#E11D74"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={20} cy={26} r={2} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={60} cy={26} r={2} fill="#FFFFFF" opacity={0.85} />
      <Ellipse cx={40} cy={42} rx={2.6} ry={12} fill="#1F2937" />
      <Path
        d="M39 30 Q34 22 32 18"
        stroke="#1F2937"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M41 30 Q46 22 48 18"
        stroke="#1F2937"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={32} cy={18} r={1.6} fill="#1F2937" />
      <Circle cx={48} cy={18} r={1.6} fill="#1F2937" />
    </Svg>
  );
}
