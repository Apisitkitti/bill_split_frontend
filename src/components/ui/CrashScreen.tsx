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
  fullPage = true,
}: {
  /**
   * Whatever was thrown, not an `Error`. React and the router both type a
   * boundary's error as `Error`, but that is a claim about the common case, not
   * a guarantee: `throw null` is legal JS and arrives here unchanged. The
   * router cannot render a falsy error at all — `defaultOnCatch` in `main.tsx`
   * replaces it with an `Error` for that reason — but that replacement is what
   * keeps the router from looping, not a promise about what this component is
   * handed: when React escalates a falsy throw straight to the `ErrorBoundary`
   * above `RouterProvider`, the original `null` is what that boundary renders
   * from, and it was measured doing exactly that. This screen is the last thing
   * standing between a crash and a blank page, so it dereferences nothing it
   * has not narrowed.
   */
  error: unknown
  componentStack?: string | null
  /** False when a layout above already fills the viewport — see `RouteCrash`. */
  fullPage?: boolean
}) {
  const message = error instanceof Error ? error.message : String(error)
  // `String(error)` rather than the message again: an Error with no `.stack`
  // still has a name worth printing, and a thrown non-Error has nothing else.
  const stack = error instanceof Error ? (error.stack ?? String(error)) : String(error)

  return (
    <div role="alert" className={`bg-base-200 p-4 ${fullPage ? 'min-h-dvh' : ''}`}>
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
            {message}
            {'\n'}
            {stack}
            {componentStack}
          </pre>
        </div>
      </details>
    </div>
  )
}
