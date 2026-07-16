'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Printer, Phone, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog, Button, Skeleton, Badge } from '@/components/ui/Kit'
import { fmtINRExact, fmtDateIN, fmtPhone } from '@/lib/format'

interface InvoiceItem {
  id: string
  description: string
  category: string
  hsnSacCode?: string
  amount: number
  rate: number
  quantity: number
}
interface Invoice {
  id: string
  orderId: string | null
  invoiceDate: string
  subtotal: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
  paymentMode: string
  items: InvoiceItem[]
  customer: { name: string; phone: string; address: string | null }
  termsText: string | null
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const toast = useToast()
  const { id } = use(params)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<{
    name?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    gstin?: string
    termsAndConds?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => {
        if (!r.ok) throw new Error('Invoice not found')
        return r.json()
      }),
      fetch('/api/business').then((r) => r.json()),
    ])
      .then(([inv, biz]) => {
        setInvoice(inv)
        if (biz && !biz.error) setSettings(biz)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDeleteInvoice = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDeleteConfirm(false)
        toast.success('Invoice deleted')
        router.push('/')
      } else {
        toast.error('Could not delete invoice')
      }
    } catch {
      toast.error('Could not delete invoice')
    } finally {
      setDeleting(false)
    }
  }

  const handlePrint = () => window.print()

  const handleWhatsAppShare = () => {
    if (!invoice) return
    const itemLines = invoice.items
      .map((it) => `• ${it.description} × ${it.quantity} — ₹${it.amount.toLocaleString('en-IN')}`)
      .join('\n')
    const text = [
      `Hi ${invoice.customer.name},`,
      `Thank you for choosing Gauram Designer Studio 🌸`,
      ``,
      `Invoice *#${invoice.orderId || 'Draft'}*`,
      `Date: ${fmtDateIN(invoice.invoiceDate)}`,
      ``,
      `Items:`,
      itemLines,
      ``,
      `Subtotal: ₹${invoice.subtotal.toLocaleString('en-IN')}`,
      `CGST: ₹${invoice.cgstAmount.toLocaleString('en-IN')} · SGST: ₹${invoice.sgstAmount.toLocaleString('en-IN')}`,
      `*Grand Total: ₹${invoice.totalAmount.toLocaleString('en-IN')}*`,
      `Paid via ${invoice.paymentMode}`,
      ``,
      settings?.address ? settings.address.split(',')[0] : '',
      settings?.gstin ? `GSTIN: ${settings.gstin}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const url = `https://wa.me/91${invoice.customer.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-in fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-ink-100 p-6 rounded-2xl text-center space-y-4">
        <p className="text-rose-600 font-semibold">{error || 'Invoice not found'}</p>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    )
  }

  const calculatedDiscount = Math.max(0, invoice.subtotal - invoice.cgstAmount / 0.06)
  const hasDiscount = calculatedDiscount > 0.01
  const studioName = settings?.name || 'Gauram Designer Studio'

  return (
    <div className="space-y-6 max-w-4xl pb-28 md:pb-6 animate-in fade-in duration-300 relative">
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteInvoice}
        title="Delete invoice?"
        description={
          <>
            Permanently delete invoice{' '}
            <span className="font-mono font-bold text-ink-900">{invoice.orderId}</span>? This cannot be undone.
          </>
        }
        confirmLabel="Delete permanently"
        danger
        loading={deleting}
      />

      {/* Desktop actions */}
      <div className="no-print hidden md:flex justify-between items-center pb-4 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-ink-100 text-ink-500 hover:text-ink-900 hover:border-ink-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-serif text-xl font-bold text-ink-900">
              {invoice.orderId ? `Invoice ${invoice.orderId}` : 'Boutique Bill'}
            </h2>
            <p className="text-sm text-ink-500 font-medium">Print, share, or manage this receipt</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:text-white hover:bg-[#25D366] text-xs rounded-xl transition-all font-semibold min-h-[44px]"
          >
            <Phone className="w-4 h-4" /> WhatsApp
          </button>
          <Button type="button" variant="ink" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="no-print md:hidden flex items-center gap-3 pb-2 select-none">
        <Link
          href="/"
          className="p-2 rounded-xl border border-ink-100 text-ink-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-serif text-lg font-bold text-ink-900">
          {invoice.orderId ? `Bill ${invoice.orderId}` : 'Boutique Bill'}
        </h2>
      </div>

      {/* Printable card */}
      <div className="print-container bg-white border border-gold-600/20 p-5 sm:p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden text-ink-900 ring-1 ring-gold-100">
        {/* Gold hairline frame */}
        <div className="pointer-events-none absolute inset-3 sm:inset-4 border border-gold-600/25 rounded-2xl print-gold" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="w-72 h-72 sm:w-96 sm:h-96 max-w-[16rem] max-h-[16rem] sm:max-w-none object-contain aspect-square"
          />
        </div>

        <div className="space-y-6 sm:space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-ink-100 pb-6 gap-4 print-border">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Gauram Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-contain border border-gold-600/20 bg-white p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="space-y-0.5">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 tracking-wide print-text-dark">
                  {studioName}
                </h1>
                <p className="text-[11px] sm:text-xs text-gold-600 tracking-widest font-serif uppercase font-semibold print-gold">
                  Designing Dreams, Creating Elegance
                </p>
                <div className="text-[11px] sm:text-xs text-ink-500 space-y-0.5 print-text-dark max-w-xs font-light">
                  <p>{settings?.address || 'Budigere Road, Bengaluru'}</p>
                  <p className="font-semibold">Phone: {settings?.phone || '+91 99004 69746'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-left md:text-right w-full md:w-auto">
              <div className="text-[11px] sm:text-xs text-ink-500 print-text-dark space-y-1">
                <p>
                  <span className="font-semibold text-ink-900 print-text-dark">Invoice ID: </span>
                  <span className="font-mono font-bold text-ink-900 print-text-dark text-sm break-all">
                    {invoice.orderId || 'Draft'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-ink-900 print-text-dark">Date: </span>
                  <span>{fmtDateIN(invoice.invoiceDate)}</span>
                </p>
                <p>
                  <span className="font-semibold text-ink-900 print-text-dark">GSTIN: </span>
                  <span className="font-mono text-ink-900 print-text-dark text-[11px] sm:text-xs break-all">
                    {settings?.gstin || '29GYCPP4290P1ZG'}
                  </span>
                </p>
                <p>
                  <Badge className="print-text-dark">{invoice.paymentMode}</Badge>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-paper/30 border border-ink-100 p-4 sm:p-5 rounded-2xl print-border print-text-dark">
            <h3 className="font-serif text-[11px] sm:text-xs font-bold text-ink-500 tracking-wide mb-2.5 print-text-dark">
              Billed to
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm text-ink-500 print-text-dark">
              <div>
                <p className="font-bold text-ink-900 print-text-dark font-serif text-base">{invoice.customer.name}</p>
                <p className="mt-1 font-semibold">{fmtPhone(invoice.customer.phone)}</p>
              </div>
              <div>
                {invoice.customer.address ? (
                  <>
                    <p className="font-semibold text-ink-900 print-text-dark">Address</p>
                    <p className="mt-0.5 leading-relaxed font-light">{invoice.customer.address}</p>
                  </>
                ) : (
                  <p className="text-ink-400 italic print-text-dark font-light">No billing address provided.</p>
                )}
              </div>
            </div>
          </div>

          {/* Line items — always printable table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse print-table">
              <thead>
                <tr className="border-b-2 border-gold-600/40 print-border text-ink-500 print-text-dark font-semibold tracking-wide">
                  <th className="py-3 px-2 text-center w-10 text-[11px]">No.</th>
                  <th className="py-3 px-3 text-[11px]">Garment / Description</th>
                  <th className="py-3 px-2 text-center w-12 text-[11px]">Qty</th>
                  <th className="py-3 px-3 text-right text-[11px]">Rate</th>
                  <th className="py-3 px-3 text-right text-[11px]">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100/50 print-border">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="text-ink-700 print-text-dark">
                    <td className="py-3 px-2 text-center font-mono text-xs">{index + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-ink-900 print-text-dark block">{item.description}</span>
                      <span className="text-[11px] text-ink-400 font-mono">
                        {item.hsnSacCode || item.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{fmtINRExact(item.rate)}</td>
                    <td className="py-3 px-3 text-right font-bold text-ink-900 print-text-dark font-mono tabular-nums">
                      {fmtINRExact(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-ink-100 print-border relative">
            <div className="md:col-span-7 space-y-2 text-[11px] sm:text-xs text-ink-500 print-text-dark max-w-prose">
              <h4 className="font-semibold text-ink-900 print-text-dark tracking-wide text-[11px]">
                Terms & conditions
              </h4>
              <div className="whitespace-pre-line leading-relaxed font-light">
                {invoice.termsText || settings?.termsAndConds}
              </div>
            </div>

            <div className="md:col-span-5 space-y-2 text-sm text-ink-700 print-text-dark">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{fmtINRExact(invoice.subtotal)}</span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-{fmtINRExact(calculatedDiscount)}</span>
                </div>
              )}
              {hasDiscount && (
                <div className="flex justify-between font-semibold text-ink-900">
                  <span>Taxable</span>
                  <span className="font-mono tabular-nums">
                    {fmtINRExact(invoice.subtotal - calculatedDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (6%)</span>
                <span className="font-mono tabular-nums">{fmtINRExact(invoice.cgstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (6%)</span>
                <span className="font-mono tabular-nums">{fmtINRExact(invoice.sgstAmount)}</span>
              </div>
              <div className="border-t border-ink-100 print-border my-1.5" />
              <div className="flex justify-between items-end font-bold text-ink-900 print-text-dark">
                <span className="font-serif text-base">Grand Total</span>
                <span className="font-mono text-lg tabular-nums border-b-2 border-gold-600 pb-0.5 print-gold">
                  {fmtINRExact(invoice.totalAmount)}
                </span>
              </div>

              <div className="mt-4 md:mt-0 flex justify-center md:absolute md:right-0 md:bottom-12 md:rotate-[-12deg] pointer-events-none select-none opacity-90">
                <div className="border-4 border-double border-gold-600 text-gold-600 rounded-xl px-4 py-2 flex flex-col items-center justify-center font-bold tracking-widest uppercase paid-stamp-print print-gold">
                  <span className="text-xs tracking-widest flex items-center gap-1 font-serif">
                    PAID IN FULL <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </span>
                  <span className="text-[10px] font-mono mt-0.5 tracking-wider normal-case">
                    Settled · {invoice.paymentMode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="print-only pt-16 flex justify-between items-center text-[11px] text-ink-700">
            <div className="w-44 text-center border-t border-black pt-2 font-light">Customer Signature</div>
            <div className="w-52 text-center border-t border-black pt-2 flex flex-col gap-1">
              <p className="font-bold text-ink-900">For {studioName}</p>
              <p className="text-[10px] mt-6 opacity-60">Authorized Signatory</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gold-600/30 text-center print-gold">
            <p className="text-[11px] text-ink-500 print-text-dark">
              Thank you for choosing {studioName}
              {settings?.website ? ` · ${settings.website}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile bottom actions — above tab bar */}
      <div className="no-print md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-white border-t border-ink-100 p-3 z-30 flex items-center justify-between gap-2.5 shadow-[0_-8px_30px_rgba(26,24,20,0.08)]">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-center p-2.5 border border-rose-200 text-rose-600 rounded-xl min-w-[44px] min-h-[44px]"
          aria-label="Delete receipt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="flex-1 flex items-center justify-center gap-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] py-3 rounded-xl text-xs font-bold min-h-[44px]"
        >
          <Phone className="w-4 h-4" /> Share
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-1 bg-ink-900 text-white py-3 rounded-xl text-xs font-bold min-h-[44px]"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
    </div>
  )
}
