import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiffState } from '../lib/liffContext'
import { Centered, LoadingScreen } from '../components/Screen'

export const Route = createFileRoute('/login')({
  component: LoginScreen,
})

/**
 * Where LINE returns to after login.
 *
 * `liff.login()` defaults its redirect to the URL it was called from, so
 * pressing the button below brings the browser back here with `?code=`, LIFF
 * consumes it during init, and this screen hands over to `/`.
 */
function LoginScreen() {
  const liffState = useLiffState()
  const navigate = useNavigate()

  const { needsLogin } = liffState

  useEffect(() => {
    // Same reason as the root's redirect: in the render path this re-fires
    // until the navigation lands.
    if (!needsLogin) navigate({ to: '/', replace: true })
  }, [needsLogin, navigate])

  if (!needsLogin) return <LoadingScreen />

  return (
    <Centered>
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">หารบิล</h1>
        <p className="text-base">
          บันทึกค่าข้าวค่าเดินทางในกลุ่ม แล้วดูว่าใครต้องโอนให้ใครเท่าไหร่
        </p>
        <button onClick={liffState.login} className="btn btn-primary btn-lg btn-block">
          เข้าสู่ระบบ LINE
        </button>
      </div>
    </Centered>
  )
}
