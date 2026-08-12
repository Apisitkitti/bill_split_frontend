import { client } from './client'

export interface User {
  id: string
  displayName: string
  pictureUrl: string
}

/**
 * The identity the server will act on.
 *
 * `liff.getProfile()` is display only — this is the one the API derives from
 * the ID token it was sent.
 */
export const me = () => client.get<User>('/me').then((r) => r.data)
