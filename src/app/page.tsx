'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Receipt,
  PlusCircle,
  Search,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Card, Skeleton, EmptyState, StatCard, Badge, PageHeader } from '@/components/ui/Kit'
import { fmtINR, fmtDateIN, fmtPhone } from '@/lib/format'
import { cn } from '@/lib/cn'

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

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [greeting] = useState(() => {
    const hrs = new Date().getHours()
    if (hrs < 12) return 'Good morning'
    if (hrs < 17) return 'Good afternoon'
    return 'Good evening'
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [preset, setPreset] = useState<'all' | 'today' | '7d' | 'month' | 'custom'>('all')

  const applyPreset = (id: typeof preset) => {
    setPreset(id)
    if (id === 'custom') return
    const now = new Date()
    if (id === 'all') {
      setStartDate('')
      setEndDate('')
    } else if (id === 'today') {
      const d = now.toISOString().split('T')[0]
      setStartDate(d)
      setEndDate(d)
    } else if (id === '7d') {
      const s = new Date(now)
      s.setDate(s.getDate() - 7)
      setStartDate(s.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    } else if (id === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(s.toISOString().split('T')[0])
      setEndDate(now.toISOString().split('T')[0])
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const q = new URLSearchParams()
    if (debouncedSearch) q.append('search', debouncedSearch)
    if (startDate) q.append('startDate', startDate)
    if (endDate) q.append('endDate', endDate)

    fetch(`/api/invoices?${q.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setInvoices(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, startDate, endDate])

  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalBillsCount = invoices.length
  const avgBillValue = totalBillsCount > 0 ? totalSales / totalBillsCount : 0

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthSales = invoices
    .filter((inv) => {
      const d = new Date(inv.invoiceDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  const todayStr = new Date().toISOString().split('T')[0]
  const todayInvoices = invoices.filter((inv) => inv.invoiceDate.startsWith(todayStr))
  const todaySales = todayInvoices.reduce((s, i) => s + i.totalAmount, 0)

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const salesByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      salesByMonth[months[d.getMonth()]] = 0
    }
    invoices.forEach((inv) => {
      const mName = months[new Date(inv.invoiceDate).getMonth()]
      if (salesByMonth[mName] !== undefined) salesByMonth[mName] += inv.totalAmount
    })
    return Object.entries(salesByMonth).map(([month, amount]) => ({ month, amount }))
  }, [invoices])

  const renderTrendChart = () => {
    const data = chartData
    const maxAmount = Math.max(...data.map((d) => d.amount), 1000)
    const width = 500
    const height = 120
    const paddingX = 40
    const paddingY = 20
    const chartWidth = width - paddingX * 2
    const chartHeight = height - paddingY * 2

    const points = data.map((d, index) => {
      const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartWidth
      const y = height - paddingY - (d.amount / maxAmount) * chartHeight
      return { x, y, month: d.month, amount: d.amount }
    })

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
        : ''

    return (
      <div className="w-full select-none">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-bold text-ink-900">Revenue trend</h4>
            <p className="text-[11px] text-ink-500">Monthly settled invoicing</p>
          </div>
          <span className="text-[11px] font-bold text-ink-700 bg-ink-100 border border-ink-100 px-2.5 py-0.5 rounded-full">
            6 months
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible font-sans text-[10px] font-medium fill-ink-500">
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b08d3f" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#b08d3f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#ece7df" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#ece7df" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#ece7df" />
          {areaPath && <path d={areaPath} fill="url(#area-grad)" />}
          {linePath && (
            <path d={linePath} fill="none" stroke="#1a1814" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={idx === points.length - 1 ? 5 : 4}
                fill="#ffffff"
                stroke={idx === points.length - 1 ? '#b08d3f' : '#1a1814'}
                strokeWidth="2"
              />
              {p.amount > 0 && (
                <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-ink-900 font-mono font-bold text-[9px]">
                  ₹{(p.amount / 1000).toFixed(1)}k
                </text>
              )}
              <text x={p.x} y={height - 4} textAnchor="middle" className="fill-ink-500 text-[10px] font-semibold">
                {p.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  const presets: Array<{ id: typeof preset; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 days' },
    { id: 'month', label: 'Month' },
  ]

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title={`${greeting}, Gauram Studio`}
        description={`Counter ledger · ${fmtDateIN(new Date())}`}
        action={
          <Link
            href="/invoices/new"
            className="flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs active:scale-[0.98] w-full sm:w-auto min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Create bill
          </Link>
        }
      />

      {/* Today pulse */}
      <div className="flex flex-wrap items-center gap-3 text-sm bg-gold-100/40 border border-gold-600/15 rounded-2xl px-4 py-3">
        <Calendar className="w-4 h-4 text-gold-600" />
        <span className="font-semibold text-ink-900">
          Today: <span className="font-mono tabular-nums">{fmtINR(todaySales)}</span>
        </span>
        <span className="text-ink-300">·</span>
        <span className="text-ink-600 font-medium">
          {todayInvoices.length} bill{todayInvoices.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total revenue" value={fmtINR(totalSales)} sub="In current filter" icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Invoices issued" value={String(totalBillsCount)} sub="Printed receipts" icon={<Receipt className="w-5 h-5" />} />
        <StatCard label="Average bill" value={fmtINR(avgBillValue)} sub="Per client cart" icon={<Layers className="w-5 h-5" />} />
        <StatCard label="This month" value={fmtINR(thisMonthSales)} sub="Calendar month" icon={<Sparkles className="w-5 h-5" />} />
      </div>

      <Card className="p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          renderTrendChart()
        )}
      </Card>

      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
        <div className="p-4 md:p-5 border-b border-ink-100 bg-paper/30 space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[36px]',
                  preset === p.id ? 'bg-ink-900 text-white' : 'bg-white border border-ink-100 text-ink-500 hover:text-ink-900'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 w-full md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input
                  type="text"
                  placeholder="Search orders or clients…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-4 py-2.5 text-sm border border-ink-100 rounded-xl focus:outline-none focus:border-gold-600 bg-white placeholder-ink-400 text-ink-900 font-medium input-mobile-lg"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMobileFilters(!showMobileFilters)
                  setPreset('custom')
                }}
                className={cn(
                  'md:hidden flex items-center justify-center p-2.5 rounded-xl border transition-all min-w-[44px] min-h-[44px]',
                  showMobileFilters || startDate || endDate
                    ? 'bg-ink-900 border-ink-900 text-white'
                    : 'bg-white border-ink-100 text-ink-500'
                )}
                aria-label="Filter by dates"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div
              className={cn(
                showMobileFilters ? 'flex' : 'hidden',
                'md:flex flex-col md:flex-row flex-wrap items-center gap-3 w-full md:w-auto'
              )}
            >
              <div className="flex items-center gap-2 bg-white px-3 py-2 border border-ink-100 rounded-xl w-full md:w-auto justify-between">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setPreset('custom')
                    setStartDate(e.target.value)
                  }}
                  className="text-sm border-0 bg-transparent p-0 text-ink-700 font-medium focus:ring-0 outline-none w-[120px]"
                />
                <span className="text-ink-300 text-[11px] font-bold px-1">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setPreset('custom')
                    setEndDate(e.target.value)
                  }}
                  className="text-sm border-0 bg-transparent p-0 text-ink-700 font-medium focus:ring-0 outline-none w-[120px]"
                />
              </div>

              {(search || startDate || endDate || preset !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    applyPreset('all')
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 px-3 py-2.5 rounded-xl border border-ink-100 hover:border-ink-300 transition-colors w-full md:w-auto min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-paper/50 text-left">
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide">Order ID</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide">Customer</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide">Date</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide text-center">Payment</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide text-right">Total</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6">
                    <EmptyState
                      title={debouncedSearch || startDate ? 'No bills in this filter' : 'No invoices yet'}
                      description={
                        debouncedSearch || startDate
                          ? 'Try a different date range or clear filters'
                          : 'Issue your first bill to record customer orders'
                      }
                      actionLabel="Create receipt"
                      actionHref="/invoices/new"
                    />
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-paper/30 transition-all group">
                    <td className="px-5 py-4 font-mono text-[12px] font-bold text-ink-900">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.orderId || <span className="text-ink-300 font-sans font-normal">Draft</span>}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/invoices/${inv.id}`} className="block">
                        <div className="font-semibold text-ink-900 text-sm">{inv.customer.name}</div>
                        <div className="text-[11px] text-ink-500 font-mono mt-0.5">{fmtPhone(inv.customer.phone)}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-ink-700 font-medium">
                      {fmtDateIN(inv.invoiceDate)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge>{inv.paymentMode}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-ink-900 font-mono tabular-nums text-sm">
                      {fmtINR(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-100 hover:border-gold-600/40 hover:bg-gold-100/30 text-ink-700 text-[11px] font-bold transition-all"
                      >
                        Receipt <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-ink-100 scroll-y">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-6 px-4">
              <EmptyState
                title={debouncedSearch || startDate ? 'No bills in this filter' : 'No invoices yet'}
                description="Issue your first bill to record customer orders"
                actionLabel="Create receipt"
                actionHref="/invoices/new"
              />
            </div>
          ) : (
            invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-4 bg-white hover:bg-paper/10 active:bg-gold-100/10 active:scale-[0.99] transition-all select-none group min-h-[64px]"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-ink-900 break-all">
                      {inv.orderId || 'Draft'}
                    </span>
                    <Badge>{inv.paymentMode}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-ink-900 truncate">{inv.customer.name}</h4>
                  <p className="text-[11px] text-ink-500 font-mono flex items-center gap-2">
                    <span>{fmtPhone(inv.customer.phone)}</span>
                    <span className="text-ink-100">·</span>
                    <span className="font-sans font-medium">
                      {fmtDateIN(inv.invoiceDate, { day: '2-digit', month: 'short' })}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="block text-[11px] text-ink-400 tracking-wide font-bold">Total</span>
                    <span className="font-bold text-ink-900 font-mono tabular-nums text-sm">{fmtINR(inv.totalAmount)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-800" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
