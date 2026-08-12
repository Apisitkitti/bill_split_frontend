import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { api } from '../lib/api'
import { toBahtString } from '../lib/money'
import { useGroupData } from '../lib/groupContext'
import { BalancePanel } from './BalancePanel'

/** Who owes whom, and the two actions that change it. */
export function BalancesPageUI() {
  const { group, me, bills, balances, setError, refresh } = useGroupData()
  const [settling, setSettling] = useState<string | null>(null)
  const [pushing, setPushing] = useState(false)

  async function settle(toUser: string, amountSatang: number) {
    if (settling) return
    setSettling(`${me.id}:${toUser}`)
    try {
      await api.createSettlement(group.id, toUser, toBahtString(amountSatang))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกการจ่ายไม่สำเร็จ')
    } finally {
      setSettling(null)
    }
  }

  async function pushSummary() {
    if (pushing) return
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

  if (!balances) return <div className="skeleton h-40 w-full" />

  if (bills.length === 0) {
    // Nothing has happened yet, so there is nothing to celebrate. Say what the
    // app will do once there is a bill, and offer the one useful action.
    return (
      <div className="card bg-base-100 p-6 text-center shadow-sm">
        <p className="text-lg font-semibold">ยังไม่มีบิลในกลุ่มนี้</p>
        <p className="mt-2 text-sm text-base-content/80">
          ใส่ค่าข้าวมื้อแรก แล้วแอปจะบอกว่าใครต้องโอนให้ใครบ้าง
        </p>
        <Link
          to="/groups/$groupId/bills/new"
          params={{ groupId: group.id }}
          className="btn btn-primary btn-lg btn-block mt-4"
        >
          ＋ เพิ่มรายการแรก
        </Link>
      </div>
    )
  }

  return (
    <>
      <BalancePanel
        data={balances}
        me={me}
        memberCount={group.members?.length ?? balances.balances.length}
        onSettle={settle}
        settling={settling}
      />
      {/* Pushing to the chat only works for a group bound to one, and only once
          there is something to push. Filled rather than btn-outline: the
          outline label measured 1.62:1 against the card. */}
      {group.lineGroupId && (
        <button onClick={pushSummary} disabled={pushing} className="btn btn-neutral mt-4 w-full">
          {pushing && <span className="loading loading-spinner loading-sm" />}
          {pushing ? 'กำลังส่ง…' : 'ส่งสรุปเข้าแชท'}
        </button>
      )}
    </>
  )
}
