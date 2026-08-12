import { client } from './client'
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

export const balances = (groupId: string) =>
  client.get<BalancesResponse>(`/groups/${groupId}/balances`).then((r) => r.data)

// The summary the bot pushes is the same settled-up view /balances returns, so
// it belongs to balances rather than to a feature of its own.
export const pushSummary = (groupId: string) =>
  client.post<{ pushed: number }>(`/groups/${groupId}/summary`).then((r) => r.data)
