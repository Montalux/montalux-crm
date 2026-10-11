import { useId, useLayoutEffect, useRef, useState } from 'react'
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

function FieldInput({ field, value, onChange }: {
  field: Field
  value: string | string[]
  onChange: (v: string | string[]) => void
}) {
  const listId = useId()
  const opts = (field.options ?? []).map(o => typeof o === 'string' ? { value: o, label: o } : o)

  if (field.type === 'multi') {
    const selected = value as string[]
    return (
      <div className="flex flex-wrap gap-3">
        {opts.map(o => (
          <label key={o.value} className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={selected.includes(o.value)}
              onChange={e => onChange(e.target.checked ? [...selected, o.value] : selected.filter(x => x !== o.value))}
            />
            <span className="label-text">{o.label}</span>
          </label>
        ))}
      </div>
    )
  }
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
      {fields.map(f => (
        <label key={f.key} className={`block ${f.type === 'textarea' || f.type === 'multi' ? 'md:col-span-2' : ''}`}>
          <span className="label-text">{f.label}{f.required && ' *'}</span>
          <FieldInput field={f} value={form[f.key]} onChange={v => setForm({ ...form, [f.key]: v })} />
        </label>
      ))}
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
