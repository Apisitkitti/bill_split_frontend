import { createFileRoute } from '@tanstack/react-router'
import { BillsPageUI } from '../../../../components/BillsPageUI'

export const Route = createFileRoute('/groups/$groupId/bills/')({
  component: BillsPageUI,
})
