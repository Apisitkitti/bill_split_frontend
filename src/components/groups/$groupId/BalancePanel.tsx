import type { BalancesResponse } from '../../../service/balance'
import type { User } from '../../../service/user'
import { formatBaht } from '../../../lib/money'

interface Props {
  data: BalancesResponse
  me: User
  /** From the group, not from `balances`: a member with no bills still counts. */
  memberCount: number
  onSettle: (toUser: string, amount: number) => void
  settling: string | null
}

/**
 * Shows what the user personally owes or is owed, the payments that clear the
 * group, and — last, folded away — everyone else's position.
 *
 * The order is the point: the user opened this to find out whether they have to
 * pay, so that answer is the first thing on the screen and the twelve-row roster
 * they did not ask for is the last.
 *
 * The transfer list comes from the server rather than being derived here: the
 * same list is pushed into the LINE chat, and two implementations of a greedy
 * settlement would eventually disagree about who pays whom.
 */
export function BalancePanel({ data, me, memberCount, onSettle, settling }: Props) {
  const nameOf = (id: string) =>
    data.balances.find((b) => b.user.id === id)?.user.displayName ?? 'สมาชิก'

  const mine = data.balances.find((b) => b.user.id === me.id)
  const net = mine?.net ?? 0
  const myTransfers = data.transfers.filter((t) => t.from === me.id || t.to === me.id)

  // A group of one cannot owe anybody: there is nobody else in it yet. Reading
  // "เสมอกัน" back to someone who has just recorded four bills alone looks like
  // the app lost them, so the card becomes a running total instead of a verdict.
  const solo = memberCount <= 1

  let headline: string
  if (solo) headline = `บันทึกไว้ ฿${formatBaht(mine?.paid ?? 0)}`
  else if (net < 0) headline = `คุณต้องจ่าย ฿${formatBaht(-net)}`
  else if (net > 0) headline = `คุณได้คืน ฿${formatBaht(net)}`
  else headline = 'เสมอกัน'

  let subline: string | null = null
  if (solo) {
    subline = 'ยังมีคุณคนเดียวในกลุ่ม — ชวนเพื่อนเข้ามาเพื่อเริ่มหาร'
  } else if (myTransfers.length === 1) {
    const t = myTransfers[0]
    subline =
      t.from === me.id
        ? `โอนให้ ${nameOf(t.to)} ฿${formatBaht(t.amount)}`
        : `รอรับจาก ${nameOf(t.from)} ฿${formatBaht(t.amount)}`
  } else if (myTransfers.length > 1) {
    subline = `เกี่ยวข้องกับการโอน ${myTransfers.length} รายการ`
  }

  return (
    <div className="space-y-4">
      <section className="card bg-base-100 p-4 shadow-sm">
        <p className="text-3xl font-bold tabular-nums">{headline}</p>
        {subline && <p className="mt-1 text-sm text-base-content/80">{subline}</p>}
      </section>

      <section className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h2 className="card-title text-base">
            โอนแค่นี้พอ
            <div className="badge badge-primary badge-sm">{data.transfers.length}</div>
          </h2>

          {data.transfers.length === 0 ? (
            // Earned, not congratulatory: this only renders when bills exist and
            // every one of them has been settled.
            <p className="py-6 text-center text-sm font-medium">เคลียร์กันหมดแล้ว 🎉</p>
          ) : (
            <ul className="space-y-2">
              {data.transfers.map((t) => {
                const isMine = t.from === me.id
                const key = `${t.from}:${t.to}`
                return (
                  <li key={key} className="flex flex-col gap-2 rounded-box bg-base-200 p-3">
                    {/* Stacked, not one row: at 375px a long Thai name, a
                        seven-figure amount and the button left the payee about
                        13px to render in. */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`max-w-[45%] truncate ${isMine ? 'font-medium' : ''}`}>
                        {nameOf(t.from)}
                      </span>
                      <span className="shrink-0 text-base-content/80">→</span>
                      <span className="max-w-[45%] truncate">{nameOf(t.to)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold tabular-nums">
                        ฿{formatBaht(t.amount)}
                      </span>
                      {/* Only the sender can record their own payment, matching
                          the rule the API enforces. */}
                      {isMine && (
                        <button
                          onClick={() => onSettle(t.to, t.amount)}
                          disabled={settling === key}
                          // Explicit 44px: this is the control that moves money,
                          // and daisyUI's small sizes are all under a thumb.
                          className="btn btn-primary btn-sm h-11 min-h-11 shrink-0"
                        >
                          {settling === key ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            'จ่ายแล้ว'
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Closed by default: twelve rows of other people's arithmetic is a lookup,
          not the answer, and it used to push the transfers 315px below the fold. */}
      <div className="collapse-arrow collapse bg-base-100">
        <input type="checkbox" />
        <div className="collapse-title text-base font-semibold">ยอดของทุกคน</div>
        <div className="collapse-content">
          <ul className="divide-y divide-base-200">
            {data.balances.map((b) => (
              <li key={b.user.id} className="flex items-start gap-3 py-2.5">
                <div className="avatar">
                  <div className="mask mask-squircle h-9 w-9 bg-base-300">
                    {b.user.pictureUrl && <img src={b.user.pictureUrl} alt="" />}
                  </div>
                </div>

                {/* Stacked, not one row — the same fix the transfer rows got. In
                    a single row beside the amount column the name measured 94px
                    at 375px, about five Thai clusters before the ellipsis, which
                    made the roster useless as the lookup it exists to be. Giving
                    the name its own line takes it to 263px; the subtitle absorbs
                    the squeeze instead, and it is the detail, not the answer. */}
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {/* Before the name, not after it: after a 40-character name
                        the badge sat at x=320 on a 320px screen, so the one row
                        the user is looking for was the one they could not see. */}
                    {b.user.id === me.id && (
                      <span className="badge badge-neutral badge-xs shrink-0">คุณ</span>
                    )}
                    <span className="truncate text-sm font-medium">{b.user.displayName}</span>
                  </div>

                  {/* Its own line rather than sharing one with the amount: beside
                      a seven-figure net it was left 80px, which cuts "จ่ายไป
                      ฿12,345.67 · ส่วนตัวเอง ฿1,234.56" off at the first amount
                      and turns the explanation of the net into noise. */}
                  <div className="mt-0.5 truncate text-xs text-base-content/80">
                    จ่ายไป ฿{formatBaht(b.paid)} · ส่วนตัวเอง ฿{formatBaht(b.owed)}
                  </div>

                  {/* The amount stays default-colour text and the direction moves
                      into a badge: text-success on base-100 measures 3.04:1,
                      while daisyUI guarantees the badge's own content pair. */}
                  <div className="mt-1 flex items-baseline justify-end gap-1.5">
                    <span className="text-base font-bold tabular-nums">
                      {b.net === 0
                        ? '—'
                        : `${b.net > 0 ? '+' : '-'}${formatBaht(Math.abs(b.net))}`}
                    </span>
                    {b.net !== 0 && (
                      <span
                        className={`badge badge-sm ${b.net > 0 ? 'badge-success' : 'badge-error'}`}
                      >
                        {b.net > 0 ? 'ได้คืน' : 'ต้องจ่าย'}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
