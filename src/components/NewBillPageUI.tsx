import { useGroupData } from '../lib/groupContext'
import { AddBillForm } from './form/AddBillForm'

/**
 * The add-bill screen: the form, plus the reload that has to happen before the
 * caller is allowed to leave.
 *
 * `onSaved` is where to go next and comes from the route, because a destination
 * is routing. The refresh is awaited first: the form tells a save that failed
 * apart from a reload that failed, and it can only render the second message
 * while it is still mounted.
 */
export function NewBillPageUI({ onSaved }: { onSaved: () => Promise<unknown> }) {
  const { group, me, refresh } = useGroupData()

  return (
    <AddBillForm
      group={group}
      me={me}
      onCreated={async () => {
        await refresh()
        await onSaved()
      }}
    />
  )
}
