import axios, { AxiosError } from 'axios'
import liff from '@line/liff'

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
export const client = axios.create({
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
