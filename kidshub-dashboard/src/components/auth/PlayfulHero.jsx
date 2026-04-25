import React from 'react';

/**
 * PlayfulHero — kid-themed cartoon scene shown above the auth form
 * on mobile/tablet (< lg). Hidden on desktop, where the dark hero on
 * the left already does the visual heavy lifting.
 *
 * Why custom inline SVG instead of an icon library or stock image:
 *   - We don't ship third-party characters (no IP exposure on the
 *     "minions / anime" idea the owner floated — same playful vibe,
 *     fully original artwork).
 *   - Inline SVG inherits document color where useful, scales without
 *     loading a network asset, and the seven shapes together still
 *     come in under ~6KB so there's no perf cost over loading a
 *     single PNG mascot.
 *   - Each character can carry its own Tailwind animate-* class so
 *     the scene feels alive without a video / Lottie dependency.
 *
 * Composition (left → right): smiling cloud, beaming sun, friendly
 * brontosaurus, smiling flower, pink balloon, fluttering butterfly,
 * purple star with a face. Each bobs/floats at a slightly different
 * cadence (`animate-float`, `animate-float-slow`, `animate-float-fast`)
 * so the row never looks like a coordinated dance — that's what makes
 * it read as "alive" instead of "loading".
 *
 * Layout: `flex-wrap justify-center` so on the very narrowest devices
 * (~320px) the row gracefully wraps to two lines instead of overflowing
 * the column.
 *
 * Accessibility: the whole strip is `role="img"` with a single
 * `aria-label` so screen readers get one friendly description
 * instead of being told about seven separate decorative shapes.
 */
