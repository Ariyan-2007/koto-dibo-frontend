import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMembers } from '@/lib/api/households'
import { updateBillSplit } from '@/lib/api/billSplits'
import type { BillSplitDto } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, TextareaField } from '@/components/ui/Field'

export function EditBillSplitSheet({
  householdId,
  billSplit,
  open,
  onClose,
}: {
  householdId: string
  billSplit: BillSplitDto
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: members } = useQuery({ queryKey: ['members', householdId], queryFn: () => listMembers(householdId), enabled: open })

  const [title, setTitle] = useState(billSplit.title)
  const [notes, setNotes] = useState(billSplit.notes ?? '')
  const [mainMeterUsage, setMainMeterUsage] = useState(billSplit.mainMeterUsage?.toString() ?? '')
  const [totalAmount, setTotalAmount] = useState(billSplit.totalAmount?.toString() ?? '')
  const [memberValues, setMemberValues] = useState<Record<string, string>>(
    Object.fromEntries(billSplit.memberInputs.map((mi) => [mi.userId, mi.value.toString()])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => {
      const usesMemberInputs = billSplit.splitMethod !== 'EqualSplit'
      const memberInputs = usesMemberInputs
        ? (members ?? [])
            .map((m) => ({ userId: m.userId, value: Number(memberValues[m.userId] ?? 0) }))
            .filter((mi) => mi.value > 0)
        : undefined

      return updateBillSplit(householdId, billSplit.id, {
        title,
        notes: notes || undefined,
        mainMeterUsage: billSplit.splitMethod === 'TariffMetered' ? Number(mainMeterUsage) : undefined,
        totalAmount: billSplit.splitMethod !== 'TariffMetered' ? Number(totalAmount) : undefined,
        memberInputs,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billSplit', billSplit.id] })
      queryClient.invalidateQueries({ queryKey: ['billSplitSettlement', billSplit.id] })
      queryClient.invalidateQueries({ queryKey: ['billSplits', householdId] })
      toast.success('Bill split updated')
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setErrors({
          title: err.fieldError('title') ?? '',
          mainMeterUsage: err.fieldError('mainMeterUsage') ?? '',
          totalAmount: err.fieldError('totalAmount') ?? '',
          memberInputs: err.fieldError('memberInputs') ?? '',
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
    <Sheet open={open} onClose={onClose} title="Edit bill split">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />

        {billSplit.splitMethod === 'TariffMetered' ? (
          <InputField
            label="Main meter (kWh)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={mainMeterUsage}
            onChange={(e) => setMainMeterUsage(e.target.value)}
            error={errors.mainMeterUsage}
            required
          />
        ) : (
          <InputField
            label={`Total amount (${billSplit.currency})`}
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

        {billSplit.splitMethod !== 'EqualSplit' && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">
              {billSplit.splitMethod === 'TariffMetered' ? 'Sub-meter usage per member' : 'Weight per member'}
            </p>
            <div className="flex flex-col gap-2">
              {(members ?? []).map((m) => (
                <div key={m.userId} className="flex items-center gap-3">
                  <span className="flex-1 truncate text-sm text-ink">{m.name}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={memberValues[m.userId] ?? ''}
                    onChange={(e) => setMemberValues({ ...memberValues, [m.userId]: e.target.value })}
                    className="h-10 w-28 rounded-md border border-border bg-surface px-2 text-right text-sm text-ink focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            {errors.memberInputs && <p className="mt-1 text-sm text-danger">{errors.memberInputs}</p>}
          </div>
        )}

        <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <Button type="submit" isLoading={mutation.isPending} className="w-full">
          Save changes
        </Button>
      </form>
    </Sheet>
  )
}
