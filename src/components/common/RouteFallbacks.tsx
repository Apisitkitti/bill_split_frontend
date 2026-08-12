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
export function RouteCrash({ error, info }: ErrorComponentProps) {
  // The component stack arrives on `info` here, where the class boundary gets
  // it from componentDidCatch.
  return <CrashScreen error={error} componentStack={info?.componentStack} />
}

export function RouteNotFound() {
  const navigate = useNavigate()
  // replace, so the back button does not walk back into the dead URL.
  return <NotFoundScreen onHome={() => void navigate({ to: '/', replace: true })} />
}
