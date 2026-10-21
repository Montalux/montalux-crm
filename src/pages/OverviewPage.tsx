import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFirmen } from '../hooks/useData'
import { ErfasstBadges, KuendigungHinweise } from '../components/FirmaInfo'
import { RollenBadges, Spinner, StatusBadge } from '../components/ui'
import { formatTelefon } from '../lib/mask'
import { addDays, dt, FAELLIG_VORLAUF_TAGE, ROLLEN, STATUS, STATUS_RAND, todayLocal } from '../lib/crm'

export default function OverviewPage() {
  const { firmen, loading, error } = useFirmen()
  const [suche, setSuche] = useState('')
  const [status, setStatus] = useState('')
  const [rolle, setRolle] = useState('')

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    return firmen.filter(f => {
      if (status && f.status !== status) return false
      if (rolle && !f.kontakt.some(k => k.rollen.includes(rolle))) return false
      if (!q) return true
      const haystack = [f.name, f.kuerzel, f.tenant, ...f.kontakt.flatMap(k => [k.name, k.email])]
      return haystack.some(v => v?.toLowerCase().includes(q))
    })
  }, [firmen, suche, status, rolle])

  const faellig = useMemo(() => {
    const today = todayLocal()
    const bis = addDays(today, FAELLIG_VORLAUF_TAGE)
    return firmen
      .flatMap(f => f.wiedervorlage.filter(w => !w.erledigt && w.faellig_am <= bis).map(w => ({ ...w, firma: f.name, ueberfaellig: w.faellig_am < today })))
      .sort((a, b) => a.faellig_am.localeCompare(b.faellig_am))
  }, [firmen])

  if (loading) return <Spinner />

  return (
    <>
      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

      {faellig.length > 0 && (
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body py-4">
            <h2 className="card-title text-base">Fällig</h2>
            <ul className="space-y-1">
              {faellig.map(w => (
                <li key={w.id} className="flex flex-wrap gap-2 items-baseline">
                  <span className={`badge badge-sm ${w.ueberfaellig ? 'badge-error' : 'badge-warning'} badge-soft`}>{dt(w.faellig_am)}</span>
                  <Link to={`/firma/${w.firma_id}`} className="link font-medium">{w.firma}</Link>
                  <span>{w.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="search"
          className="input input-bordered flex-1 min-w-48"
          placeholder="Suche: Firma, Kürzel, Tenant, Kontakt, E-Mail"
          value={suche}
          onChange={e => setSuche(e.target.value)}
        />
        <select className="select select-bordered w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Alle Status</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select select-bordered w-auto" value={rolle} onChange={e => setRolle(e.target.value)}>
          <option value="">Alle Rollen</option>
          {ROLLEN.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {!firmen.length && (
        <div className="alert">
          <span>Noch keine Firmen erfasst. <Link to="/firma/neu" className="link">Neue Firma</Link> oder <Link to="/import" className="link">MailerLite-Import</Link>.</span>
        </div>
      )}
      {!!firmen.length && !gefiltert.length && <div className="alert"><span>Keine Treffer.</span></div>}

      <div className="grid gap-4 md:grid-cols-2">
        {gefiltert.map(f => (
          <div key={f.id} className={`card bg-base-100 shadow-md border-l-4 ${STATUS_RAND[f.status] ?? 'border-base-300'}`}>
            <div className="card-body gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/firma/${f.id}`} className="card-title link link-hover">{f.name}</Link>
                {f.kuerzel && <span className="badge badge-outline">{f.kuerzel}</span>}
                <StatusBadge status={f.status} />
              </div>
              <ErfasstBadges firma={f} />
              <KuendigungHinweise firma={f} />
              {f.kontakt.length > 0 && (
                <ul className="text-sm divide-y divide-base-200 border-t border-base-200">
                  {[...f.kontakt].sort((a, b) => a.name.localeCompare(b.name)).map(k => (
                    <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
                      <span className="sm:w-40 sm:shrink-0">
                        <span className="font-medium">{k.name}</span>
                        {k.funktion && <span className="block text-xs text-base-content/60">{k.funktion}</span>}
                      </span>
                      {k.email && <a href={`mailto:${k.email}`} className="link link-hover text-base-content/70">{k.email}</a>}
                      {k.telefon && <a href={`tel:${k.telefon.replace(/\s/g, '')}`} className="link link-hover text-base-content/70 whitespace-nowrap">{formatTelefon(k.telefon)}</a>}
                      {k.mobile && <a href={`tel:${k.mobile.replace(/\s/g, '')}`} className="link link-hover text-base-content/70 whitespace-nowrap">{formatTelefon(k.mobile)}</a>}
                      <span className="ml-auto shrink-0"><RollenBadges rollen={k.rollen} kompakt /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
