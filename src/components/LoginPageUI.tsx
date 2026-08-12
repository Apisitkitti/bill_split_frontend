import { Centered } from './Screen'

/**
 * The one screen a logged-out person sees.
 *
 * It takes the login call rather than reading LIFF itself: pressing the button
 * is the only thing this screen does, and `liff.login()` is never called on the
 * app's behalf — a redirect to LINE that renders and vanishes in the same frame
 * is an invisible loop with nothing to read and nothing to press.
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
