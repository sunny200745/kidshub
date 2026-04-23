/**
 * Thin re-export of the monorepo-root `config/product.ts` so everything
 * in kidshub-dashboard imports from a local path (`../config/product`)
 * rather than reaching into `../../../config/...`.
 *
 * If you ever need to change which config file feeds the dashboard (e.g.
 * switch to a per-env override), this is the ONE file to touch.
 *
 * Note: the root file is `.ts`. Vite + esbuild transpile TS imports from
 * JS seamlessly, so the .ts extension here is fine. If you're surprised
 * why the file resolves without an extension, that's why.
 */
export * from '../../../config/product';
