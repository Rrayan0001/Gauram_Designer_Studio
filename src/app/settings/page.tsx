'use client'

import { useState, useEffect } from 'react'
import {
  Building,
  FileText,
  ShieldCheck,
  Save,
  Check,
  AlertOctagon,
  RefreshCw,
  Download
} from 'lucide-react'

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    invoicePrefix: 'GDS',
    invoiceSequenceStart: 1,
    termsAndConds: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Danger zone action states
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    // Fetch current settings
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
            invoiceSequenceStart: data.invoiceSequenceStart || 1,
            termsAndConds: data.termsAndConds || '',
          })
        }
      })
      .catch((e) => console.error('Failed to load settings', e))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'invoiceSequenceStart' ? parseInt(value) || 1 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setTimeout(() => setSuccess(false), 3000)
      } else {
        alert('Failed to save settings details.')
      }
    } catch {
      alert('Error updating configuration parameters.')
    } finally {
      setSaving(false)
    }
  }

  // Action: Reset sequence in database
  const handleResetSequence = async () => {
    const conf = confirm('Danger: Are you sure you want to reset the invoice counter back to 1?')
    if (!conf) return

    setResetting(true)
    setResetSuccess(false)

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_counter' }),
      })

      if (res.ok) {
        setResetSuccess(true)
        // Update local sequence preview
        setFormData(prev => ({ ...prev, invoiceSequenceStart: 1 }))
        setTimeout(() => setResetSuccess(false), 2500)
      } else {
        alert('Failed to reset counter.')
      }
    } catch {
      alert('Error resetting invoicing sequence.')
    } finally {
      setResetting(false)
    }
  }

  // Action: Export entire DB as JSON
  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/payments?action=export_db')
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
      } else {
        alert('Failed to fetch backup JSON.')
      }
    } catch {
      alert('Error exporting database backup.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const focusRingCls = 'focus:border-ink-500 focus:ring-1 focus:ring-ink-500/20'
  const inputCls = `w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none font-semibold ${focusRingCls}`
  const monoInputCls = `w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-ink-900 focus:outline-none ${focusRingCls}`

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-4 border-b border-ink-100">
        <h2 className="font-serif text-2xl font-bold text-ink-900">
          Studio Administration Settings
        </h2>
        <p className="text-xs text-ink-500 mt-0.5 font-medium">
          Configure studio profile, GST registration parameters, and billing rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Row 1: Studio Profile info */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
          <h3 className="font-serif text-xs font-bold text-ink-900 uppercase tracking-widest flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <Building className="w-4 h-4 text-ink-700" />
            Boutique Profile &amp; GSTIN
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Shop Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputCls}
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">GSTIN Registration Number</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                required
                placeholder="29GYCPP4290P1ZG"
                className={monoInputCls}
              />
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={inputCls}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              {/* Website */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Website URL</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Registered Shop Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-ink-500 focus:ring-1 focus:ring-ink-500/20 font-medium resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Invoicing sequence */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
          <h3 className="font-serif text-xs font-bold text-ink-900 uppercase tracking-widest flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <FileText className="w-4 h-4 text-ink-700" />
            Receipt Sequence Numbering
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prefix */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Invoice Prefix String</label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                required
                className={monoInputCls}
              />
            </div>

            {/* Sequence start */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Next Sequence Number</label>
              <input
                type="number"
                name="invoiceSequenceStart"
                value={formData.invoiceSequenceStart}
                onChange={handleChange}
                required
                min="1"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Terms & Conditions */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
          <h3 className="font-serif text-xs font-bold text-ink-900 uppercase tracking-widest flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-ink-700" />
            Invoice Terms &amp; Conditions
          </h3>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Terms and Conditions Footer Template</label>
            <textarea
              name="termsAndConds"
              rows={4}
              value={formData.termsAndConds}
              onChange={handleChange}
              required
              className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-ink-500 focus:ring-1 focus:ring-ink-500/20 font-medium resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Actions (Sticky bottom bar on mobile) */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-xs border-t border-ink-100 p-4 -mx-4 md:-mx-0 md:relative md:bg-transparent md:border-t-0 md:p-0 md:my-0 md:pt-2 z-20 flex flex-col md:flex-row justify-end gap-3 items-center select-none">
          {success && (
            <div className="w-full md:w-auto flex items-center justify-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold animate-pulse">
              <Check className="w-4 h-4 text-emerald-600" /> Settings updated successfully!
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-700 text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 select-none cursor-pointer active:scale-95 shadow-md min-h-[44px]"
          >
            <Save className="w-4 h-4 text-white" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>

      {/* Danger Zone Actions */}
      <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-serif text-xs font-bold text-rose-700 uppercase tracking-widest flex items-center gap-2 border-b border-rose-100 pb-2.5">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          Boutique Administration (Danger Zone)
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h4 className="text-xs font-bold text-ink-900">Reset Invoicing Sequence Counter</h4>
            <p className="text-[10px] text-ink-500 mt-0.5">Reset boutique invoice numbering count back to 1. Existing orders remain safe.</p>
          </div>
          <button
            type="button"
            disabled={resetting}
            onClick={handleResetSequence}
            className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all select-none ${
              resetSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'
            }`}
          >
            {resetSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" /> Sequence Reset Done
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> {resetting ? 'Resetting...' : 'Reset Sequence to 1'}
              </>
            )}
          </button>
        </div>

        <div className="border-t border-rose-100 pt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h4 className="text-xs font-bold text-ink-900">Backup Store Database</h4>
            <p className="text-[10px] text-ink-500 mt-0.5">Download a complete JSON database dump containing invoices, settings, and clients ledger.</p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 bg-white border border-ink-100 text-ink-700 hover:bg-ink-100/30 px-4.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all select-none active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-ink-750" /> {exporting ? 'Backing up...' : 'Backup Database JSON'}
          </button>
        </div>
      </div>
      
    </div>
  )
}
