import { Centered } from '../ui'

/**
 * The fallback for a logged-out person, not the front door.
 *
 * Arriving logged out redirects to LINE on its own, so most people never see
 * this. It is what is left when that redirect came back without a session:
 * redirecting a second time renders and vanishes in the same frame, which is an
 * invisible loop with nothing to read and nothing to press, so the second
 * attempt has to be a button somebody chooses to press.
 *
 * It takes the login call rather than reading LIFF itself: pressing the button
 * is the only thing this screen does.
 */
export function LoginPageUI({ onLogin }: { onLogin: () => void }) {
  return (
    <Centered>
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">หารบิล</h1>
        <p className="text-base">
          บันทึกค่าข้าวค่าเดินทางในกลุ่ม แล้วดูว่าใครต้องโอนให้ใครเท่าไหร่
        </p>
        <button onClick={onLogin} className="btn btn-primary btn-lg btn-block">
          เข้าสู่ระบบ LINE
        </button>
      </div>
    </Centered>
  )
}
