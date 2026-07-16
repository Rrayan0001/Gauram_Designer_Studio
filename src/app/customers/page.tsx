'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, Eye, AlertTriangle } from 'lucide-react'

interface CustomerSummary {
  id: string; name: string; phone: string; address: string | null
  totalBilled: number; totalPaid: number; totalPending: number; orderCount: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/customers?query=${searchTerm}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCustomers(d) })
      .finally(() => setLoading(false))
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Billing history, totals, and pending balances per client</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
          <Users className="w-3.5 h-3.5" />
          <span>{customers.length} clients</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or phone…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white" />
          </div>
        </div>

        {/* Desktop Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Orders</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Billed</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Paid</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Outstanding</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Users className="w-8 h-8" />
                      <p className="text-sm font-medium">No customers yet</p>
                      <p className="text-xs">Customers are created automatically when you create a bill</p>
                    </div>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(c.totalBilled)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{fmt(c.totalPaid)}</td>
                  <td className="px-4 py-3 text-right">
                    {c.totalPending > 0
                      ? <span className="text-red-600 font-semibold">{fmt(c.totalPending)}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.totalPending > 0
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-200"><AlertTriangle className="w-3 h-3" /> Due</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">Settled</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List (Hidden on Desktop) */}
        <div className="md:hidden divide-y divide-gray-100 animate-fade-in">
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-xs">Loading…</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">No customers yet</div>
          ) : (
            customers.map(c => (
              <div key={c.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{c.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">+91 {c.phone}</p>
                  </div>
                  <div>
                    {c.totalPending > 0
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-red-50 text-red-600 border border-red-200"><AlertTriangle className="w-2.5 h-2.5" /> Due</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-green-50 text-green-600 border border-green-200">Settled</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded-lg text-center">
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wide">Orders</span>
                    <span className="font-semibold text-gray-700">{c.orderCount}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wide">Billed</span>
                    <span className="font-semibold text-gray-700">{fmt(c.totalBilled)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase tracking-wide">Due</span>
                    <span className={`font-semibold ${c.totalPending > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {c.totalPending > 0 ? fmt(c.totalPending) : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link href={`/customers/${c.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
                    <Eye className="w-3.5 h-3.5" /> View Profile &amp; History
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
