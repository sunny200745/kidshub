import React from 'react';

/**
 * PlayfulHero — kid-themed cartoon scene shown above the auth form
 * on mobile/tablet (< lg). Hidden on desktop, where the dark hero on
 * the left already does the visual heavy lifting.
 *
 * Why custom inline SVG instead of an icon library or stock image:
 *   - We don't ship third-party characters (no IP exposure on the
 *     "minions / anime" idea the owner floated — same vibe, fully
 *     original artwork).
 *   - Inline SVG inherits document color where useful, scales
 *     without loading a network asset, and the four shapes together
 *     are tiny (< 2KB) so there's no perf cost over loading any one
 *     PNG mascot.
 *   - Each character can carry its own Tailwind animate-* class so
 *     the scene feels alive without a video / Lottie dependency.
 *
 * Composition (left → right): smiling cloud, beaming sun, pink
 * balloon, purple star with a face. Each bobs/floats at a slightly
 * different cadence (`animate-float`, `animate-float-slow`,
 * `animate-float-fast`) so the row never looks like a coordinated
 * dance — that's what makes it read as "alive" instead of "loading".
 *
 * Accessibility: the whole strip is `role="img"` with a single
 * `aria-label` so screen readers get one friendly description
 * instead of being told about four separate decorative shapes.
 */
export default function PlayfulHero() {
  return (
    <div
      role="img"
      aria-label="A friendly cartoon scene with a cloud, sun, balloon, and star"
      className="lg:hidden flex items-end justify-center gap-4 mb-6 select-none">
      <SmilingCloud className="animate-float" />
      <SmilingSun className="animate-float-slow" style={{ animationDelay: '1s' }} />
      <Balloon className="animate-float-fast" style={{ animationDelay: '0.5s' }} />
      <StarFace className="animate-float" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}

// All four mascots use stroke + fill from the brand palette so they
// match the gradient base behind them. Sizes are deliberately small
// (~56–72px) — they're a sprinkle, not a hero illustration.

function SmilingCloud({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 80 60"
      width="72"
      height="56"
      className={className}
      style={style}
      aria-hidden="true">
      <path
        d="M20 42 Q12 38 16 28 Q16 18 30 20 Q35 10 48 14 Q60 12 64 24 Q74 26 72 38 Q72 48 62 48 L24 48 Q14 48 20 42 Z"
        fill="#FFFFFF"
        stroke="#FFC2DF"
        strokeWidth="2.5"
      />
      <circle cx="34" cy="32" r="2.2" fill="#475569" />
      <circle cx="50" cy="32" r="2.2" fill="#475569" />
      <path
        d="M36 38 Q42 43 48 38"
        stroke="#475569"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tiny rosy cheeks */}
      <circle cx="30" cy="38" r="2" fill="#FFC2DF" opacity="0.7" />
      <circle cx="54" cy="38" r="2" fill="#FFC2DF" opacity="0.7" />
    </svg>
  );
}

function SmilingSun({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 80 80"
      width="64"
      height="64"
      className={className}
      style={style}
      aria-hidden="true">
      {/* Rays — the parent group rotates so the sun appears to spin
          slowly while the face floats. Pure decoration. */}
      <g
        stroke="#F59E0B"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="origin-center animate-spin-slow"
        style={{ transformOrigin: '40px 40px' }}>
        <line x1="40" y1="4" x2="40" y2="14" />
        <line x1="40" y1="66" x2="40" y2="76" />
        <line x1="4" y1="40" x2="14" y2="40" />
        <line x1="66" y1="40" x2="76" y2="40" />
        <line x1="14" y1="14" x2="21" y2="21" />
        <line x1="59" y1="59" x2="66" y2="66" />
        <line x1="66" y1="14" x2="59" y2="21" />
        <line x1="21" y1="59" x2="14" y2="66" />
      </g>
      <circle cx="40" cy="40" r="20" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="33" cy="36" r="2.5" fill="#92400E" />
      <circle cx="47" cy="36" r="2.5" fill="#92400E" />
      <path
        d="M32 44 Q40 51 48 44"
        stroke="#92400E"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheeks */}
      <circle cx="29" cy="44" r="2" fill="#FB923C" opacity="0.6" />
      <circle cx="51" cy="44" r="2" fill="#FB923C" opacity="0.6" />
    </svg>
  );
}

function Balloon({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 50 90"
      width="44"
      height="78"
      className={className}
      style={style}
      aria-hidden="true">
      {/* Balloon body with a soft highlight to feel three-dimensional */}
      <ellipse cx="25" cy="30" rx="20" ry="26" fill="#FF94C8" stroke="#E11D74" strokeWidth="1.5" />
      <ellipse cx="18" cy="22" rx="5" ry="8" fill="#FFFFFF" opacity="0.45" />
      {/* Knot */}
      <path d="M22 55 L25 60 L28 55 Z" fill="#E11D74" />
      {/* Wavy string — quadratic curves give a "blowing in the wind" feel */}
      <path
        d="M25 60 Q30 70 22 78 Q18 84 26 88"
        stroke="#94A3B8"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarFace({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 60 60"
      width="56"
      height="56"
      className={className}
      style={style}
      aria-hidden="true">
      <path
        d="M30 4 L36.5 21 L54 22 L40 33 L45 50 L30 40 L15 50 L20 33 L6 22 L23.5 21 Z"
        fill="#A78BFA"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="25" cy="27" r="2.2" fill="#FFFFFF" />
      <circle cx="35" cy="27" r="2.2" fill="#FFFFFF" />
      <path
        d="M26 32 Q30 36 34 32"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
