'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  History,
  PlusCircle,
  FileText,
  Trash2,
  Phone
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string
  address: string | null
}

interface InvoiceItem {
  id: string
  description: string
  category: string
  hsnSacCode: string
  quantity: number
  rate: number
  discount: number
  amount: number
}

interface Payment {
  id: string
  amount: number
  mode: string
  date: string
  note: string | null
}

interface Invoice {
  id: string
  orderId: string | null
  customerId: string
  customer: Customer
  invoiceDate: string
  status: 'draft' | 'pending' | 'partial' | 'paid'
  subtotal: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
  amountPaid: number
  pendingAmount: number
  paymentMode: string
  termsText: string
  items: InvoiceItem[]
  payments: Payment[]
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Business settings
  const [settings, setSettings] = useState<any>(null)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [paymentNote, setPaymentNote] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Invoice not found')
      const data = await res.json()
      setInvoice(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoice()
    
    // Fetch business details for header
    fetch('/api/business')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setSettings(data)
      })
      .catch(err => console.error(err))
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0 || amount > invoice.pendingAmount) {
      alert('Please enter a valid payment amount not exceeding the pending dues.')
      return
    }

    try {
      setSubmittingPayment(true)
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount,
          mode: paymentMode,
          note: paymentNote,
        }),
      })

      if (res.ok) {
        setShowPaymentModal(false)
        fetchInvoice()
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'Failed to record payment'}`)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred. Please try again.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action is permanent.')) return

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/')
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'Failed to delete invoice'}`)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during deletion.')
    }
  }

  const handleWhatsAppShare = () => {
    if (!invoice) return

    const customerName = invoice.customer.name
    // Remove space/special chars from phone, check for prefix
    let phoneNum = invoice.customer.phone.replace(/[^0-9]/g, '')
    if (phoneNum.length === 10) {
      phoneNum = '91' + phoneNum
    }

    const orderIdText = invoice.orderId ? `Order ID: ${invoice.orderId}` : 'Draft Quote'
    const statusText = invoice.status === 'paid' ? 'Fully Paid ✅' : invoice.status === 'partial' ? 'Partially Paid ⏳' : 'Payment Pending ⚠️'

    const text = `Hello ${customerName},

Thank you for choosing Gauram Designer Studio! 🌸

Here is the billing summary of your order:
📄 ${orderIdText}
📅 Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
💰 Total Bill: ₹${invoice.totalAmount.toFixed(2)}
💵 Amount Paid: ₹${invoice.amountPaid.toFixed(2)}
🔴 Outstanding Balance: ₹${invoice.pendingAmount.toFixed(2)}
📌 Status: ${statusText}

Terms: "Advance non-refundable. Rental outfits must be returned in original condition."

Designing Dreams, Creating Elegance. ✨
Gauram Designer Studio
Phone: +91 99004 69746`

    const url = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <span className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading invoice detail...</span>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-gray-200 p-6 rounded-2xl text-center space-y-4">
        <div className="text-rose-500 text-lg font-bold">Error</div>
        <p className="text-xs text-gray-500">{error || 'Invoice not found'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-100 border border-gray-300 text-gray-900 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    )
  }

  const isDraft = invoice.status === 'draft'
  const taxableVal = invoice.cgstAmount / 0.06
  const calculatedDiscount = Math.max(0, invoice.subtotal - taxableVal)
  const hasDiscount = calculatedDiscount > 0.01

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action Header (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 font-serif">
              {invoice.orderId ? `Invoice ${invoice.orderId}` : 'Draft Quote'}
            </h2>
            <p className="text-xs text-gray-500">
              Manage billing payments, prints, and customer sharing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Delete (only if draft) */}
          {isDraft && (
            <button
              onClick={handleDeleteInvoice}
              className="flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-950 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Draft
            </button>
          )}

          {/* Record Payment (if outstanding balance) */}
          {!isDraft && invoice.pendingAmount > 0 && (
            <button
              onClick={() => {
                setPaymentAmount(invoice.pendingAmount.toString())
                setPaymentMode('UPI')
                setPaymentNote('')
                setShowPaymentModal(true)
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-xs rounded-xl transition-all font-semibold"
            >
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              Record Payment
            </button>
          )}

          {/* WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:text-white hover:bg-[#25D366]/20 text-xs rounded-xl transition-all font-semibold"
          >
            <Phone className="w-4 h-4 text-[#25D366]" />
            Share WhatsApp
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-gray-700 text-xs rounded-xl transition-colors font-semibold"
          >
            <Printer className="w-4 h-4 text-white" />
            Print Bill / PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice Page Card */}
      <div className="print-container bg-white border border-gray-200 p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden text-gray-900">
        
        {/* Decorative corner borders (Hidden in Print) */}
        <div className="no-print absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-gray-300 pointer-events-none rounded-tl-3xl" />
        <div className="no-print absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-gray-300 pointer-events-none rounded-br-3xl" />

        {/* Invoice Layout */}
        <div className="space-y-8">
          
          {/* Header Block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-6 print-border">
            {/* Left side: Business Info */}
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Gauram Logo" 
                className="w-16 h-16 rounded-full object-contain border border-gray-300 bg-white p-1"
                onError={(e) => {
                  // Fallback if logo not found
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="space-y-1">
                <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-wider font-serif print-text-dark">
                  {settings?.name || 'Gauram Designer Studio'}
                </h1>
                <p className="text-[10px] text-gray-500 tracking-widest font-serif uppercase font-semibold mt-0.5 print-text-dark">
                  Designing Dreams, Creating Elegance
                </p>
                <div className="text-[11px] text-gray-500 space-y-0.5 print-text-dark max-w-sm font-light">
                  <p>{settings?.address || 'Budigere Road, Bengaluru'}</p>
                  <p className="font-semibold">Phone: {settings?.phone || '+91 99004 69746'}</p>
                </div>
              </div>
            </div>

            {/* Right side: Invoice ID & Meta */}
            <div className="space-y-2 text-left md:text-right w-full md:w-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-900 no-print">
                {invoice.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {invoice.status === 'partial' && <Clock className="w-3.5 h-3.5 text-gray-500" />}
                {invoice.status === 'pending' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                <span className="capitalize">{invoice.status}</span>
              </div>
              
              <div className="text-xs text-gray-500 print-text-dark space-y-1 mt-2">
                <p>
                  <span className="font-semibold text-gray-900 print-text-dark">Invoice ID: </span> 
                  <span className="font-mono font-bold text-gray-900 print-text-dark text-sm">
                    {invoice.orderId || 'Draft (Quote)'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-900 print-text-dark">Date: </span> 
                  <span>
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-900 print-text-dark">GSTIN: </span> 
                  <span className="font-mono text-gray-900 print-text-dark">{settings?.gstin || '29GYCPP4290P1ZG'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Customer Metadata Block */}
          <div className="bg-white/30 border border-gray-200 p-5 rounded-2xl print-border print-text-dark">
            <h3 className="font-serif text-xs font-bold text-gray-900 uppercase tracking-widest font-serif mb-2.5 print-text-dark">
              Billed To
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 print-text-dark">
              <div>
                <p className="font-bold text-gray-900 print-text-dark text-sm">{invoice.customer.name}</p>
                <p className="mt-1 font-semibold">Phone: +91 {invoice.customer.phone}</p>
              </div>
              <div>
                {invoice.customer.address ? (
                  <>
                    <p className="font-semibold text-gray-900 print-text-dark">Address:</p>
                    <p className="mt-0.5 leading-relaxed font-light">{invoice.customer.address}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic print-text-dark font-light">No billing address provided.</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 print-border text-gray-500 print-text-dark font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2 text-center w-10">No.</th>
                  <th className="py-3 px-3">Garment / Description</th>
                  <th className="py-3 px-2 text-center w-12">Qty</th>
                  <th className="py-3 px-3 text-right">Rate</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/40 print-border">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="text-gray-500 print-text-dark font-light">
                    <td className="py-3 px-2 text-center">{index + 1}</td>
                    <td className="py-3 px-3 font-medium text-gray-900 print-text-dark">{item.description}</td>
                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(item.rate)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900 print-text-dark">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Block */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-gray-200 print-border">
            
            {/* Terms & Bank details (Left on md screen, takes 7 cols) */}
            <div className="md:col-span-7 space-y-3 text-[10px] text-gray-500 print-text-dark">
              <h4 className="font-semibold text-gray-900 print-text-dark uppercase tracking-wider text-[11px]">
                Terms & Conditions
              </h4>
              <div className="whitespace-pre-line leading-relaxed font-light font-sans max-w-md">
                {invoice.termsText || settings?.termsAndConds}
              </div>
            </div>

            {/* Subtotal, CGST, SGST, Net Total (Right on md screen, takes 5 cols) */}
            <div className="md:col-span-5 space-y-2 text-xs text-gray-500 print-text-dark">
              <div className="flex justify-between">
                <span>Subtotal (Items Sum)</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              
              {hasDiscount && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(calculatedDiscount)}</span>
                </div>
              )}

              {hasDiscount && (
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Taxable Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal - calculatedDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>CGST (6%)</span>
                <span>{formatCurrency(invoice.cgstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (6%)</span>
                <span>{formatCurrency(invoice.sgstAmount)}</span>
              </div>
              <div className="border-t border-gray-200 print-border my-1.5" />
              
              <div className="flex justify-between font-bold text-sm text-gray-900 print-text-dark">
                <span className="text-gray-900 font-serif print-text-dark">Grand Total</span>
                <span className="text-gray-900 print-text-dark">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between font-medium text-emerald-500">
                <span>Amount Paid</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              
              {invoice.pendingAmount > 0 ? (
                <div className="flex justify-between font-bold text-rose-500 border-t border-dashed border-rose-900/30 pt-1.5">
                  <span className="flex items-center gap-1">Dues Outstanding</span>
                  <span>{formatCurrency(invoice.pendingAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-emerald-500 border-t border-dashed border-emerald-900/30 pt-1.5">
                  <span>Balance Due</span>
                  <span>Nil (Paid)</span>
                </div>
              )}
              
              <div className="text-[10px] text-gray-500 print-text-dark text-right italic font-light pt-1">
                Payment Mode: {invoice.paymentMode}
              </div>
            </div>
          </div>

          {/* Printable Signature Row (Hidden on UI, Visible only in Print) */}
          <div className="print-only pt-16 flex justify-between items-center text-xs">
            <div className="w-48 text-center border-t border-black pt-2 font-light">
              Customer Signature
            </div>
            <div className="w-56 text-center border-t border-black pt-2 flex flex-col gap-1">
              <p className="font-semibold">For Gauram Designer Studio</p>
              <p className="text-[10px] mt-6 opacity-60">Authorized Signatory</p>
            </div>
          </div>

        </div>
      </div>

      {/* Payment History Timeline (No-print) */}
      {!isDraft && invoice.payments.length > 0 && (
        <div className="no-print bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-4 select-none">
          <h3 className="font-serif text-md font-bold text-gray-900 font-serif flex items-center gap-2">
            <History className="w-4 h-4 text-gray-900" />
            Payment Collection History
          </h3>
          
          <div className="relative border-l border-gray-200 ml-3.5 space-y-4 py-2">
            {invoice.payments.map((pmt) => (
              <div key={pmt.id} className="relative pl-6">
                {/* Timeline Dot */}
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                
                <div className="flex justify-between text-xs items-start">
                  <div>
                    <span className="font-bold text-emerald-500">{formatCurrency(pmt.amount)}</span>
                    <span className="text-gray-500 ml-2">via {pmt.mode}</span>
                    {pmt.note && (
                      <p className="text-[11px] text-gray-500 font-light mt-0.5">Note: {pmt.note}</p>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {new Date(pmt.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="no-print fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            <div className="bg-gray-100 p-6 border-b border-gray-200 flex justify-between items-center">
              <h4 className="font-serif text-lg font-bold text-gray-900 font-serif">
                Record Payment
              </h4>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="text-xs text-gray-500 flex justify-between p-3 rounded-xl bg-gray-100 border border-gray-200">
                <div>
                  <span className="font-semibold text-gray-900">Order ID: </span>
                  <span className="font-mono">{invoice.orderId}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Dues: </span>
                  <span className="font-bold text-rose-500">{formatCurrency(invoice.pendingAmount)}</span>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Amount Received (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={invoice.pendingAmount}
                  min="0.01"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Mode of Payment</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                </select>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Note / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref ID, Cash given to staff"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-gray-200 hover:border-gray-200 text-gray-500 hover:text-gray-900 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {submittingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
