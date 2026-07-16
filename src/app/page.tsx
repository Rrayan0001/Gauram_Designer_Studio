'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search, CheckCircle2, AlertTriangle, Clock,
  Eye, Edit, PlusCircle, Receipt, FileText, RotateCcw, Tag, TrendingUp, IndianRupee
} from 'lucide-react'

interface Customer { id: string; name: string; phone: string }
interface InvoiceItem { id: string; description: string; category: string; amount: number }
interface Payment { id: string; amount: number; mode: string; date: string }
interface Invoice {
  id: string; orderId: string | null; customerId: string; customer: Customer
  invoiceDate: string; status: 'draft' | 'pending' | 'partial' | 'paid'
  subtotal: number; cgstAmount: number; sgstAmount: number; totalAmount: number
  amountPaid: number; pendingAmount: number; paymentMode: string
  items: InvoiceItem[]; payments: Payment[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const statusBadge = (status: Invoice['status']) => {
  const map = {
    paid:    { label: 'Paid',     cls: 'bg-green-50 text-green-700 border-green-200',  icon: <CheckCircle2 className="w-3 h-3" /> },
    partial: { label: 'Partial',  cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Clock className="w-3 h-3" /> },
    pending: { label: 'Pending',  cls: 'bg-red-50 text-red-700 border-red-200',        icon: <AlertTriangle className="w-3 h-3" /> },
    draft:   { label: 'Draft',    cls: 'bg-gray-100 text-gray-500 border-gray-200',    icon: <FileText className="w-3 h-3" /> },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  )
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [payModal, setPayModal] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState('UPI')
  const [payNote, setPayNote] = useState('')
  const [paySubmitting, setPaySubmitting] = useState(false)

  const fetchInvoices = async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (statusFilter) p.set('status', statusFilter)
    if (categoryFilter) p.set('category', categoryFilter)
    if (startDate) p.set('startDate', startDate)
    if (endDate) p.set('endDate', endDate)
    const res = await fetch(`/api/invoices?${p}`)
    const data = await res.json()
    if (Array.isArray(data)) setInvoices(data)
    setLoading(false)
  }

  useEffect(() => { fetchInvoices() }, [search, statusFilter, categoryFilter, startDate, endDate])

  const active = invoices.filter(i => i.status !== 'draft')
  const totalSales = active.reduce((s, i) => s + i.totalAmount, 0)
  const totalCollected = active.reduce((s, i) => s + i.amountPaid, 0)
  const totalPending = active.reduce((s, i) => s + i.pendingAmount, 0)
  const draftCount = invoices.filter(i => i.status === 'draft').length

  const catSales: Record<string, number> = { "Women's Wear": 0, "Men's Wear": 0, "Kids Wear": 0, Rental: 0 }
  active.forEach(inv => inv.items.forEach(it => { if (it.category in catSales) catSales[it.category] += it.amount }))
  const catTotal = Object.values(catSales).reduce((a, b) => a + b, 0)

  const openPayModal = (inv: Invoice) => {
    setPayModal(inv); setPayAmount(inv.pendingAmount.toString()); setPayMode('UPI'); setPayNote('')
  }

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payModal) return
    const amount = parseFloat(payAmount)
    if (!amount || amount > payModal.pendingAmount) return alert('Invalid amount.')
    setPaySubmitting(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: payModal.id, amount, mode: payMode, note: payNote }),
    })
    if (res.ok) { setPayModal(null); fetchInvoices() }
    else { const e = await res.json(); alert(e.error || 'Failed') }
    setPaySubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track orders, payments, and pending dues</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Bill
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales',    value: fmt(totalSales),    sub: `${active.length} invoices`, icon: <TrendingUp className="w-5 h-5 text-gray-400" />, vCls: 'text-gray-900' },
          { label: 'Collected',      value: fmt(totalCollected), sub: 'Settled & deposits',       icon: <IndianRupee className="w-5 h-5 text-green-400" />, vCls: 'text-green-600' },
          { label: 'Pending Dues',   value: fmt(totalPending),  sub: 'Requires collection',      icon: <AlertTriangle className="w-5 h-5 text-red-400" />, vCls: 'text-red-600' },
          { label: 'Active Drafts',  value: String(draftCount), sub: 'Unfinalized quotes',       icon: <FileText className="w-5 h-5 text-amber-400" />, vCls: 'text-amber-600' },
        ].map(({ label, value, sub, icon, vCls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${vCls}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Table + Category panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Invoices table — takes 3 cols */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Filters bar */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex gap-3 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order, customer, phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 w-full focus:outline-none focus:border-gray-400"
                />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400 bg-white">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400 bg-white">
                <option value="">All Categories</option>
                <option value="Women's Wear">Women's Wear</option>
                <option value="Men's Wear">Men's Wear</option>
                <option value="Kids Wear">Kids Wear</option>
                <option value="Rental">Rental</option>
              </select>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400 bg-white" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400 bg-white" />
              <button onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setStartDate(''); setEndDate('') }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 px-2 py-2">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Paid</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Due</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
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
                        {inv.orderId || <span className="text-gray-400 font-sans font-normal">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{inv.customer.name}</div>
                        <div className="text-xs text-gray-400">{inv.customer.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{fmt(inv.amountPaid)}</td>
                      <td className="px-4 py-3 text-right">
                        {inv.pendingAmount > 0
                          ? <span className="text-red-600 font-semibold">{fmt(inv.pendingAmount)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/invoices/${inv.id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {inv.status === 'draft' && (
                            <Link href={`/invoices/${inv.id}/edit`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit Draft">
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          {inv.status !== 'draft' && inv.pendingAmount > 0 && (
                            <button onClick={() => openPayModal(inv)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Record Payment">
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category breakdown — 1 col */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Category Sales</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(catSales).map(([cat, amt]) => {
              const pct = catTotal > 0 ? (amt / catTotal) * 100 : 0
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-700 font-medium">{cat}</span>
                    <span className="text-gray-500">{fmt(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-500">Total</span>
              <span className="text-gray-900">{fmt(catTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
              <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={submitPayment} className="p-6 space-y-4">
              <div className="text-sm bg-gray-50 rounded-lg p-3 flex justify-between text-gray-600">
                <span><b className="text-gray-900">{payModal.orderId}</b></span>
                <span>Due: <b className="text-red-600">{fmt(payModal.pendingAmount)}</b></span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount (₹)</label>
                <input type="number" step="0.01" required value={payAmount}
                  onChange={e => setPayAmount(e.target.value)} max={payModal.pendingAmount} min="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Mode</label>
                <select value={payMode} onChange={e => setPayMode(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white">
                  <option value="UPI">UPI</option><option value="Cash">Cash</option>
                  <option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Note / Ref</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)}
                  placeholder="UPI Ref ID or note…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPayModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={paySubmitting}
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                  {paySubmitting ? 'Saving…' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
