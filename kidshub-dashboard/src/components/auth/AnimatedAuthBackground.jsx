import React from 'react';

import { Daisy, DinoBlue, DinoPink, Stegosaurus, Sunflower, Tulip } from './StickerIllustrations';

/**
 * AnimatedAuthBackground — sticker-style nursery decoration layer for
 * the Login / Register right-side column.
 *
 * Direction (per latest owner feedback): plain off-white surface with
 * cartoon dinosaurs and flowers scattered around the edges, like a
 * pre-school flashcard wall. The previous brand-gradient + blurred-blob
 * + lucide-icon recipe read as "designy", not "kid-themed".
 *
 * Layers, back to front (all `pointer-events: none` and `aria-hidden`):
 *
 *   1. Flat surface-50 (#FAFAFA) base — basically white but with a
 *      hint of warmth so the form card (pure white) lifts off it
 *      visually. No gradient.
 *
 *   2. Six sticker illustrations from `<StickerIllustrations />`:
 *        - DinoBlue (top-right, the "anchor" character)
 *        - DinoPink (middle-left, balances the blue)
 *        - Stegosaurus (bottom-left)
 *        - Daisy x2 (top-left + middle-right)
 *        - Tulip (bottom-center)
 *        - Sunflower (bottom-right)
 *      Positions are chosen to hug the page edges and stay clear of
 *      the centered form column at all common viewport widths. Each
 *      sticker has its own `animate-float-*` cadence + delay so the
 *      scene feels alive without synchronised bobbing.
 *
 * Opacity: kept at ~70-85% (not the heavy 30-40% fade we usually use
 * for bg patterns) — these are the *content* of the background now,
 * not subtle texture, so they should be vivid enough to read as
 * actual drawings.
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
      className="pointer-events-none absolute inset-0 overflow-hidden bg-surface-50">
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