export default function PlayfulHero() {
  return (
    <div
      role="img"
      aria-label="A friendly cartoon scene with a cloud, sun, dinosaur, flower, balloon, butterfly, and star"
      className="lg:hidden flex flex-wrap items-end justify-center gap-3 mb-6 select-none">
      <SmilingCloud className="animate-float" />
      <SmilingSun className="animate-float-slow" style={{ animationDelay: '1s' }} />
      <Dinosaur className="animate-float-fast" style={{ animationDelay: '0.3s' }} />
      <Flower className="animate-float" style={{ animationDelay: '0.7s' }} />
      <Balloon className="animate-float-fast" style={{ animationDelay: '0.5s' }} />
      <Butterfly className="animate-float-slow" style={{ animationDelay: '1.8s' }} />
      <StarFace className="animate-float" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}

// All mascots use stroke + fill from the brand-adjacent palette so they
// match the gradient base behind them. Sizes are deliberately small
// (~48–72px) — they're a sprinkle, not a hero illustration.

function SmilingCloud({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 80 60"
      width="64"
      height="50"
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
      width="56"
      height="56"
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
      width="38"
      height="68"
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
      width="48"
      height="48"
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

/**
 * Dinosaur — friendly brontosaurus mascot. Cartoon proportions
 * (oversized head, tiny legs, gentle smile) so it reads as cute,
 * not scary. Green palette so it doesn't fight the pink/purple
 * gradient — green is a complementary accent, not the lead color.
 */
function Dinosaur({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 110 80"
      width="72"
      height="56"
      className={className}
      style={style}
      aria-hidden="true">
      {/* Tail — curved, ends in a soft point */}
      <path
        d="M10 52 Q4 46 8 38 Q14 44 26 50 Z"
        fill="#86EFAC"
        stroke="#16A34A"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Body */}
      <ellipse cx="48" cy="50" rx="32" ry="18" fill="#86EFAC" stroke="#16A34A" strokeWidth="2" />
      {/* Belly — lighter shade for cute tummy detail */}
      <ellipse cx="48" cy="56" rx="22" ry="9" fill="#BBF7D0" />
      {/* Spikes along the back */}
      <path
        d="M30 36 L33 30 L36 36 M42 33 L45 27 L48 33 M54 33 L57 27 L60 33 M66 36 L69 30 L72 36"
        fill="none"
        stroke="#16A34A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Neck + head */}
      <path
        d="M72 42 Q88 30 86 14 Q82 12 80 18 Q72 30 66 38 Z"
        fill="#86EFAC"
        stroke="#16A34A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="86" cy="14" r="11" fill="#86EFAC" stroke="#16A34A" strokeWidth="2" />
      {/* Eye — happy closed-arc */}
      <path
        d="M82 12 Q85 9 88 12"
        stroke="#1F2937"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Smile */}
      <path
        d="M84 18 Q87 21 91 18"
        stroke="#1F2937"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek */}
      <circle cx="91" cy="16" r="1.6" fill="#FB7185" opacity="0.6" />
      {/* Legs */}
      <rect x="32" y="64" width="7" height="12" rx="2" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.6" />
      <rect x="56" y="64" width="7" height="12" rx="2" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Flower — five pink petals, yellow smiling center, green stem with
 * one leaf. Wider than tall on purpose so it pairs visually with the
 * dinosaur (which sits grounded) instead of looking like another
 * "floating in the air" mascot.
 */
function Flower({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 70 90"
      width="50"
      height="68"
      className={className}
      style={style}
      aria-hidden="true">
      {/* Stem */}
      <path
        d="M35 48 Q33 65 35 84"
        stroke="#16A34A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaf */}
      <path
        d="M34 65 Q22 60 18 70 Q26 74 34 70 Z"
        fill="#86EFAC"
        stroke="#16A34A"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Five petals around the center, ~72° apart */}
      <circle cx="35" cy="14" r="11" fill="#FF94C8" stroke="#E11D74" strokeWidth="1.6" />
      <circle cx="55" cy="24" r="11" fill="#FF94C8" stroke="#E11D74" strokeWidth="1.6" />
      <circle cx="48" cy="42" r="11" fill="#FF94C8" stroke="#E11D74" strokeWidth="1.6" />
      <circle cx="22" cy="42" r="11" fill="#FF94C8" stroke="#E11D74" strokeWidth="1.6" />
      <circle cx="15" cy="24" r="11" fill="#FF94C8" stroke="#E11D74" strokeWidth="1.6" />
      {/* Center disk + face */}
      <circle cx="35" cy="28" r="9" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.6" />
      <circle cx="32" cy="26" r="1.4" fill="#92400E" />
      <circle cx="38" cy="26" r="1.4" fill="#92400E" />
      <path
        d="M32 30 Q35 33 38 30"
        stroke="#92400E"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Butterfly — small accent character. Two pairs of wings (large upper
 * + small lower) in purple/pink so it bridges the two brand hues, with
 * a thin black body. Tiny antennae add personality at almost no cost.
 *
 * Wings are intentionally non-mirrored in shading to feel hand-drawn
 * rather than perfectly geometric.
 */
function Butterfly({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 80 70"
      width="56"
      height="48"
      className={className}
      style={style}
      aria-hidden="true">
      {/* Upper wings */}
      <path
        d="M40 36 Q14 6 6 22 Q4 36 22 38 Q34 38 40 36 Z"
        fill="#A78BFA"
        stroke="#7C3AED"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M40 36 Q66 6 74 22 Q76 36 58 38 Q46 38 40 36 Z"
        fill="#FF94C8"
        stroke="#E11D74"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Lower wings */}
      <path
        d="M40 38 Q22 50 16 62 Q26 66 36 56 Q40 48 40 38 Z"
        fill="#C4B5FD"
        stroke="#7C3AED"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M40 38 Q58 50 64 62 Q54 66 44 56 Q40 48 40 38 Z"
        fill="#FBA8CF"
        stroke="#E11D74"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Tiny wing dots — playful detail */}
      <circle cx="20" cy="26" r="2" fill="#FFFFFF" opacity="0.85" />
      <circle cx="60" cy="26" r="2" fill="#FFFFFF" opacity="0.85" />
      {/* Body */}
      <ellipse cx="40" cy="42" rx="2.6" ry="12" fill="#1F2937" />
      {/* Antennae */}
      <path
        d="M39 30 Q34 22 32 18"
        stroke="#1F2937"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M41 30 Q46 22 48 18"
        stroke="#1F2937"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="32" cy="18" r="1.6" fill="#1F2937" />
      <circle cx="48" cy="18" r="1.6" fill="#1F2937" />
    </svg>
  );
}
