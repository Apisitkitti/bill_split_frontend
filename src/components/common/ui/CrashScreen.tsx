/**
 * What a render crash looks like.
 *
 * It lives apart from `ErrorBoundary` because two different things now have to
 * show it: the boundary above the router, and the router's own
 * `defaultErrorComponent` — TanStack Router wraps every route component in a
 * `CatchBoundary` of its own, so a crash inside a screen never reaches the
 * boundary above `<RouterProvider>` and would otherwise get the router's
 * built-in English panel.
 */
export function CrashScreen({
  error,
  componentStack,
}: {
  error: Error
  componentStack?: string | null
}) {
  return (
    <div className="min-h-dvh bg-base-200 p-4">
      {/* The exception text is for whoever is debugging, not for the person
          holding the phone: they get a plain statement and one thing to do,
          and the raw message moves down into the details below. */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold">เปิดหน้านี้ไม่สำเร็จ</h1>
        <p className="mt-1 text-sm text-base-content/80">ลองโหลดใหม่อีกครั้ง</p>
      </div>

      <button
        onClick={() => {
          // A reload is the honest recovery: the tree that threw cannot be
          // trusted to re-render correctly from the state that produced it.
          window.location.href = window.location.pathname
        }}
        className="btn btn-primary btn-lg btn-block mb-4"
      >
        โหลดใหม่
      </button>

      {/* Kept visible rather than hidden behind a dev flag: this app is
          debugged on a phone, where the console is not reachable. */}
      <details className="collapse-arrow collapse bg-base-100">
        <summary className="collapse-title text-sm font-medium">
          รายละเอียดสำหรับ debug
        </summary>
        <div className="collapse-content">
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
            {error.message}
            {'\n'}
            {error.stack ?? String(error)}
            {componentStack}
          </pre>
        </div>
      </details>
    </div>
  )
}
