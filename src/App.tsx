import { Navigate, Route, Routes } from 'react-router-dom'
import { BootstrapGate, RedirectIfAuthed, RequireAuth } from '@/routes/RequireAuth'
import { HouseholdLayout } from '@/routes/HouseholdLayout'
import { RootRedirect } from '@/routes/RootRedirect'
import { Toaster } from '@/components/ui/Toaster'
import { PWAUpdatePrompt } from '@/components/ui/PWAUpdatePrompt'

import { LoginPage } from '@/routes/auth/LoginPage'
import { RegisterPage } from '@/routes/auth/RegisterPage'
import { HouseholdListPage } from '@/routes/households/HouseholdListPage'
import { SettlementDashboardPage } from '@/routes/settlement/SettlementDashboardPage'
import { LedgerHistoryPage } from '@/routes/settlement/LedgerHistoryPage'
import { LedgerPage } from '@/routes/ledger/LedgerPage'
import { BazarListPage } from '@/routes/ledger/BazarListPage'
import { ContributionsListPage } from '@/routes/ledger/ContributionsListPage'
import { MealGridPage } from '@/routes/meals/MealGridPage'
import { MealSettlementPage } from '@/routes/meals/MealSettlementPage'
import { BillSplitListPage } from '@/routes/billsplits/BillSplitListPage'
import { CreateBillSplitPage } from '@/routes/billsplits/CreateBillSplitPage'
import { BillSplitDetailPage } from '@/routes/billsplits/BillSplitDetailPage'
import { HouseholdSettingsPage } from '@/routes/households/HouseholdSettingsPage'
import { MembersPage } from '@/routes/households/MembersPage'
import { InviteMemberPage } from '@/routes/households/InviteMemberPage'
import { JoinHouseholdPage } from '@/routes/invites/JoinHouseholdPage'
import { InviteAcceptPage } from '@/routes/invites/InviteAcceptPage'
import { PersonalLayout } from '@/routes/personal/PersonalLayout'
import { ExpensesPage } from '@/routes/personal/ExpensesPage'
import { BudgetsPage } from '@/routes/personal/BudgetsPage'

export default function App() {
  return (
    <BootstrapGate>
      <Routes>
        <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/households" element={<HouseholdListPage />} />
          <Route path="/join" element={<JoinHouseholdPage />} />
          <Route path="/invites/:code" element={<InviteAcceptPage />} />

          <Route path="/personal" element={<PersonalLayout />}>
            <Route index element={<Navigate to="expenses" replace />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="budget" element={<BudgetsPage />} />
          </Route>

          <Route path="/h/:householdId" element={<HouseholdLayout />}>
            <Route index element={<SettlementDashboardPage />} />
            <Route path="history" element={<LedgerHistoryPage />} />

            <Route path="ledger" element={<LedgerPage />}>
              <Route index element={<Navigate to="bazar" replace />} />
              <Route path="bazar" element={<BazarListPage />} />
              <Route path="contributions" element={<ContributionsListPage />} />
            </Route>

            <Route path="meals" element={<MealGridPage />} />
            <Route path="meals/settlement" element={<MealSettlementPage />} />

            <Route path="bill-splits" element={<BillSplitListPage />} />
            <Route path="bill-splits/new" element={<CreateBillSplitPage />} />
            <Route path="bill-splits/:billSplitId" element={<BillSplitDetailPage />} />

            <Route path="settings" element={<HouseholdSettingsPage />} />
            <Route path="settings/members" element={<MembersPage />} />
            <Route path="settings/invite" element={<InviteMemberPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
      <PWAUpdatePrompt />
    </BootstrapGate>
  )
}
