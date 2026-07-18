'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Sparkles, Check, ChevronRight, Phone, PlusCircle, Edit, Trash2 } from 'lucide-react'
import { Avatar, Badge, Button, Skeleton, Modal, ConfirmDialog, Field, Input } from '@/components/ui/Kit'
import { useToast } from '@/components/ui/Toast'
import { fmtINR, fmtDateIN, fmtPhone } from '@/lib/format'

interface InvoiceItem {
  id: string
  description: string
  category: string
  amount: number
}
interface Invoice {
  id: string
  orderId: string | null
  invoiceDate: string
  totalAmount: number
  amountPaid: number
  pendingAmount: number
  paymentMode: string
  items: InvoiceItem[]
}
interface CustomerDetail {
  id: string
  name: string
  phone: string
  address: string | null
  notes: string | null
  totalBilled: number
  totalPaid: number
  totalPending: number
  invoices: Invoice[]
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const toast = useToast()
  const router = useRouter()

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Customer not found')
        return r.json()
      })
      .then((data) => {
        setCustomer(data)
        setNotes(data.notes || '')
        setEditName(data.name)
        setEditPhone(data.phone)
        setEditAddress(data.address || '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim() || !editPhone.trim()) {
      setFormError('Name and phone are required')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone, address: editAddress }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCustomer((prev) => prev ? { ...prev, ...updated } : null)
        setShowEditModal(false)
        toast.success('Client profile updated')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Could not update client')
      }
    } catch {
      toast.error('Could not update client')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Client deleted')
        router.push('/customers')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Could not delete customer')
      }
    } catch {
      toast.error('Could not delete customer')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (res.ok) {
        setSaveSuccess(true)
        toast.success('Notes saved')
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        toast.error('Could not save notes')
      }
    } catch {
      toast.error('Could not save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-24 flex-1 rounded-2xl" />
          <Skeleton className="h-24 md:w-1/3 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-ink-100 p-6 rounded-2xl text-center space-y-4">
        <p className="text-rose-600 font-semibold">{error || 'Customer not found'}</p>
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2.5 rounded-xl border border-ink-100 text-ink-500 hover:bg-ink-100/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Back to customers"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <nav className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-400 font-bold mb-1" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-ink-900 transition-colors">Dashboard</Link>
              <span className="font-normal text-ink-300">/</span>
              <Link href="/customers" className="hover:text-ink-900 transition-colors">Clients</Link>
              <span className="font-normal text-ink-300">/</span>
              <span className="text-ink-600 font-semibold">{customer.name}</span>
            </nav>
            <h1 className="font-serif text-xl md:text-2xl font-bold text-ink-900">Client profile</h1>
            <p className="text-sm text-ink-500 mt-0.5 font-medium">Orders & stylist notes</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-14 sm:pl-0">
          <a
            href={`tel:+91${customer.phone.replace(/\D/g, '').slice(-10)}`}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-ink-100 text-ink-700 text-xs font-bold min-h-[44px] hover:bg-ink-100/30"
          >
            <Phone className="w-4 h-4" /> Call
          </a>
          <a
            href={`https://wa.me/91${customer.phone.replace(/\D/g, '').slice(-10)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#25D366]/30 text-[#25D366] text-xs font-bold min-h-[44px] hover:bg-[#25D366]/10"
          >
            WhatsApp
          </a>
          <Link
            href={`/invoices/new`}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gold-600 text-white text-xs font-bold min-h-[44px] hover:bg-gold-500"
          >
            <PlusCircle className="w-4 h-4" /> New bill
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="min-h-[44px]"
          >
            <Edit className="w-4 h-4 text-ink-700" /> Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="min-h-[44px]"
          >
            <Trash2 className="w-4 h-4 text-rose-600" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:order-2 md:w-1/3 bg-white border border-ink-100 rounded-2xl p-5 space-y-1 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
          <p className="text-[11px] text-ink-500 tracking-wide font-bold">Total sales (LTV)</p>
          <p className="text-xl md:text-2xl font-bold text-ink-900 font-mono tracking-tight tabular-nums border-b-2 border-gold-600 inline-block pb-0.5">
            {fmtINR(customer.totalBilled)}
          </p>
          <p className="text-[11px] text-ink-500 font-medium pt-1">
            {customer.invoices.length} receipt{customer.invoices.length !== 1 ? 's' : ''} issued
          </p>
        </div>

        <div className="md:order-1 flex-1 bg-white border border-ink-100 rounded-2xl p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
          <Avatar name={customer.name} size="lg" />
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-ink-900 text-lg truncate">{customer.name}</h3>
            <p className="text-sm text-ink-500 font-mono">{fmtPhone(customer.phone)}</p>
            <p className="text-[12px] text-ink-400 mt-1.5 truncate font-medium">
              {customer.address || 'No address recorded'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
          <div className="px-5 py-4 border-b border-ink-100 bg-paper/20">
            <h3 className="text-sm font-bold text-ink-900">Order history</h3>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-paper/50 text-left">
                  <th className="px-4 py-3.5 text-[11px] font-bold text-ink-500">Order ID</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-ink-500">Date</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-ink-500 text-center">Payment</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold text-ink-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {customer.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-ink-400 font-semibold text-sm">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  customer.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-paper/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-ink-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline">
                          {inv.orderId || 'Draft'}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-ink-700 font-medium">{fmtDateIN(inv.invoiceDate)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge>{inv.paymentMode}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-ink-900 font-mono tabular-nums">
                        {fmtINR(inv.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-ink-100 scroll-y">
            {customer.invoices.length === 0 ? (
              <div className="text-center py-10 text-ink-400 text-sm font-semibold">No orders yet</div>
            ) : (
              customer.invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-4 active:bg-gold-100/10 transition-all group min-h-[64px]"
                >
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-ink-900">{inv.orderId || 'Draft'}</span>
                      <Badge>{inv.paymentMode}</Badge>
                    </div>
                    <p className="text-[11px] text-ink-500 font-medium">{fmtDateIN(inv.invoiceDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-ink-900 font-mono text-sm tabular-nums">{fmtINR(inv.totalAmount)}</span>
                    <ChevronRight className="w-4 h-4 text-ink-300" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] h-fit flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <FileText className="w-4 h-4 text-ink-700" />
            <div>
              <h3 className="text-sm font-bold text-ink-900">Stylist notes</h3>
              <p className="text-[11px] text-ink-500 font-medium">Measurements, fittings, preferences</p>
            </div>
          </div>

          <textarea
            rows={8}
            placeholder="Bust, waist, length, bridal notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-base md:text-sm font-medium border border-ink-100 rounded-xl p-3 bg-paper/20 focus:outline-none focus:border-gold-600 focus:bg-white transition-all resize-none text-ink-900 input-mobile-lg"
          />

          <Button
            type="button"
            variant={saveSuccess ? 'ink' : 'gold'}
            className="w-full"
            loading={savingNotes}
            onClick={handleSaveNotes}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" /> Notes saved
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Save notes
              </>
            )}
          </Button>
        </div>
      </div>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit client profile" sheet>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Field label="Full name" error={formError && !editName ? formError : undefined}>
            <Input
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Priyal Patel"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </Field>
          <Field label="Phone number" error={formError && !editPhone ? formError : undefined}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="e.g. 9900469746"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </Field>
          <Field label="Address" hint="Optional">
            <Input
              type="text"
              autoComplete="street-address"
              placeholder="Optional address"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </Field>
          {formError && editName && editPhone && (
            <p className="text-[11px] text-rose-600 font-medium">{formError}</p>
          )}
          <Button type="submit" variant="ink" className="w-full" loading={saving}>
            Save changes
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete customer"
        description={
          <div className="space-y-2 text-ink-600 font-medium text-sm leading-relaxed">
            <p>Are you sure you want to delete <strong>{customer.name}</strong>?</p>
            <p className="text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs leading-normal mt-2">
              Warning: This will permanently delete this client and all their {customer.invoices.length} receipt(s) / billing record(s). This action cannot be undone.
            </p>
          </div>
        }
        confirmLabel="Delete customer"
        danger
        loading={deleting}
      />
    </div>
  )
}
