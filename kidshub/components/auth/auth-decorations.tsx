/**
 * AuthDecorations — sticker-style nursery decoration layer for the
 * signed-out screens, designed to mirror the dashboard's
 * `<AnimatedAuthBackground />` so the parent / staff app and the
 * owner dashboard share one visual identity.
 *
 * Direction (per latest owner feedback): plain off-white surface with
 * cartoon dinosaurs and flowers scattered around the edges, like a
 * pre-school flashcard wall. Replaces the previous lucide-icon
 * "stars / hearts / sparkles" recipe, which read as designy not
 * kid-themed.
 *
 * Layout:
 *   - 3 dinosaurs (DinoBlue top-right, DinoPink middle-left,
 *     Stegosaurus bottom-left)
 *   - 3 flowers (Daisy top-left + middle-right, Tulip bottom-center,
 *     Sunflower bottom-right)
 *   - Each absolutely positioned by percentage so it stays clear of
 *     the centered form column at all common phone / tablet widths.
 *
 * Animation: each sticker bobs vertically via Reanimated v4 with its
 * own duration + delay so the scene feels alive without synchronised
 * movement. Subtle (4–8pt range) so it doesn't pull focus from the
 * form.
 *
 * Pointer events: `pointerEvents="none"` on the root + absolute
 * positioning means this layer never intercepts taps on the form
 * below. Children inherit.
 *
 * Why one wrapper component (`Bob`) instead of a config-driven engine:
 *   - We only need one animation flavor (vertical bob), so the engine
 *     would be over-engineering.
 *   - Keeps each decoration declaration to one line of JSX — easy to
 *     re-arrange / re-tune by hand.
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

import {
  Daisy,
  DinoBlue,
  DinoPink,
  Stegosaurus,
  Sunflower,
  Tulip,
} from './sticker-illustrations';

type Pos = {
  top?: ViewStyle['top'];
  left?: ViewStyle['left'];
  right?: ViewStyle['right'];
  bottom?: ViewStyle['bottom'];
};

/**
 * Bob — wrapper that bobs its child vertically forever via Reanimated.
 * Range + duration are tunable per-instance so the scene doesn't feel
 * metronomic.
 */
function Bob({
  delayMs,
  duration = 2400,
  range = 6,
  pos,
  opacity = 1,
  children,
}: {
  delayMs: number;
  duration?: number;
  range?: number;
  pos: Pos;
  opacity?: number;
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
  return (
    <Animated.View style={[{ position: 'absolute', opacity }, pos, animated]}>
      {children}
    </Animated.View>
  );
}

/**
 * AuthDecorations — the layer itself. Renders six sticker illustrations
 * at hand-tuned positions across the screen.
 *
 * Sizes are tuned for typical phone widths (~360–440pt). On larger
 * tablets they'll look a touch small but still cohesive — we'd need a
 * size-by-breakpoint pass for true tablet polish, but that's a future
 * enhancement, not a blocker.
 */
export function AuthDecorations() {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* === Top half === */}
      <Bob delayMs={0} duration={2200} range={5} pos={{ top: '4%', left: '4%' }} opacity={0.8}>
        <Daisy width={56} />
      </Bob>
      <Bob delayMs={800} duration={2800} range={6} pos={{ top: '5%', right: '2%' }} opacity={0.85}>
        <DinoBlue width={120} />
      </Bob>

      {/* === Middle === */}
      <Bob delayMs={400} duration={2000} range={7} pos={{ top: '40%', left: '-4%' }} opacity={0.75}>
        <DinoPink width={110} />
      </Bob>
      <Bob delayMs={1600} duration={3000} range={5} pos={{ top: '38%', right: '4%' }} opacity={0.8}>
        <Daisy width={48} />
      </Bob>

      {/* === Bottom half === */}
      <Bob delayMs={600} duration={2400} range={6} pos={{ bottom: '6%', left: '3%' }} opacity={0.85}>
        <Stegosaurus width={120} />
      </Bob>
      <Bob delayMs={1200} duration={1800} range={8} pos={{ bottom: '14%', left: '42%' }} opacity={0.8}>
        <Tulip width={44} />
      </Bob>
      <Bob delayMs={200} duration={2600} range={6} pos={{ bottom: '6%', right: '3%' }} opacity={0.85}>
        <Sunflower width={75} />
      </Bob>
    </View>
  );
}
