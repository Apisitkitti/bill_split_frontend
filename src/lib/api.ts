import axios, { AxiosError } from 'axios'
import liff from '@line/liff'
import type { Satang } from './money'

export interface User {
  id: string
  displayName: string
  pictureUrl: string
}

export interface Group {
  id: string
  lineGroupId?: string
  name: string
  createdBy: string
  createdAt: string
  members?: User[]
}

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

export interface Settlement {
  id: string
  groupId: string
  fromUser: string
  toUser: string
  amount: Satang
  note?: string
  createdAt: string
}

/** An error carrying the HTTP status, so callers can tell 401 from 400. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Empty VITE_API_URL means "same origin", which is what Caddy gives us: it
// serves the app and proxies /api to the Go server, so a relative path reaches
// the API no matter what host the page is on. That matters because the dev
// tunnel hands out a different URL every restart — pinning an absolute host
// here means editing .env and restarting Vite each time, and forgetting to is
// the failure where LIFF loads, login succeeds, and every request then dies
// against a `localhost` that means the phone.
//
// Set it only to reach an API on a different origin than the page.
const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/**
 * Attaches the current LIFF ID token to every request.
 *
 * The token is read here, per request, rather than set once as a default
 * header: LIFF refreshes it, and a copy captured at startup goes stale in
 * exactly the long sessions where a user would notice being logged out.
 */
client.interceptors.request.use((config) => {
  const token = liff.getIDToken()
  if (!token) throw new ApiError(401, 'not logged in')

  config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Normalises failures into ApiError.
 *
 * The API answers errors with `{"error": "..."}`, which axios buries inside
 * `err.response.data`. Unwrapping it once here keeps every call site from
 * reaching through the same three levels to find out what went wrong.
 */
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof ApiError) throw error

    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0
      const message =
        (error.response?.data as { error?: string } | undefined)?.error ??
        // A request that never reached the server has no status. Inside LINE's
        // in-app browser that usually means the API host is not reachable from
        // the phone, which is a different fix from a 500.
        (status === 0 ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' : error.message)
      throw new ApiError(status, message)
    }
    throw error
  },
)

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

export const api = {
  me: () => client.get<User>('/me').then((r) => r.data),

  listGroups: () => client.get<Group[]>('/groups').then((r) => r.data),

  createGroup: (name: string, lineGroupId?: string) =>
    client.post<Group>('/groups', { name, lineGroupId }).then((r) => r.data),

  getGroup: (id: string) => client.get<Group>(`/groups/${id}`).then((r) => r.data),

  joinGroup: (id: string) =>
    client.post<Group>(`/groups/${id}/members`).then((r) => r.data),

  listBills: (groupId: string) =>
    client.get<Bill[]>(`/groups/${groupId}/bills`).then((r) => r.data),

  createBill: (groupId: string, input: CreateBillInput) =>
    client.post<Bill>(`/groups/${groupId}/bills`, input).then((r) => r.data),

  balances: (groupId: string) =>
    client.get<BalancesResponse>(`/groups/${groupId}/balances`).then((r) => r.data),

  listSettlements: (groupId: string) =>
    client.get<Settlement[]>(`/groups/${groupId}/settlements`).then((r) => r.data),

  createSettlement: (groupId: string, toUser: string, amount: string, note?: string) =>
    client
      .post<Settlement>(`/groups/${groupId}/settlements`, { toUser, amount, note })
      .then((r) => r.data),

  pushSummary: (groupId: string) =>
    client.post<{ pushed: number }>(`/groups/${groupId}/summary`).then((r) => r.data),
}
