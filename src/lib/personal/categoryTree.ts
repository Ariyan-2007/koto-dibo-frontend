import type { ExpenseCategoryDto } from '@/lib/api/types'

export interface CategoryNode extends ExpenseCategoryDto {
  depth: number
  children: CategoryNode[]
}

/** Reconstructs the parent/child tree from the flat list the API returns (§7.1). Orphaned rows
 * (a `ParentCategoryId` pointing at something deactivated/missing) fall back to top-level so they
 * never silently vanish from the picker. */
export function buildCategoryTree(categories: ExpenseCategoryDto[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>(categories.map((c) => [c.id, { ...c, depth: 0, children: [] }]))
  const roots: CategoryNode[] = []

  for (const node of byId.values()) {
    const parent = node.parentCategoryId ? byId.get(node.parentCategoryId) : undefined
    if (parent) {
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortByName = (a: CategoryNode, b: CategoryNode) => a.name.localeCompare(b.name)
  function sortTree(nodes: CategoryNode[]) {
    nodes.sort(sortByName)
    for (const n of nodes) sortTree(n.children)
  }
  sortTree(roots)

  return roots
}

/** Depth-first flattening of the tree for a `<select>` — depth drives indentation. */
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = []
  function visit(list: CategoryNode[]) {
    for (const n of list) {
      out.push(n)
      visit(n.children)
    }
  }
  visit(nodes)
  return out
}

export function categoryNameById(categories: ExpenseCategoryDto[]): Map<string, string> {
  return new Map(categories.map((c) => [c.id, c.name]))
}
