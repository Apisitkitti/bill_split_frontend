import { createFileRoute } from '@tanstack/react-router'
import { formatBaht } from '../../../../lib/money'
import { useGroupData } from '../../../../lib/groupContext'

export const Route = createFileRoute('/groups/$groupId/bills/')({
  component: BillsScreen,
})

function BillsScreen() {
  const { group, bills } = useGroupData()

  return (
    <ul className="space-y-2">
      {bills.length === 0 && (
        <p className="py-8 text-center text-sm text-base-content/80">ยังไม่มีรายการ</p>
      )}
      {bills.map((b) => (
        <li key={b.id} className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-baseline justify-between gap-2">
              {/* Two lines rather than truncate: a real title measured 388px of
                  text in 204px of row, so the list hid its own content. */}
              <span className="line-clamp-2 font-medium">{b.title}</span>
              <span className="shrink-0 text-base font-semibold tabular-nums">
                ฿{formatBaht(b.total)}
              </span>
            </div>
            <p className="text-xs text-base-content/80">
              {group.members?.find((m) => m.id === b.payerId)?.displayName ?? '—'} จ่าย ·{' '}
              {b.shares?.length ?? 0} คนหาร · {shortDate(b.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Day/month for the bills list.
 *
 * Hand-formatted only to keep the digits Latin and the separator a slash — Intl
 * was never the thing that could make two phones disagree. `getDate()` and
 * `getMonth()` read the *device* timezone, so a bill created just before
 * midnight in Bangkok already shows a different day to someone whose phone is
 * set to UTC. Everyone in one group is realistically in one timezone, so that is
 * accepted rather than fixed; formatting the UTC fields instead would only move
 * the disagreement onto the majority.
 */
function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()}/${d.getMonth() + 1}`
}
