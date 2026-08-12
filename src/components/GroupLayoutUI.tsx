import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { api, type BalancesResponse, type Bill, type Group, type User } from '../lib/api'
import { GroupContext, type GroupData } from '../lib/groupContext'
import { ErrorScreen, LoadingScreen } from './Screen'

/**
 * Loads one group and holds the screens that read it.
 *
 * The route file owns the `$groupId` param and the `key` that remounts this on
 * a group switch; everything below is the group screen itself, so the chrome
 * and the reads it needs live together here rather than beside a redirect rule.
 *
 * The data lives in an effect rather than a route loader on purpose: every
 * request here needs the LIFF ID token, which only exists after `liff.init`
 * resolves, and that is gated in the root *component*. A loader would run
 * before it. An effect also keeps the `cancelled` guard this codebase uses —
 * a loader cannot be cancelled, so a superseded one still resolves.
 */
export function GroupLayoutUI({ groupId, children }: { groupId: string; children: ReactNode }) {
  const [me, setMe] = useState<User | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [balances, setBalances] = useState<BalancesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
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
  }, [groupId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // getGroup, always — this is the read that guarantees `members` is
        // populated. POST /groups omits members rather than returning them
        // empty, so a group taken straight from a create has nobody in it and
        // the add-bill form would submit zero participants.
        const [profile, target] = await Promise.all([api.me(), api.getGroup(groupId)])
        if (cancelled) return
        setMe(profile)
        setGroup(target)

        const [nextBills, nextBalances] = await Promise.all([
          api.listBills(groupId),
          api.balances(groupId),
        ])
        if (cancelled) return
        setBills(nextBills)
        setBalances(nextBalances)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [groupId])

  if (!group || !me) {
    // Before the group resolves there is no screen to put an alert on top of.
    if (error) return <ErrorScreen message={error} />
    return <LoadingScreen />
  }

  const value: GroupData = { group, me, bills, balances, error, setError, refresh }

  return (
    <GroupContext.Provider value={value}>
      <GroupShell groupId={groupId} group={group} error={error}>
        {children}
      </GroupShell>
    </GroupContext.Provider>
  )
}

function GroupShell({
  groupId,
  group,
  error,
  children,
}: {
  groupId: string
  group: Group
  error: string | null
  children: ReactNode
}) {
  const matchRoute = useMatchRoute()
  const onAddBill = Boolean(matchRoute({ to: '/groups/$groupId/bills/new' }))

  return (
    <div
      className="mx-auto min-h-dvh max-w-md px-4 pb-24 pt-6"
      // pb-24 reserves room for the fixed bar; the bar grows by the home
      // indicator inset, so the reservation has to grow with it or the last
      // bill in the list ends up underneath it.
      style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <header className="mb-4">
        {/* Back to the picker: the header is where you look to find out which
            group you are in, so it is where you change it. */}
        <Link to="/groups" className="text-xs text-base-content/80">
          ← ทุกกลุ่ม
        </Link>
        <h1 className="text-xl font-bold">{group.name}</h1>
        <p className="text-xs text-base-content/80">{group.members?.length ?? 0} คน</p>
      </header>

      {error && (
        <div role="alert" className="alert alert-error mb-4 py-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {/* Links, not local tab state: the phone's back button has to work and a
          screen has to survive being pasted into a chat.

          tabs-box, not the daisyUI 4 name tabs-boxed, which emits no CSS in 5.
          tabs-lg rather than the default: a thumb needs a 44px target, and the
          default tab is about 32px tall.

          Two tabs, not three: adding a bill is the reason the app exists and it
          is the fixed button below, not the third thing in a row of peers. */}
      <div role="tablist" className="tabs tabs-box tabs-lg mb-4">
        <Link
          role="tab"
          to="/groups/$groupId"
          params={{ groupId }}
          activeOptions={{ exact: true }}
          // An inactive tab at the default opacity reads as disabled rather
          // than as somewhere you can go. /80 rather than the /70 the design
          // called for: measured against the built emerald CSS, base-content at
          // /70 over the tabs-box background (base-200) is 4.08:1, just under
          // AA for 14px, and /80 clears it at 5.24:1.
          activeProps={{ className: 'tab tab-active flex-1 text-sm' }}
          inactiveProps={{ className: 'tab flex-1 text-sm text-base-content/80' }}
        >
          ยอด
        </Link>
        <Link
          role="tab"
          to="/groups/$groupId/bills"
          params={{ groupId }}
          activeOptions={{ exact: true }}
          activeProps={{ className: 'tab tab-active flex-1 text-sm' }}
          inactiveProps={{ className: 'tab flex-1 text-sm text-base-content/80' }}
        >
          รายการ
        </Link>
      </div>

      {/* The child route, handed in by the route file — which screen sits here
          is the router's business, not this layout's. */}
      {children}

      {/* The primary action, parked under the thumb. The page already reserves
          pb-24 for it. Hidden on the add screen, where it would cover the form
          it leads to.

          The extra bottom padding is the iPhone home indicator: without it the
          bar sits flush to the bottom edge and the system gesture area overlaps
          the button. env() is 0px on every device that has no inset. */}
      {!onAddBill && (
        <div
          className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-base-100/95 p-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <Link
            to="/groups/$groupId/bills/new"
            params={{ groupId }}
            className="btn btn-primary btn-lg btn-block"
          >
            ＋ เพิ่มรายการ
          </Link>
        </div>
      )}
    </div>
  )
}
