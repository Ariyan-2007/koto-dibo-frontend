import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getBudgetDashboard } from '@/lib/api/budgetDashboard'
import { formatMoney, formatDate, formatPercent } from '@/lib/format'
import { BUDGET_HEALTH_LABEL, BUDGET_HEALTH_TONE } from '@/lib/personal/labels'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SelectField, InputField } from '@/components/ui/Field'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ArrowUpRight, ArrowDownRight, Wallet, ChevronRight } from '@/components/ui/icons'
import { SpendingTrendChart } from '@/components/personal/dashboard/SpendingTrendChart'
import { BudgetVsActualChart } from '@/components/personal/dashboard/BudgetVsActualChart'
import { MagnitudeBarList } from '@/components/personal/dashboard/MagnitudeBarList'
import { CategoryBreakdownList } from '@/components/personal/dashboard/CategoryBreakdownList'
import { cn } from '@/lib/cn'
import type { DashboardComparisonPeriod, DashboardPeriodPreset } from '@/lib/api/types'

const PRESETS: { value: DashboardPeriodPreset; label: string }[] = [
  { value: 'Today', label: 'Today' },
  { value: 'ThisWeek', label: 'This Week' },
  { value: 'ThisMonth', label: 'This Month' },
  { value: 'LastMonth', label: 'Last Month' },
  { value: 'ThisYear', label: 'This Year' },
  { value: 'Custom', label: 'Custom' },
]

const COMPARISONS: { value: DashboardComparisonPeriod; label: string }[] = [
  { value: 'PreviousPeriod', label: 'vs Previous Period' },
  { value: 'SamePeriodLastYear', label: 'vs Same Period Last Year' },
  { value: 'None', label: 'No Comparison' },
]

