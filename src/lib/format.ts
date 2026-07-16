/** Shared currency / date / phone formatters (en-IN). */

export function fmtINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

export function fmtINRExact(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0)
}

export function fmtDateIN(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', opts ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtPhone(phone: string): string {
  const cleaned = phone.replace(/^\+?91\s?/, '').trim()
  return `+91 ${cleaned}`
}

export function getInitials(name: string): string {
  if (!name?.trim()) return 'C'
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
