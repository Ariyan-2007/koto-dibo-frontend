import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, TextareaField, SelectField } from '@/components/ui/Field'
import { getHouseholdBalance } from '@/lib/api/balance'
import { todayIso, formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { BazarFundingSource, HouseholdMemberDto } from '@/lib/api/types'

export interface LedgerFormValues {
  date: string
  amount: number
  currency: string
  note: string
  userId?: string
  fundingSource?: BazarFundingSource
}

const FUNDING_SOURCES: { value: BazarFundingSource; label: string; hint: string }[] = [
  { value: 'Personal', label: 'Paid from my pocket', hint: 'A personal expense — not drawn from the shared fund' },
  { value: 'HouseholdFund', label: 'Pay from household balance', hint: "Drawn from the household's shared fund" },
]

export function LedgerFormSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  noteLabel = 'Note',
  fieldErrors,
  formError,
  initial,
  signMode = 'positive',
  amountLabel,
  amountHint,
  showMemberPicker = false,
  members,
  currentUserId,
  showFundingSourceChoice = false,
  householdId,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: LedgerFormValues) => void
  isSubmitting: boolean
  title: string
  noteLabel?: string
  fieldErrors?: Record<string, string>
  /** A non-field error (e.g. a 409 balance-conflict message) shown as a banner above Save. */
  formError?: string
  initial?: Partial<LedgerFormValues>
  /** 'negative' is the Bazar "leftover" flow (§Phase 2) — the user always types a positive
   * magnitude here; the sign is applied on submit so a stray minus sign can't slip through. */
  signMode?: 'positive' | 'negative'
  amountLabel?: string
  amountHint?: string
  /** Owner/Manager-only "add on behalf of" picker, mirrored from the Meals grid's on-behalf-of flow. */
  showMemberPicker?: boolean
  members?: HouseholdMemberDto[]
  currentUserId?: string
  /** Bazar-only: lets the user pick whether this purchase draws from the household fund. */
  showFundingSourceChoice?: boolean
  householdId?: string
}) {
  const [date, setDate] = useState(initial?.date ?? todayIso())
  const [amount, setAmount] = useState(initial?.amount !== undefined ? Math.abs(initial.amount).toString() : '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'BDT')
  const [note, setNote] = useState(initial?.note ?? '')
  const [userId, setUserId] = useState(initial?.userId ?? currentUserId ?? '')
  const [fundingSource, setFundingSource] = useState<BazarFundingSource>(initial?.fundingSource ?? 'Personal')

  const noteRequired = signMode === 'negative'
  const usingHouseholdFund = showFundingSourceChoice && fundingSource === 'HouseholdFund'

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['householdBalance', householdId],
    queryFn: () => getHouseholdBalance(householdId!),
    enabled: open && usingHouseholdFund && !!householdId,
  })

  const insufficientBalance = usingHouseholdFund && !!balance && Number(amount) > balance.currentBalance

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const magnitude = Math.abs(Number(amount))
    onSubmit({
      date,
      amount: signMode === 'negative' ? -magnitude : magnitude,
      currency: currency.toUpperCase(),
      note,
      userId: showMemberPicker ? userId : undefined,
      fundingSource: showFundingSourceChoice ? fundingSource : undefined,
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {showMemberPicker && members && members.length > 0 && (
          <SelectField label="For" value={userId} onChange={(e) => setUserId(e.target.value)}>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userId === currentUserId ? `${member.name} (You)` : member.name}
              </option>
            ))}
          </SelectField>
        )}
        <InputField
          label="Date"
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          error={fieldErrors?.date}
          required
        />
        <InputField
          label={amountLabel ?? `Amount (${currency})`}
          hint={amountHint}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={fieldErrors?.amount}
          required
          autoFocus
        />
        {showFundingSourceChoice && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Funding Source</p>
            <div className="flex flex-col gap-2">
              {FUNDING_SOURCES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFundingSource(f.value)}
                  className={cn(
                    'rounded-md border p-3 text-left',
                    fundingSource === f.value ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-muted',
                  )}
                >
                  <p className={cn('font-medium', fundingSource === f.value ? 'text-primary' : 'text-ink')}>{f.label}</p>
                  <p className="text-xs text-muted">{f.hint}</p>
                </button>
              ))}
            </div>
            {usingHouseholdFund && (
              <p className="mt-2 text-xs text-muted">
                {balanceLoading || !balance ? (
                  'Checking household balance…'
                ) : (
                  <>
                    Current household balance:{' '}
                    <span className={cn('font-medium', insufficientBalance ? 'text-danger' : 'text-ink')}>
                      {formatMoney(balance.currentBalance, balance.currency)}
                    </span>
                  </>
                )}
              </p>
            )}
            {insufficientBalance && (
              <p className="mt-1 text-xs text-danger">This amount exceeds the household's current balance.</p>
            )}
          </div>
        )}
        <InputField
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          error={fieldErrors?.currency}
          required
        />
        <TextareaField
          label={noteLabel}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={fieldErrors?.note}
          required={noteRequired}
        />
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" isLoading={isSubmitting} disabled={insufficientBalance} className="w-full">
          Save
        </Button>
      </form>
    </Sheet>
  )
}
