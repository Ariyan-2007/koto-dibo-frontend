import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/routes/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'

export function JoinHouseholdPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    navigate(`/invites/${encodeURIComponent(trimmed)}`)
  }

  return (
    <AuthLayout>
      <h2 className="mb-2 text-lg font-semibold text-ink">Join a Household</h2>
      <p className="mb-5 text-sm text-muted">
        Enter the invite code someone shared with you, or open the link from a scanned QR code.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField
          label="Invite Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="7K3PQXR9"
          autoFocus
          required
        />
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </AuthLayout>
  )
}
