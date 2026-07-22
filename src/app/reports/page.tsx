'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, History, Tag, Download, Receipt, Scale, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, Skeleton, StatCard, Badge, EmptyState, PageHeader, Button } from '@/components/ui/Kit'
import { useToast } from '@/components/ui/Toast'
import { fmtINR, fmtDateIN } from '@/lib/format'
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

type Preset = 'month' | '30days' | 'quarter' | 'fy' | 'all'

function indianFYBounds(now = new Date()) {
  const y = now.getFullYear()
  const m = now.getMonth()
  // FY starts April 1
  const startYear = m >= 3 ? y : y - 1
  return {
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59),
    label: `FY ${startYear}-${String(startYear + 1).slice(2)}`,
  }
}

export default function ReportsPage() {
  const toast = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [datePreset, setDatePreset] = useState<Preset>('all')

  const fy = useMemo(() => indianFYBounds(), [])

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data)
      })
      .catch(() => toast.error('Could not load reports'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredInvoices = useMemo(() => {
    if (!invoices.length) return []
    const now = new Date()
    if (datePreset === 'all') return invoices
    if (datePreset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return invoices.filter((inv) => new Date(inv.invoiceDate) >= start)
    }
    if (datePreset === '30days') {
      const start = new Date()
      start.setDate(now.getDate() - 30)
      return invoices.filter((inv) => new Date(inv.invoiceDate) >= start)
    }
    if (datePreset === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3
      const start = new Date(now.getFullYear(), qMonth, 1)
      return invoices.filter((inv) => new Date(inv.invoiceDate) >= start)
    }
    if (datePreset === 'fy') {
      return invoices.filter((inv) => {
        const d = new Date(inv.invoiceDate)
        return d >= fy.start && d <= fy.end
      })
    }
    return invoices
  }, [datePreset, invoices, fy])

  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalCGST = filteredInvoices.reduce((sum, inv) => sum + inv.cgstAmount, 0)
  const totalSGST = filteredInvoices.reduce((sum, inv) => sum + inv.sgstAmount, 0)
  const totalTax = totalCGST + totalSGST
  const totalBillsCount = filteredInvoices.length

  const categoryStats: Record<string, { count: number; total: number }> = {
    "Women's Wear": { count: 0, total: 0 },
    "Men's Wear": { count: 0, total: 0 },
    "Kids Wear": { count: 0, total: 0 },
    Rental: { count: 0, total: 0 },
  }

  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const cat = item.category || 'Other'
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, total: 0 }
      }
      categoryStats[cat].count += 1
      categoryStats[cat].total += item.amount
    })
  })

  // Payment mode mix
  const paymentMix: Record<string, number> = {}
  filteredInvoices.forEach((inv) => {
    paymentMix[inv.paymentMode] = (paymentMix[inv.paymentMode] || 0) + inv.totalAmount
  })

  // Top customers
  const customerMap: Record<string, { name: string; total: number; count: number }> = {}
  filteredInvoices.forEach((inv) => {
    const key = inv.customer.phone
    if (!customerMap[key]) customerMap[key] = { name: inv.customer.name, total: 0, count: 0 }
    customerMap[key].total += inv.totalAmount
    customerMap[key].count += 1
  })
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.info('No invoices to export for this range')
      return
    }
    const headers = 'Invoice ID,Customer Name,Customer Phone,Date,Payment Mode,Subtotal,CGST,SGST,Grand Total\n'
    const rows = filteredInvoices.map((inv) => {
      const name = inv.customer.name.replace(/,/g, ' ')
      const date = fmtDateIN(inv.invoiceDate)
      return `"${inv.orderId || 'Draft'}","${name}","${inv.customer.phone}","${date}","${inv.paymentMode}",${inv.subtotal},${inv.cgstAmount},${inv.sgstAmount},${inv.totalAmount}\n`
    })
    const blob = new Blob([headers, ...rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `GDS_Sales_Report_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const presets: Array<{ id: Preset; label: string }> = [
    { id: 'all', label: 'All time' },
    { id: 'month', label: 'This month' },
    { id: '30days', label: 'Last 30 days' },
    { id: 'quarter', label: 'This quarter' },
    { id: 'fy', label: fy.label },
  ]

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-ink-100">
        <PageHeader
          title="Studio revenue reports"
          description="GST filing helpers, collections, and sales ledger"
          className="border-0 pb-0"
        />
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="flex bg-white border border-ink-100 rounded-xl p-1 overflow-x-auto flex-nowrap max-w-full">
            {presets.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDatePreset(item.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 min-h-[36px]',
                  datePreset === item.id
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100/30'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button type="button" variant="ink" size="sm" onClick={handleExportCSV} title="Download CSV">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total billed sales"
          value={fmtINR(totalSales)}
          sub={`${totalBillsCount} invoices`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="GST tax collected"
          value={fmtINR(totalTax)}
          sub={`CGST ${fmtINR(totalCGST)} · SGST ${fmtINR(totalSGST)}`}
          icon={<Scale className="w-4 h-4" />}
        />
        <StatCard
          label="Invoices billed"
          value={String(totalBillsCount)}
          sub={`Avg ${fmtINR(totalBillsCount > 0 ? totalSales / totalBillsCount : 0)}`}
          icon={<Receipt className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-ink-500" />
              Category share
            </h3>
            <div className="space-y-4 pt-1">
              {Object.entries(categoryStats).map(([category, stats]) => {
                const percentage = totalSales > 0 ? (stats.total / totalSales) * 100 : 0
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-ink-500">{category}</span>
                      <span className="text-ink-900 font-mono tabular-nums">{fmtINR(stats.total)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-ink-400 font-medium">
                      <span>{stats.count} items</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-ink-100">
                      <div className="h-full bg-ink-900 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900">Payment mix</h3>
            {Object.keys(paymentMix).length === 0 ? (
              <p className="text-sm text-ink-400">No payments in range</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(paymentMix)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mode, amount]) => {
                    const pct = totalSales > 0 ? (amount / totalSales) * 100 : 0
                    return (
                      <div key={mode} className="flex justify-between items-center text-sm">
                        <Badge>{mode}</Badge>
                        <span className="font-mono font-bold tabular-nums text-ink-900">
                          {fmtINR(amount)} <span className="text-ink-400 font-sans text-[11px]">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>

          <Card className="space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900">Top clients</h3>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-ink-400">No data</p>
            ) : (
              <ol className="space-y-3">
                {topCustomers.map((c, i) => (
                  <li key={c.name + i} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-ink-900 truncate pr-2">
                      <span className="text-ink-500 font-mono mr-2">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-ink-900 flex-shrink-0">{fmtINR(c.total)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="space-y-4 p-5 md:p-6">
            <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2">
              <History className="w-4 h-4 text-ink-500" />
              Recent billings
            </h3>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 text-ink-500 font-bold tracking-wide bg-paper/50">
                    <th className="py-3 px-3 text-[11px]">Date</th>
                    <th className="py-3 px-3 text-[11px]">Invoice</th>
                    <th className="py-3 px-3 text-[11px]">Customer</th>
                    <th className="py-3 px-3 text-center text-[11px]">Mode</th>
                    <th className="py-3 px-3 text-right text-[11px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8">
                        <EmptyState title="No invoices in range" description="Try another date preset or create a bill" />
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.slice(0, 12).map((log) => (
                      <tr key={log.id} className="hover:bg-paper/20 transition-colors">
                        <td className="py-3.5 px-3 text-ink-500">{fmtDateIN(log.invoiceDate)}</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-ink-900">
                          <Link href={`/invoices/${log.id}`} className="hover:underline">
                            {log.orderId || 'Draft'}
                          </Link>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-ink-900">{log.customer.name}</td>
                        <td className="py-3.5 px-3 text-center">
                          <Badge>{log.paymentMode}</Badge>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-ink-900 font-mono tabular-nums">
                          {fmtINR(log.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-ink-100 scroll-y">
              {filteredInvoices.length === 0 ? (
                <EmptyState title="No invoices in range" description="Try another date preset" />
              ) : (
                filteredInvoices.slice(0, 12).map((log) => (
                  <Link
                    key={log.id}
                    href={`/invoices/${log.id}`}
                    className="flex items-center justify-between py-4 active:bg-ink-100/40 transition-all group min-h-[64px]"
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-ink-900">{log.orderId || 'Draft'}</span>
                        <Badge>{log.paymentMode}</Badge>
                      </div>
                      <h4 className="text-sm font-bold text-ink-900 truncate">{log.customer.name}</h4>
                      <p className="text-[11px] text-ink-500">{fmtDateIN(log.invoiceDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-ink-900 font-mono text-sm tabular-nums">{fmtINR(log.totalAmount)}</span>
                      <ChevronRight className="w-4 h-4 text-ink-300" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
