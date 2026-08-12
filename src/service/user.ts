import { client } from '../lib/axios'

export interface User {
  id: string
  displayName: string
  pictureUrl: string
}

const ME_PATH = '/me'

/**
 * The identity the server will act on.
 *
 * `liff.getProfile()` is display only — this is the one the API derives from
 * the ID token it was sent.
 */
export const me = async () => {
  const response = await client.get<User>(ME_PATH)
  return response.data
}
