import type { Avv, FirmaFull, Lizenz } from '../types/database'

export const ROLLEN = ['Entscheider', 'Fachlich', 'Technisch', 'Rechnung', 'Datenschutz']
export const STATUS = ['Kunde', 'Pilot', 'Interessent', 'Ex-Kunde']
export const PROJEKT_STATUS = ['Offeriert', 'Laufend', 'Abgeschlossen', 'Verworfen']
export const INTERVALLE = ['monatlich', 'quartalsweise', 'halbjährlich', 'jährlich']
export const DOKUMENT_TYPEN = ['Vertrag', 'AVV', 'Offerte', 'Sonstiges']
export const BUCKET = 'crm-dokumente'

export const ROLLEN_FARBE: Record<string, string> = {
  Entscheider: 'badge-error',
  Fachlich: 'badge-info',
  Technisch: 'badge-accent',
  Rechnung: 'badge-warning',
  Datenschutz: 'badge-primary',
}

export const STATUS_FARBE: Record<string, string> = {
  Kunde: 'badge-success',
  Pilot: 'badge-info',
  Interessent: 'badge-warning',
  'Ex-Kunde': 'badge-ghost',
}

// Days before a due Wiedervorlage shows up in the "Fällig" block
export const FAELLIG_VORLAUF_TAGE = 7

// Local YYYY-MM-DD (toISOString() shifts to UTC)
export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// Whole days from a to b (both YYYY-MM-DD), negative if b is before a
export function daysBetween(a: string, b: string): number {
  const toUtc = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(b) - toUtc(a)) / 86400000)
}

// TT.MM.JJJJ
export function dt(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return d && m && y ? `${d}.${m}.${y}` : iso
}

// CHF 12'000
export function chf(v: number | null | undefined): string {
  if (v === null || v === undefined) return ''
  return 'CHF ' + tausender(Math.round(v))
}

// "1 Kontakt" / "3 Kontakte"
export function anzahl(n: number, einzahl: string, mehrzahl: string): string {
  return `${n} ${n === 1 ? einzahl : mehrzahl}`
}

export function tausender(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'")
}

export type KuendigungState = 'ok' | 'soon' | 'missed' | 'expired'
export interface KuendigungInfo {
  date: string
  days: number
  state: KuendigungState
}

// Port of kuendigung_info() from the PHP prototype: "Kündigen bis" = Ende minus Frist
export function kuendigungInfo(l: Pick<Lizenz, 'ende' | 'kuendigungsfrist_tage'>, today = todayLocal()): KuendigungInfo | null {
  if (!l.ende || l.kuendigungsfrist_tage === null) return null
  const date = addDays(l.ende, -l.kuendigungsfrist_tage)
  const days = daysBetween(today, date)
  const state: KuendigungState = l.ende < today ? 'expired' : days < 0 ? 'missed' : days <= 90 ? 'soon' : 'ok'
  return { date, days, state }
}

export const KUENDIGUNG_LABEL: Record<KuendigungState, string> = {
  ok: 'ok',
  soon: 'bald',
  missed: 'Frist verpasst',
  expired: 'abgelaufen',
}

export const KUENDIGUNG_FARBE: Record<KuendigungState, string> = {
  ok: 'badge-ghost',
  soon: 'badge-warning',
  missed: 'badge-error',
  expired: 'badge-ghost',
}

// Current AVV = latest signed (unsigned ones sort first, like ORDER BY unterzeichnet_am ASC in SQLite)
export function aktuellerAvv(avv: Avv[]): Avv | null {
  if (!avv.length) return null
  return [...avv].sort((a, b) => (a.unterzeichnet_am ?? '').localeCompare(b.unterzeichnet_am ?? '')).at(-1) ?? null
}

// Port of firma_stats(): counts per area, missing roles, current AVV version
export function firmaStats(f: FirmaFull) {
  const rollen = new Set(f.kontakt.flatMap(k => k.rollen))
  return {
    kontakte: f.kontakt.length,
    lizenzen: f.lizenz.length,
    module: f.modul.length,
    avvVersion: aktuellerAvv(f.avv)?.version ?? null,
    fehlendeRollen: ROLLEN.filter(r => !rollen.has(r)),
  }
}

// Licences whose notice deadline needs attention (soon or missed)
export function kuendigungHinweise(lizenzen: Lizenz[]) {
  return lizenzen
    .map(l => ({ lizenz: l, info: kuendigungInfo(l) }))
    .filter((x): x is { lizenz: Lizenz; info: KuendigungInfo } => !!x.info && (x.info.state === 'soon' || x.info.state === 'missed'))
}
