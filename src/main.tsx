import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// A rejected promise nobody caught is the other way this app can fail
// silently — an async handler that throws after its await leaves the screen
// exactly as it was, with no error and no clue. Surfacing it in the console at
// least names the failure.
window.addEventListener('unhandledrejection', (event) => {
  console.error('unhandled rejection', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
