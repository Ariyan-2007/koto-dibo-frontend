export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatMonthDay(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Local calendar date, not UTC — a UTC-based `toISOString()` slice reads as "yesterday" for
 * timezones ahead of UTC (e.g. Asia/Dhaka, UTC+6) during their early-morning hours, which made
 * every cell in the meal grid register as "future" and become uneditable during that window. */
export function todayIso(): string {
  const d = new Date()
  return toIso(d.getFullYear(), d.getMonth(), d.getDate())
}

export function getMonthRange(year: number, month: number): { from: string; to: string; label: string; daysInMonth: number } {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return {
    from: toIso(year, month, 1),
    to: toIso(year, month, daysInMonth),
    label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    daysInMonth,
  }
}

export function dayOfMonthIso(year: number, month: number, day: number): string {
  return toIso(year, month, day)
}

/** `null` means "never budgeted" (§Phase 7) — render as an em dash, not "0%". */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(digits)}%`
}
