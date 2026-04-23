/**
 * Runtime feature flags for kidshub. Unlike the per-tier `FEATURES` map
 * in config/product.ts (which gates features based on subscription), the
 * flags here are developer-level switches that globally turn experimental
 * or half-baked surfaces on/off.
 *
 * Resolution rules (first match wins):
 *   1. `EXPO_PUBLIC_<FLAG>` env var (`true`/`false` strings). Lets us flip
 *      a flag without a code deploy by setting the env var on EAS/Vercel.
 *   2. Default value from config/product.ts.
 *
 * The `ENABLE_WEB_APP` flag is the initial use case (B1 in PRODUCT_PLAN):
 *   - When false, visiting the kidshub web URL shows a "Download the app"
 *     splash instead of the full parent/teacher UI. Mobile-first
 *     positioning for launch.
 *   - When true, web and native render the same app. Kept in code so we
 *     don't lose the capability — just hidden for now.
 *   - To override at runtime: set EXPO_PUBLIC_ENABLE_WEB_APP=true in your
 *     environment (or a local `.env`) and restart Metro.
 */
import { ENABLE_WEB_APP_DEFAULT } from './product';

/**
 * Parse a `true`/`false`/`1`/`0` env string into a boolean. Returns null
 * for anything unset so callers can fall back to their default.
 *
 * We read process.env.EXPO_PUBLIC_ENABLE_WEB_APP via a LITERAL property
 * access (not a dynamic key) because Expo's lint rule requires literals
 * — `process.env[name]` is stripped at bundle time differently than
 * `process.env.NAME` and can silently become undefined on native.
 */
function normaliseBoolean(raw: string | undefined | null): boolean | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const normalised = String(raw).toLowerCase().trim();
  if (normalised === 'true' || normalised === '1') return true;
  if (normalised === 'false' || normalised === '0') return false;
  return null;
}

/**
 * Resolved at module-eval time. If you change the env var at runtime
 * (unlikely in RN), restart Metro — `process.env.EXPO_PUBLIC_*` is
 * inlined at bundle time, not read live.
 */
export const ENABLE_WEB_APP: boolean =
  normaliseBoolean(process.env.EXPO_PUBLIC_ENABLE_WEB_APP) ?? ENABLE_WEB_APP_DEFAULT;
