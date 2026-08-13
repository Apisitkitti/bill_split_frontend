import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createGroup, listGroups } from '../service/group'
import { useLiffState } from '../lib/liffContext'
import { ErrorScreen, LoadingScreen } from '../components/ui'

export const Route = createFileRoute('/')({
  component: EntryRoute,
})

/**
 * Decides where an open lands, and renders nothing of its own.
 *
 * This is also the LIFF Endpoint URL, so it is the first thing LINE loads.
 *
 * The only route with no `*PageUI.tsx` beside it, and deliberately so: it is a
 * redirect, and the two things it can show while redirecting — a skeleton and a
 * failure — are the shared `Screen` primitives every route falls back to. An
 * empty component file here would be a file to keep in sync with nothing.
 */
function EntryRoute() {
  const liffState = useLiffState()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const { lineGroupId, needsLogin } = liffState

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      try {
        // The root is already redirecting to /login, and its `location` flips
        // one commit before the matched route does — so this component gets one
        // render on the way out. Resolving in it sends the URL to /groups, the
        // root bounces it back to /login, and the two redirects feed each other
        // until React gives up with "Maximum update depth exceeded".
        if (needsLogin) return

        if (!lineGroupId) {
          // Outside a LINE chat there is no chat to bind a group to. The app
          // used to pick groups[0] — the most recently created one — with
          // nothing on screen saying which group that was; the picker is the
          // answer to that, not a better guess.
          await navigate({ to: '/groups', replace: true })
          return
        }

        // Opening from a LINE chat should land in that chat's group. The API
        // treats a create for a chat that already has one as a join, so this
        // single path covers both the first open and every one after it.
        const groups = await listGroups()
        // The create below is not idempotent without a lineGroupId to dedupe
        // on, so a superseded run has to stop before it, not after.
        if (cancelled) return

        const existing = groups.find((g) => g.lineGroupId === lineGroupId)
        // POST /groups answers with the group's own row, and its members are
        // omitted rather than empty — a group used straight from this response
        // has a member list of none, so the add-bill form would submit zero
        // participants and could not save anything. The re-read that fixes it
        // is the unconditional getGroup in the /groups/$groupId layout,
        // which every route below this navigation goes through.
        const resolved = existing ?? (await createGroup('กลุ่มนี้', lineGroupId))
        if (cancelled) return

        await navigate({
          to: '/groups/$groupId',
          params: { groupId: resolved.id },
          replace: true,
        })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
      }
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [lineGroupId, needsLogin, navigate, attempt])

  // Before a group resolves there is no screen to put an alert on top of, and a
  // failure rendered as dim text reads as "still loading" with nothing to do
  // about it. Give it the error treatment it would get later — with the exits,
  // because this is the LIFF Endpoint URL and a dead end here is the whole app.
  if (error) {
    return (
      <ErrorScreen
        message={error}
        actions={[
          // The picker, not "home": home is this route, and sending someone
          // back to the resolve that just failed is not an exit. /groups reads
          // its own list, so it can still work when this one did not.
          { label: 'ดูกลุ่มทั้งหมด', onClick: () => void navigate({ to: '/groups', replace: true }) },
          {
            label: 'ลองใหม่อีกครั้ง',
            onClick: () => {
              setError(null)
              setAttempt((n) => n + 1)
            },
          },
        ]}
      />
    )
  }

  return <LoadingScreen />
}
