import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-white">
          ৳
        </div>
        <h1 className="text-xl font-semibold text-ink">কত দিবো?</h1>
        <p className="text-sm text-muted">Shared household ledger</p>
      </div>
      <Card className="w-full max-w-sm p-6">{children}</Card>
    </div>
  )
}
