import { client } from './client'
import type { Satang } from '../lib/money'

export interface Settlement {
  id: string
  groupId: string
  fromUser: string
  toUser: string
  amount: Satang
  note?: string
  createdAt: string
}

export const listSettlements = (groupId: string) =>
  client.get<Settlement[]>(`/groups/${groupId}/settlements`).then((r) => r.data)

export const createSettlement = (
  groupId: string,
  toUser: string,
  amount: string,
  note?: string,
) =>
  client
    .post<Settlement>(`/groups/${groupId}/settlements`, { toUser, amount, note })
    .then((r) => r.data)
