import { createFileRoute } from '@tanstack/react-router'
import { BillsPageUI } from '../../../../components/groups/$groupId/bills/BillsPageUI'

export const Route = createFileRoute('/groups/$groupId/bills/')({
  component: BillsPageUI,
})
