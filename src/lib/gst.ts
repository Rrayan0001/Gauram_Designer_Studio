/** Flat GST 12% = CGST 6% + SGST 6% (single source of truth). */

export const GST_RATE = 0.12
export const CGST_RATE = 0.06
export const SGST_RATE = 0.06

export function computeTaxable(subtotal: number, overallDiscount: number): number {
  return Math.max(0, subtotal - Math.max(0, overallDiscount))
}

export function computeCgst(taxable: number): number {
  return Math.round(taxable * CGST_RATE * 100) / 100
}

export function computeSgst(taxable: number): number {
  return Math.round(taxable * SGST_RATE * 100) / 100
}

export function computeGrandTotal(taxable: number, cgst: number, sgst: number): number {
  return Math.round((taxable + cgst + sgst) * 100) / 100
}

export function computeBillTotals(subtotal: number, overallDiscount: number) {
  const taxableAmount = computeTaxable(subtotal, overallDiscount)
  const cgstAmount = computeCgst(taxableAmount)
  const sgstAmount = computeSgst(taxableAmount)
  const totalAmount = computeGrandTotal(taxableAmount, cgstAmount, sgstAmount)
  return { taxableAmount, cgstAmount, sgstAmount, totalAmount }
}
