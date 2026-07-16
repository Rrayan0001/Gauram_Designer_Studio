'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save, ShieldAlert, Sparkles, Check, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Customer { id: string; name: string; phone: string; address?: string }
interface InvoiceItemInput {
  description: string; category: string; hsnSacCode: string
  quantity: number; rate: number; discount: number; gstRate: number; amount: number
}
interface InvoiceFormProps { initialInvoice?: any }

const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 placeholder-gray-400 transition-colors'
const labelCls = 'text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1'

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
  const [amountPaid, setAmountPaid] = useState(initialInvoice?.amountPaid || 0)

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
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)

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
  const pendingAmount = Math.max(0, totalAmount - amountPaid)

  const handleSubmit = async (finalize: boolean) => {
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
      amountPaid,
      paymentMode,
      items: payloadItems,
      isFinalized: finalize,
      isFinalizing: finalize
    }

    try {
      const url = isEdit ? `/api/invoices/${initialInvoice.id}` : '/api/invoices'
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { const saved = await res.json(); router.push(`/invoices/${saved.id}`) }
      else { const e = await res.json(); alert(`Error: ${e.error || 'Failed'}`) }
    } catch { alert('Failed to submit. Try again.') }
    finally { setSubmitting(false); setShowFinalizeConfirm(false) }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Draft Invoice' : 'Create New Bill'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? 'Modify draft before finalising' : 'Add garments, custom stitching services, and rentals'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Customer + Line Items ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 relative">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Customer Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="relative">
                <label className={labelCls}>Phone Number</label>
                <input type="text" placeholder="e.g. 9876543210" value={customerPhone}
                  onChange={e => { setCustomerPhone(e.target.value); setCustomerId('') }}
                  className={inputCls} />
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto divide-y divide-gray-50">
                    {customerSuggestions.map(c => (
                      <button key={c.id} type="button" onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex justify-between items-center transition-colors">
                        <div>
                          <span className="font-semibold text-gray-900 block">{c.name}</span>
                          <span className="text-gray-400">{c.phone}</span>
                        </div>
                        <Check className="w-3.5 h-3.5 text-green-500" />
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

            {/* Address */}
            <div>
              <div className="flex justify-between mb-1">
                <label className={labelCls}>Address</label>
                <span className="text-[10px] text-gray-400">Optional</span>
              </div>
              <input type="text" placeholder="Residential address (recommended for rentals & bridal)"
                value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Sleek Line Items Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Garments & Services</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">List garments, stitching orders, or hire items below</p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 bg-gray-900 text-white hover:bg-gray-800 text-xs px-3.5 py-2 rounded-lg font-medium transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            {/* Item cards collection */}
            <div className="space-y-3.5">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 relative group"
                >
                  {/* Top card bar: index indicator + actions */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
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
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 text-center transition-colors"
                      />
                    </div>

                    {/* Rate (Right) */}
                    <div className="md:col-span-4 space-y-1">
                      <label className={labelCls}>Rate (₹)</label>
                      <div className="relative rounded-lg border border-gray-200 bg-white focus-within:border-gray-400 transition-colors">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={item.rate || ''}
                          onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-0 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtotal badge inside the item row */}
                  <div className="flex justify-between items-center bg-gray-50/50 rounded-lg p-2.5 border border-gray-100 text-xs mt-1">
                    <span className="text-gray-400 font-medium">Fixed GST @ 12% is included in grand total</span>
                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                      <span className="text-gray-400 font-medium">Line Total:</span>
                      <span className="text-sm text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
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
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-700 bg-white py-3.5 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add another garment / service
            </button>
          </div>
        </div>

        {/* ── Right: Bill Settings + Summary ── */}
        <div className="space-y-5">

          {/* Bill Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Bill Settings</h3>
            <div>
              <label className={labelCls}>Billing Date</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">Payment Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Items Sum)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-500 border-b border-gray-100 pb-2">
                <span>Discount Applied</span>
                <span className="text-red-600">-₹{overallDiscount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-medium text-gray-700 pt-1">
                <span>Taxable Subtotal</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-500">
                <span>CGST (6%)</span>
                <span>₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>SGST (6%)</span>
                <span>₹{sgstAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total Payable</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount Input field */}
            <div className="pt-2 border-t border-gray-100">
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

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button type="button" disabled={submitting} onClick={() => handleSubmit(false)}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                <Save className="w-4 h-4 text-gray-400" />
                Save Draft
              </button>
              <button type="button" disabled={submitting} onClick={() => setShowFinalizeConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                <Sparkles className="w-4 h-4" />
                Finalize & Issue Bill
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Lock and Finalise Bill?</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                This will assign a sequential GST Invoice Number ({settings?.invoicePrefix || 'GDS/2026/'}XXXX) and lock the line items. Follow-up payments can still be recorded.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFinalizeConfirm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Go Back
                </button>
                <button type="button" disabled={submitting} onClick={() => handleSubmit(true)}
                  className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {submitting ? 'Locking…' : 'Yes, Lock & Finalise'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
