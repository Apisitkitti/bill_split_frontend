import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import { ErrorBoundary } from './components/common/ui'
import { RouteCrash, RouteNotFound } from './components/common/RouteFallbacks'

// A rejected promise nobody caught is the other way this app can fail
// silently — an async handler that throws after its await leaves the screen
// exactly as it was, with no error and no clue. Surfacing it in the console at
// least names the failure.
window.addEventListener('unhandledrejection', (event) => {
  console.error('unhandled rejection', event.reason)
})

// Without these two the router's own CatchBoundary answers first — every route
// component is wrapped in one — and a crash inside a screen shows its built-in
// English panel instead of the Thai screen, with no reload button and no stack
// to read on a phone. The ErrorBoundary below still covers RouterProvider
// itself, which is outside anything the router can catch.
// `defaultOnCatch` is the only place the router hands out a component stack: it
// builds the error component with `{ error, reset }` and never passes the
// `ErrorInfo`, so without this hook a crash inside a screen — nearly every
// crash, now that every route has its own CatchBoundary — would log nothing at
// all, and `componentDidCatch` below would only ever fire for the tree outside
// the router.
const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteCrash,
  defaultNotFoundComponent: RouteNotFound,
  defaultOnCatch: (error, info) => console.error('render crashed', error, info.componentStack),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Above the router, not inside a route: a crash while resolving a route is
        exactly the one that would otherwise leave a blank page. */}
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
