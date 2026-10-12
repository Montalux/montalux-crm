import type { FirmaFull } from '../types/database'
import { anzahl, dt, firmaStats, kuendigungHinweise, KUENDIGUNG_FARBE, KUENDIGUNG_LABEL } from '../lib/crm'

// "Erfasst im CRM": counts and current AVV as one quiet line
export function ErfasstBadges({ firma }: { firma: FirmaFull }) {
  const s = firmaStats(firma)
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-content/70">
      <span>{anzahl(s.kontakte, 'Kontakt', 'Kontakte')}</span>
      <span aria-hidden>·</span>
      <span>{anzahl(s.lizenzen, 'Lizenz', 'Lizenzen')}</span>
      <span aria-hidden>·</span>
      <span>{anzahl(s.module, 'Modul', 'Module')}</span>
      {s.avvVersion
        ? <span className="badge badge-sm badge-soft badge-success">AVV {s.avvVersion}</span>
        : <span className="badge badge-sm badge-soft badge-error">kein AVV</span>}
    </div>
  )
}

export function KuendigungHinweise({ firma }: { firma: FirmaFull }) {
  const hinweise = kuendigungHinweise(firma.lizenz)
  if (!hinweise.length) return null
  return (
    <div className="flex flex-col gap-1">
      {hinweise.map(({ lizenz, info }) => (
        <div key={lizenz.id} className={`badge ${KUENDIGUNG_FARBE[info.state]} badge-soft h-auto py-1`}>
          {lizenz.produkt}: kündigen bis {dt(info.date)}
          {info.state === 'soon' ? ` (in ${info.days} Tagen)` : ` (${KUENDIGUNG_LABEL[info.state]})`}
        </div>
      ))}
    </div>
  )
}
