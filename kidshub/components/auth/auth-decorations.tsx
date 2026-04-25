/**
 * AuthDecorations — animated background decoration layer for the
 * signed-out screens, designed to mirror the dashboard's
 * `<AnimatedAuthBackground />` so the parent / staff app and the
 * owner dashboard share one playful visual language.
 *
 * Layers (back to front, all `pointer-events: none`):
 *   1. Twinkling stars (yellow + pink + purple mix)
 *   2. Floating hearts (pink, gentle bob)
 *   3. Drifting sparkles (purple, drifts + rotates)
 *   4. Drifting flowers (pink/purple, drifts + rotates)
 *   5. Floating clouds (very faint, top edge "sky" feel)
 *
 * Why custom over a one-shot Lottie:
 *   - Reanimated runs on the UI thread on iOS/Android and on the main
 *     thread (worklet bridge) on web — 60fps with no JS work.
 *   - We already depend on `react-native-reanimated` (~4.1.1) and
 *     `lucide-react-native`; no new packages.
 *   - Each decoration is independently positioned + delayed, so the
 *     scene reads as scattered glitter, not a coordinated dance.
 *
 * Why three small wrapper components (Twinkle / Float / Drift) instead
 * of one big config-driven engine: each animation flavor has its own
 * set of shared values; bundling them into one hook would force every
 * decoration to allocate three transforms even if it only uses one.
 * Three tiny components is cheaper at runtime AND clearer to read.
 *
 * Pointer events: the root `<View pointerEvents="none">` plus the
 * absolute positioning means this layer never intercepts taps on the
 * form. Setting it on the root is enough — children inherit.
 */
import { Cloud, Flower2, Heart, Sparkles, Star } from 'lucide-react-native';
import { ReactNode, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Pos = { top?: ViewStyle['top']; left?: ViewStyle['left']; right?: ViewStyle['right']; bottom?: ViewStyle['bottom'] };

// ---------- animation hooks ----------
// Reanimated v4 requires shared values to be created inside a component;
// each hook is single-purpose so we don't allocate transforms we won't
// use. All hooks are auto-reversing (`true` arg to withRepeat) so the
// animation eases back instead of snapping at the loop boundary.

function useTwinkle(delayMs: number) {
  const opacity = useSharedValue(0.45);
  const scale = useSharedValue(0.85);
  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: 1500 }), -1, true)
    );
    scale.value = withDelay(
      delayMs,
      withRepeat(withTiming(1.15, { duration: 1500 }), -1, true)
    );
    // intentionally empty deps — animation should start once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
}

function useFloat(delayMs: number, duration = 2400, range = 8) {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(
      delayMs,
      withRepeat(withTiming(-range, { duration }), -1, true)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
}

function useDrift(delayMs: number) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const rot = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delayMs, withRepeat(withTiming(-6, { duration: 4500 }), -1, true));
    tx.value = withDelay(delayMs, withRepeat(withTiming(8, { duration: 6000 }), -1, true));
    rot.value = withDelay(delayMs, withRepeat(withTiming(10, { duration: 7000 }), -1, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));
}

// ---------- decoration wrappers ----------
// Each takes a position + delay and renders an absolutely-positioned
// `Animated.View` containing the icon. Splitting per-flavor keeps each
// decoration self-contained (one hook call per item, in a fixed order).

function Twinkle({ delayMs, pos, children }: { delayMs: number; pos: Pos; children: ReactNode }) {
  const style = useTwinkle(delayMs);
  return (
    <Animated.View style={[{ position: 'absolute' }, pos, style]}>{children}</Animated.View>
  );
}

function Float({
  delayMs,
  pos,
  duration,
  range,
  children,
}: {
  delayMs: number;
  pos: Pos;
  duration?: number;
  range?: number;
  children: ReactNode;
}) {
  const style = useFloat(delayMs, duration, range);
  return (
    <Animated.View style={[{ position: 'absolute' }, pos, style]}>{children}</Animated.View>
  );
}

function Drift({ delayMs, pos, children }: { delayMs: number; pos: Pos; children: ReactNode }) {
  const style = useDrift(delayMs);
  return (
    <Animated.View style={[{ position: 'absolute' }, pos, style]}>{children}</Animated.View>
  );
}

// ---------- the layer itself ----------
// Coordinates + delays are hand-tuned so:
//   - decorations stay clear of the centered form column at common
//     breakpoints (mobile 360–420, tablet 600–768, web 1024+).
//   - no two adjacent items animate in lock-step (delays are
//     non-multiples of the durations).
// If a decoration ends up under the card on a particular viewport, it
// stays there harmlessly — they're behind the form in z-order.

