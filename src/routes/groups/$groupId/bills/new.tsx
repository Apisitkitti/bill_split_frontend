import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { NewBillPageUI } from '../../../../components/groups/$groupId/bills/new/NewBillPageUI'

export const Route = createFileRoute('/groups/$groupId/bills/new')({
  component: NewBillRoute,
})

function NewBillRoute() {
  const { groupId } = Route.useParams()
  const navigate = useNavigate()

  // Where a saved bill lands is this file's only business; the screen decides
  // when to call it, because only the form knows the save actually got through.
  return <NewBillPageUI onSaved={() => navigate({ to: '/groups/$groupId', params: { groupId } })} />
}
