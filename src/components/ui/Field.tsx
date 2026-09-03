import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const controlClasses =
  'h-11 w-full rounded-sm border border-border bg-surface-muted px-3 text-[15px] text-ink placeholder:text-muted ' +
  'focus:outline-none focus:border-primary focus:shadow-focus disabled:opacity-50'

interface FieldShellProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
  required?: boolean
}

export function FieldShell({ label, htmlFor, error, hint, children, required }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function InputField({ label, error, hint, className, id, required, ...props }: InputFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id ?? label} error={error} hint={hint} required={required}>
      <input
        id={id ?? label}
        className={cn(controlClasses, error && 'border-danger', className)}
        required={required}
        {...props}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

export function SelectField({ label, error, hint, className, id, required, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id ?? label} error={error} hint={hint} required={required}>
      <select
        id={id ?? label}
        className={cn(controlClasses, 'appearance-none bg-no-repeat', error && 'border-danger', className)}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function TextareaField({ label, error, hint, className, id, required, ...props }: TextareaFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id ?? label} error={error} hint={hint} required={required}>
      <textarea
        id={id ?? label}
        className={cn(controlClasses, 'h-auto min-h-20 py-2 resize-none', error && 'border-danger', className)}
        required={required}
        {...props}
      />
    </FieldShell>
  )
}
