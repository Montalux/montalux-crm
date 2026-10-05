import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BUCKET, dt } from '../lib/crm'
import { dokumentFields } from '../lib/fields'
import { deleteRecord, saveRecord } from '../hooks/useData'
import { RecordFields } from './RecordForm'
import { toDb, toForm } from '../lib/form'
import { openDokument } from '../lib/dokument'
import type { Dokument } from '../types/database'

export function Dokumente({ firmaId, rows, onChanged }: { firmaId: number; rows: Dokument[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Dokument | 'neu' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = async (d: Dokument) => {
    if (!confirm(`«${d.titel}» löschen?${d.storage_path ? ' Die Datei wird ebenfalls gelöscht.' : ''}`)) return
    if (d.storage_path) {
      const { error } = await supabase.storage.from(BUCKET).remove([d.storage_path])
      if (error) { setError(error.message); return }
    }
    const err = await deleteRecord('dokument', d.id)
    setError(err)
    if (!err) onChanged()
  }

  const sorted = [...rows].sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h3 className="card-title text-base">Dokumente</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setEditing('neu')}>Hinzufügen</button>
        </div>
        {error && <div className="alert alert-error"><span>{error}</span></div>}
        {sorted.length === 0 ? <p className="text-sm opacity-60">Noch nichts erfasst.</p> : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr><th>Titel</th><th>Typ</th><th>Datum</th><th>Bemerkung</th><th /></tr></thead>
              <tbody>
                {sorted.map(d => (
                  <tr key={d.id}>
                    <td>
                      <button className="link" onClick={() => openDokument(d)}>{d.titel}</button>
                      <span className="badge badge-xs badge-ghost ml-2">{d.url ? 'Link' : 'Datei'}</span>
                    </td>
                    <td>{d.typ}</td>
                    <td>{dt(d.datum)}</td>
                    <td className="max-w-xs truncate">{d.bemerkung}</td>
                    <td className="whitespace-nowrap text-right">
                      <button className="btn btn-ghost btn-xs" onClick={() => setEditing(d)}>Bearbeiten</button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => remove(d)}>Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && (
        <DokumentModal
          firmaId={firmaId}
          dokument={editing === 'neu' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged() }}
        />
      )}
    </div>
  )
}

function DokumentModal({ firmaId, dokument, onClose, onSaved }: {
  firmaId: number
  dokument: Dokument | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(() => toForm(dokumentFields, dokument ? { ...dokument } : { typ: 'Sonstiges' }))
  // Source is fixed once saved: a file is replaced by deleting and re-adding
  const [quelle, setQuelle] = useState<'datei' | 'link'>(dokument?.url ? 'link' : 'datei')
  const [url, setUrl] = useState(dokument?.url ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const values = toDb(dokumentFields, form)
    let uploadedPath: string | null = null

    if (!dokument && quelle === 'datei') {
      if (!file) { setError('Bitte eine Datei wählen.'); return }
      setSaving(true)
      const safeName = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_')
      uploadedPath = `${firmaId}/${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from(BUCKET).upload(uploadedPath, file)
      if (error) { setSaving(false); setError(`Upload fehlgeschlagen: ${error.message}`); return }
      values.storage_path = uploadedPath
    } else if (quelle === 'link') {
      values.url = url.trim()
    }

    setSaving(true)
    const { error } = await saveRecord('dokument', dokument ? values : { ...values, firma_id: firmaId }, dokument?.id)
    setSaving(false)
    if (error) {
      // Don't leave an orphaned file in the bucket
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
      setError(error)
    } else {
      onSaved()
    }
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Dokument {dokument ? 'bearbeiten' : 'hinzufügen'}</h3>
        {error && <div className="alert alert-error mb-3"><span>{error}</span></div>}
        <form onSubmit={submit} className="space-y-3">
          {!dokument && (
            <div className="join">
              <button type="button" className={`btn btn-sm join-item ${quelle === 'datei' ? 'btn-active' : ''}`} onClick={() => setQuelle('datei')}>Datei hochladen</button>
              <button type="button" className={`btn btn-sm join-item ${quelle === 'link' ? 'btn-active' : ''}`} onClick={() => setQuelle('link')}>Link</button>
            </div>
          )}
          {quelle === 'datei' && !dokument && (
            <input type="file" className="file-input file-input-bordered w-full" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          )}
          {quelle === 'datei' && dokument && <p className="text-sm opacity-70">Datei: {dokument.storage_path?.split('/').pop()}</p>}
          {quelle === 'link' && (
            <label className="block">
              <span className="label-text">Link *</span>
              <input type="url" className="input input-bordered w-full" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
            </label>
          )}
          <RecordFields fields={dokumentFields} form={form} setForm={setForm} />
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="loading loading-spinner loading-sm" /> : 'Speichern'}</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}
