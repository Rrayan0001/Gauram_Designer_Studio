'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Sparkles, Check, Sparkle, UserCheck, Smartphone, Landmark, CreditCard, Coins } from 'lucide-react'
import Link from 'next/link'

interface Customer { id: string; name: string; phone: string; address?: string }
interface InvoiceItemInput {
  description: string; category: string; hsnSacCode: string
  quantity: number; rate: number; discount: number; gstRate: number; amount: number
}
interface InvoiceFormProps { initialInvoice?: any }

const inputCls = 'w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 placeholder-ink-300 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 transition-all font-medium'
const labelCls = 'text-[9px] font-bold text-ink-500 uppercase tracking-wider block mb-1.5'

export default function InvoiceForm({ initialInvoice }: InvoiceFormProps) {
  const router = useRouter()
  const isEdit = !!initialInvoice

  const [settings, setSettings] = useState<any>(null)
  const [customerId, setCustomerId] = useState(initialInvoice?.customerId || '')
  const [customerName, setCustomerName] = useState(initialInvoice?.customer?.name || '')
  const [customerPhone, setCustomerPhone] = useState(initialInvoice?.customer?.phone || '')
  const [customerAddress, setCustomerAddress] = useState(initialInvoice?.customer?.address || '')
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoice?.invoiceDate
      ? new Date(initialInvoice.invoiceDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [paymentMode, setPaymentMode] = useState(initialInvoice?.paymentMode || 'UPI')

  // Overall discount state (calculated from initial invoice values if editing)
  const [overallDiscount, setOverallDiscount] = useState<number>(() => {
    if (!initialInvoice) return 0
    const taxableVal = initialInvoice.cgstAmount / 0.06
    const diff = initialInvoice.subtotal - taxableVal
    return diff > 0.01 ? Math.round(diff * 100) / 100 : 0
  })

  // Load items. Category is hardcoded to "Women's Wear", discount is hardcoded to 0, gstRate is hardcoded to 12.
  const [items, setItems] = useState<InvoiceItemInput[]>(
    initialInvoice?.items?.map((item: any) => ({
      description: item.description,
      category: item.category || "Women's Wear",
      hsnSacCode: item.hsnSacCode || 'HSN 6204',
      quantity: item.quantity,
      rate: item.rate,
      discount: 0,
      gstRate: 12,
      amount: item.quantity * item.rate,
    })) || [{ description: '', category: "Women's Wear", hsnSacCode: 'HSN 6204', quantity: 1, rate: 0, discount: 0, gstRate: 12, amount: 0 }]
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/business').then(r => r.json()).then(d => { if (d && !d.error) setSettings(d) })
  }, [])

  useEffect(() => {
    if (customerPhone.length >= 3) {
      fetch(`/api/customers?query=${customerPhone}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) { setCustomerSuggestions(d); setShowSuggestions(true) } })
    } else { setCustomerSuggestions([]); setShowSuggestions(false) }
  }, [customerPhone])

  const handleSelectCustomer = (c: Customer) => {
    setCustomerId(c.id); setCustomerName(c.name); setCustomerPhone(c.phone)
    setCustomerAddress(c.address || ''); setShowSuggestions(false)
  }

  const handleItemChange = (index: number, field: keyof InvoiceItemInput, value: any) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    const qty  = parseFloat(updated[index].quantity as any) || 0
    const rate = parseFloat(updated[index].rate as any)     || 0
    updated[index].amount = qty * rate
    setItems(updated)
  }

  const addItem = () => setItems([...items, { description: '', category: "Women's Wear", hsnSacCode: 'HSN 6204', quantity: 1, rate: 0, discount: 0, gstRate: 12, amount: 0 }])
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)) }

  // Sum of (quantity * rate) of all items
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  
  // Taxable Value after overall discount deduction
  const taxableAmount = Math.max(0, subtotal - overallDiscount)
  
  // CGST and SGST at 6% each (total 12%) on the taxable amount
  const cgstAmount = Math.round((taxableAmount * 0.06) * 100) / 100
  const sgstAmount = Math.round((taxableAmount * 0.06) * 100) / 100
  
  // Grand total
  const totalAmount = taxableAmount + cgstAmount + sgstAmount

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'C'
    return name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) return alert('Please fill Customer Name and Phone.')
    if (items.some(i => !i.description || i.rate <= 0)) return alert('Please fill all item descriptions and rates.')
    setSubmitting(true)

    // Items array with fixed values to satisfy database schema constraints
    const payloadItems = items.map(item => ({
      ...item,
      category: "Women's Wear", // hardcoded category
      hsnSacCode: "HSN 6204",  // default HSN code since we removed it
      discount: 0,             // no item-level discount
      gstRate: 12,             // fixed GST rate
    }))

    const payload = {
      customerId: customerId || undefined,
      customerName,
      customerPhone,
      customerAddress,
      invoiceDate,
      subtotal,
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountPaid: totalAmount, // Every invoice is paid in full at creation
      paymentMode,
      items: payloadItems,
      isFinalized: true,       // Finalized instantly
      isFinalizing: true
    }

    try {
      const url = isEdit ? `/api/invoices/${initialInvoice.id}` : '/api/invoices'
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const saved = await res.json(); router.push(`/invoices/${saved.id}`) }
      else { const e = await res.json(); alert(`Error: ${e.error || 'Failed'}`) }
    } catch { alert('Failed to submit. Try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-350">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-ink-100">
        <Link href="/" className="p-2 rounded-xl border border-ink-100 text-ink-500 hover:bg-ink-100/30 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-serif text-xl font-bold text-ink-900">
            {isEdit ? 'Edit Receipt' : 'Create New Bill'}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5 font-medium">
            Issue boutique bills, apply discounts, and record payment modes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Customer + Line Items ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer Card */}
          <div className="bg-white border border-ink-100 rounded-2xl p-6 space-y-5 relative shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <div className="flex justify-between items-center border-b border-ink-100 pb-3">
              <h3 className="text-sm font-bold text-ink-900">Customer Profile Ledger</h3>
              {customerId && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-gold-600 bg-gold-100/50 border border-gold-600/10 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  <UserCheck className="w-3 h-3 text-gold-600" /> Returning Client
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Initials Avatar */}
              <div className="w-14 h-14 rounded-full bg-gold-100/40 border border-gold-600/10 flex items-center justify-center text-gold-600 font-serif text-lg font-bold flex-shrink-0 select-none">
                {getInitials(customerName)}
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="relative">
                  <label className={labelCls}>Phone Number</label>
                  <input type="text" placeholder="e.g. 9876543210" value={customerPhone}
                    onChange={e => { setCustomerPhone(e.target.value); setCustomerId('') }}
                    className={inputCls} />
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-ink-100 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto divide-y divide-ink-100">
                      {customerSuggestions.map(c => (
                        <button key={c.id} type="button" onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-paper/40 flex justify-between items-center transition-colors">
                          <div>
                            <span className="font-semibold text-ink-900 block">{c.name}</span>
                            <span className="text-ink-300 font-mono">{c.phone}</span>
                          </div>
                          <Check className="w-3.5 h-3.5 text-gold-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Name */}
                <div>
                  <label className={labelCls}>Customer Name</label>
                  <input type="text" placeholder="Full name" value={customerName}
                    onChange={e => setCustomerName(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className={labelCls}>Address</label>
                <span className="text-[10px] text-ink-300 font-medium">Optional</span>
              </div>
              <input type="text" placeholder="Residential address (recommended for rentals & custom stitching)"
                value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Sleek Line Items Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-paper/50 border border-ink-100 rounded-2xl px-5 py-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Garments &amp; Stitching Services</h3>
                <p className="text-[10px] text-ink-500 font-medium">List items or hire options below (GST flat @ 12%)</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 bg-ink-900 text-white hover:bg-ink-700 text-xs px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-gold-500" />
                Add Item
              </button>
            </div>

            {/* Item cards collection */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-ink-100 rounded-2xl p-5 space-y-4 hover:border-gold-600/35 hover:shadow-[0_4px_12px_rgba(26,24,20,0.02)] transition-all duration-200 relative group"
                >
                  {/* Top card bar: index indicator + actions */}
                  <div className="flex justify-between items-center border-b border-ink-100 pb-2.5">
                    <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest bg-gold-100/40 border border-gold-600/10 rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <Sparkle className="w-3 h-3 text-gold-600 fill-gold-600" /> Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-ink-300 hover:text-red-500 hover:bg-rose-50 p-2 rounded-xl transition-all"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields structure */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Item Description (Left, takes remaining space) */}
                    <div className="md:col-span-6 space-y-1">
                      <label className={labelCls}>Item Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Bridal Lehenga custom fitting, Men's Suit stitching"
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    {/* Quantity (Center) */}
                    <div className="md:col-span-2 space-y-1">
                      <label className={labelCls}>Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-xs text-ink-900 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600/20 text-center transition-all font-semibold"
                      />
                    </div>

                    {/* Rate (Right) */}
                    <div className="md:col-span-4 space-y-1">
                      <label className={labelCls}>Rate (₹)</label>
                      <div className="relative rounded-xl border border-ink-100 bg-white focus-within:border-gold-600 focus-within:ring-1 focus-within:ring-gold-600/20 transition-all">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-300 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={item.rate || ''}
                          onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-0 rounded-xl pl-7 pr-3 py-2.5 text-xs text-ink-900 focus:outline-none text-right font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtotal badge inside the item row */}
                  <div className="flex justify-between items-center bg-paper/50 rounded-xl p-3 border border-ink-100/50 text-[10px] font-semibold">
                    <span className="text-ink-500">Fixed HSN 6204 &bull; GST @ 12% is computed automatically</span>
                    <div className="flex items-center gap-1.5 text-ink-900 font-bold">
                      <span className="text-ink-500 font-medium">Line Total:</span>
                      <span className="text-xs text-ink-900 bg-white border border-ink-100 px-2.5 py-1 rounded-lg shadow-2xs font-mono font-bold">
                        ₹{item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Add Item row */}
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-100 hover:border-gold-600/50 text-ink-300 hover:text-ink-900 bg-white/50 hover:bg-white py-4 rounded-2xl text-xs font-bold transition-all select-none"
            >
              <Plus className="w-4 h-4 text-gold-600" />
              Add another boutique garment / stitching service
            </button>
          </div>
        </div>

        {/* ── Right: Bill Settings + Summary ── */}
        <div className="space-y-6">

          {/* Bill Settings */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5 space-y-4 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider border-b border-ink-100 pb-2">Bill Parameters</h3>
            <div>
              <label className={labelCls}>Billing Date</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5 space-y-5 sticky top-6 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider border-b border-ink-100 pb-2">Checkout Summary</h3>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal (Items Sum)</span>
                <span className="font-mono">{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-rose-600 border-b border-ink-100 pb-2">
                <span>Overall Discount</span>
                <span className="font-mono">-₹{overallDiscount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-ink-900 font-bold pt-1.5">
                <span>Taxable Subtotal</span>
                <span className="font-mono">₹{taxableAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-ink-500 font-medium">
                <span>CGST (6%)</span>
                <span className="font-mono">₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-500 font-medium">
                <span>SGST (6%)</span>
                <span className="font-mono">₹{sgstAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-ink-300 pt-3 flex justify-between items-center text-ink-900">
                <span className="font-serif text-sm font-bold">Grand Total</span>
                <div className="text-right">
                  <span className="font-serif text-lg font-bold border-b-2 border-gold-600 pb-0.5 font-mono">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount Input field */}
            <div className="pt-3 border-t border-ink-100">
              <label className={labelCls}>Discount Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={overallDiscount || ''}
                onChange={e => setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className={inputCls}
              />
            </div>

            {/* Segmented Button Group for Payment Mode */}
            <div className="space-y-2">
              <label className={labelCls}>Mode of Payment</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: 'UPI', label: 'UPI GPay', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { mode: 'Cash', label: 'Cash In Hand', icon: <Coins className="w-3.5 h-3.5" /> },
                  { mode: 'Card', label: 'Swipe Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { mode: 'Bank Transfer', label: 'Bank IMPS', icon: <Landmark className="w-3.5 h-3.5" /> },
                ].map(item => {
                  const active = paymentMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setPaymentMode(item.mode)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[10px] font-bold tracking-wide transition-all ${
                        active
                          ? 'bg-gold-600 border-gold-600 text-white shadow-xs'
                          : 'bg-white border-ink-100 text-ink-500 hover:bg-ink-100/20 hover:text-ink-900'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-ink-100">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-700 text-white py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-50 active:scale-95 shadow-md"
              >
                <Sparkles className="w-4 h-4 text-gold-500 fill-gold-500" />
                {submitting ? 'Generating...' : 'Generate & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
