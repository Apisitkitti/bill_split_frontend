import { createFileRoute } from '@tanstack/react-router'
import { BalancesPageUI } from '../../../components/BalancesPageUI'

export const Route = createFileRoute('/groups/$groupId/')({
  component: BalancesPageUI,
})
