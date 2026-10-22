import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { toDb, toForm } from '../lib/form'
import { EMAIL_PATTERN, formatEmail, formatTelefon, isEmailChar, isTelefonChar } from '../lib/mask'

export type FieldType = 'text' | 'email' | 'tel' | 'url' | 'date' | 'number' | 'textarea' | 'multi' | 'select'

export interface Field {
  key: string
  label: string
  type: FieldType
  required?: boolean
  // select / multi choices: plain strings or {value,label}
  options?: (string | { value: string; label: string })[]
  // free-text suggestions (<datalist>)
  suggestions?: string[]
}

export type Values = Record<string, unknown>

// Text input that reformats while typing and keeps the caret in place:
// the caret stays behind the same number of significant characters as before formatting.
function MaskedInput({ value, onChange, format, isSignificant, ...props }: {
  value: string
  onChange: (v: string) => void
  format: (raw: string) => string
  isSignificant: (c: string) => boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const ref = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (caret.current === null || !ref.current) return
    let pos = 0
    for (let seen = 0; pos < value.length && seen < caret.current; pos++) {
      if (isSignificant(value[pos])) seen++
    }
    ref.current.setSelectionRange(pos, pos)
    caret.current = null
  })

  return (
    <input
      {...props}
      ref={ref}
      className="input input-bordered w-full"
      value={value}
      onChange={e => {
        const before = e.target.value.slice(0, e.target.selectionStart ?? e.target.value.length)
        caret.current = [...before].filter(isSignificant).length
        onChange(format(e.target.value))
      }}
    />
  )
}

// Dropdown with checkboxes. The first selected value is the primary one (star).
function MultiSelect({ options, selected, onChange }: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const label = (v: string) => options.find(o => o.value === v)?.label ?? v
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  const makePrimary = (v: string) => onChange([v, ...selected.filter(x => x !== v)])

  return (
    <div ref={ref} className="relative">
      <button type="button" className="select select-bordered w-full text-left" onClick={() => setOpen(!open)}>
        <span className="truncate">
          {selected.length ? selected.map((v, i) => i === 0 && selected.length > 1 ? `${label(v)} ★` : label(v)).join(', ') : '–'}
        </span>
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
          {options.map(o => {
            const checked = selected.includes(o.value)
            const primary = selected[0] === o.value
            return (
              <li key={o.value} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-base-200">
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <input type="checkbox" className="checkbox checkbox-sm" checked={checked} onChange={() => toggle(o.value)} />
                  <span>{o.label}</span>
                </label>
                <button
                  type="button"
                  className={`btn btn-ghost btn-xs btn-square ${primary ? 'text-warning' : 'opacity-30 hover:opacity-100'}`}
                  title={primary ? 'Hauptrolle' : 'Als Hauptrolle setzen'}
                  aria-label={primary ? `${o.label} ist Hauptrolle` : `${o.label} als Hauptrolle setzen`}
                  onClick={() => makePrimary(o.value)}
                >
                  {primary ? '★' : '☆'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FieldInput({ field, value, onChange }: {
  field: Field
  value: string | string[]
  onChange: (v: string | string[]) => void
}) {
  const listId = useId()
  const opts = (field.options ?? []).map(o => typeof o === 'string' ? { value: o, label: o } : o)

  if (field.type === 'multi') return <MultiSelect options={opts} selected={value as string[]} onChange={onChange} />
  if (field.type === 'select') {
    return (
      <select className="select select-bordered w-full" value={value as string} required={field.required} onChange={e => onChange(e.target.value)}>
        {!field.required && <option value="">–</option>}
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
  if (field.type === 'textarea') {
    return <textarea className="textarea textarea-bordered w-full" rows={3} value={value as string} onChange={e => onChange(e.target.value)} />
  }
  if (field.type === 'tel') {
    return (
      <MaskedInput
        type="tel" value={value as string} onChange={onChange} required={field.required}
        format={formatTelefon} isSignificant={isTelefonChar} placeholder="079 123 45 67"
      />
    )
  }
  if (field.type === 'email') {
    // type="text": the selection API needed for the mask is not available on type="email"
    return (
      <MaskedInput
        type="text" inputMode="email" autoCapitalize="off" spellCheck={false}
        value={value as string} onChange={onChange} required={field.required}
        format={formatEmail} isSignificant={isEmailChar}
        pattern={EMAIL_PATTERN} title="E-Mail-Adresse im Format name@firma.ch" placeholder="name@firma.ch"
      />
    )
  }
  return (
    <>
      <input
        // url: plain text, https:// is added on save
        type={field.type === 'url' ? 'text' : field.type}
        inputMode={field.type === 'url' ? 'url' : undefined}
        placeholder={field.type === 'url' ? 'https://…' : undefined}
        className="input input-bordered w-full"
        value={value as string}
        required={field.required}
        step={field.type === 'number' ? 'any' : undefined}
        list={field.suggestions?.length ? listId : undefined}
        onChange={e => onChange(e.target.value)}
      />
      {!!field.suggestions?.length && (
        <datalist id={listId}>{field.suggestions.map(s => <option key={s} value={s} />)}</datalist>
      )}
    </>
  )
}

export function RecordFields({ fields, form, setForm }: {
  fields: Field[]
  form: Record<string, string | string[]>
  setForm: (f: Record<string, string | string[]>) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map(f => {
        // A <label> around the dropdown would forward clicks to its first checkbox
        const Wrapper = f.type === 'multi' ? 'div' : 'label'
        return (
          <Wrapper key={f.key} className={`block ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
            <span className="label-text">{f.label}{f.required && ' *'}</span>
            <FieldInput field={f} value={form[f.key]} onChange={v => setForm({ ...form, [f.key]: v })} />
          </Wrapper>
        )
      })}
    </div>
  )
}

// Generic add/edit modal. record === null → closed; record === {} → new.
// The body only mounts while open, so the form state starts fresh for every record.
export function RecordModal(props: {
  title: string
  fields: Field[]
  record: Values | null
  onClose: () => void
  onSave: (values: Values) => Promise<string | null>
}) {
  if (!props.record) return null
  return <ModalBody {...props} record={props.record} />
}

function ModalBody({ title, fields, record, onClose, onSave }: {
  title: string
  fields: Field[]
  record: Values
  onClose: () => void
  onSave: (values: Values) => Promise<string | null>
}) {
  const [form, setForm] = useState(() => toForm(fields, record))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const err = await onSave(toDb(fields, form))
    setSaving(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {error && <div className="alert alert-error mb-3"><span>{error}</span></div>}
        <form onSubmit={submit}>
          <RecordFields fields={fields} form={form} setForm={setForm} />
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>Speichern</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}
