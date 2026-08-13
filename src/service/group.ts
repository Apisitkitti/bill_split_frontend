import { client } from '../lib/axios'
import type { User } from './user'

export interface Group {
  id: string
  lineGroupId?: string
  name: string
  createdBy: string
  createdAt: string
  members?: User[]
}

// Each path is written once. A fixed path is a constant; one that needs an id is
// a function that builds it — a second hand-written copy is a typo nobody sees
// until that one endpoint is called.
const GROUPS_PATH = '/groups'
const groupPath = (id: string) => `${GROUPS_PATH}/${id}`
const groupMembersPath = (id: string) => `${groupPath(id)}/members`

export const listGroups = async () => {
  const response = await client.get<Group[]>(GROUPS_PATH)
  return response.data
}

export const createGroup = async (name: string, lineGroupId?: string) => {
  const response = await client.post<Group>(GROUPS_PATH, { name, lineGroupId })
  return response.data
}

export const getGroup = async (id: string) => {
  const response = await client.get<Group>(groupPath(id))
  return response.data
}

export const joinGroup = async (id: string) => {
  const response = await client.post<Group>(groupMembersPath(id))
  return response.data
}
