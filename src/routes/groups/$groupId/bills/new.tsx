import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGroupData } from '../../../../lib/groupContext'
import { AddBillForm } from '../../../../components/form/AddBillForm'

export const Route = createFileRoute('/groups/$groupId/bills/new')({
  component: NewBillScreen,
})

function NewBillScreen() {
  const { group, me, refresh } = useGroupData()
  const navigate = useNavigate()

  return (
    <AddBillForm
      group={group}
      me={me}
      // Refresh first, navigate second. The form distinguishes a save that
      // failed from a reload that failed, and it can only render the second
      // message while it is still mounted.
      onCreated={async () => {
        await refresh()
        await navigate({ to: '/groups/$groupId', params: { groupId: group.id } })
      }}
    />
  )
}
