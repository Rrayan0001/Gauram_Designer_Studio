'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Receipt,
  Eye,
  PlusCircle,
  Search,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Card, Skeleton, EmptyState } from '@/components/ui/Kit'

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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [greeting, setGreeting] = useState('Good day')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const fetchInvoices = async () => {
    try {
      const q = new URLSearchParams()
      if (search) q.append('search', search)
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
    const hrs = new Date().getHours()
    if (hrs < 12) setGreeting('Good morning')
    else if (hrs < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    fetchInvoices()
  }, [search, startDate, endDate])

  // Aggregate metrics
  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalBillsCount = invoices.length
  const avgBillValue = totalBillsCount > 0 ? totalSales / totalBillsCount : 0

  // Calculate current month's sales
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthSales = invoices
    .filter(inv => {
      const d = new Date(inv.invoiceDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  // SVG Area Chart points generator (Past 6 months trend)
  const renderTrendChart = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const salesByMonth: Record<string, number> = {}
    
    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mName = months[d.getMonth()]
      salesByMonth[mName] = 0
    }
    
    invoices.forEach(inv => {
      const d = new Date(inv.invoiceDate)
      const mName = months[d.getMonth()]
      if (salesByMonth[mName] !== undefined) {
        salesByMonth[mName] += inv.totalAmount
      }
    })

    const data = Object.entries(salesByMonth).map(([month, amount]) => ({ month, amount }))
    const maxAmount = Math.max(...data.map(d => d.amount), 1000)

    // Chart dimensions
    const width = 500
    const height = 120
    const paddingX = 40
    const paddingY = 20
    const chartWidth = width - paddingX * 2
    const chartHeight = height - paddingY * 2

    const points = data.map((d, index) => {
      const x = paddingX + (index / (data.length - 1)) * chartWidth
      const y = height - paddingY - (d.amount / maxAmount) * chartHeight
      return { x, y, month: d.month, amount: d.amount }
    })

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : ''

    return (
      <div className="w-full select-none">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">Revenue Trend</h4>
            <p className="text-[10px] text-ink-500">Monthly settled boutique invoicing</p>
          </div>
          <span className="text-[10px] font-bold text-gold-600 bg-gold-100/50 border border-gold-600/10 px-2.5 py-0.5 rounded-full">6 Months</span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible font-sans text-[9px] font-medium fill-ink-500">
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a961" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c9a961" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#ece7df" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#ece7df" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#ece7df" />

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#area-grad)" />}

          {/* Line Path */}
          {linePath && <path d={linePath} fill="none" stroke="#b08d3f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#ffffff"
                stroke="#b08d3f"
                strokeWidth="2"
                className="transition-all hover:r-6 cursor-pointer"
              />
              {/* Text tooltip on hover/render */}
              <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[8px] font-mono fill-ink-900 font-bold">
                {p.amount > 0 ? `₹${(p.amount / 1000).toFixed(1)}k` : ''}
              </text>
              {/* Month label */}
              <text x={p.x} y={height - 6} textAnchor="middle" className="fill-ink-500 uppercase tracking-wider text-[8px] font-semibold">
                {p.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Greeting & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 tracking-tight flex items-center gap-2">
            {greeting}, <span className="text-gold-600">Gauram Studio</span>
          </h1>
          <p className="text-xs text-ink-500 mt-1 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gold-600" /> Stylist counter ledger dashboard &amp; billing panel
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-700 text-white px-5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all shadow-[0_4px_12px_rgba(26,24,20,0.08)] active:scale-[0.98] w-full sm:w-auto min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold-500" />
          Create Bill
        </Link>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalSales), sub: 'Paid in full at checkout', icon: <TrendingUp className="w-5 h-5 text-gold-600" /> },
          { label: 'Invoices Issued', value: String(totalBillsCount), sub: 'Printed boutique receipts', icon: <Receipt className="w-5 h-5 text-gold-600" /> },
          { label: 'Average Bill Value', value: fmt(avgBillValue), sub: 'Average cart per client', icon: <Layers className="w-5 h-5 text-gold-600" /> },
          { label: 'This Month\'s Sales', value: fmt(thisMonthSales), sub: 'Current calendar billing', icon: <Sparkles className="w-5 h-5 text-gold-600" /> },
        ].map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-ink-100 p-4 md:p-5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] select-none">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-ink-500 uppercase tracking-wider">{label}</p>
                <p className="text-lg md:text-xl font-bold text-ink-900 tracking-tight font-mono break-all">{value}</p>
                <p className="text-[10px] text-ink-300 font-medium leading-tight">{sub}</p>
              </div>
              <div className="p-2 md:p-2.5 bg-paper rounded-xl border border-ink-100 flex-shrink-0">{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Graph Row */}
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

      {/* Invoices List Container */}
      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
        
        {/* Filters and search panel */}
        <div className="p-4 md:p-5 border-b border-ink-100 bg-paper/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input and Collapsible toggle for mobile */}
            <div className="flex gap-2 w-full md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pr-4 py-2.5 text-xs border border-ink-100 rounded-xl focus:outline-none focus:border-gold-600 bg-white placeholder-ink-300 text-ink-900 font-medium transition-all"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`md:hidden flex items-center justify-center p-2.5 rounded-xl border transition-all min-w-[44px] min-h-[44px] ${
                  showMobileFilters || startDate || endDate
                    ? 'bg-gold-600 border-gold-600 text-white shadow-2xs'
                    : 'bg-white border-ink-100 text-ink-500 hover:text-ink-900'
                }`}
                title="Filter by dates"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Date Picker Group (Desktop flex, Mobile hidden/collapsible) */}
            <div className={`${showMobileFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row flex-wrap items-center gap-3 w-full md:w-auto animate-in slide-in-from-top-2 duration-150`}>
              <div className="flex items-center gap-2 bg-white px-3 py-2 border border-ink-100 rounded-xl w-full md:w-auto justify-between">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="text-xs border-0 bg-transparent p-0 text-ink-700 font-medium focus:ring-0 outline-none w-[110px]"
                />
                <span className="text-ink-300 text-[10px] uppercase font-bold px-1">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="text-xs border-0 bg-transparent p-0 text-ink-700 font-medium focus:ring-0 outline-none w-[110px]"
                />
              </div>

              {(search || startDate || endDate) && (
                <button
                  onClick={() => { setSearch(''); setStartDate(''); setEndDate('') }}
                  className="flex items-center justify-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 px-3 py-2.5 rounded-xl border border-ink-100 hover:border-ink-300 transition-colors w-full md:w-auto min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink-100 bg-paper/50 text-left">
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Order ID</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Customer Client</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Checkout Date</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center">Payment Mode</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-right">Total Amount</th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-500 uppercase tracking-wider text-center">Action</th>
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
                      title="No boutique invoices found"
                      description="Issue your first bill to record customer orders"
                      actionLabel="Create Receipt"
                      actionHref="/invoices/new"
                    />
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-paper/20 transition-all group">
                    <td className="px-5 py-4 font-mono text-[11px] font-bold text-ink-900 break-all">
                      {inv.orderId || <span className="text-ink-300 font-sans font-normal">Draft</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink-900 text-xs">{inv.customer.name}</div>
                      <div className="text-[10px] text-ink-500 font-mono mt-0.5">+91 {inv.customer.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-[10px] text-ink-700 font-medium">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="bg-gold-100/50 border border-gold-600/10 text-gold-600 font-semibold px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wide">
                        {inv.paymentMode}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-ink-900 font-mono tabular-nums text-xs">
                      {fmt(inv.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-100 hover:border-ink-300 hover:bg-white text-ink-700 hover:text-ink-900 text-[10px] font-bold transition-all shadow-2xs"
                      >
                        Receipt <ArrowRight className="w-3 h-3 text-gold-600" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List (Hidden on Desktop) */}
        <div className="md:hidden divide-y divide-ink-100 scroll-y">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-14 w-full animate-pulse" />
              <Skeleton className="h-14 w-full animate-pulse" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-6 px-4">
              <EmptyState
                title="No boutique invoices found"
                description="Issue your first bill to record customer orders"
                actionLabel="Create Receipt"
                actionHref="/invoices/new"
              />
            </div>
          ) : (
            invoices.map(inv => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between p-4 bg-white hover:bg-paper/10 active:bg-gold-100/10 active:scale-[0.99] transition-all select-none group"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-ink-900 break-all">
                      {inv.orderId || 'Draft'}
                    </span>
                    <span className="text-[9px] bg-gold-100/50 border border-gold-600/10 text-gold-600 px-1.5 py-0.5 rounded font-bold tracking-wide uppercase">
                      {inv.paymentMode}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-ink-900 truncate">{inv.customer.name}</h4>
                  <p className="text-[10px] text-ink-500 font-mono flex items-center gap-2">
                    <span>+91 {inv.customer.phone}</span>
                    <span className="text-ink-100">&bull;</span>
                    <span className="font-sans font-medium text-ink-500">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="block text-[8px] text-ink-300 uppercase tracking-wider font-bold">Total</span>
                    <span className="font-bold text-ink-950 font-mono tabular-nums text-xs">{fmt(inv.totalAmount)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-gold-600 transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
