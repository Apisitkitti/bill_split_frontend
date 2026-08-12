import { createFileRoute } from '@tanstack/react-router'
import { GroupsPageUI } from '../../components/GroupsPageUI'

export const Route = createFileRoute('/groups/')({
  component: GroupsPageUI,
})
