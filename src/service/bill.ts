import { client } from '../lib/axios'
import type { Satang } from '../lib/money'

export interface Share {
  userId: string
  amount: Satang
}

export interface Bill {
  id: string
  groupId: string
  payerId: string
  title: string
  total: Satang
  note?: string
  createdBy: string
  createdAt: string
  shares?: Share[]
}

export type SplitMode = 'equal' | 'weight' | 'exact'

export interface CreateBillInput {
  title: string
  /** Baht as a string — a JSON number would lose satang in transit. */
  total: string
  note?: string
  payerId?: string
  mode: SplitMode
  participants: string[]
  weights?: number[]
  shares?: string[]
}

const groupBillsPath = (groupId: string) => `/groups/${groupId}/bills`

export const listBills = async (groupId: string) => {
  const response = await client.get<Bill[]>(groupBillsPath(groupId))
  return response.data
}

export const createBill = async (groupId: string, input: CreateBillInput) => {
  const response = await client.post<Bill>(groupBillsPath(groupId), input)
  return response.data
}
