import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiffState } from '../lib/liffContext'
import { LoadingScreen } from '../components/common/ui'
import { LoginPageUI } from '../components/login/LoginPageUI'

export const Route = createFileRoute('/login')({
  component: LoginRoute,
})

/**
 * Where LINE returns to after login.
 *
 * `liff.login()` defaults its redirect to the URL it was called from, so
 * pressing the button on `LoginPageUI` brings the browser back here with
 * `?code=`, LIFF consumes it during init, and this route hands over to `/`.
 */
function LoginRoute() {
  const liffState = useLiffState()
  const navigate = useNavigate()

  const { needsLogin } = liffState

  useEffect(() => {
    // Same reason as the root's redirect: in the render path this re-fires
    // until the navigation lands.
    if (!needsLogin) navigate({ to: '/', replace: true })
  }, [needsLogin, navigate])

  // Already signed in and on the way out — never flash the login screen at
  // somebody who is not logged out.
  if (!needsLogin) return <LoadingScreen />

  return <LoginPageUI onLogin={liffState.login} />
}
