import React from 'react';

import { Daisy, DinoBlue, DinoPink, Stegosaurus, Sunflower, Tulip } from './StickerIllustrations';

/**
 * AnimatedAuthBackground — background layer for the Login / Register
 * right-side column (which is also the ENTIRE viewport on mobile +
 * tablet, since the desktop left hero is `hidden lg:flex`).
 *
 * Direction (per latest owner feedback): on mobile / tablet, mirror
 * the desktop left hero's *base* treatment — dark surface-900, the
 * subtle "+" SVG pattern, and the brand-pink + accent-purple gradient
 * blobs — and then layer the floating sticker dinos + flowers on top
 * of it. So mobile/tablet ends up reading as "Owner Portal mood +
 * playful nursery characters", combining both prior iterations.
 *
 * On desktop the right column is the form column sitting next to the
 * dark left hero, so it stays light (surface-50) with the same
 * sticker decorations — no plus pattern, no blobs there because the
 * dark left hero is already on screen providing the brand drama.
 *
 * Layers, back to front (all `pointer-events: none` and `aria-hidden`):
 *
 *   1. Base color — RESPONSIVE:
 *        - Mobile / tablet (< lg): surface-900 (#212121).
 *        - Desktop (>= lg): surface-50 (#FAFAFA).
 *
 *   2. Mobile/tablet-only "owner-hero" texture (hidden lg+):
 *        a) "+" SVG pattern overlay at 5% opacity — copied verbatim
 *           from the desktop left hero so the texture is byte-for-byte
 *           identical across viewports.
 *        b) Brand-pink top-right blob + accent-purple bottom-left
 *           blob (both `w-96 h-96 blur-3xl`, 20% opacity) — same
 *           color cue as the desktop hero.
 *
 *   3. Six sticker illustrations from `<StickerIllustrations />`
 *      (DinoBlue, DinoPink, Stegosaurus, Daisy x2, Tulip, Sunflower).
 *      Rendered on every viewport — pastels read as "neon stickers"
 *      on the dark mobile/tablet surface, and as "flashcard wall" on
 *      the light desktop surface. Positions hug the column edges and
 *      stay clear of the centered form card. Each has its own
 *      `animate-float-*` cadence + delay so the scene feels alive
 *      without synchronised bobbing.
 *
 * No props by design — Login + Register share identical chrome.
 *
 * Layout: positioned absolutely to fill the parent. Caller needs to
 * be `relative overflow-hidden`.
 */
export default function AnimatedAuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-surface-900 lg:bg-surface-50">
      {/* ============================================================
          Mobile / tablet "Owner Portal" texture — sits BELOW the
          stickers so the plus pattern + blobs read as a brand-tinted
          backdrop that the characters are floating in front of.
          Hidden on lg+ where the dark left hero is already on screen.
          ============================================================ */}
      <div className="lg:hidden absolute inset-0">
        {/* Subtle "+" pattern — copied verbatim from the desktop left
            hero so the texture is byte-for-byte identical across
            viewports. */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Brand + accent gradient blobs — same colors / sizes /
            opacities / blur as the desktop left hero. */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      {/* ============================================================
          Sticker decorations — rendered on every viewport. Pastel
          characters pop nicely against both the dark hero treatment
          (mobile/tablet) and the light surface-50 (desktop). Each
          sticker has its own animation cadence + delay so the scene
          feels alive without synchronised bobbing.
          ============================================================ */}
      {/* === Top half === */}
      <div className="absolute top-[4%] left-[6%] opacity-80 animate-float">
        <Daisy width={70} />
      </div>
      <div
        className="absolute top-[6%] right-[4%] opacity-85 animate-float-slow"
        style={{ animationDelay: '0.8s' }}>
        <DinoBlue width={150} />
      </div>

      {/* === Middle === */}
      <div
        className="absolute top-[42%] left-[4%] opacity-80 animate-float-fast"
        style={{ animationDelay: '0.4s' }}>
        <DinoPink width={130} />
      </div>
      <div
        className="absolute top-[40%] right-[6%] opacity-80 animate-float-slow"
        style={{ animationDelay: '1.6s' }}>
        <Daisy width={60} />
      </div>

      {/* === Bottom half === */}
      <div
        className="absolute bottom-[6%] left-[5%] opacity-85 animate-float"
        style={{ animationDelay: '0.6s' }}>
        <Stegosaurus width={140} />
      </div>
      <div
        className="absolute bottom-[10%] left-[40%] opacity-80 animate-float-fast"
        style={{ animationDelay: '1.2s' }}>
        <Tulip width={55} />
      </div>
      <div
        className="absolute bottom-[6%] right-[5%] opacity-85 animate-float-slow"
        style={{ animationDelay: '0.2s' }}>
        <Sunflower width={90} />
      </div>
    </div>
  );
}
