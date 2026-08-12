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
