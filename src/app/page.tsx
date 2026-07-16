'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Receipt,
  Eye,
  PlusCircle,
  Tag,
  Search,
  RotateCcw
} from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  orderId: string | null
  invoiceDate: string
  status: string
  subtotal: number
  cgstAmount: number
  sgstAmount: number
  totalAmount: number
  amountPaid: number
  pendingAmount: number
  paymentMode: string
  customer: { name: string; phone: string }
  items: { category: string; amount: number }[]
}

const fmt = (n: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n)
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchInvoices = async () => {
    try {
      const q = new URLSearchParams()
      if (search) q.append('search', search)
      if (categoryFilter) q.append('category', categoryFilter)
      if (startDate) q.append('startDate', startDate)
      if (endDate) q.append('endDate', endDate)

      const res = await fetch(`/api/invoices?${q.toString()}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setInvoices(data)
      }
    } catch (e) {
      console.error('Failed to fetch invoices', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [search, categoryFilter, startDate, endDate])

  // Aggregate metrics
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalBillsCount = invoices.length

  // Category sales breakdown
  const catSales: Record<string, number> = {}
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      const cat = item.category || "Women's Wear"
      catSales[cat] = (catSales[cat] || 0) + item.amount
    })
  })
  const catTotal = Object.values(catSales).reduce((s, a) => s + a, 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage designer boutique orders and billing history</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Bill
        </Link>
      </div>

      {/* Simplified Stats row (No dues, no drafts, as everything is settled on creation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Total Revenue (Settled)', value: fmt(totalSales), sub: 'Paid in full on checkout', icon: <TrendingUp className="w-5 h-5 text-gray-400" />, vCls: 'text-gray-900' },
          { label: 'Total Invoices Issued', value: String(totalBillsCount), sub: 'Printed boutique receipts', icon: <Receipt className="w-5 h-5 text-gray-400" />, vCls: 'text-gray-900' },
        ].map(({ label, value, sub, icon, vCls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${vCls}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoices List Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search order, customer, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-3 py-2 text-sm rounded-lg border border-gray-200 w-full focus:outline-none focus:border-gray-400 bg-white"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full sm:w-auto text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:border-gray-400 bg-white" />
                <span className="text-gray-400 text-xs">to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full sm:w-auto text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none focus:border-gray-400 bg-white" />
              </div>

              <button onClick={() => { setSearch(''); setStartDate(''); setEndDate('') }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-2 py-2 w-auto">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Payment Mode</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Receipt className="w-8 h-8" />
                      <p className="text-sm font-medium">No invoices yet</p>
                      <p className="text-xs">Create your first bill to get started</p>
                      <Link href="/invoices/new" className="mt-2 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                        Create Bill
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">
                      {inv.orderId || <span className="text-gray-400 font-sans font-normal">Draft</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{inv.customer.name}</div>
                      <div className="text-xs text-gray-400">{inv.customer.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-gray-600">
                      <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                        {inv.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs transition-colors" title="View">
                        <Eye className="w-4 h-4" /> View Receipt
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List (Hidden on Desktop) */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-xs">Loading…</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-medium text-gray-500">No invoices yet</p>
              <Link href="/invoices/new" className="mt-2 inline-block text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg">
                Create Bill
              </Link>
            </div>
          ) : (
            invoices.map(inv => (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-900">
                      {inv.orderId || 'Draft'}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{inv.customer.name}</p>
                    <p className="text-xs text-gray-400">{inv.customer.phone}</p>
                  </div>
                  <span className="text-[10px] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-gray-600 font-medium">
                    {inv.paymentMode}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg">
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wide">Date</span>
                    <span className="font-medium text-gray-700">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wide">Total Billed</span>
                    <span className="font-bold text-gray-900">{fmt(inv.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Link href={`/invoices/${inv.id}`}
                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium bg-white hover:bg-gray-50 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View Receipt
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
