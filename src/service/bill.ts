import { client } from './client'
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

export const listBills = (groupId: string) =>
  client.get<Bill[]>(`/groups/${groupId}/bills`).then((r) => r.data)

export const createBill = (groupId: string, input: CreateBillInput) =>
  client.post<Bill>(`/groups/${groupId}/bills`, input).then((r) => r.data)
