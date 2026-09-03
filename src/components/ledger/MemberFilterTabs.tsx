import { cn } from '@/lib/cn'

export interface MemberTabOption {
  userId: string
  label: string
  count: number
}

/** Horizontally-scrollable "who did what" filter — tap a member to see just their entries. */
export function MemberFilterTabs({
  options,
  selected,
  onSelect,
  totalCount,
}: {
  options: MemberTabOption[]
  selected: string | 'all'
  onSelect: (userId: string | 'all') => void
  totalCount: number
}) {
  if (options.length <= 1) return null

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Filter by member">
      <TabButton label="All" count={totalCount} active={selected === 'all'} onClick={() => onSelect('all')} />
      {options.map((o) => (
        <TabButton key={o.userId} label={o.label} count={o.count} active={selected === o.userId} onClick={() => onSelect(o.userId)} />
      ))}
    </div>
  )
}

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'border-primary bg-primary-soft text-primary-active' : 'border-border bg-surface text-ink hover:bg-surface-muted',
      )}
    >
      {label} <span className={cn('ml-0.5', active ? 'text-primary/70' : 'text-muted')}>{count}</span>
    </button>
  )
}
