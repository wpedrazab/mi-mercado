import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id, name, ...props },
  ref,
) {
  const inputId = id ?? name
  return (
    <div className="text-left">
      <label htmlFor={inputId} className="block text-sm font-semibold text-text-label mb-1">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={`w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text placeholder:text-text-muted focus:outline-none focus:border-accent ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-alert" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
