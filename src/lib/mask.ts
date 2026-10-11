// Input masks for phone and e-mail fields

const group = (digits: string, sizes: number[]) => {
  const out: string[] = []
  let i = 0
  for (const n of sizes) {
    if (i >= digits.length) break
    out.push(digits.slice(i, i + n))
    i += n
  }
  return out.join(' ')
}

// Swiss numbers: "079 356 11 66" and "+41 79 356 11 66". "0041…" becomes "+41…".
// Other international numbers keep "+" and digits without grouping.
export function formatTelefon(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  let plus = raw.trimStart().startsWith('+')
  if (!plus && digits.startsWith('00')) { plus = true; digits = digits.slice(2) }

  if (plus) {
    if (!digits.startsWith('41')) return '+' + digits
    // Drop the trunk zero people type after the country code: +41 (0)79 …
    const national = digits.slice(2).replace(/^0/, '').slice(0, 9)
    return ('+41 ' + group(national, [2, 3, 2, 2])).trimEnd()
  }
  if (digits.startsWith('0')) return group(digits.slice(0, 10), [3, 3, 2, 2])
  return digits
}

export const isTelefonChar = (c: string) => /[\d+]/.test(c)

// No whitespace, lowercase
export function formatEmail(raw: string): string {
  return raw.replace(/\s/g, '').toLowerCase()
}

export const isEmailChar = (c: string) => !/\s/.test(c)

export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[^\\s@]+'

// "kunde.strahlhorn.ch" → "https://kunde.strahlhorn.ch". Anything without http(s) gets https://,
// so a stored value can never become a javascript: or relative link.
export function toUrl(raw: string): string {
  const v = raw.trim()
  return /^https?:\/\//i.test(v) ? v : 'https://' + v
}
