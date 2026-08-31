import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HouseholdDto } from '@/lib/api/types'

interface HouseholdState {
  selectedHouseholdId: string | null
  selectedHousehold: HouseholdDto | null
  selectHousehold: (household: HouseholdDto) => void
  clearHousehold: () => void
}

// There is no "default household" from the API — persist the caller's last choice so it survives
// reloads/PWA relaunches (§0.2).
export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      selectedHouseholdId: null,
      selectedHousehold: null,
      selectHousehold: (household) => set({ selectedHouseholdId: household.id, selectedHousehold: household }),
      clearHousehold: () => set({ selectedHouseholdId: null, selectedHousehold: null }),
    }),
    { name: 'koto-dibo:selected-household' },
  ),
)
