/** Shared billing helpers for invoice status, phone cleanup, and categories */

export const CATEGORIES = [
  { value: "Women's Wear", hsn: 'HSN 6204' },
  { value: "Men's Wear", hsn: 'HSN 6203' },
  { value: 'Kids Wear', hsn: 'HSN 6209' },
  { value: 'Rental', hsn: 'SAC 9983' },
] as const

export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid'

export function statusFromAmounts(totalAmount: number, amountPaid: number): Exclude<InvoiceStatus, 'draft'> {
  const paid = Number(amountPaid) || 0
  const total = Number(totalAmount) || 0
  const pending = total - paid
  if (pending <= 0.009) return 'paid'
  if (paid > 0.009) return 'partial'
  return 'pending'
}

/** Normalize Indian mobile for WhatsApp: digits only, with 91 country code when 10 digits. */
export function whatsappPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`
  return digits
}

export function hsnForCategory(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.hsn ?? 'HSN 6204'
}

export function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}
