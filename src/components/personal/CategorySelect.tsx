import { SelectField } from '@/components/ui/Field'
import { useExpenseCategories } from '@/lib/personal/useExpenseCategories'
import { buildCategoryTree, flattenCategoryTree } from '@/lib/personal/categoryTree'
import { categoryIcon } from '@/lib/personal/labels'

export function CategorySelect({
  value,
  onChange,
  error,
  label = 'Category',
}: {
  value: string
  onChange: (categoryId: string) => void
  error?: string
  label?: string
}) {
  const { data: categories, isLoading } = useExpenseCategories()
  const flat = flattenCategoryTree(buildCategoryTree(categories ?? []))

  return (
    <SelectField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={isLoading}
      required
    >
      <option value="" disabled>
        {isLoading ? 'Loading…' : 'Select a category'}
      </option>
      {flat.map((c) => (
        <option key={c.id} value={c.id} disabled={false}>
          {'  '.repeat(c.depth)}
          {c.depth === 0 ? `${categoryIcon(c.icon)} ` : ''}
          {c.name}
        </option>
      ))}
    </SelectField>
  )
}
