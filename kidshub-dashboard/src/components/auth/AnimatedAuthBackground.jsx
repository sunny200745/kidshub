import React from 'react';
import { Heart, Sparkles, Star } from 'lucide-react';

/**
 * AnimatedAuthBackground — themed, gently animated chrome for the
 * Login / Register right-side column.
 *
 * Replaces the original "static gradient + 3 still blobs" treatment
 * after the owner feedback that the page felt too quiet for a kid-care
 * brand. Layers, from back to front:
 *
 *   1. Brand gradient base (pink-50 → white → purple-50). Sets the
 *      overall warmth without competing with the form.
 *   2. Three blurred color blobs (pink, purple, soft pink) animated
 *      with `animate-pulse-blob` — they breathe slowly so the page
 *      feels alive on its own without needing user interaction.
 *   3. A scattered "decoration layer" of small icons:
 *        - 5 stars (yellow + pink mix) twinkling at staggered delays
 *          so they catch the eye like real sparkles, not a metronome.
 *        - 3 hearts (pink) floating up-and-down for a kid-care vibe.
 *        - 2 sparkle icons (purple) drifting + rotating slowly.
 *      Every decoration is `aria-hidden` and `pointer-events-none` so
 *      assistive tech and clicks ignore the layer entirely.
 *
 * No props by design — Login/Register share identical chrome so the
 * auth flow reads as one cohesive surface. If we ever need a teacher
 * variant (teal palette) we'd take a `tone` prop here, but every
 * signed-out path today is parent-pink.
 *
 * Layout: positioned absolutely to fill the parent container. Caller
 * needs to be `relative overflow-hidden` and is responsible for
 * stacking the actual form on top with z-index higher than 0.
 */
export default function AnimatedAuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50">
      {/* Pulsing color blobs — same recipe as the desktop hero on
          the left so brand language is consistent across columns. */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-300/40 blur-3xl animate-pulse-blob" />
      <div
        className="absolute -bottom-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent-300/35 blur-3xl animate-pulse-blob"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-brand-200/40 blur-2xl animate-pulse-blob"
        style={{ animationDelay: '4s' }}
      />

      {/* Twinkling stars — yellow + pink mix. Positions are picked to
          stay clear of the centered form column at typical viewport
          widths; even when they overlap the card edges they sit
          behind it in z-order. Each `animationDelay` keeps the
          stars from blinking in unison. */}
      <Star
        size={18}
        className="absolute top-[12%] left-[18%] text-warning-400 fill-warning-300 animate-twinkle"
        style={{ animationDelay: '0s' }}
      />
      <Star
        size={14}
        className="absolute top-[28%] right-[14%] text-brand-400 fill-brand-200 animate-twinkle"
        style={{ animationDelay: '1.2s' }}
      />
      <Star
        size={12}
        className="absolute top-[68%] left-[10%] text-warning-400 fill-warning-300 animate-twinkle-slow"
        style={{ animationDelay: '0.6s' }}
      />
      <Star
        size={16}
        className="absolute bottom-[18%] right-[22%] text-brand-400 fill-brand-200 animate-twinkle"
        style={{ animationDelay: '2.4s' }}
      />
      <Star
        size={10}
        className="absolute top-[8%] right-[36%] text-accent-400 fill-accent-200 animate-twinkle-slow"
        style={{ animationDelay: '1.8s' }}
      />

      {/* Floating hearts — pink, gentle bob. Hearts are deliberately
          low-saturation (300/40) so they read as decoration, not a
          "favorite" call to action. */}
      <Heart
        size={16}
        className="absolute top-[42%] left-[8%] text-brand-400 fill-brand-300/60 animate-float"
        style={{ animationDelay: '0s' }}
      />
      <Heart
        size={20}
        className="absolute bottom-[28%] right-[10%] text-brand-500 fill-brand-300/60 animate-float-slow"
        style={{ animationDelay: '1.5s' }}
      />
      <Heart
        size={12}
        className="absolute top-[78%] right-[36%] text-brand-400 fill-brand-300/60 animate-float-fast"
        style={{ animationDelay: '0.8s' }}
      />

      {/* Drifting sparkles — purple. Combined translate+rotate keyframe
          (`drift`) makes them feel like glitter caught in air rather
          than a UI loader spin. */}
      <Sparkles
        size={20}
        className="absolute top-[20%] left-[45%] text-accent-400 animate-drift"
        style={{ animationDelay: '0.4s' }}
      />
      <Sparkles
        size={14}
        className="absolute bottom-[10%] left-[40%] text-accent-500 animate-drift"
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
}
