/**
 * AuthDecorations — background decoration layer for the parent / staff
 * app's auth screens (`/login`, `/forgot-password`, `/register`).
 *
 * Mirrors the dashboard's mobile / tablet auth background — same "+"
 * SVG pattern + brand-pink and accent-purple soft "blobs" + the same
 * six floating sticker characters (DinoBlue, DinoPink, Stegosaurus,
 * Daisy, Tulip, Sunflower) — but on a LIGHT base color (the parent /
 * staff app is mobile-first utility and stays bright). Effectively:
 *
 *   dashboard mobile/tablet:  dark surface  +  pattern  +  blobs  +  stickers
 *   parent/staff app:         LIGHT surface +  pattern  +  blobs  +  stickers
 *
 * Layers, back to front (all `pointer-events: none` to never steal
 * taps from the form):
 *
 *   1. "+" SVG pattern — dark dots at ~7% opacity. On a light bg this
 *      reads as a subtle dotted texture, like graph paper. Same shape
 *      and tile size as the dashboard's pattern so the texture feels
 *      identical across products.
 *
 *   2. Two brand-color "blobs" — a brand-pink circle pinned top-right
 *      and an accent-purple circle pinned bottom-left, both at ~12%
 *      opacity with very large border-radius. RN doesn't have a true
 *      `blur-3xl` equivalent (filter blur) without a heavy native
 *      module, so we lean on translucent fills + soft circles to give
 *      the diffuse color cue. Reads as "brand-tinted glow", not "hard
 *      shape".
 *
 *   3. Six floating stickers from `<sticker-illustrations.tsx>`. Each
 *      one is wrapped in a `FloatingSticker` that uses Reanimated to
 *      bob it up and down a few pixels on a long loop. Three cadences
 *      (3s / 4s / 6s) and staggered delays mean nothing bobs in sync,
 *      so the scene feels alive rather than mechanical. Same delay /
 *      cadence assignments as the dashboard's `animate-float-*` recipe.
 *
 * Rendered absolutely-positioned, filling the parent. The caller (the
 * `AuthShell`) puts this layer BEHIND its `ScrollView`, so the form
 * card scrolls in front of a fixed decoration layer — the stickers
 * stay anchored to the viewport corners while the user scrolls the
 * form on a small screen.
 */
import { ReactNode, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { Daisy, DinoBlue, DinoPink, Stegosaurus, Sunflower, Tulip } from './sticker-illustrations';

/**
 * FloatingSticker — wraps any sticker in an Animated.View that bobs
 * up + down on a Reanimated loop. Internal helper, not exported.
 *
 * Why a wrapper instead of animating each sticker SVG directly:
 *   - The SVGs are pure draw code. Keeping them stateless makes them
 *     trivially testable / hot-reloadable and means a future "static
 *     sticker pack" use case (e.g. inside a card) doesn't pay the
 *     animation cost.
 *   - Animation belongs to the auth-screen layout decision, not to
 *     the sticker's identity, so it lives at this layer.
 */
function FloatingSticker({
  children,
  duration,
  delay,
  amplitude = 8,
  style,
}: {
  children: ReactNode;
  duration: number;
  delay: number;
  amplitude?: number;
  style: object;
}) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      delay,
      withRepeat(withTiming(-amplitude, { duration }), -1, true),
    );
  }, [amplitude, delay, duration, offset]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
}

/**
 * PlusPattern — full-screen dotted "+" texture. Internal helper.
 *
 * Implementation: a single `<Svg>` with a `<Pattern>` definition that
 * tiles a tiny "+" path every 30px. The pattern uses `userSpaceOnUse`
 * so it doesn't scale with the SVG viewport; the `<Rect>` fill picks
 * up the pattern via `url(#plus)`. Rendering the whole texture as one
 * SVG (instead of N individual `<Path>` elements) keeps the layer
 * cheap and lets the rasterizer dedupe the tile draw.
 */
function PlusPattern() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern id="plus" width={30} height={30} patternUnits="userSpaceOnUse">
          <Path d="M14 13v-3h2v3h3v2h-3v3h-2v-3h-3v-2z" fill="#0F172A" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#plus)" opacity={0.07} />
    </Svg>
  );
}

export function AuthDecorations() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {/* === Layer 1: dotted "+" texture === */}
      <PlusPattern />

      {/* === Layer 2: brand-color "blobs" ===
          Two oversized translucent circles pinned to opposite
          corners, peeking just past the screen edge. Pink top-right,
          purple bottom-left — same color positions as the dashboard
          left hero so the brand cue reads identically across
          products. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#FF2D8A',
          opacity: 0.12,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -120,
          left: -120,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: '#A855F7',
          opacity: 0.12,
        }}
      />

      {/* === Layer 3: floating stickers ===
          Same character set + same edge layout as the dashboard auth
          right column. Sizes are tuned down ~25-30% from the desktop
          defaults because phone screens are narrower and the form
          card is centered — these need to peek around the card, not
          fight it. Each has its own duration + delay so the bobbing
          is desynchronised. */}

      {/* Top-left — small daisy */}
      <FloatingSticker
        duration={4000}
        delay={0}
        style={{ position: 'absolute', top: '4%', left: '5%', opacity: 0.85 }}>
        <Daisy width={56} />
      </FloatingSticker>

      {/* Top-right — anchor character (blue dino) */}
      <FloatingSticker
        duration={6000}
        delay={800}
        style={{ position: 'absolute', top: '5%', right: '4%', opacity: 0.9 }}>
        <DinoBlue width={120} />
      </FloatingSticker>

      {/* Middle-left — pink dino balancing the blue */}
      <FloatingSticker
        duration={3000}
        delay={400}
        style={{ position: 'absolute', top: '40%', left: '3%', opacity: 0.85 }}>
        <DinoPink width={100} />
      </FloatingSticker>

      {/* Middle-right — small daisy */}
      <FloatingSticker
        duration={6000}
        delay={1600}
        style={{ position: 'absolute', top: '42%', right: '5%', opacity: 0.8 }}>
        <Daisy width={48} />
      </FloatingSticker>

      {/* Bottom-left — stegosaurus */}
      <FloatingSticker
        duration={4000}
        delay={600}
        style={{ position: 'absolute', bottom: '6%', left: '4%', opacity: 0.9 }}>
        <Stegosaurus width={110} />
      </FloatingSticker>

      {/* Bottom-center — tulip */}
      <FloatingSticker
        duration={3000}
        delay={1200}
        style={{ position: 'absolute', bottom: '10%', alignSelf: 'center', opacity: 0.85 }}>
        <Tulip width={48} />
      </FloatingSticker>

      {/* Bottom-right — sunflower (warm anchor opposite the blue dino) */}
      <FloatingSticker
        duration={6000}
        delay={200}
        style={{ position: 'absolute', bottom: '6%', right: '4%', opacity: 0.9 }}>
        <Sunflower width={68} />
      </FloatingSticker>
    </View>
  );
}
