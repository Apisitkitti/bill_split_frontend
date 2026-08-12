import type { ReactNode } from 'react'

/** A single short message on an otherwise empty page. */
export function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center text-sm">
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
