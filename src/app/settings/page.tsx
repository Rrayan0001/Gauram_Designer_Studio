'use client'

import { useState, useEffect } from 'react'
import { Save, Building, ShieldCheck, FileText, Check, AlertOctagon, Download, Sparkle, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    termsAndConds: '',
    invoicePrefix: '',
    nextInvoiceNum: 1,
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Danger zone action states
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchSettings = () => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setFormData({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            gstin: data.gstin || '',
            termsAndConds: data.termsAndConds || '',
            invoicePrefix: data.invoicePrefix || '',
            nextInvoiceNum: data.nextInvoiceNum || 1,
          })
        }
      })
      .catch((err) => console.error('Error fetching settings:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'nextInvoiceNum' ? parseInt(value) || 1 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        alert('Failed to update business settings.')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  // Danger zone: Reset Sequence number back to 1
  const handleResetSequence = async () => {
    if (!confirm('Are you sure you want to reset the invoice sequence counter back to 1? This will not affect existing invoices.')) return
    setResetting(true)
    setResetSuccess(false)
    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, nextInvoiceNum: 1 }),
      })
      if (res.ok) {
        setFormData(prev => ({ ...prev, nextInvoiceNum: 1 }))
        setResetSuccess(true)
        setTimeout(() => setResetSuccess(false), 3000)
      } else {
        alert('Failed to reset sequence.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setResetting(false)
    }
  }

  // Danger zone: Download all DB records in a single JSON file
  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const resInvoices = await fetch('/api/invoices')
      const invoices = await resInvoices.json()

      const resCustomers = await fetch('/api/customers')
      const customers = await resCustomers.json()

      const backupData = {
        exportedAt: new Date().toISOString(),
        businessSettings: formData,
        invoices: Array.isArray(invoices) ? invoices : [],
        customers: Array.isArray(customers) ? customers : []
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `GDS_Studio_Database_Backup_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error(err)
      alert('Failed to export data backup.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-ink-300">
        <span className="w-8 h-8 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Loading studio settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-ink-100 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink-900">
            Studio Profile Configuration
          </h2>
          <p className="text-xs text-ink-500 mt-0.5 font-medium">
            Configure registered GSTIN, sequence format prefixes, and invoice templates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Row 1: Business Profile & Logo Preview */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-5">
          <h3 className="font-serif text-xs font-bold text-ink-900 uppercase tracking-widest flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <Building className="w-4 h-4 text-gold-600" />
            Boutique Profile Header
          </h3>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo Image Preview block */}
            <div className="flex flex-col items-center gap-2 select-none flex-shrink-0">
              <span className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Boutique Logo</span>
              <div className="w-24 h-24 rounded-full border border-ink-100 bg-paper p-2 flex items-center justify-center shadow-2xs overflow-hidden">
                <img src="/logo.png" alt="Studio Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Legal Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Legal Business Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-semibold"
                />
              </div>

              {/* GSTIN */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">GSTIN Registration</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Contact Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-semibold"
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
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-semibold"
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
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-semibold"
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
                  className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-medium resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Invoicing sequence */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
          <h3 className="font-serif text-xs font-bold text-ink-900 uppercase tracking-widest flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <FileText className="w-4 h-4 text-gold-600" />
            Invoice Sequencing Defaults
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prefix */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Invoice ID Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                required
                className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20"
              />
              <p className="text-[10px] text-ink-300 font-medium leading-none mt-1">e.g. GDS/2026/ results in GDS/2026/0001</p>
            </div>

            {/* Next number */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wider block">Next Sequence Number</label>
              <input
                type="number"
                name="nextInvoiceNum"
                value={formData.nextInvoiceNum}
                onChange={handleChange}
                required
                min="1"
                className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Terms & Conditions */}
        <div className="bg-white border border-ink-100 p-6 rounded-2xl shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] space-y-4">
          <h3 className="font-serif text-xs font-bold text-ink-900 uppercase tracking-widest flex items-center gap-2 border-b border-ink-100 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-gold-600" />
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
              className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 font-medium resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 items-center pt-2">
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold animate-pulse">
              <Check className="w-4 h-4 text-emerald-600" /> Settings updated successfully!
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ink-900 hover:bg-ink-700 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 select-none cursor-pointer active:scale-95 shadow-md"
          >
            <Save className="w-4 h-4 text-gold-500" />
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
            <Download className="w-3.5 h-3.5 text-gold-600" /> {exporting ? 'Backing up...' : 'Backup Database JSON'}
          </button>
        </div>
      </div>
      
    </div>
  )
}
