import { X } from '@/components/ui/icons'

export interface FixedChargeRow {
  id: string
  label: string
  amount: string
}

const PRESETS = ['Demand Charge', 'VAT', 'Meter Rent']

export function emptyFixedChargeRow(label = ''): FixedChargeRow {
  return { id: crypto.randomUUID(), label, amount: '' }
}

/** Turns rows into the `{ label, amount }[]` the API expects — a row only counts once it has
 * both a non-empty label and a positive amount (§Phase 4: "an empty list is valid"). */
export function toFixedCharges(rows: FixedChargeRow[]): { label: string; amount: number }[] {
  return rows
    .map((r) => ({ label: r.label.trim(), amount: Number(r.amount) }))
    .filter((fc) => fc.label.length > 0 && fc.amount > 0)
}

export function FixedChargesInput({
  rows,
  onChange,
  error,
}: {
  rows: FixedChargeRow[]
  onChange: (rows: FixedChargeRow[]) => void
  error?: string
}) {
  function updateRow(id: string, patch: Partial<FixedChargeRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id))
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">
        Fixed Charges <span className="font-normal text-muted">(optional)</span>
      </p>
      {rows.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                placeholder="Label"
                value={row.label}
                onChange={(e) => updateRow(row.id, { label: e.target.value })}
                className="h-10 flex-1 rounded-md border border-border bg-surface px-2 text-sm text-ink focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                className="h-10 w-28 rounded-md border border-border bg-surface px-2 text-right text-sm text-ink focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label="Remove fee"
                className="rounded-pill p-2 text-muted hover:bg-danger-soft hover:text-danger"
              >
                <X width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {PRESETS.filter((p) => !rows.some((r) => r.label === p)).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange([...rows, emptyFixedChargeRow(preset)])}
            className="rounded-sm border border-border px-3 py-1 text-xs text-muted hover:bg-surface-muted"
          >
            + {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange([...rows, emptyFixedChargeRow()])}
          className="rounded-sm border border-dashed border-border px-3 py-1 text-xs text-muted hover:bg-surface-muted"
        >
          + Add a fee
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
