import { useEffect } from 'react'
import { Outlet, createRootRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { useLiff } from '../lib/useLiff'
import { LiffContext } from '../lib/liffContext'
import { ErrorScreen, LoadingScreen } from '../components/Screen'

const LIFF_ID = import.meta.env.VITE_LIFF_ID ?? ''

export const Route = createRootRoute({
  component: RootLayout,
})

/**
 * The LIFF gate every route sits behind.
 *
 * `useLiff` is called here and nowhere else. It guards a module-level init
 * promise, and a second caller mounting alongside the first is exactly the race
 * that fights over the `?code=` LINE puts in the URL after login.
 */
function RootLayout() {
  const liffState = useLiff(LIFF_ID)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()

  const { needsLogin } = liffState
  const atLogin = pathname === '/login'

  useEffect(() => {
    // An effect, not a <Navigate> in the render path: the router still reports
    // the old pathname while a navigation is in flight, so a render-phase
    // redirect re-fires every render until it lands and React gives up with
    // "Maximum update depth exceeded".
    //
    // The redirect goes to a screen with a button, never to LINE. Calling
    // liff.login() on the app's behalf renders and vanishes in the same frame
    // when a session fails to stick — an invisible loop with nothing to read
    // and nothing to press.
    if (needsLogin && !atLogin) navigate({ to: '/login', replace: true })
  }, [needsLogin, atLogin, navigate])

  if (liffState.error) {
    return <ErrorScreen message={`เปิดผ่าน LINE ไม่สำเร็จ: ${liffState.error}`} />
  }

  // Nothing below this can render without an identity: every screen in the app
  // is somebody's group.
  if (needsLogin ? !atLogin : !liffState.ready) return <LoadingScreen />

  return (
    <LiffContext.Provider value={liffState}>
      <Outlet />
    </LiffContext.Provider>
  )
}
