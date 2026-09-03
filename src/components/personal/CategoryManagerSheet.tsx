import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InputField, SelectField } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Pencil, Plus, Trash, Check, X } from '@/components/ui/icons'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { createExpenseCategory, deactivateExpenseCategory, updateExpenseCategory } from '@/lib/api/expenseCategories'
import { useExpenseCategories } from '@/lib/personal/useExpenseCategories'
import { buildCategoryTree, flattenCategoryTree } from '@/lib/personal/categoryTree'
import { categoryIcon } from '@/lib/personal/labels'
import { cn } from '@/lib/cn'
import type { ExpenseCategoryDto } from '@/lib/api/types'

export function CategoryManagerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useExpenseCategories(true)
  const flat = flattenCategoryTree(buildCategoryTree(categories ?? []))

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState<ExpenseCategoryDto | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['expenseCategories'] })
  }

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; name: string }) => updateExpenseCategory(vars.id, { name: vars.name }),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      toast.success('Category updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateExpenseCategory(id),
    onSuccess: () => {
      invalidate()
      toast.success('Category removed')
      setDeactivateTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setDeactivateTarget(null)
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createExpenseCategory({ name: newName.trim(), parentCategoryId: newParentId || undefined }),
    onSuccess: () => {
      invalidate()
      toast.success('Category added')
      setNewName('')
      setNewParentId('')
      setAddOpen(false)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setErrors({ name: err.fieldError('name') ?? '' })
      } else {
        toast.error(errorMessage(err))
      }
    },
  })

  function onAddSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    createMutation.mutate()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Manage Categories">
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="flex flex-col gap-1">
            {flat.map((c) => (
              <div
                key={c.id}
                className={cn('flex items-center gap-2 rounded-md px-2 py-2', !c.isActive && 'opacity-50')}
                style={{ paddingLeft: `${c.depth * 20 + 8}px` }}
              >
                {c.depth === 0 && <span>{categoryIcon(c.icon)}</span>}
                {editingId === c.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="h-8 flex-1 rounded-md border border-border bg-surface px-2 text-sm text-ink focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => updateMutation.mutate({ id: c.id, name: editName.trim() })}
                      disabled={!editName.trim() || updateMutation.isPending}
                      aria-label="Save"
                      className="rounded-pill p-1.5 text-primary hover:bg-primary-soft"
                    >
                      <Check width={16} height={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded-pill p-1.5 text-muted hover:bg-surface-muted">
                      <X width={16} height={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm text-ink">{c.name}</span>
                    {c.isSystemDefault && <Badge>Default</Badge>}
                    {!c.isSystemDefault && c.isActive && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(c.id)
                            setEditName(c.name)
                          }}
                          aria-label={`Edit ${c.name}`}
                          className="rounded-pill p-1.5 text-muted hover:bg-surface-muted hover:text-ink"
                        >
                          <Pencil width={15} height={15} />
                        </button>
                        <button
                          onClick={() => setDeactivateTarget(c)}
                          aria-label={`Remove ${c.name}`}
                          className="rounded-pill p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash width={15} height={15} />
                        </button>
                      </>
                    )}
                    {!c.isActive && <Badge tone="muted">Removed</Badge>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {addOpen ? (
          <form onSubmit={onAddSubmit} className="flex flex-col gap-3 rounded-md border border-border p-3">
            <InputField label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} error={errors.name} maxLength={100} required autoFocus />
            <SelectField label="Parent (optional)" value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
              <option value="">Top level</option>
              {flat
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.depth)}
                    {c.name}
                  </option>
                ))}
            </SelectField>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
                Add
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" icon={<Plus width={18} height={18} />} onClick={() => setAddOpen(true)}>
            Add Category
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={!!deactivateTarget}
        title={`Remove "${deactivateTarget?.name}"?`}
        description="Existing expenses keep showing this category name — this just hides it from future pickers."
        confirmLabel="Remove"
        danger
        isLoading={deactivateMutation.isPending}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        onCancel={() => setDeactivateTarget(null)}
      />
    </Sheet>
  )
}
