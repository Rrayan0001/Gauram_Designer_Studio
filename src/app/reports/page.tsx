'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  History, 
  Tag, 
  Sparkles,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  orderId: string | null
  invoiceDate: string
  status: 'draft' | 'pending' | 'partial' | 'paid'
  totalAmount: number
  amountPaid: number
  pendingAmount: number
  paymentMode: string
  customer: {
    name: string
  }
  items: {
    category: string
    amount: number
  }[]
  payments: {
    id: string
    amount: number
    mode: string
    date: string
    note: string | null
  }[]
}

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInvoices(data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Aggregate metrics
  const activeInvoices = invoices.filter(inv => inv.status !== 'draft')
  
  const totalSales = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalCollected = activeInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
  const totalDues = activeInvoices.reduce((sum, inv) => sum + inv.pendingAmount, 0)

  // Current Month calculations
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const currentMonthSales = activeInvoices
    .filter(inv => new Date(inv.invoiceDate) >= startOfCurrentMonth)
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  
  const currentMonthCollected = activeInvoices
    .filter(inv => new Date(inv.invoiceDate) >= startOfCurrentMonth)
    .reduce((sum, inv) => sum + inv.amountPaid, 0)

  // Category sales breakdown
  const categoryStats = {
    "Women's Wear": { count: 0, total: 0 },
    "Men's Wear": { count: 0, total: 0 },
    "Kids Wear": { count: 0, total: 0 },
    "Rental": { count: 0, total: 0 },
  }

  activeInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const cat = item.category as keyof typeof categoryStats
      if (cat in categoryStats) {
        categoryStats[cat].count += 1
        categoryStats[cat].total += item.amount
      }
    })
  })

  // Extract all payment history log entries
  interface FlattenedPayment {
    id: string
    invoiceId: string
    orderId: string | null
    customerName: string
    amount: number
    mode: string
    date: string
    note: string | null
  }

  const paymentLog: FlattenedPayment[] = []
  activeInvoices.forEach(inv => {
    inv.payments.forEach(p => {
      paymentLog.push({
        id: p.id,
        invoiceId: inv.id,
        orderId: inv.orderId,
        customerName: inv.customer.name,
        amount: p.amount,
        mode: p.mode,
        date: p.date,
        note: p.note,
      })
    })
  })

  // Sort payments newest first
  paymentLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <span className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Aggregating boutique sales reports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8  max-w-5xl mx-auto select-none">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 font-serif">
          Studio Revenue Reports
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Perform accounting audits, inspect payment collections, and view product category performance.
        </p>
      </div>

      {/* Grid 1: High Level Revenue & Collections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Billed (Sales Volume) */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-2 relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Total Sales (All Time)</span>
            <span className="p-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-900">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 font-sans">
            {formatCurrency(totalSales)}
          </div>
          <div className="text-xs text-gray-500 flex justify-between pt-2">
            <span>This Month's Sales:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(currentMonthSales)}</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-2 relative group overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">Payments Collected</span>
            <span className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-500 font-sans">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-xs text-gray-500 flex justify-between pt-2">
            <span>Collected This Month:</span>
            <span className="font-semibold text-emerald-500">{formatCurrency(currentMonthCollected)}</span>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="bg-white border border-rose-900/50 p-6 rounded-2xl shadow-md space-y-2 relative group overflow-hidden bg-gradient-to-br from-card/50 to-rose-950/10">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-rose-300 uppercase tracking-widest font-semibold block">Pending Collections</span>
            <span className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/30 text-rose-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold text-rose-500 font-sans">
            {formatCurrency(totalDues)}
          </div>
          <div className="text-xs text-rose-300 flex justify-between pt-2">
            <span>Dues share of sales:</span>
            <span className="font-semibold">
              {totalSales > 0 ? ((totalDues / totalSales) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>

      </div>

      {/* Grid 2: Categories and Audit log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category shares */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="font-serif text-base font-bold text-gray-900 font-serif flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-900" />
              Sales by Category
            </h3>
            
            <div className="space-y-4 pt-2">
              {Object.entries(categoryStats).map(([category, stats]) => {
                const percentage = totalSales > 0 ? (stats.total / totalSales) * 100 : 0
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-500">{category}</span>
                      <span className="text-gray-900">{formatCurrency(stats.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-light">
                      <span>{stats.count} items billed</span>
                      <span>{percentage.toFixed(0)}% revenue share</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div 
                        className="h-full bg-gradient-to-r from-maroon-800 to-gold-500 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Payments collection timeline log (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="font-serif text-base font-bold text-gray-900 font-serif flex items-center gap-2">
              <History className="w-4 h-4 text-gray-900" />
              Recent Collections Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Invoice</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Mode</th>
                    <th className="py-3 px-3">Transaction Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/40">
                  {paymentLog.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentLog.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-100 transition-colors">
                        <td className="py-3.5 px-3 text-gray-500">
                          {new Date(log.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-gray-900">
                          <Link href={`/invoices/${log.invoiceId}`} className="hover:underline flex items-center gap-0.5">
                            {log.orderId || 'Draft'}
                            <ChevronRight className="w-3 h-3 text-gray-900" />
                          </Link>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-gray-900">
                          {log.customerName}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-500">
                          {formatCurrency(log.amount)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded border border-gray-200 bg-gray-100 text-[10px] uppercase text-gray-500">
                            {log.mode}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-500 font-light truncate max-w-[150px]" title={log.note || ''}>
                          {log.note || '—'}
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
