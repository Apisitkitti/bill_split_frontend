import { Outlet, createFileRoute } from '@tanstack/react-router'
import { GroupLayoutUI } from '../../../components/GroupLayoutUI'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupRoute,
})

/** The `$groupId` branch: which group, and which screen inside it. */
function GroupRoute() {
  const { groupId } = Route.useParams()

  // Keyed on the param so that every piece of state in the layout is thrown
  // away when the group changes. Without it, navigating between groups paints
  // the new group's name over the previous group's bills for as long as the
  // reads take.
  return (
    <GroupLayoutUI key={groupId} groupId={groupId}>
      <Outlet />
    </GroupLayoutUI>
  )
}
