import type { Field, Values } from '../components/RecordForm'

// Form state is kept as strings / string[]; convert to DB values on save
export function toForm(fields: Field[], record: Values | null): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const f of fields) {
    const v = record?.[f.key]
    out[f.key] = f.type === 'multi' ? (Array.isArray(v) ? v as string[] : []) : v == null ? '' : String(v)
  }
  return out
}

export function toDb(fields: Field[], form: Record<string, string | string[]>): Values {
  const out: Values = {}
  for (const f of fields) {
    const v = form[f.key]
    if (f.type === 'multi') out[f.key] = v
    else if (typeof v === 'string' && v.trim() === '') out[f.key] = null
    else if (f.type === 'number') out[f.key] = Number(v)
    else out[f.key] = typeof v === 'string' ? v.trim() : v
  }
  return out
}
