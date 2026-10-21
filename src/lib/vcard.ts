// vCard 3.0 export for a single contact (works with macOS/iOS Contacts and Outlook)
import type { Firma, Kontakt } from '../types/database'

// RFC 6350 text escaping: backslash, comma, semicolon, newline
const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n')

// Free-text address: last line "3000 Bern" becomes ZIP + city, the lines above are the street
function adr(adresse: string): string {
  const lines = adresse.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const m = lines[lines.length - 1]?.match(/^(?:CH-)?(\d{4,5})\s+(.+)$/i)
  if (!m) return `;;${esc(lines.join('\n'))};;;;`
  return `;;${esc(lines.slice(0, -1).join('\n'))};${esc(m[2])};;${m[1]};`
}

export function toVcard(k: Kontakt, firma: Pick<Firma, 'name' | 'adresse' | 'telefon_zentrale'>): string {
  // Same rule as the MailerLite export: last name = last word of name
  const parts = k.name.trim().split(/\s+/)
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(k.name.trim())}`,
    `ORG:${esc(firma.name)}`,
    k.funktion && `TITLE:${esc(k.funktion)}`,
    k.email && `EMAIL;TYPE=INTERNET,WORK:${esc(k.email)}`,
    k.telefon && `TEL;TYPE=WORK,VOICE:${esc(k.telefon)}`,
    k.mobile && `TEL;TYPE=CELL:${esc(k.mobile)}`,
    firma.telefon_zentrale && `TEL;TYPE=MAIN:${esc(firma.telefon_zentrale)}`,
    firma.adresse && `ADR;TYPE=WORK:${adr(firma.adresse)}`,
    'END:VCARD',
  ]
  return lines.filter(Boolean).join('\r\n') + '\r\n'
}

export function downloadVcard(k: Kontakt, firma: Pick<Firma, 'name' | 'adresse' | 'telefon_zentrale'>) {
  const blob = new Blob([toVcard(k, firma)], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${k.name.trim().replace(/[^\p{L}\p{N} .-]/gu, '').replace(/\s+/g, '_') || 'kontakt'}.vcf`
  a.click()
  URL.revokeObjectURL(url)
}
