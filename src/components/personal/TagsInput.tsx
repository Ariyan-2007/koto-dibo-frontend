import { useState, type KeyboardEvent } from 'react'
import { X } from '@/components/ui/icons'

/** Free-text tags, deduplicated case-insensitively server-side, max 20 per expense (§7.2) —
 * mirror the cap client-side so a form doesn't submit 21 only to 400 back. */
const MAX_TAGS = 20

export function TagsInput({ value, onChange, error }: { value: string[]; onChange: (tags: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState('')

  function commit() {
    const tag = draft.trim()
    setDraft('')
    if (!tag) return
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    if (value.length >= MAX_TAGS) return
    onChange([...value, tag])
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">Tags</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 focus-within:border-primary focus-within:shadow-focus">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-[2px] bg-surface-muted px-2 py-1 text-xs text-ink">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`}>
              <X width={12} height={12} className="text-muted" />
            </button>
          </span>
        ))}
        {value.length < MAX_TAGS && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            placeholder={value.length === 0 ? 'Add a tag and press Enter' : ''}
            maxLength={50}
            className="h-8 min-w-24 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
