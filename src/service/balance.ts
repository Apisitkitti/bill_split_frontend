import { client } from '../lib/axios'
import type { User } from './user'
import type { Satang } from '../lib/money'

export interface BalanceEntry {
  user: User
  paid: Satang
  owed: Satang
  net: Satang
}

export interface Transfer {
  from: string
  to: string
  amount: Satang
}

export interface BalancesResponse {
  balances: BalanceEntry[]
  transfers: Transfer[]
}

const groupBalancesPath = (groupId: string) => `/groups/${groupId}/balances`
const groupSummaryPath = (groupId: string) => `/groups/${groupId}/summary`

export const balances = async (groupId: string) => {
  const response = await client.get<BalancesResponse>(groupBalancesPath(groupId))
  return response.data
}

// The summary the bot pushes is the same settled-up view /balances returns, so
// it belongs to balances rather than to a feature of its own.
export const pushSummary = async (groupId: string) => {
  const response = await client.post<{ pushed: number }>(groupSummaryPath(groupId))
  return response.data
}
