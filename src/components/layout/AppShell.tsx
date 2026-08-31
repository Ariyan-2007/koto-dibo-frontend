import type { ReactNode } from 'react'
import type { HouseholdDto } from '@/lib/api/types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

export function AppShell({ household, children }: { household: HouseholdDto; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg md:h-screen md:overflow-hidden">
      <Sidebar household={household} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar household={household} />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
      <BottomNav householdId={household.id} />
    </div>
  )
}
