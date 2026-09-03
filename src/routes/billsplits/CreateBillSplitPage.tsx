import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { createBillSplit } from '@/lib/api/billSplits'
import type { BillSplitMethod } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { useIsMounted } from '@/lib/useIsMounted'
import { BILL_SPLIT_METHOD_LABEL } from '@/lib/billsplit/labels'
import { FixedChargesInput, toFixedCharges, type FixedChargeRow } from '@/components/billsplit/FixedChargesInput'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField, TextareaField } from '@/components/ui/Field'
import { ArrowLeft } from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { todayIso } from '@/lib/format'

const METHODS: { value: BillSplitMethod; label: string; hint: string }[] = [
  {
    value: 'TariffMetered',
    label: BILL_SPLIT_METHOD_LABEL.TariffMetered,
    hint: 'Sub-meter usage billed against progressive tariff bands, plus any fixed fees',
  },
  { value: 'EqualSplit', label: BILL_SPLIT_METHOD_LABEL.EqualSplit, hint: 'One total, split evenly across active members' },
  { value: 'WeightedSplit', label: BILL_SPLIT_METHOD_LABEL.WeightedSplit, hint: 'One total, split by per-member weight' },
]

export function CreateBillSplitPage() {
  const { household } = useHouseholdContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMounted = useIsMounted()

  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })

  const [method, setMethod] = useState<BillSplitMethod>('EqualSplit')
  const [title, setTitle] = useState('')
  const [periodFrom, setPeriodFrom] = useState(todayIso())
  const [periodTo, setPeriodTo] = useState(todayIso())
  const [currency, setCurrency] = useState('BDT')
  const [mainMeterUsage, setMainMeterUsage] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [memberValues, setMemberValues] = useState<Record<string, string>>({})
  const [fixedChargeRows, setFixedChargeRows] = useState<FixedChargeRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => {
      const memberInputs = (members ?? [])
        .map((m) => ({ userId: m.userId, value: Number(memberValues[m.userId] ?? 0) }))
        .filter((mi) => method !== 'EqualSplit' && mi.value > 0)

      return createBillSplit(household.id, {
        title,
        splitMethod: method,
        periodFrom,
        periodTo,
        currency,
        tariffCountry: method === 'TariffMetered' ? 'BD' : undefined,
        mainMeterUsage: method === 'TariffMetered' ? Number(mainMeterUsage) : undefined,
        totalAmount: method !== 'TariffMetered' ? Number(totalAmount) : undefined,
        memberInputs,
        fixedCharges: method === 'TariffMetered' ? toFixedCharges(fixedChargeRows) : undefined,
        notes: notes || undefined,
      })
    },
    onSuccess: (billSplit) => {
      queryClient.invalidateQueries({ queryKey: ['billSplits', household.id] })
      toast.success('Bill split created')
      if (isMounted.current) navigate(`/h/${household.id}/bill-splits/${billSplit.id}`)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setErrors({
          title: err.fieldError('title') ?? '',
          mainMeterUsage: err.fieldError('mainMeterUsage') ?? '',
          totalAmount: err.fieldError('totalAmount') ?? '',
          memberInputs: err.fieldError('memberInputs') ?? '',
          fixedCharges: err.fieldError('fixedCharges') ?? '',
        })
        toast.error(err.message)
      } else {
        toast.error(errorMessage(err))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to={`/h/${household.id}/bill-splits`} className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className="font-heading text-[22px] font-semibold text-ink">New bill split</h1>
      </div>

      <Card className="p-5">
        <p className="mb-2 text-sm font-medium text-ink">Split Method</p>
        <div className="mb-5 flex flex-col gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={cn(
                'rounded-md border p-3 text-left',
                method === m.value ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-muted',
              )}
            >
              <p className={cn('font-medium', method === m.value ? 'text-primary' : 'text-ink')}>{m.label}</p>
              <p className="text-xs text-muted">{m.hint}</p>
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <InputField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Period From" type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} required />
            <InputField label="Period To" type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} required />
          </div>

          <InputField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} required />

          {method === 'TariffMetered' ? (
            <>
              <SelectField label="Tariff Country" value="BD" disabled hint="Only Bangladesh (BD) is seeded at MVP">
                <option value="BD">Bangladesh (BD)</option>
              </SelectField>
              <InputField
                label="Main Meter (kWh)"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={mainMeterUsage}
                onChange={(e) => setMainMeterUsage(e.target.value)}
                error={errors.mainMeterUsage}
                required
              />
              <MemberValueInputs
                title="Sub-Meter Usage per Member"
                members={members ?? []}
                values={memberValues}
                onChange={setMemberValues}
                error={errors.memberInputs}
              />
              <FixedChargesInput rows={fixedChargeRows} onChange={setFixedChargeRows} error={errors.fixedCharges} />
            </>
          ) : (
            <InputField
              label={`Total Amount (${currency})`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              error={errors.totalAmount}
              required
            />
          )}

          {method === 'WeightedSplit' && (
            <MemberValueInputs
              title="Weight per Member"
              members={members ?? []}
              values={memberValues}
              onChange={setMemberValues}
              error={errors.memberInputs}
            />
          )}

          <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <Button type="submit" isLoading={mutation.isPending} className="w-full">
            Create Bill Split
          </Button>
        </form>
      </Card>
    </div>
  )
}

function MemberValueInputs({
  title,
  members,
  values,
  onChange,
  error,
}: {
  title: string
  members: { userId: string; name: string }[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  error?: string
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{title}</p>
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-3">
            <span className="flex-1 truncate text-sm text-ink">{m.name}</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={values[m.userId] ?? ''}
              onChange={(e) => onChange({ ...values, [m.userId]: e.target.value })}
              className="h-10 w-28 rounded-md border border-border bg-surface px-2 text-right text-sm text-ink focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
