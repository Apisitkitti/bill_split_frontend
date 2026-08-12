import { useCallback, useEffect, useState } from 'react'
import { api, type BalancesResponse, type Bill, type Group, type User } from './lib/api'
import { formatBaht, toBahtString } from './lib/money'
import { useLiff } from './lib/useLiff'
import { AddBillForm } from './components/form/AddBillForm'
import { BalancePanel } from './components/BalancePanel'

const LIFF_ID = import.meta.env.VITE_LIFF_ID ?? ''

export default function App() {
  const liffState = useLiff(LIFF_ID)

  const [me, setMe] = useState<User | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [balances, setBalances] = useState<BalancesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settling, setSettling] = useState<string | null>(null)
  const [pushing, setPushing] = useState(false)
  const [tab, setTab] = useState<'balances' | 'bills' | 'add'>('balances')

  const refresh = useCallback(async (groupId: string) => {
    // The two reads are independent, so they go out together rather than
    // making the user wait for one round trip and then the next.
    const [nextBills, nextBalances] = await Promise.all([
      api.listBills(groupId),
      api.balances(groupId),
    ])
    setBills(nextBills)
    setBalances(nextBalances)
    // A refresh that got through means whatever failed before is no longer
    // true, so the alert must not outlive it for the rest of the session.
    setError(null)
  }, [])

  useEffect(() => {
    if (!liffState.ready) return

    let cancelled = false

    async function load() {
      try {
        const profile = await api.me()
        if (cancelled) return
        setMe(profile)

        // Opening from a LINE chat should land in that chat's group. The API
        // treats a create for a chat that already has one as a join, so this
        // single path covers both the first open and every one after it.
        const groups = await api.listGroups()
        // The create below is not idempotent without a lineGroupId to dedupe
        // on, so a superseded run has to stop before it, not after.
        if (cancelled) return
        const existing = liffState.lineGroupId
          ? groups.find((g) => g.lineGroupId === liffState.lineGroupId)
          : groups[0]

        // POST /groups answers with the group's own row, and its members are
        // omitted rather than empty. Re-reading through getGroup on both
        // branches is what guarantees `members` is populated — without it the
        // very first person to open a group gets a member list of none, so the
        // add-bill form submits zero participants and cannot save anything.
        const resolved =
          existing ??
          (await api.createGroup(
            liffState.lineGroupId ? 'กลุ่มนี้' : 'กลุ่มของฉัน',
            liffState.lineGroupId,
          ))
        const target = await api.getGroup(resolved.id)

        if (cancelled) return
        setGroup(target)
        await refresh(target.id)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [liffState.ready, liffState.lineGroupId, refresh])

  async function settle(toUser: string, amountSatang: number) {
    if (!group || !me) return
    setSettling(`${me.id}:${toUser}`)
    try {
      await api.createSettlement(group.id, toUser, toBahtString(amountSatang))
      await refresh(group.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกการจ่ายไม่สำเร็จ')
    } finally {
      setSettling(null)
    }
  }

  async function pushSummary() {
    if (!group || pushing) return
    // A summary lands in the group chat and cannot be unsent, so a double tap
    // on mobile data must not post it twice.
    setPushing(true)
    try {
      await api.pushSummary(group.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งสรุปไม่สำเร็จ')
    } finally {
      setPushing(false)
    }
  }

  if (liffState.error) {
    return (
      <Centered>
        <div role="alert" className="alert alert-error text-left text-sm">
          <span>เปิดผ่าน LINE ไม่สำเร็จ: {liffState.error}</span>
        </div>
      </Centered>
    )
  }
  if (liffState.needsLogin) {
    return (
      <Centered>
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold">หารบิล</h1>
          <p className="text-base">
            บันทึกค่าข้าวค่าเดินทางในกลุ่ม แล้วดูว่าใครต้องโอนให้ใครเท่าไหร่
          </p>
          <button onClick={liffState.login} className="btn btn-primary btn-lg btn-block">
            เข้าสู่ระบบ LINE
          </button>
        </div>
      </Centered>
    )
  }
  if (!liffState.ready || !me || !group) {
    // Before a group resolves there is no screen to put an alert on top of, and
    // a failure rendered as dim text reads as "still loading" with nothing to
    // do about it. Give it the error treatment it would get later.
    if (error) {
      return (
        <Centered>
          <div role="alert" className="alert alert-error text-left text-sm">
            <span>{error}</span>
          </div>
        </Centered>
      )
    }
    // Skeletons in the shape of the cards that are coming, rather than a line of
    // dim text: on mobile data this screen is visible for seconds, and a shape
    // that matches the result reads as progress instead of as a stall.
    return (
      <div className="mx-auto min-h-dvh max-w-md space-y-3 px-4 pt-6">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
      </div>
    )
  }

  return (
    <div
      className="mx-auto min-h-dvh max-w-md px-4 pb-24 pt-6"
      // pb-24 reserves room for the fixed bar; the bar grows by the home
      // indicator inset, so the reservation has to grow with it or the last
      // bill in the list ends up underneath it.
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <header className="mb-4">
        <h1 className="text-xl font-bold">{group.name}</h1>
        <p className="text-xs text-base-content/80">{group.members?.length ?? 0} คน</p>
      </header>

      {error && (
        <div role="alert" className="alert alert-error mb-4 py-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* tabs-box, not the daisyUI 4 name tabs-boxed, which emits no CSS in 5.
          tabs-lg rather than the default: a thumb needs a 44px target, and the
          default tab is about 32px tall. */}
      {/* Two tabs, not three: adding a bill is the reason the app exists and it
          is now the fixed button below, not the third thing in a row of peers. */}
      <div role="tablist" className="tabs tabs-box tabs-lg mb-4">
        {(['balances', 'bills'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            onClick={() => setTab(key)}
            // An inactive tab at the default opacity reads as disabled rather
            // than as somewhere you can go. /80 rather than the /70 the design
            // called for: measured against the built emerald CSS, base-content at
            // /70 over the tabs-box background (base-200) is 4.08:1, just under
            // AA for 14px, and /80 clears it at 5.24:1.
            className={`tab flex-1 text-sm ${tab === key ? 'tab-active' : 'text-base-content/80'}`}
          >
            {key === 'balances' ? 'ยอด' : 'รายการ'}
          </button>
        ))}
      </div>

      {tab === 'balances' &&
        balances &&
        (bills.length === 0 ? (
          // Nothing has happened yet, so there is nothing to celebrate. Say what
          // the app will do once there is a bill, and offer the one useful action.
          <div className="card bg-base-100 p-6 text-center shadow-sm">
            <p className="text-lg font-semibold">ยังไม่มีบิลในกลุ่มนี้</p>
            <p className="mt-2 text-sm text-base-content/80">
              ใส่ค่าข้าวมื้อแรก แล้วแอปจะบอกว่าใครต้องโอนให้ใครบ้าง
            </p>
            <button
              onClick={() => setTab('add')}
              className="btn btn-primary btn-lg btn-block mt-4"
            >
              ＋ เพิ่มรายการแรก
            </button>
          </div>
        ) : (
          <>
            <BalancePanel
              data={balances}
              me={me}
              memberCount={group.members?.length ?? balances.balances.length}
              onSettle={settle}
              settling={settling}
            />
            {/* Pushing to the chat only works for a group bound to one, and only
                once there is something to push. Filled rather than btn-outline:
                the outline label measured 1.62:1 against the card. */}
            {group.lineGroupId && (
              <button
                onClick={pushSummary}
                disabled={pushing}
                className="btn btn-neutral mt-4 w-full"
              >
                {pushing && <span className="loading loading-spinner loading-sm" />}
                {pushing ? 'กำลังส่ง…' : 'ส่งสรุปเข้าแชท'}
              </button>
            )}
          </>
        ))}

      {tab === 'bills' && (
        <ul className="space-y-2">
          {bills.length === 0 && (
            <p className="py-8 text-center text-sm text-base-content/80">ยังไม่มีรายการ</p>
          )}
          {bills.map((b) => (
            <li key={b.id} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex items-baseline justify-between gap-2">
                  {/* Two lines rather than truncate: a real title measured 388px
                      of text in 204px of row, so the list hid its own content. */}
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
      )}

      {tab === 'add' && (
        <AddBillForm
          group={group}
          me={me}
          onCreated={async () => {
            await refresh(group.id)
            setTab('balances')
          }}
        />
      )}

      {/* The primary action, parked under the thumb. The page already reserves
          pb-24 for it. Hidden on the add view, where it would cover the form it
          leads to.

          The extra bottom padding is the iPhone home indicator: without it the
          bar sits flush to the bottom edge and the system gesture area overlaps
          the button. env() is 0px on every device that has no inset. */}
      {tab !== 'add' && (
        <div
          className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-base-100/95 p-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <button onClick={() => setTab('add')} className="btn btn-primary btn-lg btn-block">
            ＋ เพิ่มรายการ
          </button>
        </div>
      )}
    </div>
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center text-sm">
      {children}
    </div>
  )
}
