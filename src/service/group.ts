import { client } from './client'
import type { User } from './user'

export interface Group {
  id: string
  lineGroupId?: string
  name: string
  createdBy: string
  createdAt: string
  members?: User[]
}

export const listGroups = () => client.get<Group[]>('/groups').then((r) => r.data)

export const createGroup = (name: string, lineGroupId?: string) =>
  client.post<Group>('/groups', { name, lineGroupId }).then((r) => r.data)

export const getGroup = (id: string) => client.get<Group>(`/groups/${id}`).then((r) => r.data)

export const joinGroup = (id: string) =>
  client.post<Group>(`/groups/${id}/members`).then((r) => r.data)
