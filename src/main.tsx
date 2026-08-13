import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import { ErrorBoundary } from './components/ui'
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
  defaultOnCatch: (error, info) => {
    console.error('render crashed', error, info.componentStack)

    // The router's CatchBoundary keeps whatever was thrown and renders
    // `if (error)`, so a falsy one leaves it handing back the very children
    // that threw. When the throw is a component's first render React notices
    // the boundary failed to handle it and escalates to the `ErrorBoundary`
    // above `RouterProvider`, which tracks a `crashed` flag and copes. When it
    // is a re-render — a screen that throws once some state has arrived, which
    // is most of them — nothing escalates: the boundary keeps handing the
    // children back and they keep throwing. Measured in a production build at
    // 375px with this line removed: 1084 console errors at 1.5s, 2432 at 3s,
    // still climbing, with the crashed screen's own markup on the page and no
    // crash screen. With it: 4, and it stops. `defaultErrorComponent` cannot
    // reach that case at all — a falsy error never renders it.
    //
    // Re-throwing from `onCatch` is the one hook the router leaves open here,
    // and the one it uses itself to hand a not-found up the tree. The
    // replacement is truthy, so the boundary above this match — the parent
    // route's, or this `ErrorBoundary` at the top — stores it and shows the
    // crash screen. What was actually thrown is already in the console line
    // above, which is the only place it was ever readable.
    if (!error) throw new Error(`a route component threw ${JSON.stringify(error) ?? 'undefined'}`)
  },
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
