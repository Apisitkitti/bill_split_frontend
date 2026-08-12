import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getGroup, listGroups, type Group } from '../../service/group'
import { ErrorScreen, LoadingScreen } from '../ui'

/**
 * Which group am I looking at?
 *
 * A picker, not a dashboard: a name and how many people are in it is everything
 * needed to choose, and anything else here competes with the group screen it
 * leads to.
 */
export function GroupsPageUI() {
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Bumping this re-runs the load. A failed picker used to be a dead end — an
  // alert with nothing to press — and on mobile data the failure it shows is
  // usually the one a second attempt fixes.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await listGroups()
        if (cancelled) return
        // Names first: the list is already usable for choosing, and the counts
        // below cost one request each.
        setGroups(list)

        // GET /groups omits members, so the count is a read per group.
        // allSettled rather than all: one group that fails to expand should
        // lose its count, not the whole picker.
        const detailed = await Promise.allSettled(list.map((g) => getGroup(g.id)))
        if (cancelled) return
        setGroups(
          list.map((g, i) => {
            const result = detailed[i]
            return result.status === 'fulfilled' ? result.value : g
          }),
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'โหลดกลุ่มไม่สำเร็จ')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (error) {
    return (
      <ErrorScreen
        title="โหลดกลุ่มไม่สำเร็จ"
        message={error}
        actions={[
          {
            label: 'ลองใหม่อีกครั้ง',
            onClick: () => {
              // Clear the alert first, or the skeleton renders under a failure
              // that is no longer being tested.
              setError(null)
              setAttempt((n) => n + 1)
            },
          },
        ]}
      />
    )
  }
  if (!groups) return <LoadingScreen />

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-6 pt-6">
      <h1 className="mb-4 text-xl font-bold">กลุ่มของคุณ</h1>

      {groups.length === 0 ? (
        <div className="card bg-base-100 p-6 text-center shadow-sm">
          <p className="text-lg font-semibold">ยังไม่มีกลุ่ม</p>
          <p className="mt-2 text-sm text-base-content/80">
            เปิดแอปนี้จากแชทกลุ่มใน LINE แล้วกลุ่มของแชทนั้นจะถูกสร้างให้อัตโนมัติ
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              {/* The whole row is the target, at well over 44px tall: on a
                  phone the name alone is a thin strip to aim at. */}
              <Link
                to="/groups/$groupId"
                params={{ groupId: g.id }}
                className="card min-h-16 w-full justify-center bg-base-100 px-4 py-3 text-left shadow-sm"
              >
                <span className="line-clamp-2 font-medium">{g.name}</span>
                <span className="mt-0.5 text-xs text-base-content/80">
                  {g.members ? `${g.members.length} คน` : '—'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
