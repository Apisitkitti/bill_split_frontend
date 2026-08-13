import { client } from '../lib/axios'
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

const groupSettlementsPath = (groupId: string) => `/groups/${groupId}/settlements`

export const listSettlements = async (groupId: string) => {
  const response = await client.get<Settlement[]>(groupSettlementsPath(groupId))
  return response.data
}

export const createSettlement = async (
  groupId: string,
  toUser: string,
  amount: string,
  note?: string,
) => {
  const response = await client.post<Settlement>(groupSettlementsPath(groupId), {
    toUser,
    amount,
    note,
  })
  return response.data
}
