# kidshub/hooks — migration map

This folder serves two purposes:

1. **Theme plumbing from the Expo template** (`use-color-scheme`, `use-theme-color`) — kept as-is, they're how `ThemedText` / `ThemedView` resolve light/dark colors.
2. **Navigation + auth helpers** (added in p3-7) — the thin layer that makes porting pages from `kidshub-legacy` (react-router-dom) and `kidshub-dashboard` (also react-router-dom) to this Expo app mechanical rather than invention-per-page.

## react-router-dom → expo-router pattern map

Use this table when porting a page in p3-10 (parent) or p3-11 (teacher). The left column is what you'll find in the legacy/dashboard source; the right column is the expo-router replacement.

| react-router-dom                             | expo-router / this folder                                              | Notes                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `import { useNavigate } from 'react-router-dom'`<br/>`const navigate = useNavigate()`<br/>`navigate('/home')` | `import { useRouter } from 'expo-router'`<br/>`const router = useRouter()`<br/>`router.push('/home')` | `router.replace(path)` for non-back-stack navigation; `router.back()` for `navigate(-1)`. |
| `<Link to="/home">`                          | `<Link href="/home">` from `expo-router`                               | Same-name import, different prop name.                                |
| `<NavLink to="/home" className={({ isActive }) => ...}>` | `useIsRouteActive('/home')` + conditional className                 | No built-in NavLink. See `use-is-route-active.ts`.                    |
| `import { Navigate } from 'react-router-dom'`<br/>`<Navigate to="/login" replace />` | `import { Redirect } from 'expo-router'`<br/>`<Redirect href="/login" />` | `Redirect` is always replace-style.                                   |
| `import { useLocation } from 'react-router-dom'`<br/>`const { pathname, search } = useLocation()` | `import { usePathname, useLocalSearchParams } from 'expo-router'`<br/>`const pathname = usePathname()`<br/>`const params = useLocalSearchParams()` | Search is exposed as an already-parsed params object, not a raw string. |
| `import { useParams } from 'react-router-dom'`<br/>`const { id } = useParams()` | `import { useLocalSearchParams } from 'expo-router'`<br/>`const { id } = useLocalSearchParams<{ id: string }>()` | Same ergonomics; expo-router unifies route params + search params.    |
| `<Routes>` + `<Route path="/..." element={<X />} />` | File-based routing under `app/`                                        | Delete. Structure comes from the file tree.                           |

## Auth guards (p3-7 scaffolding, fully used in p3-13)

| When you need…                               | Use this hook (from `@/hooks`)                                         |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| "this screen needs a signed-in user"         | `useAuthRedirect({ require: 'authenticated', redirectTo: '/login' })`  |
| "this screen is only for signed-out users"   | `useAuthRedirect({ require: 'anonymous', redirectTo: '/' })`           |
| "this screen needs a specific role"          | `useRequireRole({ allowedRoles: [ROLES.PARENT] })`                     |

All three wait for `AuthContext.loading` to resolve before bouncing — no flicker on first render.

The Firestore security rules (see monorepo-root `firestore.rules`, tightened in p2-5b and extended in p3-15) are the real defense. These client-side hooks are UX + defense-in-depth.
