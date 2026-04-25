/**
 * StickerIllustrations — large, sticker-style cartoon SVGs (dinos +
 * flowers) used as the background decoration layer on the parent /
 * staff app's signed-out screens. React Native port of the dashboard's
 * `StickerIllustrations.jsx` so both surfaces share the exact same
 * visual identity.
 *
 * Visual language (per owner reference): pastel-blue brontosaurus on
 * a soft mint card with white polka dots, friendly closed-eye smile.
 * Hallmarks:
 *   - Soft pastel fills (blue / mint / coral / pink / yellow).
 *   - Light outlines (1.6–2px) in a slightly darker shade of the fill.
 *   - White polka dots scattered on the bodies for "nursery sticker"
 *     texture.
 *   - Friendly closed-eye-arc + small smile + a tiny pink cheek.
 *
 * Why custom inline SVG (via react-native-svg) instead of an image
 * pack:
 *   - We don't ship third-party characters (no IP exposure).
 *   - Inline SVG renders identically across iOS / Android / web
 *     (RN-web), with no asset-loading flash on the most-visited screen.
 *   - Same proportions as the web counterparts so designers iterate
 *     once.
 */
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

type StickerProps = {
  width?: number;
};

// ============================================================
// DINOSAURS
// ============================================================

/**
 * DinoBlue — pastel-blue brontosaurus, the "anchor" character of the
 * set; matches the owner's reference image almost 1:1.
 */
export function DinoBlue({ width = 150 }: StickerProps) {
  const height = (width * 120) / 160;
  return (
    <Svg viewBox="0 0 160 120" width={width} height={height}>
      <Path
        d="M22 78 Q6 70 10 56 Q18 50 28 60 Q34 70 42 76 Z"
        fill="#A5C8E6"
        stroke="#7AABD4"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Ellipse cx={68} cy={68} rx={46} ry={24} fill="#A5C8E6" stroke="#7AABD4" strokeWidth={2} />
      <Ellipse cx={68} cy={78} rx={34} ry={11} fill="#D0E4F4" />
      <Path
        d="M104 54 Q128 38 130 16 Q124 12 119 22 Q108 38 96 52 Z"
        fill="#A5C8E6"
        stroke="#7AABD4"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={132} cy={18} r={14} fill="#A5C8E6" stroke="#7AABD4" strokeWidth={2} />
      <Path d="M125 16 Q129 12 133 16" stroke="#1F2937" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M129 22 Q132 25 137 22" stroke="#1F2937" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle cx={138} cy={20} r={2} fill="#FBA8CF" opacity={0.55} />
      <Circle cx={46} cy={60} r={2} fill="#FFFFFF" />
      <Circle cx={60} cy={54} r={2.5} fill="#FFFFFF" />
      <Circle cx={74} cy={60} r={2} fill="#FFFFFF" />
      <Circle cx={88} cy={66} r={2.5} fill="#FFFFFF" />
      <Circle cx={52} cy={72} r={2} fill="#FFFFFF" />
      <Circle cx={68} cy={76} r={2.5} fill="#FFFFFF" />
      <Circle cx={84} cy={78} r={2} fill="#FFFFFF" />
      <Circle cx={100} cy={62} r={2} fill="#FFFFFF" />
      <Ellipse cx={58} cy={48} rx={3} ry={1.8} fill="#7AABD4" opacity={0.3} />
      <Ellipse cx={74} cy={50} rx={3} ry={1.8} fill="#7AABD4" opacity={0.3} />
      <Ellipse cx={90} cy={56} rx={3} ry={1.8} fill="#7AABD4" opacity={0.3} />
      <Rect x={44} y={86} width={10} height={18} rx={3} fill="#A5C8E6" stroke="#7AABD4" strokeWidth={1.8} />
      <Rect x={80} y={86} width={10} height={18} rx={3} fill="#A5C8E6" stroke="#7AABD4" strokeWidth={1.8} />
    </Svg>
  );
}

/**
 * DinoPink — same brontosaurus silhouette, pastel pink palette. Used
 * to balance the blue lead on the opposite side of the page.
 */
