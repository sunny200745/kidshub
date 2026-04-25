/**
 * build-icons.mjs — regenerate every raster brand asset across the
 * monorepo from the single SVG source at `<repo>/brand/kidshub-logo.svg`.
 *
 * One source of truth. Re-run any time the logo changes:
 *
 *   cd kidshub && npm run build:icons
 *
 * What it writes (overwrites in place):
 *
 *   kidshub/assets/images/ — Expo app icons + splash + favicon
 *     - icon.png                       1024×1024  iOS app icon
 *     - favicon.png                      96×96    web favicon
 *     - splash-icon.png                1024×1024  splash (Expo scales it
 *                                                 to the `imageWidth` in
 *                                                 app.json)
 *     - android-icon-foreground.png    1024×1024  logo padded inside the
 *                                                 Android adaptive safe
 *                                                 zone (OS masks the icon
 *                                                 to a circle / squircle,
 *                                                 so we leave room around
 *                                                 the edges)
 *     - android-icon-background.png    1024×1024  solid white (logo
 *                                                 already carries its own
 *                                                 gradient chip)
 *     - android-icon-monochrome.png    1024×1024  white-on-transparent
 *                                                 silhouette of the
 *                                                 rounded-square chip,
 *                                                 for Material You
 *
 *   kidshub-landing/assets/
 *     - kidshub-logo.png                128×128   PNG fallback used by the
 *                                                 transactional email
 *                                                 template — most email
 *                                                 clients (Gmail, Outlook,
 *                                                 Yahoo) won't render
 *                                                 inline SVG reliably, so
 *                                                 we ship a small PNG as
 *                                                 the brand mark in emails
 *
 * Why hand-rolled instead of `expo prebuild` / `@expo/icon-tools`:
 *   - We want deterministic, tracked-in-git PNGs that any contributor can
 *     re-build offline, without spinning up the Expo CLI's cache layer.
 *   - sharp is already a one-line devDep and gives us pixel-exact output.
 *
 * Why this script lives under kidshub/ even though it writes into
 * kidshub-landing/: kidshub already has sharp installed and an npm
 * scripts entry point, and brand assets are a build-time concern not an
 * app-runtime one. Centralizing here keeps the "regenerate everything"
 * command to one invocation.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SVG_PATH = path.join(REPO_ROOT, 'brand', 'kidshub-logo.svg');
const KIDSHUB_OUT = path.resolve(__dirname, '..', 'assets', 'images');
const LANDING_OUT = path.resolve(REPO_ROOT, 'kidshub-landing', 'assets');

const svgBuffer = await fs.readFile(SVG_PATH);

// Render the full logo SVG at the requested square size and write it.
async function renderLogo(outDir, size, outFile) {
  await sharp(svgBuffer, { density: 1024 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, outFile));
  console.log(`  ✓ ${path.relative(REPO_ROOT, path.join(outDir, outFile))} (${size}×${size})`);
}

// Render the logo centered on a transparent canvas with `paddingRatio`
// of empty space on every side. Used for Android adaptive foreground —
// Android will mask the icon to a circle / squircle / rounded square,
// so the actual mark needs to live inside the central ~660/1024 ≈ 64%
// safe zone or it will get clipped on some launchers.
async function renderPadded(outDir, size, paddingRatio, outFile) {
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const offset = Math.round((size - inner) / 2);
  const innerPng = await sharp(svgBuffer, { density: 1024 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: innerPng, top: offset, left: offset }])
    .png()
    .toFile(path.join(outDir, outFile));
  console.log(
    `  ✓ ${path.relative(REPO_ROOT, path.join(outDir, outFile))} (${size}×${size}, ${Math.round(paddingRatio * 100)}% pad)`,
  );
}

// Render a flat solid-color square. Used for Android adaptive background.
async function renderSolid(outDir, size, color, outFile) {
  await sharp({
    create: { width: size, height: size, channels: 4, background: color },
  })
    .png()
    .toFile(path.join(outDir, outFile));
  console.log(
    `  ✓ ${path.relative(REPO_ROOT, path.join(outDir, outFile))} (${size}×${size}, solid ${color})`,
  );
}

// Render an inline SVG string at the requested size. Used for the
// monochrome adaptive icon — Android Material You expects a single-color
// silhouette of the brand mark, so we hand-author a stripped-down SVG
// that matches the rounded-square outline of the real logo.
async function renderInlineSvg(outDir, size, svgString, outFile) {
  await sharp(Buffer.from(svgString), { density: 1024 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, outFile));
  console.log(
    `  ✓ ${path.relative(REPO_ROOT, path.join(outDir, outFile))} (${size}×${size}, inline SVG)`,
  );
}

await fs.mkdir(KIDSHUB_OUT, { recursive: true });
await fs.mkdir(LANDING_OUT, { recursive: true });

console.log(`Source: ${path.relative(REPO_ROOT, SVG_PATH)}`);
console.log('');
console.log('Mobile app (Expo):');
await renderLogo(KIDSHUB_OUT, 1024, 'icon.png');
await renderLogo(KIDSHUB_OUT, 96, 'favicon.png');
await renderLogo(KIDSHUB_OUT, 1024, 'splash-icon.png');
// 18% padding on each side ⇒ logo occupies the central 64% of the canvas,
// matching Android's adaptive icon safe zone (the OS may shave up to 18%
// off each edge depending on launcher mask).
await renderPadded(KIDSHUB_OUT, 1024, 0.18, 'android-icon-foreground.png');
await renderSolid(KIDSHUB_OUT, 1024, '#FFFFFF', 'android-icon-background.png');
await renderInlineSvg(
  KIDSHUB_OUT,
  1024,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
     <rect x="6" y="6" width="52" height="52" rx="14" fill="#FFFFFF"/>
   </svg>`,
  'android-icon-monochrome.png',
);

console.log('');
console.log('Landing site (email template fallback):');
await renderLogo(LANDING_OUT, 128, 'kidshub-logo.png');

console.log('');
console.log('Done. Re-run any time brand/kidshub-logo.svg changes.');