export function PersonalDashboardPage() {
  const [preset, setPreset] = useState<DashboardPeriodPreset>('ThisMonth')
  const [comparisonPeriod, setComparisonPeriod] = useState<DashboardComparisonPeriod>('PreviousPeriod')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['budgetDashboard', preset, comparisonPeriod, customFrom, customTo],
    queryFn: () =>
      getBudgetDashboard({
        preset,
        from: preset === 'Custom' ? customFrom || undefined : undefined,
        to: preset === 'Custom' ? customTo || undefined : undefined,
        comparisonPeriod,
      }),
    enabled: preset !== 'Custom' || (!!customFrom && !!customTo),
  })

  const currency = 'BDT'

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Period" value={preset} onChange={(e) => setPreset(e.target.value as DashboardPeriodPreset)}>
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Compare" value={comparisonPeriod} onChange={(e) => setComparisonPeriod(e.target.value as DashboardComparisonPeriod)}>
          {COMPARISONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectField>
      </div>

      {preset === 'Custom' && (
        <div className="grid grid-cols-2 gap-3">
          <InputField label="From" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <InputField label="To" type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : !data ? (
        <p className="text-sm text-muted">Pick a custom date range to load the dashboard.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Budgeted" value={formatMoney(data.summary.totalBudget, currency)} />
            <StatTile label="Spent" value={formatMoney(data.summary.totalSpent, currency)} />
            <StatTile
              label={data.summary.totalOverspent > 0 ? 'Overspent' : 'Remaining'}
              value={formatMoney(data.summary.totalOverspent > 0 ? data.summary.totalOverspent : data.summary.totalRemaining, currency)}
              danger={data.summary.totalOverspent > 0}
            />
            <StatTile label="Used" value={formatPercent(data.summary.budgetUtilizationPercentage)} />
            <StatTile label="Expenses" value={String(data.summary.expenseCount)} />
            <StatTile label="Avg / Expense" value={formatMoney(data.summary.averageExpense, currency)} />
          </div>

          {data.budget.hasBudget ? (
            <Link to={`/budgets/${data.budget.id}`}>
              <Card className="flex items-center justify-between gap-2 p-4 hover:border-primary">
                <div>
                  <p className="font-medium text-ink">{data.budget.name}</p>
                  <p className="text-xs text-muted">{data.budget.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={BUDGET_HEALTH_TONE[data.budget.health]}>{BUDGET_HEALTH_LABEL[data.budget.health]}</Badge>
                  <ChevronRight width={16} height={16} className="text-muted" />
                </div>
              </Card>
            </Link>
          ) : (
            <EmptyState
              icon={<Wallet width={24} height={24} />}
              title="No Budget For This Period"
              description="Create one to see budget-vs-actual and category envelopes here."
              action={
                <Link to="/budgets" className="text-sm font-medium text-primary">
                  Set up a budget →
                </Link>
              }
            />
          )}

          {data.comparison && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">Compared to {formatDate(data.comparison.previousFrom)}–{formatDate(data.comparison.previousTo)}</p>
                <TrendBadge trend={data.comparison.trend} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ComparisonStat
                  label="Spending"
                  current={data.comparison.currentSpending}
                  previous={data.comparison.previousSpending}
                  changePct={data.comparison.spendingChangePercentage}
                  currency={currency}
                />
                <ComparisonStat
                  label="Budget"
                  current={data.comparison.currentBudget}
                  previous={data.comparison.previousBudget}
                  changePct={data.comparison.budgetChangePercentage}
                  currency={currency}
                />
              </div>
            </Card>
          )}

          {data.budgetVsActual.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 font-medium text-ink">Budget vs Actual</h2>
              <BudgetVsActualChart points={data.budgetVsActual} currency={currency} />
            </Card>
          )}

          {data.categoryBreakdown.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 font-medium text-ink">Category Breakdown</h2>
              <CategoryBreakdownList items={data.categoryBreakdown} currency={currency} />
            </Card>
          )}

          {data.spendingTrend.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 font-medium text-ink">Spending Trend</h2>
              <SpendingTrendChart points={data.spendingTrend} currency={currency} />
            </Card>
          )}

          {data.overspending.length > 0 && (
            <Card className="border-danger-border p-4">
              <h2 className="mb-3 font-medium text-danger">Overspending</h2>
              <CategoryBreakdownList items={data.overspending} currency={currency} />
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.topCategories.length > 0 && (
              <Card className="p-4">
                <h2 className="mb-3 font-medium text-ink">Top Categories</h2>
                <MagnitudeBarList
                  items={data.topCategories.map((c) => ({ key: c.categoryId, label: c.categoryName, amount: c.amount, percentageOfTotal: c.percentageOfTotal }))}
                  currency={currency}
                />
              </Card>
            )}
            {data.topMerchants.length > 0 && (
              <Card className="p-4">
                <h2 className="mb-3 font-medium text-ink">Top Merchants</h2>
                <MagnitudeBarList
                  items={data.topMerchants.map((m) => ({
                    key: m.merchant,
                    label: m.merchant,
                    amount: m.amount,
                    percentageOfTotal: m.percentageOfTotal,
                    sublabel: `× ${m.transactionCount}`,
                  }))}
                  currency={currency}
                />
              </Card>
            )}
          </div>

          {data.upcomingExpenses.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 font-medium text-ink">Upcoming (Next 30 Days)</h2>
              <div className="flex flex-col gap-2">
                {data.upcomingExpenses.map((u) => (
                  <div key={u.recurringExpenseId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-ink">{u.description || u.merchant || u.categoryName}</p>
                      <p className="text-xs text-muted">{formatDate(u.nextOccurrenceDate)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-ink">{formatMoney(u.amount, currency)}</span>
                      <Badge tone={u.daysUntilDue <= 3 ? 'warning' : 'muted'}>{u.daysUntilDue}d</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h2 className="mb-3 font-medium text-ink">Insights</h2>
            <div className="flex flex-col gap-2 text-sm">
              {data.insights.highestSpendingCategory && (
                <InsightRow label="Highest spending category" value={data.insights.highestSpendingCategory} />
              )}
              {data.insights.mostFrequentCategory && <InsightRow label="Most frequent category" value={data.insights.mostFrequentCategory} />}
              {data.insights.highestExpenseAmount != null && (
                <InsightRow
                  label="Largest expense"
                  value={`${formatMoney(data.insights.highestExpenseAmount, currency)}${data.insights.highestExpenseDescription ? ` — ${data.insights.highestExpenseDescription}` : ''}`}
                />
              )}
              <InsightRow label="Average expense" value={formatMoney(data.insights.averageExpense, currency)} />
              <InsightRow label="Recurring total" value={formatMoney(data.insights.recurringExpensesTotal, currency)} />
              <InsightRow label="Fixed vs variable" value={`${formatMoney(data.insights.fixedExpensesTotal, currency)} / ${formatMoney(data.insights.variableExpensesTotal, currency)}`} />
              {data.insights.overspendingCategoriesCount > 0 && (
                <InsightRow label="Categories overspent" value={String(data.insights.overspendingCategoriesCount)} danger />
              )}
              {data.insights.categoriesApproachingLimit.length > 0 && (
                <InsightRow label="Approaching limit" value={data.insights.categoriesApproachingLimit.join(', ')} />
              )}
              {data.insights.categoriesSignificantlyUnderBudget.length > 0 && (
                <InsightRow label="Well under budget" value={data.insights.categoriesSignificantlyUnderBudget.join(', ')} />
              )}
            </div>
          </Card>

          {data.expenses.recentExpenses.length > 0 && (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium text-ink">Recent Expenses</h2>
                <Link to="/expenses" className="text-sm font-medium text-primary">
                  View all →
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {data.expenses.recentExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-ink">
                        {e.categoryName}
                        {e.merchant && ` · ${e.merchant}`}
                      </p>
                      <p className="text-xs text-muted">{formatDate(e.date)}</p>
                    </div>
                    <span className="shrink-0 font-medium text-ink">{formatMoney(e.amount, e.currency)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn('mt-1 font-semibold', danger ? 'text-danger' : 'text-ink')}>{value}</p>
    </Card>
  )
}

function InsightRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className={cn('text-right font-medium', danger ? 'text-danger' : 'text-ink')}>{value}</span>
    </div>
  )
}

function TrendBadge({ trend }: { trend: 'Increased' | 'Decreased' | 'Stable' }) {
  if (trend === 'Stable') return <Badge tone="muted">Stable</Badge>
  const Icon = trend === 'Increased' ? ArrowUpRight : ArrowDownRight
  return (
    <Badge tone={trend === 'Increased' ? 'danger' : 'primary'} className="flex items-center gap-1">
      <Icon width={12} height={12} />
      {trend}
    </Badge>
  )
}

function ComparisonStat({
  label,
  current,
  previous,
  changePct,
  currency,
}: {
  label: string
  current: number
  previous: number
  changePct: number | null
  currency: string
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-ink">{formatMoney(current, currency)}</p>
      <p className="text-xs text-muted">
        was {formatMoney(previous, currency)}
        {changePct !== null && ` (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`}
      </p>
    </div>
  )
}
