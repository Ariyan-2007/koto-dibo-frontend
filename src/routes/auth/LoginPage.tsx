import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { ApiError } from '@/lib/api/client'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setIsLoading(true)
    try {
      const auth = await login({ email, password })
      setSession(auth)
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError('Too many attempts. Please wait a moment and try again.')
        } else if (err.errors) {
          setFieldErrors({
            email: err.fieldError('email') ?? '',
            password: err.fieldError('password') ?? '',
          })
        } else {
          // Account lockout also surfaces as a plain-title 400/403 — show it as-is, not a generic message.
          setFormError(err.message)
        }
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="mb-5 text-lg font-semibold text-ink">Sign In</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <InputField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/register" state={location.state} className="font-medium text-primary">
          Create Account
        </Link>
      </p>
    </AuthLayout>
  )
}
