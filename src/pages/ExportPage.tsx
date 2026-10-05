import { useMemo, useState } from 'react'
import { useFirmen } from '../hooks/useData'
import { RollenBadges, Spinner } from '../components/ui'
import { downloadCsv, toCsv } from '../lib/csv'
import { ROLLEN, STATUS, todayLocal } from '../lib/crm'

// Last word of name = last name (like export.php); single word → no last name
function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/)
  const last = parts.length > 1 ? parts.pop()! : ''
  return [parts.join(' '), last]
}

export default function ExportPage() {
  const { firmen, loading } = useFirmen()
  const [segment, setSegment] = useState('')
  const [rolle, setRolle] = useState('')
  const [status, setStatus] = useState('')

  const alle = useMemo(() => firmen
    .flatMap(f => f.kontakt.filter(k => k.email?.trim()).map(k => ({ ...k, firma: f.name, firmaStatus: f.status })))
    .sort((a, b) => a.firma.localeCompare(b.firma) || a.name.localeCompare(b.name)), [firmen])

  const segmente = useMemo(() => [...new Set(alle.map(k => k.ml_segment).filter((s): s is string => !!s))].sort(), [alle])

  const rows = alle.filter(k =>
    (!segment || k.ml_segment === segment) &&
    (!status || k.firmaStatus === status) &&
    (!rolle || k.rollen.includes(rolle)))

  const exportCsv = () => {
    const csv = toCsv([
      ['email', 'name', 'last_name', 'company', 'rollen', 'segment'],
      ...rows.map(k => {
        const [first, last] = splitName(k.name)
        return [k.email, first, last, k.firma, k.rollen.join(','), k.ml_segment ?? '']
      }),
    ])
    downloadCsv(`mailerlite-kontakte-${todayLocal()}.csv`, csv)
  }

  if (loading) return <Spinner />

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Export für MailerLite</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <select className="select select-bordered w-auto" value={segment} onChange={e => setSegment(e.target.value)}>
          <option value="">Alle Segmente</option>
          {segmente.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select select-bordered w-auto" value={rolle} onChange={e => setRolle(e.target.value)}>
          <option value="">Alle Rollen</option>
          {ROLLEN.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select select-bordered w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Alle Status</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary" onClick={exportCsv} disabled={!rows.length}>{rows.length} Kontakte als CSV</button>
      </div>
      <div className="card bg-base-100 shadow-md overflow-x-auto">
        <table className="table table-sm">
          <thead><tr><th>Name</th><th>E-Mail</th><th>Firma</th><th>Rollen</th><th>Segment</th></tr></thead>
          <tbody>
            {rows.map(k => (
              <tr key={k.id}>
                <td>{k.name}</td><td>{k.email}</td><td>{k.firma}</td>
                <td><RollenBadges rollen={k.rollen} /></td><td>{k.ml_segment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
