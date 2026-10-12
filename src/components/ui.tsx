import type { FlashMessage } from '../hooks/useFlash'
import { ROLLEN, ROLLEN_FARBE, STATUS_FARBE } from '../lib/crm'

export function Spinner() {
  return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
}

// kompakt: one small circle with the initial per role (E, F, T, R, D), full name as tooltip
export function RollenBadges({ rollen, kompakt }: { rollen: string[]; kompakt?: boolean }) {
  if (kompakt) {
    return (
      <span className="inline-flex gap-1">
        {ROLLEN.filter(r => rollen.includes(r)).map(r => (
          <span
            key={r}
            title={r}
            aria-label={r}
            className={`badge badge-soft ${ROLLEN_FARBE[r] ?? ''} size-5 p-0 rounded-full text-[10px] font-bold`}
          >
            {r[0]}
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {rollen.map(r => <span key={r} className={`badge badge-sm badge-soft ${ROLLEN_FARBE[r] ?? ''}`}>{r}</span>)}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-soft ${STATUS_FARBE[status] ?? ''}`}>{status}</span>
}

export function Flash({ flash, onDismiss }: { flash: FlashMessage | null; onDismiss: () => void }) {
  if (!flash) return null
  return (
    <div className={`alert ${flash.kind === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
      <span>{flash.text}</span>
      <button type="button" className="btn btn-ghost btn-xs" onClick={onDismiss} aria-label="Meldung schliessen">X</button>
    </div>
  )
}
