import { Centered } from './Centered'

/**
 * A URL that matches nothing.
 *
 * It takes the navigation rather than doing it, the way `LoginPageUI` takes the
 * login call: knowing where "home" is belongs to the router, not to a
 * primitive that has no idea what routes exist.
 */
export function NotFoundScreen({
  onHome,
  fullPage = true,
}: {
  onHome: () => void
  fullPage?: boolean
}) {
  return (
    <Centered fullPage={fullPage}>
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-lg font-semibold">ไม่พบหน้านี้</h1>
        <p className="text-sm text-base-content/80">ลิงก์อาจหมดอายุหรือพิมพ์ผิด</p>
        <button onClick={onHome} className="btn btn-primary btn-lg btn-block">
          กลับหน้าแรก
        </button>
      </div>
    </Centered>
  )
}
