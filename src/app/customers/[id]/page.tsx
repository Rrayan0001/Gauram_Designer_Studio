'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, History, AlertTriangle, Eye, User, CheckCircle2, Clock, FileText } from 'lucide-react'

interface InvoiceItem { id: string; description: string; category: string; amount: number }
interface Payment {
  id: string; amount: number; mode: string; date: string; note: string | null
  invoice: { orderId: string | null }
}
interface Invoice {
  id: string; orderId: string | null; invoiceDate: string
  status: 'draft' | 'pending' | 'partial' | 'paid'
  totalAmount: number; amountPaid: number; pendingAmount: number; paymentMode: string; items: InvoiceItem[]
}
interface CustomerDetail {
  id: string; name: string; phone: string; address: string | null
  totalBilled: number; totalPaid: number; totalPending: number; invoices: Invoice[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const statusBadge = (status: Invoice['status']) => {
  const map = {
    paid:    { label: 'Paid',    cls: 'bg-green-50 text-green-700 border-green-200' },
    partial: { label: 'Partial', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    pending: { label: 'Pending', cls: 'bg-red-50 text-red-700 border-red-200' },
    draft:   { label: 'Draft',   cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  }
  const s = map[status]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${s.cls}`}>{s.label}</span>
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => { if (!r.ok) throw new Error('Customer not found'); return r.json() })
      .then(data => {
        setCustomer(data)
        const all: Payment[] = []
        data.invoices.forEach((inv: any) => {
          inv.payments?.forEach((p: any) => all.push({ ...p, invoice: { orderId: inv.orderId } }))
        })
        all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setPayments(all)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-sm">Loading…</div>
  if (error || !customer) return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-gray-200 p-6 rounded-2xl text-center space-y-4">
      <p className="text-red-500 font-semibold">{error || 'Customer not found'}</p>
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/customers" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Client Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">Order history and account balance for {customer.name}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Profile card */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">{customer.name}</h3>
            <p className="text-sm text-gray-500">+91 {customer.phone}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{customer.address || 'No address recorded'}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Billed</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(customer.totalBilled)}</p>
          <p className="text-xs text-gray-400">{customer.invoices.length} invoice{customer.invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`bg-white border rounded-xl p-4 space-y-1 ${customer.totalPending > 0 ? 'border-red-200' : 'border-gray-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Outstanding</p>
          <p className={`text-2xl font-bold ${customer.totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(customer.totalPending)}</p>
          <p className="text-xs text-gray-400">{customer.totalPending > 0 ? 'Requires collection' : 'Fully settled'}</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Billing & Order History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider text-right">Paid</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider text-right">Due</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customer.invoices.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No orders yet.</td></tr>
                ) : customer.invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 text-[11px]">
                      {inv.orderId || <span className="text-gray-400 font-sans font-normal">Draft</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{fmt(inv.amountPaid)}</td>
                    <td className="px-4 py-3 text-right">
                      {inv.pendingAmount > 0
                        ? <span className="text-red-600 font-semibold">{fmt(inv.pendingAmount)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(inv.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/invoices/${inv.id}`}
                        className="inline-flex p-1 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
          </div>
          {payments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 italic">No collections recorded yet.</p>
          ) : (
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-4 py-1">
              {payments.map(pmt => (
                <div key={pmt.id} className="relative pl-5">
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-green-600">{fmt(pmt.amount)}</span>
                      <span className="text-[10px] text-gray-400">{pmt.mode}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>#{pmt.invoice.orderId || 'Draft'}</span>
                      <span>{new Date(pmt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    {pmt.note && (
                      <p className="text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1 border border-gray-100">{pmt.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
