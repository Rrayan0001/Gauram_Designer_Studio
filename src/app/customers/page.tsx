'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, ChevronRight, Trophy, Coins, Plus, Sparkles, Eye } from 'lucide-react'
import { Skeleton, EmptyState, StatCard, Avatar, Modal, Button, Field, Input, PageHeader } from '@/components/ui/Kit'
import { useToast } from '@/components/ui/Toast'
import { fmtINR, fmtPhone } from '@/lib/format'

interface CustomerSummary {
  id: string
  name: string
  phone: string
  address: string | null
  totalBilled: number
  totalPaid: number
  totalPending: number
  orderCount: number
}

export default function CustomersPage() {
  const toast = useToast()
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm), 250)
    return () => window.clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/customers?query=${encodeURIComponent(debouncedSearch)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d)) setCustomers(d)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  const refreshCustomers = () => {
    setLoading(true)
    fetch(`/api/customers?query=${encodeURIComponent(debouncedSearch)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCustomers(d)
      })
      .finally(() => setLoading(false))
  }

  const totalClientsCount = customers.length
  const topSpenderAmt = customers.length > 0 ? Math.max(...customers.map((c) => c.totalBilled)) : 0
  const avgLtvVal =
    totalClientsCount > 0 ? customers.reduce((sum, c) => sum + c.totalBilled, 0) / totalClientsCount : 0
  const repeatClientsCount = customers.filter((c) => c.orderCount > 1).length

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newPhone.trim()) {
      setFormError('Name and phone are required')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone, address: newAddress }),
      })
      if (res.ok) {
        setNewName('')
        setNewPhone('')
        setNewAddress('')
        setShowAddModal(false)
        toast.success('Client added')
        refreshCustomers()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Could not add customer')
      }
    } catch {
      toast.error('Could not add customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add client" sheet>
        <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
          <Field label="Phone number" error={formError && !newPhone ? formError : undefined}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="e.g. 9900469746"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </Field>
          <Field label="Full name" error={formError && !newName ? formError : undefined}>
            <Input
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Priyal Patel"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Field>
          <Field label="Address" hint="Optional">
            <Input
              type="text"
              autoComplete="street-address"
              placeholder="Optional address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </Field>
          {formError && newName && newPhone && (
            <p className="text-[11px] text-rose-600 font-medium">{formError}</p>
          )}
          <Button type="submit" variant="ink" className="w-full" loading={saving}>
            <Plus className="w-4 h-4" /> Register client
          </Button>
        </form>
      </Modal>

      <PageHeader
        title="Boutique clients"
        description="Billing ledger, sales totals, and client directory"
        action={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(true)} aria-label="Add customer">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add client</span>
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-500 bg-ink-100/40 border border-ink-100/30 px-3 py-2 rounded-xl font-semibold">
              <Users className="w-4 h-4 text-ink-700" />
              <span>{totalClientsCount} registered</span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total clients" value={String(totalClientsCount)} sub="Customer profiles" icon={<Users className="w-4 h-4" />} />
        <StatCard label="Repeat customers" value={String(repeatClientsCount)} sub="More than 1 bill" icon={<Sparkles className="w-4 h-4" />} />
        <StatCard label="Top spender LTV" value={fmtINR(topSpenderAmt)} sub="Highest total" icon={<Trophy className="w-4 h-4" />} />
        <StatCard label="Average LTV" value={fmtINR(avgLtvVal)} sub="Per client" icon={<Coins className="w-4 h-4" />} />
      </div>

      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
        <div className="p-4 border-b border-ink-100 bg-paper/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input
              type="text"
              placeholder="Search customers…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-4 py-2.5 text-base md:text-sm border border-ink-100 rounded-xl focus:outline-none focus:border-gold-600 bg-white placeholder-ink-400 text-ink-900 font-medium input-mobile-lg"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-paper/50 text-left">
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide">Client</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide text-center">Orders</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide text-right">Lifetime value</th>
                <th className="px-5 py-4 text-[11px] font-bold text-ink-500 tracking-wide text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6">
                    <EmptyState
                      title="No customers yet"
                      description="Clients appear when you generate a bill, or add one manually"
                      actionLabel="Create bill"
                      actionHref="/invoices/new"
                    />
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-paper/20 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/customers/${c.id}`} className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <div>
                          <div className="font-semibold text-ink-900 text-sm">{c.name}</div>
                          <div className="text-[11px] text-ink-500 font-mono mt-0.5">{fmtPhone(c.phone)}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-ink-700 font-mono">{c.orderCount}</td>
                    <td className="px-5 py-4 text-right font-bold text-ink-900 font-mono tabular-nums">
                      {fmtINR(c.totalBilled)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-100 hover:border-gold-600/40 text-ink-700 text-[11px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-ink-100 scroll-y">
          {loading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-6 px-4">
              <EmptyState
                title="No customers yet"
                description="Add a client or create your first bill"
                actionLabel="Create bill"
                actionHref="/invoices/new"
              />
            </div>
          ) : (
            customers.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between p-4 bg-white active:bg-gold-100/10 active:scale-[0.99] transition-all group min-h-[64px]"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink-900 truncate">{c.name}</h4>
                    <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                      {fmtPhone(c.phone)} · {c.orderCount} order{c.orderCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className="block text-[11px] text-ink-400 font-bold">LTV</span>
                    <span className="font-bold text-ink-900 font-mono tabular-nums text-sm">{fmtINR(c.totalBilled)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
