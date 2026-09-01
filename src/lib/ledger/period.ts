import { getMonthRange } from '@/lib/format'

/** "YYYY-MM" calendar-month key — the unit §0.6/§5.2 compute and cache one settlement call per,
 * never a wider range (widening blends meal rates across months incorrectly). */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function monthKeyFromDate(date: Date): string {
  return monthKey(date.getFullYear(), date.getMonth())
}

export function currentMonthKey(): string {
  return monthKeyFromDate(new Date())
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function previousMonthKey(key: string): string {
  const { year, month } = parseMonthKey(key)
  return month === 0 ? monthKey(year - 1, 11) : monthKey(year, month - 1)
}

export function monthKeyRange(key: string): { from: string; to: string; label: string } {
  const { year, month } = parseMonthKey(key)
  const { from, to, label } = getMonthRange(year, month)
  return { from, to, label }
}

export function isMonthKeyClosed(key: string): boolean {
  return key < currentMonthKey()
}

/** True in the last few days of the calendar month — the natural moment to prompt recording a
 * Bazar "leftover" entry before the month closes (§5.2 month-end reconciliation). */
export function isNearMonthEnd(daysThreshold = 3): boolean {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return daysInMonth - now.getDate() < daysThreshold
}
