import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// A rejected promise nobody caught is the other way this app can fail
// silently — an async handler that throws after its await leaves the screen
// exactly as it was, with no error and no clue. Surfacing it in the console at
// least names the failure.
window.addEventListener('unhandledrejection', (event) => {
  console.error('unhandled rejection', event.reason)
})

const router = createRouter({ routeTree })

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
