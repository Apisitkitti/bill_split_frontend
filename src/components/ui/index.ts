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
 */
export { Centered } from './Centered'
export { CrashScreen } from './CrashScreen'
export { ErrorBoundary } from './ErrorBoundary'
export { ErrorScreen, type ErrorAction } from './ErrorScreen'
export { LoadingScreen } from './LoadingScreen'
export { NotFoundScreen } from './NotFoundScreen'
