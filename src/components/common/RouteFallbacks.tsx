import { useMatch, useNavigate, type ErrorComponentProps } from '@tanstack/react-router'
import { CrashScreen, NotFoundScreen } from '../ui'

/**
 * What the router shows when a route crashes or matches nothing.
 *
 * TanStack Router wraps every route component in a `CatchBoundary` of its own,
 * so a crash inside a screen is caught there and never reaches the
 * `ErrorBoundary` above `<RouterProvider>`. Handing these to `createRouter` as
 * the defaults is what keeps the Thai screen — with its reload button and its
 * stack — instead of the router's built-in English panel.
 *
 * They live in `common/` rather than `ui/`: they know the router, which the
 * primitives in the barrel deliberately do not.
 */

/**
 * Whether a layout above this fallback has already painted a full-height
 * container, which is what decides `fullPage`.
 *
 * `useMatch({ strict: false })` is the match this fallback is rendering inside
 * — the one that crashed, or the one whose child was not found — and `index` is
 * its depth in the matched chain. Index 0 is `__root__`, which renders an
 * `<Outlet>` and nothing else; every match above that is a layout route with
 * its own `min-h-dvh`.
 *
 * Passing `fullPage={false}` unconditionally, as this file used to, is only
 * right when such a layout matched. At `/groups`, `/login` or `/` there is
 * none, and the crash screen renders as a ~200px band with the rest of the
 * viewport unpainted.
 */
function useNestedInLayout(from: 'crash' | 'notFound'): boolean {
  const index = useMatch({ strict: false, select: (match) => match.index })
  // A crash replaces its own match, so the layouts that painted are the ones
  // strictly above it: nesting needs index >= 2. A not-found renders inside its
  // parent's outlet — the parent did paint — so index >= 1 is enough.
  return from === 'crash' ? index >= 2 : index >= 1
}

export function RouteCrash({ error }: ErrorComponentProps) {
  // No component stack here. `info` is optional on ErrorComponentProps, but in
  // this version CatchBoundary builds the error component with `{ error, reset
  // }` only and never passes it — reading `info?.componentStack` would silently
  // render nothing. The stack reaches the console through `defaultOnCatch` in
  // `main.tsx` instead.
  const nested = useNestedInLayout('crash')
  return <CrashScreen error={error} fullPage={!nested} />
}

export function RouteNotFound() {
  const navigate = useNavigate()
  const nested = useNestedInLayout('notFound')
  // replace, so the back button does not walk back into the dead URL.
  return (
    <NotFoundScreen
      fullPage={!nested}
      onHome={() => void navigate({ to: '/', replace: true })}
    />
  )
}
