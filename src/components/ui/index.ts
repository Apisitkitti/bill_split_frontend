/**
 * The generic pieces, behind one import path.
 *
 * Nothing here knows what a bill, a group, LIFF or a route is — that is the
 * entry test for living in `ui/` rather than in `common/`, or in the folder of
 * the screen that uses it.
 *
 * One component per file, so that a screen that needs `Centered` does not read
 * a file that also holds the crash treatment. The barrel is what keeps that
 * split from reaching the call sites: every import here stays `'…/ui'`.
 *
 * These exports are static, and stay that way. Re-exporting them as
 * `lazy(() => import('./Thing'))` was tried and measured, and it costs bytes
 * rather than saving them — first paint went 401.34 kB / 124.75 kB gzip to
 * 401.61 kB / 125.48 kB gzip with only `NotFoundScreen` lazy, and to
 * 400.90 kB / 125.15 kB gzip with `Centered`, `ErrorScreen`, `LoadingScreen`
 * and `NotFoundScreen` all lazy. Nothing here is big enough to pay for a chunk:
 * the four split out at 0.24–0.68 kB each, less than the per-chunk overhead and
 * the `React.lazy` machinery that splitting them drags into the entry, and one
 * extra round trip on mobile data costs more than 0.4 kB ever returns.
 *
 * Three of them could not be lazy anyway. `LoadingScreen` and `ErrorScreen` are
 * what `RootPageUI` paints first, before any route is allowed to render, so a
 * chunk fetch and a Suspense fallback would sit in front of the loading screen
 * itself. `CrashScreen` and `ErrorBoundary` are the last thing between a crash
 * and a blank page — a chunk that fails to load is the exact situation they
 * exist for. Splitting `NotFoundScreen` alone also pulled `Centered`, which it
 * shares with `ErrorScreen`, into a chunk that first paint preloads regardless.
 *
 * Dynamic import does pay one level up, and already runs there: the routes are
 * code-split by `autoCodeSplitting` in `vite.config.ts`, which keeps the add-bill
 * screen and its zod schema — 96.66 kB, 29.05 kB gzip — off first paint entirely.
 */
export { Centered } from './Centered'
export { CrashScreen } from './CrashScreen'
export { ErrorBoundary } from './ErrorBoundary'
export { ErrorScreen, type ErrorAction } from './ErrorScreen'
export { LoadingScreen } from './LoadingScreen'
export { NotFoundScreen } from './NotFoundScreen'
