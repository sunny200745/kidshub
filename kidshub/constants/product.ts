/**
 * Thin re-export of the monorepo-root `config/product.ts` so everything
 * in kidshub imports from `@/constants/product` rather than reaching
 * into `../../config/...` from a deep tab file.
 *
 * If you ever need to change which config file feeds kidshub (e.g.
 * switch to a per-env override), this is the ONE file to touch.
 *
 * Metro resolves the `../../config/product` path via watchFolders
 * (monorepoRoot) — see kidshub/metro.config.js.
 */
export * from '../../config/product';
