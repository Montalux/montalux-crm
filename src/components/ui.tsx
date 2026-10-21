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

// Outline icons (Heroicons, MIT) for table row actions
const ICONS = {
  edit: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10',
  delete: 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
  vcard: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z',
}

export function IconButton({ icon, label, onClick, danger }: { icon: keyof typeof ICONS; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={`btn btn-ghost btn-xs btn-square ${danger ? 'text-error' : ''}`} title={label} aria-label={label} onClick={onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
        <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[icon]} />
      </svg>
    </button>
  )
}
