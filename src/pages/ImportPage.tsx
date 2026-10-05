import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFirmen } from '../hooks/useData'
import { useFlash } from '../hooks/useFlash'
import { supabase } from '../lib/supabase'
import { parseCsv } from '../lib/csv'
import { anzahl, STATUS } from '../lib/crm'
import { Flash, Spinner } from '../components/ui'

// MailerLite export headers (normalized: lowercase, no spaces/underscores/dashes) → our field
const HEADER_MAP: Record<string, 'email' | 'vorname' | 'nachname' | 'firma' | 'segment'> = {
  email: 'email', subscriber: 'email',
  name: 'vorname', firstname: 'vorname', vorname: 'vorname',
  lastname: 'nachname', nachname: 'nachname',
  company: 'firma', firma: 'firma',
  groups: 'segment', group: 'segment', gruppe: 'segment', gruppen: 'segment', segment: 'segment',
}

interface Zeile {
  nr: number
  email: string
  name: string
  firmaName: string
  segment: string
  status: 'neu' | 'duplikat' | 'fehler'
  hinweis: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ImportPage() {
  const { firmen, loading, refetch } = useFirmen()
  const { flash, show, dismiss } = useFlash(8000)
  const [zeilen, setZeilen] = useState<Zeile[] | null>(null)
  const [spaltenFehler, setSpaltenFehler] = useState<string | null>(null)
  // Row nr → chosen existing firma id for rows without company
  const [zuordnung, setZuordnung] = useState<Record<number, string>>({})
  const [neuStatus, setNeuStatus] = useState('Kunde')
  const [importing, setImporting] = useState(false)

  const firmaByName = useMemo(() => new Map(firmen.map(f => [f.name.trim().toLowerCase(), f])), [firmen])

  const lesen = async (file: File) => {
    setZuordnung({})
    setSpaltenFehler(null)
    const [header, ...rows] = parseCsv(await file.text())
    if (!header) { setZeilen([]); return }
    const cols = header.map(h => HEADER_MAP[h.toLowerCase().replace(/[\s_-]/g, '')])
    if (!cols.includes('email')) {
      setSpaltenFehler(`Keine Spalte «email» gefunden. Erkannte Spalten: ${header.join(', ')}`)
      setZeilen(null)
      return
    }

    const vorhanden = new Set(firmen.flatMap(f => f.kontakt.map(k => k.email?.trim().toLowerCase()).filter(Boolean)))
    const gesehen = new Set<string>()
    setZeilen(rows.map((r, i) => {
      const get = (c: string) => (r[cols.indexOf(c as never)] ?? '').trim()
      const email = get('email')
      const key = email.toLowerCase()
      const z: Zeile = {
        nr: i + 2,
        email,
        name: [get('vorname'), get('nachname')].filter(Boolean).join(' '),
        firmaName: get('firma'),
        // Several MailerLite groups → first one becomes the segment
        segment: get('segment').split(/[,;|]/)[0]?.trim() ?? '',
        status: 'neu',
        hinweis: '',
      }
      if (!EMAIL_RE.test(email)) { z.status = 'fehler'; z.hinweis = 'ungültige E-Mail' }
      else if (vorhanden.has(key)) { z.status = 'duplikat'; z.hinweis = 'schon im CRM' }
      else if (gesehen.has(key)) { z.status = 'duplikat'; z.hinweis = 'doppelt in der Datei' }
      if (!z.name) z.name = email
      gesehen.add(key)
      return z
    }))
  }

  // Target of a row: existing firma id, new firma name, or nothing (skipped)
  const ziel = (z: Zeile): { id: number } | { neu: string } | null => {
    if (z.firmaName) {
      const f = firmaByName.get(z.firmaName.toLowerCase())
      return f ? { id: f.id } : { neu: z.firmaName }
    }
    return zuordnung[z.nr] ? { id: Number(zuordnung[z.nr]) } : null
  }

  const importierbar = (zeilen ?? []).filter(z => z.status === 'neu' && ziel(z))
  const neueFirmen = [...new Map(importierbar.flatMap(z => {
    const t = ziel(z)
    return t && 'neu' in t ? [[t.neu.toLowerCase(), t.neu] as const] : []
  })).values()]

  const importieren = async () => {
    setImporting(true)
    const ids = new Map<string, number>()
    if (neueFirmen.length) {
      const { data, error } = await supabase.from('firma').insert(neueFirmen.map(name => ({ name, status: neuStatus }))).select('id, name')
      if (error) { setImporting(false); show('error', `Firmen anlegen fehlgeschlagen: ${error.message}`); return }
      data.forEach(f => ids.set(f.name.toLowerCase(), f.id))
    }
    const kontakte = importierbar.map(z => {
      const t = ziel(z)!
      return {
        firma_id: 'id' in t ? t.id : ids.get(t.neu.toLowerCase())!,
        name: z.name,
        email: z.email,
        ml_segment: z.segment || null,
      }
    })
    const { error } = await supabase.from('kontakt').insert(kontakte)
    setImporting(false)
    if (error) {
      show('error', `Kontakte importieren fehlgeschlagen: ${error.message}${neueFirmen.length ? ' (neue Firmen wurden bereits angelegt)' : ''}`)
    } else {
      show('success', `${anzahl(kontakte.length, 'Kontakt', 'Kontakte')} und ${anzahl(neueFirmen.length, 'neue Firma', 'neue Firmen')} importiert. Rollen jetzt pro Firma ergänzen.`)
      setZeilen(null)
    }
    refetch()
  }

  if (loading) return <Spinner />

  return (
    <>
      <Flash flash={flash} onDismiss={dismiss} />
      <h1 className="text-2xl font-bold mb-2">Import aus MailerLite</h1>
      <p className="text-sm opacity-70 mb-4">
        CSV-Export aus MailerLite hochladen. Erkannt werden die Spalten email, name, last_name, company und groups (erste Gruppe wird Segment).
        Kontakte mit bereits erfasster E-Mail werden übersprungen.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        className="file-input file-input-bordered w-full max-w-md mb-6"
        onChange={e => { const f = e.target.files?.[0]; if (f) lesen(f) }}
      />
      {spaltenFehler && <div className="alert alert-error mb-4"><span>{spaltenFehler}</span></div>}

      {zeilen && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge badge-soft badge-success">{importierbar.length} werden importiert</span>
              <span className="badge badge-soft badge-ghost">{zeilen.filter(z => z.status === 'duplikat').length} Duplikate</span>
              <span className="badge badge-soft badge-error">{zeilen.filter(z => z.status === 'fehler').length} Fehler</span>
              {neueFirmen.length > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  {anzahl(neueFirmen.length, 'neue Firma', 'neue Firmen')} mit Status
                  <select className="select select-bordered select-sm w-auto" value={neuStatus} onChange={e => setNeuStatus(e.target.value)}>
                    {STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              )}
              <button className="btn btn-primary btn-sm ml-auto" disabled={!importierbar.length || importing} onClick={importieren}>
                {importing ? <span className="loading loading-spinner loading-sm" /> : 'Importieren'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead><tr><th>Zeile</th><th>Status</th><th>Name</th><th>E-Mail</th><th>Firma</th><th>Segment</th></tr></thead>
                <tbody>
                  {zeilen.map(z => {
                    const t = ziel(z)
                    return (
                      <tr key={z.nr} className={z.status !== 'neu' ? 'opacity-50' : ''}>
                        <td>{z.nr}</td>
                        <td>
                          {z.status === 'neu' && !t && <span className="badge badge-sm badge-warning badge-soft">Firma wählen</span>}
                          {z.status === 'neu' && t && <span className="badge badge-sm badge-success badge-soft">neu</span>}
                          {z.status !== 'neu' && <span className="badge badge-sm badge-ghost">{z.hinweis}</span>}
                        </td>
                        <td>{z.name}</td>
                        <td>{z.email}</td>
                        <td>
                          {z.firmaName ? (
                            <>{z.firmaName}{z.status === 'neu' && t && 'neu' in t && <span className="badge badge-xs badge-info badge-soft ml-1">neue Firma</span>}</>
                          ) : z.status === 'neu' ? (
                            <select
                              className="select select-bordered select-xs"
                              value={zuordnung[z.nr] ?? ''}
                              onChange={e => setZuordnung({ ...zuordnung, [z.nr]: e.target.value })}
                            >
                              <option value="">– überspringen –</option>
                              {firmen.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                          ) : null}
                        </td>
                        <td>{z.segment}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!firmen.length && zeilen.some(z => !z.firmaName) && (
              <p className="text-sm opacity-70">
                Für Kontakte ohne Firma zuerst die Firma <Link to="/firma/neu" className="link">erfassen</Link>, dann die CSV erneut laden.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
