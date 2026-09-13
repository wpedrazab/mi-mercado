import { useState } from 'react'

export interface SearchableOption {
  id: string
  label: string
}

/**
 * Un <select> nativo se vuelve difícil de usar cuando hay muchos productos:
 * no se puede escribir para filtrar. Esto es un input con autocompletar
 * simple (sin librería externa) — escribe para filtrar, toca una opción
 * para elegirla.
 */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  id?: string
  value: string
  onChange: (id: string) => void
  options: SearchableOption[]
  disabled?: boolean
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery ? options.filter((o) => o.label.toLowerCase().includes(normalizedQuery)) : options

  if (disabled) {
    return (
      <div
        id={id}
        className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text flex items-center opacity-70"
      >
        {selected?.label ?? placeholder}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={open ? query : (selected?.label ?? '')}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-surface border border-border rounded-[var(--radius-field)] shadow-lg">
          {filtered.length === 0 && <p className="px-4 py-2 text-sm text-text-secondary">Sin resultados</p>}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(o.id)
                setOpen(false)
                setQuery('')
              }}
              className="w-full text-left px-4 py-2 hover:bg-subtle text-text min-h-11"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