export function DinoPink({ width = 130 }: StickerProps) {
  const height = (width * 120) / 160;
  return (
    <Svg viewBox="0 0 160 120" width={width} height={height}>
      <Path
        d="M22 78 Q6 70 10 56 Q18 50 28 60 Q34 70 42 76 Z"
        fill="#FBA8CF"
        stroke="#F472B6"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Ellipse cx={68} cy={68} rx={46} ry={24} fill="#FBA8CF" stroke="#F472B6" strokeWidth={2} />
      <Ellipse cx={68} cy={78} rx={34} ry={11} fill="#FCD0E0" />
      <Path
        d="M104 54 Q128 38 130 16 Q124 12 119 22 Q108 38 96 52 Z"
        fill="#FBA8CF"
        stroke="#F472B6"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={132} cy={18} r={14} fill="#FBA8CF" stroke="#F472B6" strokeWidth={2} />
      <Path d="M125 16 Q129 12 133 16" stroke="#1F2937" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M129 22 Q132 25 137 22" stroke="#1F2937" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle cx={138} cy={20} r={2} fill="#E11D74" opacity={0.55} />
      <Circle cx={46} cy={60} r={2} fill="#FFFFFF" />
      <Circle cx={60} cy={54} r={2.5} fill="#FFFFFF" />
      <Circle cx={74} cy={60} r={2} fill="#FFFFFF" />
      <Circle cx={88} cy={66} r={2.5} fill="#FFFFFF" />
      <Circle cx={52} cy={72} r={2} fill="#FFFFFF" />
      <Circle cx={68} cy={76} r={2.5} fill="#FFFFFF" />
      <Circle cx={84} cy={78} r={2} fill="#FFFFFF" />
      <Circle cx={100} cy={62} r={2} fill="#FFFFFF" />
      <Ellipse cx={58} cy={48} rx={3} ry={1.8} fill="#F472B6" opacity={0.35} />
      <Ellipse cx={74} cy={50} rx={3} ry={1.8} fill="#F472B6" opacity={0.35} />
      <Ellipse cx={90} cy={56} rx={3} ry={1.8} fill="#F472B6" opacity={0.35} />
      <Rect x={44} y={86} width={10} height={18} rx={3} fill="#FBA8CF" stroke="#F472B6" strokeWidth={1.8} />
      <Rect x={80} y={86} width={10} height={18} rx={3} fill="#FBA8CF" stroke="#F472B6" strokeWidth={1.8} />
    </Svg>
  );
}

/**
 * Stegosaurus — pastel mint, simple triangular back plates. Different
 * silhouette from the brontos so the set has actual species variety,
 * not just color swaps.
 */
export function Stegosaurus({ width = 140 }: StickerProps) {
  const height = (width * 110) / 150;
  return (
    <Svg viewBox="0 0 150 110" width={width} height={height}>
      <Path
        d="M14 70 Q4 62 10 50 Q22 56 32 68 Z"
        fill="#B7E4C7"
        stroke="#74C69D"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M10 56 L4 48 L14 52 Z" fill="#74C69D" />
      <Ellipse cx={62} cy={64} rx={40} ry={22} fill="#B7E4C7" stroke="#74C69D" strokeWidth={2} />
      <Ellipse cx={62} cy={74} rx={30} ry={10} fill="#D8F3DC" />
      <Path d="M30 46 L37 32 L44 46 Z" fill="#74C69D" stroke="#52B788" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M44 42 L52 28 L60 42 Z" fill="#74C69D" stroke="#52B788" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M60 40 L68 26 L76 40 Z" fill="#74C69D" stroke="#52B788" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M76 42 L83 28 L90 42 Z" fill="#74C69D" stroke="#52B788" strokeWidth={1.5} strokeLinejoin="round" />
      <Ellipse cx={112} cy={62} rx={22} ry={15} fill="#B7E4C7" stroke="#74C69D" strokeWidth={2} />
      <Path d="M108 58 Q111 54 114 58" stroke="#1F2937" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M110 66 Q115 70 120 66" stroke="#1F2937" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle cx={124} cy={64} r={2} fill="#FBA8CF" opacity={0.55} />
      <Circle cx={44} cy={60} r={2} fill="#FFFFFF" />
      <Circle cx={58} cy={64} r={2.5} fill="#FFFFFF" />
      <Circle cx={72} cy={66} r={2} fill="#FFFFFF" />
      <Circle cx={86} cy={64} r={2.5} fill="#FFFFFF" />
      <Circle cx={50} cy={72} r={2} fill="#FFFFFF" />
      <Circle cx={68} cy={74} r={2.5} fill="#FFFFFF" />
      <Circle cx={82} cy={72} r={2} fill="#FFFFFF" />
      <Rect x={40} y={82} width={9} height={16} rx={2.5} fill="#B7E4C7" stroke="#74C69D" strokeWidth={1.6} />
      <Rect x={74} y={82} width={9} height={16} rx={2.5} fill="#B7E4C7" stroke="#74C69D" strokeWidth={1.6} />
    </Svg>
  );
}

