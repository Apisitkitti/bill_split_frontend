import type { ReactNode } from 'react'

/**
 * A single short message on an otherwise empty page.
 *
 * `fullPage` is false when something above already fills the viewport — a
 * second `min-h-dvh` nested inside the first adds a screenful of dead scroll
 * below the fold.
 */
export function Centered({
  children,
  fullPage = true,
}: {
  children: ReactNode
  fullPage?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-center px-6 text-center text-sm ${fullPage ? 'min-h-dvh' : 'py-10'}`}
    >
      {children}
    </div>
  )
}

/**
 * Skeletons in the shape of the cards that are coming, rather than a line of
 * dim text: on mobile data this screen is visible for seconds, and a shape that
 * matches the result reads as progress instead of as a stall.
 */
export function LoadingScreen() {
  return (
    <div className="mx-auto min-h-dvh max-w-md space-y-3 px-4 pt-6">
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-20 w-full" />
    </div>
  )
}

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

/** The page-level failure treatment, for a failure with no screen to sit on. */
export function ErrorScreen({ message }: { message: string }) {
  return (
    <Centered>
      <div role="alert" className="alert alert-error text-left text-sm">
        <span>{message}</span>
      </div>
    </Centered>
  )
}