export function AuthDecorations() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Sky — fluffy clouds drifting along the top */}
      <Float delayMs={500} pos={{ top: '5%', left: '6%' }} duration={3200}>
        <Cloud size={36} color="#FBA8CF" fill="rgba(255,255,255,0.7)" strokeWidth={2} />
      </Float>
      <Float delayMs={2200} pos={{ top: '10%', right: '8%' }} duration={2800}>
        <Cloud size={28} color="#C4B5FD" fill="rgba(255,255,255,0.7)" strokeWidth={2} />
      </Float>

      {/* Twinkling stars */}
      <Twinkle delayMs={0} pos={{ top: '14%', left: '18%' }}>
        <Star size={18} color="#F59E0B" fill="#FCD34D" strokeWidth={2} />
      </Twinkle>
      <Twinkle delayMs={1200} pos={{ top: '24%', right: '14%' }}>
        <Star size={14} color="#FF2D8A" fill="#FFC2DF" strokeWidth={2} />
      </Twinkle>
      <Twinkle delayMs={600} pos={{ top: '64%', left: '10%' }}>
        <Star size={12} color="#F59E0B" fill="#FCD34D" strokeWidth={2} />
      </Twinkle>
      <Twinkle delayMs={2400} pos={{ bottom: '20%', right: '20%' }}>
        <Star size={16} color="#FF2D8A" fill="#FFC2DF" strokeWidth={2} />
      </Twinkle>
      <Twinkle delayMs={1800} pos={{ top: '8%', right: '36%' }}>
        <Star size={10} color="#7C3AED" fill="#C4B5FD" strokeWidth={2} />
      </Twinkle>
      <Twinkle delayMs={3100} pos={{ top: '50%', right: '6%' }}>
        <Star size={12} color="#F59E0B" fill="#FCD34D" strokeWidth={2} />
      </Twinkle>
      <Twinkle delayMs={900} pos={{ bottom: '38%', left: '22%' }}>
        <Star size={14} color="#7C3AED" fill="#C4B5FD" strokeWidth={2} />
      </Twinkle>

      {/* Floating hearts */}
      <Float delayMs={0} pos={{ top: '40%', left: '6%' }} range={10}>
        <Heart size={16} color="#FF2D8A" fill="rgba(255,148,200,0.6)" strokeWidth={2} />
      </Float>
      <Float delayMs={1500} pos={{ bottom: '26%', right: '10%' }} duration={3000} range={12}>
        <Heart size={20} color="#E11D74" fill="rgba(255,148,200,0.6)" strokeWidth={2} />
      </Float>
      <Float delayMs={800} pos={{ top: '76%', right: '34%' }} duration={1800} range={8}>
        <Heart size={12} color="#FF2D8A" fill="rgba(255,148,200,0.6)" strokeWidth={2} />
      </Float>
      <Float delayMs={2700} pos={{ top: '34%', left: '42%' }} duration={1900} range={9}>
        <Heart size={14} color="#FF2D8A" fill="rgba(255,148,200,0.6)" strokeWidth={2} />
      </Float>
      <Float delayMs={1100} pos={{ bottom: '6%', left: '14%' }} duration={2600} range={11}>
        <Heart size={18} color="#E11D74" fill="rgba(255,148,200,0.6)" strokeWidth={2} />
      </Float>

      {/* Drifting sparkles */}
      <Drift delayMs={400} pos={{ top: '20%', left: '45%' }}>
        <Sparkles size={20} color="#7C3AED" strokeWidth={2} />
      </Drift>
      <Drift delayMs={3000} pos={{ bottom: '12%', left: '40%' }}>
        <Sparkles size={14} color="#A78BFA" strokeWidth={2} />
      </Drift>
      <Drift delayMs={1600} pos={{ top: '58%', right: '38%' }}>
        <Sparkles size={16} color="#7C3AED" strokeWidth={2} />
      </Drift>
      <Drift delayMs={4200} pos={{ bottom: '44%', right: '8%' }}>
        <Sparkles size={12} color="#A78BFA" strokeWidth={2} />
      </Drift>

      {/* Flowers — adds the "playground / nature" texture */}
      <Drift delayMs={700} pos={{ top: '32%', left: '14%' }}>
        <Flower2 size={20} color="#FF2D8A" fill="rgba(255,194,223,0.7)" strokeWidth={2} />
      </Drift>
      <Drift delayMs={2100} pos={{ bottom: '14%', right: '42%' }}>
        <Flower2 size={16} color="#7C3AED" fill="rgba(196,181,253,0.7)" strokeWidth={2} />
      </Drift>
      <Drift delayMs={3600} pos={{ top: '80%', left: '34%' }}>
        <Flower2 size={18} color="#E11D74" fill="rgba(255,194,223,0.7)" strokeWidth={2} />
      </Drift>
    </View>
  );
}
