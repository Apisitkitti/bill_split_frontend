import { useNavigate, type ErrorComponentProps } from '@tanstack/react-router'
import { CrashScreen, NotFoundScreen } from './ui'

/**
 * What the router shows when a route crashes or matches nothing.
 *
 * TanStack Router wraps every route component in a `CatchBoundary` of its own,
 * so a crash inside a screen is caught there and never reaches the
 * `ErrorBoundary` above `<RouterProvider>`. Handing these to `createRouter` as
 * the defaults is what keeps the Thai screen — with its reload button and its
 * stack — instead of the router's built-in English panel.
 *
 * They live in `common/` rather than `common/ui`: they know the router, which
 * the primitives in the barrel deliberately do not.
 */
export function RouteCrash({ error }: ErrorComponentProps) {
  // No component stack here. `info` is optional on ErrorComponentProps, but in
  // this version CatchBoundary builds the error component with `{ error, reset
  // }` only and never passes it — reading `info?.componentStack` would silently
  // render nothing. The stack reaches the console through `defaultOnCatch` in
  // `main.tsx` instead.
  //
  // fullPage={false}: the router renders this inside whatever layout matched
  // above the crash, whose own `min-h-dvh` already fills the viewport. A second
  // one nested inside it is a screenful of dead scroll below the fold.
  return <CrashScreen error={error} fullPage={false} />
}

export function RouteNotFound() {
  const navigate = useNavigate()
  // replace, so the back button does not walk back into the dead URL.
  // fullPage={false} for the same nesting reason as RouteCrash above.
  return (
    <NotFoundScreen fullPage={false} onHome={() => void navigate({ to: '/', replace: true })} />
  )
}
