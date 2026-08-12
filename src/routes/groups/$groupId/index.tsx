import { createFileRoute } from '@tanstack/react-router'
import { BalancesPageUI } from '../../../components/groups/$groupId/BalancesPageUI'

export const Route = createFileRoute('/groups/$groupId/')({
  component: BalancesPageUI,
})
