'use client'

import { useState, useEffect } from 'react'
import { Save, Building, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'

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

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <span className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading studio settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8  max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 font-serif">
            Studio Settings
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Update invoice headers, registered GSTIN, sequence numbers, and terms of service.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Row 1: Business Profile */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-serif text-md font-bold text-gray-900 font-serif flex items-center gap-2 border-b border-gray-200 pb-2">
            <Building className="w-4 h-4 text-gray-900" />
            Boutique Profile Header
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legal Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Legal Business Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">GSTIN Registration</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Contact Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* Website */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Website URL</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Registered Shop Address</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Invoicing sequence */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-serif text-md font-bold text-gray-900 font-serif flex items-center gap-2 border-b border-gray-200 pb-2">
            <FileText className="w-4 h-4 text-gray-900" />
            Invoice Sequencing Defaults
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prefix */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Invoice ID Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleChange}
                required
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:border-gray-300"
              />
              <p className="text-[10px] text-gray-500">e.g. GDS/2026/ which results in GDS/2026/0001</p>
            </div>

            {/* Next number */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Next Sequence Number</label>
              <input
                type="number"
                name="nextInvoiceNum"
                value={formData.nextInvoiceNum}
                onChange={handleChange}
                required
                min="1"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Terms & Conditions */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md space-y-4">
          <h3 className="font-serif text-md font-bold text-gray-900 font-serif flex items-center gap-2 border-b border-gray-200 pb-2">
            <ShieldCheck className="w-4 h-4 text-gray-900" />
            Invoice Terms & Conditions
          </h3>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Terms and Conditions Footer Template</label>
            <textarea
              name="termsAndConds"
              rows={4}
              value={formData.termsAndConds}
              onChange={handleChange}
              required
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-300 font-sans"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 items-center pt-2">
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-950/20 border border-emerald-900/30 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated successfully!
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gray-900 border border-gray-300 hover:border-gray-300 text-gray-900 hover:text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover: disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gray-900" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </form>
    </div>
  )
}
