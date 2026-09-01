import type { BillSplitMethod } from '@/lib/api/types'

// `SplitMethod` stays `TariffMetered` over the wire — this is a display-only relabel per the
// blueprint's 2026-09-01 update. Every place a method name is shown must route through this map
// rather than hardcoding "Tariff Metered" or string-matching the enum value again.
export const BILL_SPLIT_METHOD_LABEL: Record<BillSplitMethod, string> = {
  TariffMetered: 'Electricity Bill (Postpaid)',
  EqualSplit: 'Equal Split',
  WeightedSplit: 'Weighted Split',
}
