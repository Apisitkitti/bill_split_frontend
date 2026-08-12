import { createContext, useContext } from 'react'
import type { BalancesResponse, Bill, Group, User } from './api'

export interface GroupData {
  group: Group
  me: User
  bills: Bill[]
  /** Null until the first balances read lands. */
  balances: BalancesResponse | null
  error: string | null
  setError: (message: string | null) => void
  /**
   * Re-reads bills and balances for this group. Rejects rather than swallowing:
   * the caller knows whether a failed refresh means "nothing happened" or
   * "your change was saved but the screen is stale", and those need different
   * messages.
   */
  refresh: () => Promise<void>
}

export const GroupContext = createContext<GroupData | null>(null)

/** The loaded group the `/groups/$groupId` layout is holding. */
export function useGroupData(): GroupData {
  const data = useContext(GroupContext)
  if (!data) throw new Error('useGroupData used outside the group layout route')
  return data
}
