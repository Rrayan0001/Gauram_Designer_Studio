'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  History, 
  Tag, 
  Sparkles,
  Download,
  Calendar,
  Receipt,
  Scale
} from 'lucide-react'
import Link from 'next/link'
import { Card, Skeleton } from '@/components/ui/Kit'

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

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  
  // Date filter preset state
  const [datePreset, setDatePreset] = useState<'month' | '30days' | 'quarter' | 'fy2026' | 'all'>('all')

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (Array.isArray(data)) {
        setInvoices(data)
        setFilteredInvoices(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  // Filter invoices when datePreset or invoices changes
  useEffect(() => {
    if (!invoices.length) return

    const now = new Date()
    let filtered = [...invoices]

    if (datePreset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = invoices.filter(inv => new Date(inv.invoiceDate) >= startOfMonth)
    } else if (datePreset === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      filtered = invoices.filter(inv => new Date(inv.invoiceDate) >= thirtyDaysAgo)
    } else if (datePreset === 'quarter') {
      const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3
      const startOfQuarter = new Date(now.getFullYear(), currentQuarterMonth, 1)
      filtered = invoices.filter(inv => new Date(inv.invoiceDate) >= startOfQuarter)
    } else if (datePreset === 'fy2026') {
      // FY 2026: April 1, 2026 to March 31, 2027
      const startOfFY = new Date(2026, 3, 1)
      const endOfFY = new Date(2027, 2, 31, 23, 59, 59)
      filtered = invoices.filter(inv => {
        const d = new Date(inv.invoiceDate)
        return d >= startOfFY && d <= endOfFY
      })
    }

    setFilteredInvoices(filtered)
  }, [datePreset, invoices])

  // Aggregates based on filtered list
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalCGST = filteredInvoices.reduce((sum, inv) => sum + inv.cgstAmount, 0)
  const totalSGST = filteredInvoices.reduce((sum, inv) => sum + inv.sgstAmount, 0)
  const totalTax = totalCGST + totalSGST
  const totalBillsCount = filteredInvoices.length

  // Category sales breakdown
  const categoryStats = {
    "Women's Wear": { count: 0, total: 0 },
    "Men's Wear": { count: 0, total: 0 },
    "Kids Wear": { count: 0, total: 0 },
    "Rental": { count: 0, total: 0 },
  }

  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const cat = item.category as keyof typeof categoryStats
      if (cat in categoryStats) {
        categoryStats[cat].count += 1
        categoryStats[cat].total += item.amount
      }
    })
  })

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return alert('No invoices to export.')

    const headers = ['Invoice ID,Customer Name,Customer Phone,Date,Payment Mode,Subtotal,CGST,SGST,Grand Total\n']
    const rows = filteredInvoices.map(inv => {
      const name = inv.customer.name.replace(/,/g, ' ')
      const phone = inv.customer.phone
      const date = new Date(inv.invoiceDate).toLocaleDateString('en-IN')
      return `"${inv.orderId || 'Draft'}","${name}","${phone}","${date}","${inv.paymentMode}",${inv.subtotal},${inv.cgstAmount},${inv.sgstAmount},${inv.totalAmount}\n`
    })

    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `GDS_Sales_Report_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-ink-300">
        <span className="w-8 h-8 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Aggregating boutique sales reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      
      {/* Header & Date Preset Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-ink-100">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink-900">
            Studio Revenue Reports
          </h2>
          <p className="text-xs text-ink-500 mt-0.5 font-medium">
            Perform GST filing audits, inspect collections, and download sales ledgers.
          </p>
        </div>

        {/* Date presets block */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white border border-ink-100 rounded-xl p-1 select-none">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'month', label: 'This Month' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'quarter', label: 'This Quarter' },
              { id: 'fy2026', label: 'FY 2026' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setDatePreset(item.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  datePreset === item.id
                    ? 'bg-gold-600 text-white shadow-2xs'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-ink-900 hover:bg-ink-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-2xs select-none"
            title="Download CSV for Excel/GST filing"
          >
            <Download className="w-3.5 h-3.5 text-gold-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Grid 1: Sales, Invoices and GST filing summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        {/* Total Billed (Sales Volume) */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-2 relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-ink-500 uppercase tracking-widest font-bold block">Total Billed Sales</span>
            <span className="p-2.5 rounded-xl bg-paper border border-ink-100 text-gold-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-ink-900 font-mono tracking-tight">
            {fmt(totalSales)}
          </div>
          <div className="text-[10px] text-ink-300 font-medium pt-2 border-t border-ink-100/50 flex justify-between">
            <span>Filtered subset sales volume</span>
            <span className="font-semibold text-ink-700">{totalBillsCount} Invoices</span>
          </div>
        </div>

        {/* GST Filing Helper Summary */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-2 relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-ink-500 uppercase tracking-widest font-bold block">GST Tax Collected</span>
            <span className="p-2.5 rounded-xl bg-gold-100/50 border border-gold-600/10 text-gold-600">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-gold-600 font-mono tracking-tight">
            {fmt(totalTax)}
          </div>
          <div className="text-[10px] text-ink-300 font-medium pt-2 border-t border-ink-100/50 flex justify-between">
            <span>CGST: {fmt(totalCGST)}</span>
            <span>SGST: {fmt(totalSGST)}</span>
          </div>
        </div>

        {/* Total Invoices Issued count card */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-2 relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-ink-500 uppercase tracking-widest font-bold block">Invoices Billed</span>
            <span className="p-2.5 rounded-xl bg-paper border border-ink-100 text-gold-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-ink-900 font-mono tracking-tight">
            {totalBillsCount}
          </div>
          <div className="text-[10px] text-ink-300 font-medium pt-2 border-t border-ink-100/50 flex justify-between">
            <span>Avg ticket size:</span>
            <span className="font-semibold text-ink-900">{fmt(totalBillsCount > 0 ? totalSales / totalBillsCount : 0)}</span>
          </div>
        </div>

      </div>

      {/* Grid 2: Categories and Audit log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category shares */}
        <div className="space-y-6">
          <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-gold-600" />
              Category Revenue Share
            </h3>
            
            <div className="space-y-4 pt-2">
              {Object.entries(categoryStats).map(([category, stats]) => {
                const percentage = totalSales > 0 ? (stats.total / totalSales) * 100 : 0
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink-500">{category}</span>
                      <span className="text-ink-900 font-mono">{fmt(stats.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-ink-300 font-medium">
                      <span>{stats.count} garments sold</span>
                      <span>{percentage.toFixed(0)}% share</span>
                    </div>
                    <div className="h-2 w-full bg-paper rounded-full overflow-hidden border border-ink-100">
                      <div 
                        className="h-full bg-gold-600 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Billing Ledger (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2">
              <History className="w-4 h-4 text-gold-600" />
              Recent Billings Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 text-ink-500 font-bold uppercase tracking-wider bg-paper/50">
                    <th className="py-3 px-3 text-[10px]">Date</th>
                    <th className="py-3 px-3 text-[10px]">Invoice ID</th>
                    <th className="py-3 px-3 text-[10px]">Customer</th>
                    <th className="py-3 px-3 text-center text-[10px]">Mode</th>
                    <th className="py-3 px-3 text-right text-[10px]">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-ink-300 font-medium">
                        No invoices recorded in this range.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.slice(0, 10).map((log) => (
                      <tr key={log.id} className="hover:bg-paper/20 transition-colors">
                        <td className="py-3.5 px-3 text-ink-500">
                          {new Date(log.invoiceDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-ink-900">
                          <Link href={`/invoices/${log.id}`} className="hover:underline flex items-center gap-0.5">
                            {log.orderId || 'Draft'}
                          </Link>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-ink-900">
                          {log.customer.name}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md border border-gold-600/10 bg-gold-100/50 text-[9px] uppercase text-gold-600 font-bold tracking-wide">
                            {log.paymentMode}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-ink-900 font-mono tabular-nums">
                          {fmt(log.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}
