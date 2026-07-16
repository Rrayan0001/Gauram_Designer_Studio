'use client'

import { useState, useEffect } from 'react'
import { Building, FileText, ShieldCheck, Save, Check, AlertOctagon, RefreshCw, Download } from 'lucide-react'
import { Card, Button, Field, Input, Textarea, Skeleton, PageHeader, ConfirmDialog } from '@/components/ui/Kit'
import { useToast } from '@/components/ui/Toast'

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i

export default function SettingsPage() {
  const toast = useToast()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    invoicePrefix: 'GDS',
    nextInvoiceNum: 1,
    termsAndConds: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [gstinError, setGstinError] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    fetch('/api/business')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setFormData({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            gstin: data.gstin || '',
            invoicePrefix: data.invoicePrefix || 'GDS',
            nextInvoiceNum: data.nextInvoiceNum || 1,
            termsAndConds: data.termsAndConds || '',
          })
        }
      })
      .catch(() => toast.error('Could not load settings'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'nextInvoiceNum' ? parseInt(value) || 1 : value,
    }))
    if (name === 'gstin') setGstinError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.gstin && !GSTIN_RE.test(formData.gstin.trim())) {
      setGstinError('Enter a valid 15-character GSTIN')
      toast.error('Invalid GSTIN format')
      return
    }
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSuccess(true)
        toast.success('Settings saved')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Could not save settings')
      }
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleResetSequence = async () => {
    setResetting(true)
    setResetSuccess(false)
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_counter' }),
      })
      if (res.ok) {
        setResetSuccess(true)
        setFormData((prev) => ({ ...prev, nextInvoiceNum: 1 }))
        setShowResetConfirm(false)
        toast.success('Invoice sequence reset to 1')
        setTimeout(() => setResetSuccess(false), 2500)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Could not reset counter')
      }
    } catch {
      toast.error('Could not reset sequence')
    } finally {
      setResetting(false)
    }
  }

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/business?action=export_db')
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `GDS_Studio_Database_Backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Backup downloaded')
      } else {
        toast.error('Could not export backup')
      }
    } catch {
      toast.error('Could not export backup')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetSequence}
        title="Reset invoice sequence?"
        description="This sets the next invoice number back to 1. Existing orders are not deleted."
        confirmLabel="Reset to 1"
        danger
        loading={resetting}
      />

      <PageHeader
        title="Studio settings"
        description="Profile, GST registration, and billing rules"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <Building className="w-4 h-4 text-gold-600" />
            Boutique profile & GSTIN
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Shop name">
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </Field>
            <Field label="GSTIN" error={gstinError}>
              <Input
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                required
                placeholder="29GYCPP4290P1ZG"
                className="font-mono font-bold"
              />
            </Field>
            <Field label="Phone">
              <Input name="phone" value={formData.phone} onChange={handleChange} required />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" value={formData.email} onChange={handleChange} />
            </Field>
            <Field label="Website" className="md:col-span-2">
              <Input name="website" value={formData.website} onChange={handleChange} />
            </Field>
            <Field label="Registered address" className="md:col-span-2">
              <Textarea name="address" rows={2} value={formData.address} onChange={handleChange} required />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <FileText className="w-4 h-4 text-gold-600" />
            Receipt numbering
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Invoice prefix">
              <Input
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                required
                className="font-mono font-bold"
              />
            </Field>
            <Field label="Next sequence number">
              <Input
                type="number"
                name="nextInvoiceNum"
                value={formData.nextInvoiceNum}
                onChange={handleChange}
                required
                min={1}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-serif text-sm font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-gold-600" />
            Terms & conditions
          </h3>
          <Field label="Footer template on receipts">
            <Textarea
              name="termsAndConds"
              rows={4}
              value={formData.termsAndConds}
              onChange={handleChange}
              required
            />
          </Field>
        </Card>

        <div className="sticky bottom-0 bg-white/90 backdrop-blur-[2px] border-t border-ink-100 p-4 -mx-4 md:mx-0 md:relative md:bg-transparent md:border-t-0 md:p-0 z-20 flex flex-col md:flex-row justify-end gap-3 items-center">
          {success && (
            <div className="w-full md:w-auto flex items-center justify-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold">
              <Check className="w-4 h-4" /> Settings updated
            </div>
          )}
          <Button type="submit" variant="gold" loading={saving} className="w-full md:w-auto">
            <Save className="w-4 h-4" />
            Save settings
          </Button>
        </div>
      </form>

      <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl space-y-4">
        <h3 className="font-serif text-sm font-bold text-rose-700 flex items-center gap-2 border-b border-rose-100 pb-2.5">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          Danger zone
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h4 className="text-sm font-bold text-ink-900">Reset invoice sequence</h4>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Reset next number to 1. Existing orders remain safe.
            </p>
          </div>
          <Button
            type="button"
            variant={resetSuccess ? 'ink' : 'danger'}
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
          >
            {resetSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Reset done
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Reset to 1
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-rose-100 pt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h4 className="text-sm font-bold text-ink-900">Backup database</h4>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Download a JSON dump of invoices, settings, and clients.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" loading={exporting} onClick={handleExportJSON}>
            <Download className="w-3.5 h-3.5" /> Backup JSON
          </Button>
        </div>
      </div>
    </div>
  )
}
