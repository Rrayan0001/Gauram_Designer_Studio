'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, User, FileText, Sparkles, Check, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Kit'

interface InvoiceItem { id: string; description: string; category: string; amount: number }
interface Invoice {
  id: string; orderId: string | null; invoiceDate: string
  totalAmount: number; amountPaid: number; pendingAmount: number; paymentMode: string; items: InvoiceItem[]
}
interface CustomerDetail {
  id: string; name: string; phone: string; address: string | null; notes: string | null
  totalBilled: number; totalPaid: number; totalPending: number; invoices: Invoice[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Stylist notes editing state
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => { if (!r.ok) throw new Error('Customer not found'); return r.json() })
      .then(data => {
        setCustomer(data)
        setNotes(data.notes || '')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        alert('Failed to save notes.')
      }
    } catch {
      alert('Error saving notes.')
    } finally {
      setSavingNotes(false)
    }
  }

  // Avatar initials helper
  const getInitials = (name: string) => {
    if (!name) return 'C'
    return name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-ink-300 text-sm">Loading profile details…</div>
  if (error || !customer) return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-ink-100 p-6 rounded-2xl text-center space-y-4">
      <p className="text-red-500 font-semibold">{error || 'Customer not found'}</p>
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900 font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 select-none">
        <Link href="/customers" className="p-2.5 rounded-xl border border-ink-100 text-ink-500 hover:bg-ink-100/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-ink-900">Client Ledger Profile</h1>
          <p className="text-xs text-ink-500 mt-0.5 font-medium">Boutique order specifications &amp; measurements</p>
        </div>
      </div>

      {/* Stats and Profile details: Stack total billed card on top on Mobile */}
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Total Billed LTV Card (Top on Mobile, right on desktop) */}
        <div className="md:order-2 md:w-1/3 bg-white border border-ink-100 rounded-2xl p-5 space-y-1 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] select-none">
          <p className="text-[10px] text-ink-500 uppercase tracking-wider font-bold">Total Sales (Settled)</p>
          <p className="text-xl md:text-2xl font-bold text-ink-900 font-mono tracking-tight">{fmt(customer.totalBilled)}</p>
          <p className="text-[10px] text-ink-300 font-medium">{customer.invoices.length} receipt{customer.invoices.length !== 1 ? 's' : ''} issued</p>
        </div>

        {/* Profile Card (Bottom on Mobile, left on desktop) */}
        <div className="md:order-1 flex-1 bg-white border border-ink-100 rounded-2xl p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
          <div className="w-14 h-14 rounded-full bg-ink-100 border border-ink-100 flex items-center justify-center text-ink-700 font-serif text-lg font-bold flex-shrink-0 select-none">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 text-base truncate">{customer.name}</h3>
            <p className="text-xs text-ink-500 font-mono">+91 {customer.phone}</p>
            <p className="text-[11px] text-ink-300 mt-1.5 truncate font-medium">{customer.address || 'No residence address recorded'}</p>
          </div>
        </div>

      </div>

      {/* Two-Column Grid: Left (Invoice history), Right (Stylist custom notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Billing & Order History */}
        <div className="lg:col-span-2 bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
          <div className="px-5 py-4 border-b border-ink-100 bg-paper/20">
            <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider">Billing &amp; Order History</h3>
          </div>
          
          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper/50 text-left">
                  <th className="px-4 py-3.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center">Payment Mode</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-right">Grand Total</th>
                  <th className="px-4 py-3.5 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {customer.invoices.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-ink-300 font-semibold">No orders yet.</td></tr>
                ) : customer.invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-paper/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-ink-900">
                      {inv.orderId || <span className="text-ink-300 font-sans font-normal">Draft</span>}
                    </td>
                    <td className="px-4 py-3.5 text-ink-700 font-medium">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="bg-ink-100 border border-ink-100/30 text-ink-700 font-semibold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                        {inv.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-ink-900 font-mono tabular-nums">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Link href={`/invoices/${inv.id}`}
                        className="inline-flex p-1.5 rounded-lg border border-ink-100 text-ink-400 hover:text-ink-900 hover:bg-ink-100/40 transition-colors">
                        <Eye className="w-4 h-4 text-ink-700" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Orders List cards (Hidden on Desktop) */}
          <div className="md:hidden divide-y divide-ink-100 scroll-y">
            {customer.invoices.length === 0 ? (
              <div className="text-center py-10 text-ink-300 text-xs font-semibold">No orders yet.</div>
            ) : customer.invoices.map(inv => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-4 bg-white active:bg-gold-100/10 active:scale-[0.99] transition-all select-none group"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-ink-900">
                      {inv.orderId || 'Draft'}
                    </span>
                    <span className="text-[8px] bg-ink-100 border border-ink-100/35 text-ink-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {inv.paymentMode}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-500 font-mono font-medium">
                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="block text-[8px] text-ink-300 uppercase tracking-wider font-bold">Bill total</span>
                    <span className="font-bold text-ink-950 font-mono text-xs tabular-nums">{fmt(inv.totalAmount)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-800 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* Stylist Notes Section */}
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] h-fit flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <FileText className="w-4.5 h-4.5 text-ink-700" />
            <div>
              <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider">Stylist Custom Notes</h3>
              <p className="text-[9px] text-ink-500 font-medium">Measurements, bridal fitting, custom requests</p>
            </div>
          </div>

          <textarea
            rows={8}
            placeholder="Write customer measurements, stitching sizes (e.g. bust, waist, length), or bespoke lehenga request parameters here..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full text-base md:text-xs font-medium border border-ink-100 rounded-xl p-3 bg-paper/20 focus:outline-none focus:border-ink-500 focus:bg-white transition-all resize-none text-ink-900 input-mobile-lg"
          />

          <button
            type="button"
            disabled={savingNotes}
            onClick={handleSaveNotes}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs select-none active:scale-[0.98] min-h-[44px] ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-ink-900 hover:bg-ink-700 text-white'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" /> Notes Saved Successfully
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" /> {savingNotes ? 'Saving...' : 'Save Stylist Notes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
