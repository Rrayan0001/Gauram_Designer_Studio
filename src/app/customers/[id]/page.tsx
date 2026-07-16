'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, User } from 'lucide-react'

interface InvoiceItem { id: string; description: string; category: string; amount: number }
interface Invoice {
  id: string; orderId: string | null; invoiceDate: string
  totalAmount: number; amountPaid: number; pendingAmount: number; paymentMode: string; items: InvoiceItem[]
}
interface CustomerDetail {
  id: string; name: string; phone: string; address: string | null
  totalBilled: number; totalPaid: number; totalPending: number; invoices: Invoice[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => { if (!r.ok) throw new Error('Customer not found'); return r.json() })
      .then(data => setCustomer(data))
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
          <p className="text-xs text-gray-500 mt-0.5">Order history for {customer.name}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">{customer.name}</h3>
            <p className="text-sm text-gray-500">+91 {customer.phone}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{customer.address || 'No address recorded'}</p>
          </div>
        </div>
        
        {/* Total Billed card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Sales (Settled)</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(customer.totalBilled)}</p>
          <p className="text-xs text-gray-400">{customer.invoices.length} invoice{customer.invoices.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Billing & Order History - Takes full width since payments timeline is removed */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Billing &amp; Order History</h3>
        </div>
        
        {/* Desktop & Mobile responsive table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Payment Mode</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Grand Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {customer.invoices.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No orders yet.</td></tr>
              ) : customer.invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">
                    {inv.orderId || <span className="text-gray-400 font-sans font-normal">Draft</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                    <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                      {inv.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Receipt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
