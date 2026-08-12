import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, type Group, type SplitMode, type User } from '../../lib/api'
import { formatBaht, parseBaht, toBahtString } from '../../lib/money'
import { billSchema, type BillFormValues } from './schema'

interface Props {
  group: Group
  me: User
  /**
   * Runs after the bill is on the server. Allowed to be async and to reject:
   * the form awaits it inside its own try, so a refresh that fails surfaces in
   * the form's error alert instead of becoming an unhandled rejection.
   */
  onCreated: () => void | Promise<void>
}

/**
 * Mirrors money.SplitEqual on the server: the remainder goes to the people at
 * the front of the participant list, one satang each.
 */
function splitEqual(total: number, count: number): number[] {
  const base = Math.floor(total / count)
  const remainder = total % count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Records a new expense.
 *
 * The per-person figures shown beside each checkbox are the point of the form:
 * they include which participant absorbs the odd satang, so the split is agreed
 * before it is saved rather than argued about after.
 */
export function AddBillForm({ group, me, onCreated }: Props) {
  const members = group.members ?? []
  const allIds = members.map((m) => m.id)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    // Validate as they type: the amount rule is what the preview depends on, so
    // a wrong amount should say why at the moment the preview stops updating.
    mode: 'onChange',
    defaultValues: {
      title: '',
      total: '',
      payerId: me.id,
      participants: allIds,
    },
  })

  // One member means an "equal split" among one person: the section is a single
  // checkbox next to yourself, so it is skipped. The default value still holds,
  // because a field that is never registered keeps the default it was given.
  const showParticipants = members.length > 1

  const participants = watch('participants') ?? []
  // parseBaht rejects anything past MAX_SATANG on its own, so an out-of-range
  // amount is already `null` here and the preview cannot be handed an Infinity.
  const totalSatang = parseBaht(watch('total'))
  const previewable = totalSatang !== null && totalSatang > 0 && participants.length > 0

  const preview = previewable ? splitEqual(totalSatang, participants.length) : []
  const shareBase = previewable ? Math.floor(totalSatang / participants.length) : 0
  const remainder = previewable ? totalSatang % participants.length : 0

  async function onSubmit(values: BillFormValues) {
    // The resolver has already accepted this string; this only narrows the type.
    const satang = parseBaht(values.total)
    if (satang === null) return

    try {
      await api.createBill(group.id, {
        title: values.title,
        // The satang the preview was computed from, not the raw input: the
        // number the user agreed to and the number the server parses have to
        // come from the same value.
        total: toBahtString(satang),
        payerId: values.payerId,
        // The API also accepts 'weight' and 'exact'; this form covers the case
        // that comes up every time, and leaves the other two to a screen that
        // can show a per-person amount field.
        mode: 'equal' satisfies SplitMode,
        participants: values.participants,
      })
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ',
      })
      return
    }

    reset({
      title: '',
      total: '',
      payerId: values.payerId,
      participants: values.participants,
    })

    // Awaited, and caught separately from the save above. onCreated reloads the
    // list and switches tabs; that rejection used to go nowhere, so the bill was
    // on the server while the form sat there looking like it had eaten the
    // entry, and the fix a user reaches for is to submit again.
    try {
      await onCreated()
    } catch (err) {
      // Said explicitly, because the reload's own message — "เชื่อมต่อเซิร์ฟเวอร์
      // ไม่ได้" — reads as "your bill was not saved" and invites the duplicate
      // this whole branch exists to prevent.
      const detail = err instanceof Error ? `: ${err.message}` : ''
      setError('root', {
        message: `บันทึกรายการแล้ว แต่โหลดยอดใหม่ไม่สำเร็จ${detail}`,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow-sm">
      <div className="card-body gap-4 p-4">
        <h2 className="card-title text-base">เพิ่มรายการ</h2>

        <div>
          <label className="label-text text-xs" htmlFor="bill-title">
            ค่าอะไร
          </label>
          <input
            id="bill-title"
            {...register('title')}
            placeholder="เช่น ข้าวเย็น"
            className={`input input-bordered input-lg mt-1 w-full text-base ${
              errors.title ? 'input-error' : ''
            }`}
          />
          {errors.title && (
            <span className="mt-1 block text-xs text-error">{errors.title.message}</span>
          )}
        </div>

        <div>
          <label className="label-text text-xs" htmlFor="bill-total">
            จำนวนเงิน (บาท)
          </label>
          <input
            id="bill-total"
            {...register('total')}
            inputMode="decimal"
            placeholder="0.00"
            className={`input input-bordered input-lg mt-1 w-full text-right tabular-nums ${
              errors.total ? 'input-error' : ''
            }`}
          />
          {errors.total && (
            <span className="mt-1 block text-xs text-error">{errors.total.message}</span>
          )}
        </div>

        <div>
          <label className="label-text text-xs" htmlFor="bill-payer">
            ใครจ่าย
          </label>
          <select
            id="bill-payer"
            {...register('payerId')}
            className={`select select-bordered select-lg mt-1 w-full text-base ${
              errors.payerId ? 'select-error' : ''
            }`}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
          {errors.payerId && (
            <span className="mt-1 block text-xs text-error">
              {errors.payerId.message ?? 'เลือกคนจ่าย'}
            </span>
          )}
        </div>

        {showParticipants && (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="label-text text-xs">หารกับใคร</span>
              <span className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() =>
                    setValue('participants', allIds, { shouldValidate: true })
                  }
                >
                  ทุกคน
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setValue('participants', [], { shouldValidate: true })}
                >
                  ไม่เลือกใคร
                </button>
              </span>
            </div>
            <ul className="mt-1">
              {members.map((m) => {
                const index = participants.indexOf(m.id)
                return (
                  <li key={m.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-btn px-1 py-3 hover:bg-base-200">
                      <input
                        type="checkbox"
                        value={m.id}
                        {...register('participants')}
                        className="checkbox checkbox-primary"
                      />
                      <span className="min-w-0 flex-1 break-words text-sm">
                        {m.displayName}
                      </span>
                      {index >= 0 && preview[index] !== undefined && (
                        <span className="badge badge-ghost shrink-0 tabular-nums">
                          ฿{formatBaht(preview[index])}
                        </span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Outside the showParticipants guard on purpose. A group whose members
            have not loaded yet renders no checkbox list, submits an empty
            participants array, and fails this rule — so an error rendered inside
            the guard is invisible in the one case that produces it, and บันทึก
            appears to do nothing at all. */}
        {errors.participants && (
          <span className="block text-xs text-error">{errors.participants.message}</span>
        )}

        <div className="sticky bottom-0 -mx-4 -mb-4 bg-base-100 p-4 pt-2">
          {errors.root && (
            <div role="alert" className="alert alert-error mb-2 py-2 text-sm">
              <span>{errors.root.message}</span>
            </div>
          )}

          <p className="mb-2 text-sm">
            {previewable ? (
              remainder > 0 ? (
                // An uneven split has two per-person figures; showing one of
                // them would be wrong for somebody at the moment they confirm.
                <span className="tabular-nums">
                  หาร {participants.length} คน · คนละ ฿{formatBaht(shareBase)} ·{' '}
                  {remainder} คนแรกจ่าย ฿{formatBaht(shareBase + 1)}
                </span>
              ) : (
                <span className="tabular-nums">
                  หาร {participants.length} คน · คนละ ฿{formatBaht(shareBase)}
                </span>
              )
            ) : (
              <span className="text-base-content/80">ใส่จำนวนเงินเพื่อดูยอดหาร</span>
            )}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg btn-block"
          >
            {isSubmitting && <span className="loading loading-spinner loading-sm" />}
            {isSubmitting ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>
      </div>
    </form>
  )
}
