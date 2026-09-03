import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { register } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { ApiError } from '@/lib/api/client'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const [name, setName] = useState('')
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
      const auth = await register({ name, email, password })
      setSession(auth)
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError('Too many attempts. Please wait a moment and try again.')
        } else if (err.errors) {
          setFieldErrors({
            name: err.fieldError('name') ?? '',
            email: err.fieldError('email') ?? '',
            password: err.fieldError('password') ?? '',
          })
        } else {
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
      <h2 className="mb-5 font-heading text-lg font-semibold text-ink">Create account</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint={!fieldErrors.password ? 'At least 8 characters, with upper, lower, and a digit.' : undefined}
          required
        />
        {formError && <p className="text-sm text-danger">{formError}</p>}
        <Button type="submit" isLoading={isLoading} framed className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
