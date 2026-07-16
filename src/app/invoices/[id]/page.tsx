'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Printer, Phone, Check } from 'lucide-react'

interface InvoiceItem { id: string; description: string; category: string; amount: number; rate: number; quantity: number }
interface Invoice {
  id: string; orderId: string | null; invoiceDate: string
  subtotal: number; cgstAmount: number; sgstAmount: number; totalAmount: number; paymentMode: string; items: InvoiceItem[]
  customer: { name: string; phone: string; address: string | null }
  termsText: string | null
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => { if (!r.ok) throw new Error('Invoice not found'); return r.json() })
      .then((data) => setInvoice(data))
      .catch((e) => setError(e.message))

    fetch('/api/business')
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setSettings(data) })
      .finally(() => setLoading(false))
  }, [id])

  const handleDeleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice permanently?')) return
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/')
      else alert('Failed to delete invoice.')
    } catch {
      alert('Error occurred.')
    }
  }

  const handlePrint = () => window.print()

  const handleWhatsAppShare = () => {
    if (!invoice) return
    const text = `Hi ${invoice.customer.name},\nThank you for choosing Gauram Designer Studio! 🌸\n\nYour invoice *#${invoice.orderId || 'Draft'}* has been generated for a total amount of *₹${invoice.totalAmount.toLocaleString('en-IN')}*.\n\nThank you!`
    const url = `https://wa.me/91${invoice.customer.phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-ink-300 text-sm">Loading receipt details…</div>
  if (error || !invoice) return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-ink-100 p-6 rounded-2xl text-center space-y-4">
      <p className="text-red-500 font-semibold">{error || 'Invoice not found'}</p>
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  )

  // Calculations
  const calculatedDiscount = Math.max(0, invoice.subtotal - (invoice.cgstAmount / 0.06))
  const hasDiscount = calculatedDiscount > 0.01

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      
      {/* Header Actions (No print) */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-ink-100 text-ink-500 hover:text-ink-900 hover:border-ink-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900">
              {invoice.orderId ? `Invoice ${invoice.orderId}` : 'Boutique Bill'}
            </h2>
            <p className="text-xs text-ink-500 font-medium">
              Manage billing payments, prints, and customer sharing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Delete Invoice */}
          <button
            onClick={handleDeleteInvoice}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs rounded-xl transition-all font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:text-white hover:bg-[#25D366] text-xs rounded-xl transition-all font-semibold"
          >
            <Phone className="w-4 h-4 text-[#25D366] hover:text-white" />
            WhatsApp
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-ink-900 text-white hover:bg-ink-700 text-xs rounded-xl transition-colors font-semibold"
          >
            <Printer className="w-4 h-4 text-white" />
            Print Receipt / PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice Page Card */}
      <div className="print-container bg-white border border-gold-600/30 p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden text-ink-900">
        
        {/* Monogram Watermark Background (Faint centered logo) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
          <img src="/logo.png" alt="Monogram Watermark" className="w-96 h-96 object-contain" />
        </div>

        {/* Decorative corner borders (Hidden in Print) */}
        <div className="no-print absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-gold-600/20 pointer-events-none rounded-tl-3xl" />
        <div className="no-print absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-gold-600/20 pointer-events-none rounded-br-3xl" />

        {/* Invoice Layout */}
        <div className="space-y-8 relative z-10">
          
          {/* Header Block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-ink-100 pb-6 gap-6 print-border">
            {/* Left side: Business Info */}
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Gauram Logo" 
                className="w-16 h-16 rounded-full object-contain border border-ink-100 bg-white p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="space-y-1">
                <h1 className="font-serif text-2xl font-bold text-ink-900 tracking-wider font-serif print-text-dark">
                  {settings?.name || 'Gauram Designer Studio'}
                </h1>
                <p className="text-[10px] text-ink-500 tracking-widest font-serif uppercase font-semibold mt-0.5 print-text-dark">
                  Designing Dreams, Creating Elegance
                </p>
                <div className="text-[11px] text-ink-500 space-y-0.5 print-text-dark max-w-sm font-light">
                  <p>{settings?.address || 'Budigere Road, Bengaluru'}</p>
                  <p className="font-semibold">Phone: {settings?.phone || '+91 99004 69746'}</p>
                </div>
              </div>
            </div>

            {/* Right side: Invoice ID & Meta */}
            <div className="space-y-2 text-left md:text-right w-full md:w-auto">
              <div className="text-xs text-ink-500 print-text-dark space-y-1 mt-2">
                <p>
                  <span className="font-semibold text-ink-900 print-text-dark">Invoice ID: </span> 
                  <span className="font-mono font-bold text-ink-900 print-text-dark text-sm">
                    {invoice.orderId || 'Draft (Quote)'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-ink-900 print-text-dark">Date: </span> 
                  <span>
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-ink-900 print-text-dark">GSTIN: </span> 
                  <span className="font-mono text-ink-900 print-text-dark">{settings?.gstin || '29GYCPP4290P1ZG'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Customer Metadata Block */}
          <div className="bg-paper/30 border border-ink-100 p-5 rounded-2xl print-border print-text-dark">
            <h3 className="font-serif text-[10px] font-bold text-ink-500 uppercase tracking-widest font-serif mb-2.5 print-text-dark">
              Billed To
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-500 print-text-dark">
              <div>
                <p className="font-bold text-ink-900 print-text-dark text-sm">{invoice.customer.name}</p>
                <p className="mt-1 font-semibold">Phone: +91 {invoice.customer.phone}</p>
              </div>
              <div>
                {invoice.customer.address ? (
                  <>
                    <p className="font-semibold text-ink-900 print-text-dark">Address:</p>
                    <p className="mt-0.5 leading-relaxed font-light">{invoice.customer.address}</p>
                  </>
                ) : (
                  <p className="text-ink-300 italic print-text-dark font-light">No billing address provided.</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-100 print-border text-ink-500 print-text-dark font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2 text-center w-10">No.</th>
                  <th className="py-3 px-3">Garment / Description</th>
                  <th className="py-3 px-2 text-center w-12">Qty</th>
                  <th className="py-3 px-3 text-right">Rate</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100/50 print-border">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="text-ink-700 print-text-dark font-light">
                    <td className="py-3 px-2 text-center font-mono">{index + 1}</td>
                    <td className="py-3 px-3 font-semibold text-ink-900 print-text-dark flex items-center gap-1.5">
                      {item.description}
                      <span className="text-[9px] bg-gold-100/50 border border-gold-600/10 text-gold-600 px-1.5 py-0.5 rounded font-mono font-bold tracking-wide uppercase print-only paid-stamp-print">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{formatCurrency(item.rate)}</td>
                    <td className="py-3 px-3 text-right font-bold text-ink-900 print-text-dark font-mono tabular-nums">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Block */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-ink-100 print-border relative">
            
            {/* Terms & Bank details (Left on md screen, takes 7 cols) */}
            <div className="md:col-span-7 space-y-3 text-[10px] text-ink-500 print-text-dark">
              <h4 className="font-semibold text-ink-900 print-text-dark uppercase tracking-wider text-[10px]">
                Terms &amp; Conditions
              </h4>
              <div className="whitespace-pre-line leading-relaxed font-light font-sans max-w-sm">
                {invoice.termsText || settings?.termsAndConds}
              </div>
            </div>

            {/* Subtotal, CGST, SGST, Net Total (Right on md screen, takes 5 cols) */}
            <div className="md:col-span-5 space-y-2 text-xs text-ink-700 print-text-dark">
              <div className="flex justify-between">
                <span>Subtotal (Items Sum)</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.subtotal)}</span>
              </div>
              
              {hasDiscount && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(calculatedDiscount)}</span>
                </div>
              )}

              {hasDiscount && (
                <div className="flex justify-between font-semibold text-ink-900">
                  <span>Taxable Subtotal</span>
                  <span className="font-mono tabular-nums">{formatCurrency(invoice.subtotal - calculatedDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>CGST (6%)</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.cgstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (6%)</span>
                <span className="font-mono tabular-nums">{formatCurrency(invoice.sgstAmount)}</span>
              </div>
              <div className="border-t border-ink-100 print-border my-1.5" />
              
              <div className="flex justify-between font-bold text-sm text-ink-900 print-text-dark">
                <span className="text-ink-900 font-serif print-text-dark">Grand Total</span>
                <span className="text-ink-900 print-text-dark font-serif border-b-2 border-gold-600 pb-0.5 font-mono tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
              </div>

              {/* Rotated PAID IN FULL rubber stamp SVG */}
              <div className="absolute right-0 bottom-12 rotate-[-12deg] pointer-events-none select-none opacity-80 border-4 border-double border-gold-600 text-gold-600 rounded-xl px-4 py-2 flex flex-col items-center justify-center font-bold tracking-widest uppercase paid-stamp-print">
                <span className="text-sm tracking-widest flex items-center gap-1 font-serif">PAID IN FULL <Check className="w-4 h-4 text-gold-600 stroke-[3px]" /></span>
                <span className="text-[8px] font-mono mt-0.5 tracking-wider">Settled &bull; {invoice.paymentMode}</span>
              </div>
            </div>
          </div>

          {/* Printable Signature Row (Hidden on UI, Visible only in Print) */}
          <div className="print-only pt-16 flex justify-between items-center text-[10px] text-ink-700">
            <div className="w-44 text-center border-t border-black pt-2 font-light">
              Customer Signature
            </div>
            <div className="w-52 text-center border-t border-black pt-2 flex flex-col gap-1">
              <p className="font-bold text-ink-950">For Gauram Designer Studio</p>
              <p className="text-[9px] mt-6 opacity-60">Authorized Signatory</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
