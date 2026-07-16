'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, Eye, Sparkles, Trophy, Coins, UserCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/Kit'

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

  // Stats strip calculations
  const totalClientsCount = customers.length
  const topSpenderAmt = customers.length > 0 ? Math.max(...customers.map(c => c.totalBilled)) : 0
  const avgLtvVal = totalClientsCount > 0 ? customers.reduce((sum, c) => sum + c.totalBilled, 0) / totalClientsCount : 0
  const repeatClientsCount = customers.filter(c => c.orderCount > 1).length

  // Avatar initials helper
  const getInitials = (name: string) => {
    if (!name) return 'C'
    return name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">Boutique Clients</h1>
          <p className="text-xs text-ink-500 mt-0.5 font-medium font-sans">Billing ledger, sales totals, and measurements directory</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-500 bg-gold-100/40 border border-gold-600/10 px-3 py-1.5 rounded-xl font-semibold select-none">
          <Users className="w-4 h-4 text-gold-600" />
          <span>{totalClientsCount} registered</span>
        </div>
      </div>

      {/* Customer Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {[
          { label: 'Total Clients', value: String(totalClientsCount), sub: 'Bespoke customer profiles', icon: <Users className="w-4 h-4 text-gold-600" /> },
          { label: 'Repeat Customers', value: String(repeatClientsCount), sub: 'Issued more than 1 bill', icon: <Sparkles className="w-4 h-4 text-gold-600" /> },
          { label: 'Top Spender LTV', value: fmt(topSpenderAmt), sub: 'Highest boutique order total', icon: <Trophy className="w-4 h-4 text-gold-600" /> },
          { label: 'Average Client LTV', value: fmt(avgLtvVal), sub: 'Average store sales per client', icon: <Coins className="w-4 h-4 text-gold-600" /> },
        ].map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-white border border-ink-100 rounded-2xl p-4.5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">{label}</span>
                <span className="text-lg font-bold text-ink-900 block font-mono">{value}</span>
                <span className="text-[9px] text-ink-300 block font-medium">{sub}</span>
              </div>
              <div className="p-2 bg-paper border border-ink-100 rounded-lg">{icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
        {/* Search bar */}
        <div className="p-4.5 border-b border-ink-100 bg-paper/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input type="text" placeholder="Search customer records by name or phone..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-4 py-2.5 text-xs border border-ink-100 rounded-xl focus:outline-none focus:border-gold-600 bg-white placeholder-ink-300 text-ink-900 font-medium transition-all"
              style={{ paddingLeft: '2.5rem' }} />
          </div>
        </div>

        {/* Desktop Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink-100 bg-paper/50 text-left">
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Boutique Client</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center">Orders Count</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-right">Lifetime Value (LTV)</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full animate-pulse" />
                      <Skeleton className="h-5 w-full animate-pulse" />
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-ink-300">
                      <UserCircle2 className="w-8 h-8 text-ink-100" />
                      <p className="text-sm font-semibold text-ink-900">No customer records yet</p>
                      <p className="text-xs">Clients will populate automatically when you generate a new bill</p>
                    </div>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-paper/20 transition-colors">
                  <td className="px-5 py-4 flex items-center gap-3">
                    {/* Round avatar circle */}
                    <div className="w-9 h-9 rounded-full bg-gold-100/40 border border-gold-600/10 flex items-center justify-center text-gold-600 font-serif text-xs font-bold flex-shrink-0 select-none">
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink-900 text-xs">{c.name}</div>
                      <div className="text-[10px] text-ink-500 font-mono mt-0.5">+91 {c.phone}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-ink-700 font-mono">{c.orderCount}</td>
                  <td className="px-5 py-4 text-right font-bold text-ink-900 font-mono tabular-nums text-xs">{fmt(c.totalBilled)}</td>
                  <td className="px-5 py-4 text-center">
                    <Link href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-100 hover:border-ink-300 hover:bg-white text-ink-700 hover:text-ink-900 text-[10px] font-bold transition-all shadow-2xs">
                      <Eye className="w-3.5 h-3.5 text-gold-600" /> View Profile &amp; History
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List (Hidden on Desktop) */}
        <div className="md:hidden divide-y divide-ink-100">
          {loading ? (
            <div className="text-center py-6">
              <Skeleton className="h-10 w-full animate-pulse" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-10 text-ink-300 text-xs">No customers yet.</div>
          ) : (
            customers.map(c => (
              <div key={c.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-100/40 border border-gold-600/10 flex items-center justify-center text-gold-600 font-serif text-xs font-bold flex-shrink-0 select-none">
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-900">{c.name}</h4>
                    <p className="text-[10px] text-ink-500 font-mono mt-0.5">+91 {c.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] bg-paper p-2.5 rounded-xl border border-ink-100/50 text-center font-semibold">
                  <div>
                    <span className="block text-[8px] text-ink-300 uppercase tracking-wider">Orders Count</span>
                    <span className="font-semibold text-ink-700 font-mono">{c.orderCount}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-ink-300 uppercase tracking-wider">Total Billed</span>
                    <span className="font-bold text-ink-900 font-mono tabular-nums">{fmt(c.totalBilled)}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link href={`/customers/${c.id}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-ink-100 text-ink-700 text-xs font-bold bg-white hover:bg-paper transition-all w-full select-none">
                    <Eye className="w-3.5 h-3.5 text-gold-600" /> View Profile &amp; History
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