// ============================================================
// FLOWERS
// ============================================================

/**
 * Daisy — six round white petals + yellow center + green stem.
 */
export function Daisy({ width = 80 }: StickerProps) {
  const height = (width * 110) / 80;
  return (
    <Svg viewBox="0 0 80 110" width={width} height={height}>
      <Path
        d="M40 42 Q37 65 40 100"
        stroke="#74C69D"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M38 70 Q22 65 18 78 Q28 82 40 75 Z"
        fill="#B7E4C7"
        stroke="#74C69D"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M42 84 Q58 80 60 92 Q50 96 40 88 Z"
        fill="#B7E4C7"
        stroke="#74C69D"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={40} cy={14} r={9} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1.4} />
      <Circle cx={52} cy={20} r={9} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1.4} />
      <Circle cx={52} cy={36} r={9} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1.4} />
      <Circle cx={40} cy={42} r={9} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1.4} />
      <Circle cx={28} cy={36} r={9} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1.4} />
      <Circle cx={28} cy={20} r={9} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth={1.4} />
      <Circle cx={40} cy={28} r={8} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.5} />
    </Svg>
  );
}

/**
 * Tulip — pink bell on a green stem with two leaves. Adds vertical /
 * narrow silhouette to balance the rounder daisy + sunflower.
 */
export function Tulip({ width = 60 }: StickerProps) {
  const height = (width * 110) / 60;
  return (
    <Svg viewBox="0 0 60 110" width={width} height={height}>
      <Path
        d="M30 50 Q28 75 30 105"
        stroke="#74C69D"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M28 64 Q14 60 10 74 Q22 80 30 70 Z"
        fill="#B7E4C7"
        stroke="#74C69D"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M32 80 Q46 76 50 90 Q38 94 30 84 Z"
        fill="#B7E4C7"
        stroke="#74C69D"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M30 10 Q14 16 16 38 Q22 52 30 50 Q38 52 44 38 Q46 16 30 10 Z"
        fill="#FF94C8"
        stroke="#E11D74"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M30 20 Q24 28 24 42 Q28 50 30 50 Q32 50 36 42 Q36 28 30 20 Z"
        fill="#FFC2DF"
      />
    </Svg>
  );
}

/**
 * Sunflower — yellow petals around a brown center, on a green stem.
 * Warm anchor; pairs visually with DinoBlue across the page.
 */
export function Sunflower({ width = 90 }: StickerProps) {
  const height = (width * 120) / 90;
  return (
    <Svg viewBox="0 0 90 120" width={width} height={height}>
      <Path
        d="M45 50 Q43 75 45 115"
        stroke="#74C69D"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M43 76 Q26 70 22 86 Q34 92 45 82 Z"
        fill="#B7E4C7"
        stroke="#74C69D"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {/* 8 petals — `transform="rotate(...)"` works in react-native-svg
          v15 the same as on web. */}
      <Ellipse cx={45} cy={10} rx={6} ry={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} />
      <Ellipse cx={61} cy={16} rx={6} ry={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} transform="rotate(45 61 16)" />
      <Ellipse cx={67} cy={32} rx={11} ry={6} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} />
      <Ellipse cx={61} cy={48} rx={6} ry={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} transform="rotate(-45 61 48)" />
      <Ellipse cx={45} cy={54} rx={6} ry={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} />
      <Ellipse cx={29} cy={48} rx={6} ry={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} transform="rotate(45 29 48)" />
      <Ellipse cx={23} cy={32} rx={11} ry={6} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} />
      <Ellipse cx={29} cy={16} rx={6} ry={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.4} transform="rotate(-45 29 16)" />
      <Circle cx={45} cy={32} r={11} fill="#92400E" stroke="#78350F" strokeWidth={1.5} />
      <Circle cx={42} cy={29} r={1.2} fill="#78350F" />
      <Circle cx={48} cy={29} r={1.2} fill="#78350F" />
      <Circle cx={42} cy={35} r={1.2} fill="#78350F" />
      <Circle cx={48} cy={35} r={1.2} fill="#78350F" />
      <Circle cx={45} cy={32} r={1.2} fill="#78350F" />
    </Svg>
  );
}
