import type { FlashMessage } from '../hooks/useFlash'
import { ROLLEN_FARBE, STATUS_FARBE } from '../lib/crm'

export function Spinner() {
  return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
}

export function RollenBadges({ rollen }: { rollen: string[] }) {
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
