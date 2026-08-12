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
