import { createContext, useContext } from 'react'
import type { LiffState } from './useLiff'

/**
 * The one `useLiff` result for the page, shared down the route tree.
 *
 * `useLiff` is deliberately called in exactly one place — the root route — so
 * that the module-level init promise it guards is never raced by two components
 * mounting at once. Everything below reads the result from here rather than
 * calling the hook again.
 */
export const LiffContext = createContext<LiffState | null>(null)

/** The LIFF state, from a tree the root route has already gated on. */
export function useLiffState(): LiffState {
  const state = useContext(LiffContext)
  // A screen rendering outside the root's gate would be reading LIFF before it
  // is initialised; that is a bug in the route tree, not a state to render.
  if (!state) throw new Error('useLiffState used outside the router root')
  return state
}
