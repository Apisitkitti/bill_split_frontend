import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { api, type Group } from '../../lib/api'
import { ErrorScreen, LoadingScreen } from '../../components/Screen'

export const Route = createFileRoute('/groups/')({
  component: GroupPicker,
})

/**
 * Which group am I looking at?
 *
 * A picker, not a dashboard: a name and how many people are in it is everything
 * needed to choose, and anything else here competes with the group screen it
 * leads to.
 */
function GroupPicker() {
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await api.listGroups()
        if (cancelled) return
        // Names first: the list is already usable for choosing, and the counts
        // below cost one request each.
        setGroups(list)

        // GET /groups omits members, so the count is a read per group.
        // allSettled rather than all: one group that fails to expand should
        // lose its count, not the whole picker.
        const detailed = await Promise.allSettled(list.map((g) => api.getGroup(g.id)))
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
  }, [])

  if (error) return <ErrorScreen message={error} />
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
