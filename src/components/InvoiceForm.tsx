'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Check,
  Sparkle,
  UserCheck,
  Smartphone,
  Landmark,
  CreditCard,
  Coins,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import { Avatar, Button, Field } from '@/components/ui/Kit'
import { computeBillTotals } from '@/lib/gst'
import { CATEGORIES, CATEGORY_HSN, ITEM_TEMPLATES, type Category, hsnForCategory } from '@/lib/categories'
import { cn } from '@/lib/cn'

interface Customer {
  id: string
  name: string
  phone: string
  address?: string
}
interface InvoiceItemInput {
  description: string
  category: Category
  customCategory?: string
  hsnSacCode: string
  quantity: number
  rate: number
  discount: number
  gstRate: number
  amount: number
}
interface InvoiceFormProps {
  initialInvoice?: {
    id: string
    customerId?: string
    customer?: { name: string; phone: string; address?: string }
    invoiceDate?: string
    paymentMode?: string
    subtotal?: number
    cgstAmount?: number
    items?: Array<{
      description: string
      category?: string
      hsnSacCode?: string
      quantity: number
      rate: number
      amount?: number
    }>
  }
}

const DRAFT_KEY = 'gds-bill-draft'

const labelCls = 'text-[11px] font-bold text-ink-500 tracking-wide block mb-1.5'
const inputCls =
  'w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-base md:text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-gold-600 focus:ring-2 focus:ring-gold-600/15 transition-all font-medium input-mobile-lg'

export default function InvoiceForm({ initialInvoice }: InvoiceFormProps) {
  const router = useRouter()
  const toast = useToast()
  const isEdit = !!initialInvoice

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed')
  const [discountValue, setDiscountValue] = useState<number>(() => {
    if (!initialInvoice?.cgstAmount || !initialInvoice?.subtotal) return 0
    const taxableVal = initialInvoice.cgstAmount / 0.06
    const diff = initialInvoice.subtotal - taxableVal
    return diff > 0.01 ? Math.round(diff * 100) / 100 : 0
  })

  const [items, setItems] = useState<InvoiceItemInput[]>(
    initialInvoice?.items?.map((item) => {
      const cat = item.category || "Women's Wear"
      const isStd = CATEGORIES.includes(cat as any)
      return {
        description: item.description,
        category: isStd ? cat : 'Other',
        customCategory: isStd ? '' : cat,
        hsnSacCode: item.hsnSacCode || hsnForCategory(cat),
        quantity: item.quantity,
        rate: item.rate,
        discount: 0,
        gstRate: 12,
        amount: item.quantity * item.rate,
      }
    }) || [
      {
        description: '',
        category: "Women's Wear",
        customCategory: '',
        hsnSacCode: CATEGORY_HSN["Women's Wear"],
        quantity: 1,
        rate: 0,
        discount: 0,
        gstRate: 12,
        amount: 0,
      },
    ]
  )
  const [submitting, setSubmitting] = useState(false)

  // Restore draft for new bills
  useEffect(() => {
    if (isEdit) return
    const t = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (!raw) return
        const draft = JSON.parse(raw)
        if (draft.customerName) setCustomerName(draft.customerName)
        if (draft.customerPhone) setCustomerPhone(draft.customerPhone)
        if (draft.customerAddress) setCustomerAddress(draft.customerAddress)
        if (draft.customerId) setCustomerId(draft.customerId)
        if (draft.paymentMode) setPaymentMode(draft.paymentMode)
        if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate)
        if (typeof draft.discountType === 'string' && (draft.discountType === 'fixed' || draft.discountType === 'percent')) {
          setDiscountType(draft.discountType)
        }
        if (typeof draft.discountValue === 'number') {
          setDiscountValue(draft.discountValue)
        } else if (typeof draft.overallDiscount === 'number') {
          setDiscountValue(draft.overallDiscount)
          setDiscountType('fixed')
        }
        if (Array.isArray(draft.items) && draft.items.length) setItems(draft.items)
      } catch {
        /* ignore corrupt draft */
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [isEdit])

  // Autosave draft
  useEffect(() => {
    if (isEdit) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            customerId,
            customerName,
            customerPhone,
            customerAddress,
            invoiceDate,
            paymentMode,
            discountType,
            discountValue,
            items,
          })
        )
      } catch {
        /* ignore */
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [
    isEdit,
    customerId,
    customerName,
    customerPhone,
    customerAddress,
    invoiceDate,
    paymentMode,
    discountType,
    discountValue,
    items,
  ])

  // Customer suggest on phone or name (debounced)
  useEffect(() => {
    const q = customerPhone.length >= 3 ? customerPhone : customerName.length >= 2 ? customerName : ''
    const t = window.setTimeout(() => {
      if (!q) {
        setCustomerSuggestions([])
        setShowSuggestions(false)
        return
      }
      fetch(`/api/customers?query=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) {
            setCustomerSuggestions(d)
            setShowSuggestions(d.length > 0)
          }
        })
        .catch(() => {})
    }, 250)
    return () => window.clearTimeout(t)
  }, [customerPhone, customerName])

  const handleSelectCustomer = (c: Customer) => {
    setCustomerId(c.id)
    setCustomerName(c.name)
    setCustomerPhone(c.phone)
    setCustomerAddress(c.address || '')
    setShowSuggestions(false)
    setErrors((e) => ({ ...e, customerName: '', customerPhone: '' }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item
      const next = { ...item, [field]: value } as InvoiceItemInput
      if (field === 'category') {
        next.hsnSacCode = hsnForCategory(String(value))
      }
      const qty = parseFloat(String(next.quantity)) || 0
      const rate = parseFloat(String(next.rate)) || 0
      next.amount = qty * rate
      return next
    })
    setItems(updated)
  }

  const addItem = () =>
    setItems([
      ...items,
      {
        description: '',
        category: "Women's Wear",
        customCategory: '',
        hsnSacCode: CATEGORY_HSN["Women's Wear"],
        quantity: 1,
        rate: 0,
        discount: 0,
        gstRate: 12,
        amount: 0,
      },
    ])

  const applyTemplate = (tpl: (typeof ITEM_TEMPLATES)[number]) => {
    const emptyIdx = items.findIndex((i) => !i.description && !i.rate)
    if (emptyIdx >= 0) {
      const updated = [...items]
      updated[emptyIdx] = {
        ...updated[emptyIdx],
        description: tpl.description,
        category: tpl.category,
        hsnSacCode: CATEGORY_HSN[tpl.category],
        rate: tpl.defaultRate || 0,
        amount: (updated[emptyIdx].quantity || 1) * (tpl.defaultRate || 0),
      }
      setItems(updated)
    } else {
      setItems([
        ...items,
        {
          description: tpl.description,
          category: tpl.category,
          hsnSacCode: CATEGORY_HSN[tpl.category],
          quantity: 1,
          rate: tpl.defaultRate || 0,
          discount: 0,
          gstRate: 12,
          amount: tpl.defaultRate || 0,
        },
      ])
    }
  }

  const removeItem = (i: number) => {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i))
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0)

  const calculatedDiscountAmount =
    discountType === 'percent'
      ? Math.round(((subtotal * (discountValue || 0)) / 100) * 100) / 100
      : discountValue || 0

  const { taxableAmount, cgstAmount, sgstAmount, totalAmount } = computeBillTotals(subtotal, calculatedDiscountAmount)

  const handleSubmit = async () => {
    const next: Record<string, string> = {}
    if (!customerName.trim()) next.customerName = 'Customer name is required'
    if (!customerPhone.trim()) next.customerPhone = 'Phone number is required'
    if (items.some((i) => !i.description.trim() || i.rate <= 0)) {
      next.items = 'Each item needs a description and rate greater than zero'
    }
    if (calculatedDiscountAmount > subtotal) next.discount = 'Discount cannot exceed the subtotal'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSubmitting(true)

    const payloadItems = items.map((item) => {
      const isStd = CATEGORIES.includes(item.category as any) && item.category !== 'Other'
      const finalCategory = isStd
        ? item.category
        : (item.customCategory?.trim() || (item.category !== 'Other' ? item.category : 'Other'))

      return {
        ...item,
        category: finalCategory,
        hsnSacCode: item.hsnSacCode || hsnForCategory(finalCategory),
        discount: 0,
        gstRate: 12,
      }
    })

    const payload = {
      customerId: customerId || undefined,
      customerName,
      customerPhone,
      customerAddress,
      invoiceDate,
      subtotal,
      discountAmount: calculatedDiscountAmount,
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountPaid: totalAmount,
      paymentMode,
      items: payloadItems,
      isFinalized: true,
      isFinalizing: true,
    }

    try {
      const url = isEdit ? `/api/invoices/${initialInvoice!.id}` : '/api/invoices'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const saved = await res.json()
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {
          /* ignore */
        }
        toast.success('Receipt ready')
        router.push(`/invoices/${saved.id}`)
      } else {
        const e = await res.json().catch(() => ({}))
        toast.error(e.error || 'Could not save the bill')
      }
    } catch {
      toast.error('Could not save — check connection and try again')
    } finally {
      setSubmitting(false)
    }
  }

  const paymentModes = [
    { mode: 'UPI', label: 'UPI GPay', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { mode: 'Cash', label: 'Cash', icon: <Coins className="w-3.5 h-3.5" /> },
    { mode: 'Card', label: 'Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { mode: 'Bank Transfer', label: 'Bank', icon: <Landmark className="w-3.5 h-3.5 text-[11px]" /> },
  ]

  const summaryBlock = (
    <div className="space-y-2 text-sm font-semibold">
      <div className="flex justify-between text-ink-500">
        <span>Subtotal</span>
        <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-rose-600 border-b border-ink-100 pb-2">
        <span>
          Discount {discountType === 'percent' && discountValue > 0 ? `(${discountValue}%)` : ''}
        </span>
        <span className="font-mono tabular-nums">-₹{calculatedDiscountAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-ink-900 font-bold pt-1">
        <span>Taxable</span>
        <span className="font-mono tabular-nums">₹{taxableAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-ink-500 font-medium">
        <span>CGST (6%)</span>
        <span className="font-mono tabular-nums">₹{cgstAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-ink-500 font-medium">
        <span>SGST (6%)</span>
        <span className="font-mono tabular-nums">₹{sgstAmount.toFixed(2)}</span>
      </div>
      <div className="border-t border-ink-100 pt-3 flex justify-between items-end text-ink-900">
        <span className="font-serif text-base font-semibold">Grand Total</span>
        <span className="font-mono text-xl font-bold tabular-nums border-b-2 border-gold-600 pb-0.5">
          ₹{totalAmount.toFixed(2)}
        </span>
      </div>
    </div>
  )

  const renderDiscountControl = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelCls}>Discount</label>
        <div className="inline-flex bg-ink-100/60 p-0.5 rounded-lg border border-ink-100/80 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              if (discountType === 'percent') {
                const converted = subtotal > 0 ? Math.round(((subtotal * discountValue) / 100) * 100) / 100 : discountValue
                setDiscountType('fixed')
                setDiscountValue(converted)
              }
            }}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all cursor-pointer',
              discountType === 'fixed'
                ? 'bg-white text-ink-900 shadow-sm border border-ink-100/40'
                : 'text-ink-500 hover:text-ink-900'
            )}
          >
            ₹ Amount
          </button>
          <button
            type="button"
            onClick={() => {
              if (discountType === 'fixed') {
                const converted = subtotal > 0 ? Math.round(((discountValue / subtotal) * 100) * 100) / 100 : 0
                setDiscountType('percent')
                setDiscountValue(Math.min(100, converted))
              }
            }}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all cursor-pointer',
              discountType === 'percent'
                ? 'bg-white text-ink-900 shadow-sm border border-ink-100/40'
                : 'text-ink-500 hover:text-ink-900'
            )}
          >
            % Percent
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border border-ink-100 bg-white focus-within:border-gold-600 focus-within:ring-2 focus-within:ring-gold-600/15">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400 text-xs font-semibold">
          {discountType === 'fixed' ? '₹' : '%'}
        </span>
        <input
          type="number"
          min={0}
          max={discountType === 'percent' ? 100 : undefined}
          step={discountType === 'percent' ? '1' : '0.01'}
          placeholder={discountType === 'fixed' ? '0.00' : '0'}
          value={discountValue || ''}
          onChange={(e) => {
            const raw = parseFloat(e.target.value) || 0
            const val = Math.max(0, raw)
            setDiscountValue(discountType === 'percent' ? Math.min(100, val) : val)
          }}
          style={{ paddingLeft: '34px' }}
          className={cn(
            'w-full bg-transparent border-0 rounded-xl pr-3.5 py-2.5 text-base md:text-sm text-ink-900 focus:outline-none font-semibold font-mono input-mobile-lg',
            errors.discount && 'text-rose-600'
          )}
        />
      </div>

      {discountType === 'percent' && discountValue > 0 && (
        <p className="text-[11px] text-ink-500 font-medium flex justify-between pt-0.5">
          <span>Applied discount:</span>
          <span className="font-mono font-bold text-rose-600">-₹{calculatedDiscountAmount.toFixed(2)}</span>
        </p>
      )}

      {errors.discount && <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.discount}</p>}
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl pb-28 md:pb-6 animate-in fade-in duration-300 relative">
      <div className="flex items-center gap-3 pb-4 border-b border-ink-100">
        <Link
          href="/"
          className="p-2.5 rounded-xl border border-ink-100 text-ink-500 hover:bg-ink-100/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink-900">
            {isEdit ? 'Edit Receipt' : 'Create New Bill'}
          </h2>
          <p className="text-sm text-ink-500 mt-0.5 font-medium">
            Issue boutique bills, apply discounts, and record payment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="bg-white border border-ink-100 rounded-2xl p-4 md:p-6 space-y-5 relative shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <div className="flex justify-between items-center border-b border-ink-100 pb-3">
              <h3 className="text-sm font-bold text-ink-900">Customer</h3>
              {customerId && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-gold-600 bg-gold-100 border border-gold-600/15 px-2.5 py-1 rounded-full">
                  <UserCheck className="w-3 h-3" /> Returning client
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <Avatar name={customerName} size="lg" />
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone number" error={errors.customerPhone}>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value)
                        setCustomerId('')
                      }}
                      className={cn(inputCls, errors.customerPhone && 'border-rose-300')}
                    />
                    {showSuggestions && customerSuggestions.length > 0 && (
                      <div className="hidden md:block absolute left-0 right-0 top-full mt-1 bg-white border border-ink-100 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto divide-y divide-ink-100">
                        {customerSuggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-paper/40 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold text-ink-900 block">{c.name}</span>
                              <span className="text-ink-400 font-mono text-xs">{c.phone}</span>
                            </div>
                            <Check className="w-3.5 h-3.5 text-gold-600" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Customer name" error={errors.customerName}>
                  <input
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="Full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={cn(inputCls, errors.customerName && 'border-rose-300')}
                  />
                </Field>
              </div>
            </div>

            {/* Mobile suggestions sheet */}
            {showSuggestions && customerSuggestions.length > 0 && (
              <>
                <div
                  onClick={() => setShowSuggestions(false)}
                  className="fixed inset-0 bg-ink-900/35 backdrop-blur-[2px] z-40 md:hidden"
                />
                <div className="fixed inset-x-0 bottom-0 bg-white border-t border-ink-100 rounded-t-2xl shadow-xl z-50 p-4 pb-safe md:hidden max-h-[45vh] flex flex-col">
                  <div className="flex justify-between items-center pb-3 border-b border-ink-100 mb-2">
                    <span className="text-xs font-bold text-ink-900">Matching clients</span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-400"
                      aria-label="Close suggestions"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto divide-y divide-ink-100 flex-1">
                    {customerSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left py-3 px-1 text-sm flex justify-between items-center active:bg-paper"
                      >
                        <div>
                          <span className="font-bold text-ink-900 block">{c.name}</span>
                          <span className="text-xs text-ink-500 font-mono">+91 {c.phone}</span>
                        </div>
                        <Check className="w-4 h-4 text-gold-600" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Field label="Address" hint="Optional">
              <input
                type="text"
                autoComplete="street-address"
                enterKeyHint="done"
                placeholder="Residential address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Line items */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-paper/50 border border-ink-100 rounded-2xl px-4 md:px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Garments & services</h3>
                <p className="text-[11px] text-ink-500 font-medium">GST flat @ 12% (CGST 6% + SGST 6%)</p>
              </div>
              <Button type="button" variant="ink" size="sm" onClick={addItem}>
                <Plus className="w-3.5 h-3.5" /> Add item
              </Button>
            </div>

            {/* Templates */}
            <div className="flex flex-wrap gap-2">
              {ITEM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-ink-100 bg-white text-ink-600 hover:border-gold-600/40 hover:bg-gold-100/40 hover:text-ink-900 transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {errors.items && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.items}</p>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-ink-100 rounded-2xl p-4 md:p-5 space-y-4 hover:border-ink-300 transition-all relative"
                >
                  <div className="flex justify-between items-center border-b border-ink-100 pb-2.5">
                    <span className="text-[11px] font-bold text-gold-600 bg-gold-100 border border-gold-600/15 rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <Sparkle className="w-3 h-3" /> Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-ink-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5 space-y-1">
                      <label className={labelCls}>Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Bridal Lehenga custom fitting"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className={labelCls}>Category</label>
                      <select
                        value={CATEGORIES.includes(item.category as any) ? item.category : 'Other'}
                        onChange={(e) => {
                          const val = e.target.value
                          handleItemChange(index, 'category', val)
                          if (val === 'Other') {
                            setItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, customCategory: it.customCategory || '' } : it))
                            )
                          }
                        }}
                        className={inputCls}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Other">+ Other (Custom)</option>
                      </select>
                      {(!CATEGORIES.includes(item.category as any) || item.category === 'Other') && (
                        <div className="pt-1.5">
                          <input
                            type="text"
                            placeholder="Enter custom category"
                            value={item.customCategory !== undefined ? item.customCategory : (CATEGORIES.includes(item.category as any) ? '' : item.category === 'Other' ? '' : item.category)}
                            onChange={(e) => {
                              const val = e.target.value
                              setItems((prev) =>
                                prev.map((it, i) => (i === index ? { ...it, customCategory: val } : it))
                              )
                            }}
                            className={cn(inputCls, 'text-xs border-gold-600/40 bg-gold-100/10 focus:border-gold-600')}
                          />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-1 space-y-1">
                      <label className={labelCls}>Qty</label>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={cn(inputCls, 'text-center')}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className={labelCls}>Rate (₹)</label>
                      <div className="relative rounded-xl border border-ink-100 bg-white focus-within:border-gold-600 focus-within:ring-2 focus-within:ring-gold-600/15">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={item.rate || ''}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-0 rounded-xl pl-8 pr-3.5 py-2.5 text-base md:text-sm text-ink-900 focus:outline-none text-right font-semibold font-mono input-mobile-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-paper/50 rounded-xl p-3 border border-ink-100/50 text-[11px] font-semibold">
                    <span className="text-ink-500 font-mono">{item.hsnSacCode}</span>
                    <div className="flex items-center gap-1.5 text-ink-900 font-bold">
                      <span className="text-ink-500 font-medium">Line total</span>
                      <span className="text-xs bg-white border border-ink-100 px-2.5 py-1 rounded-lg font-mono tabular-nums">
                        ₹{item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-100 hover:border-gold-600/40 text-ink-400 hover:text-ink-900 bg-white/50 hover:bg-white py-4 rounded-2xl text-xs font-bold transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add another item
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white border border-ink-100 rounded-2xl p-5 space-y-4 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <h3 className="text-xs font-bold text-ink-900 tracking-wide border-b border-ink-100 pb-2">
              Bill date
            </h3>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="hidden md:block bg-white border border-ink-100 rounded-2xl p-5 space-y-5 sticky top-6 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
            <h3 className="text-xs font-bold text-ink-900 tracking-wide border-b border-ink-100 pb-2">
              Checkout summary
            </h3>
            {summaryBlock}

            <div className="pt-3 border-t border-ink-100">
              {renderDiscountControl()}
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Payment mode</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentModes.map((item) => {
                  const active = paymentMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setPaymentMode(item.mode)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all min-h-[44px] justify-center',
                        active
                          ? 'bg-ink-900 border-ink-900 text-white'
                          : 'bg-white border-ink-100 text-ink-500 hover:bg-ink-100/20'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Button
              type="button"
              variant="gold"
              className="w-full uppercase tracking-wider text-xs"
              loading={submitting}
              onClick={handleSubmit}
            >
              <Sparkles className="w-4 h-4" />
              Generate & print receipt
            </Button>
          </div>

          {/* Mobile checkout fields */}
          <div className="md:hidden bg-white border border-ink-100 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-ink-900 tracking-wide border-b border-ink-100 pb-2">
              Checkout details
            </h3>
            {renderDiscountControl()}
            <div className="space-y-2">
              <label className={labelCls}>Payment mode</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentModes.map((item) => {
                  const active = paymentMode === item.mode
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setPaymentMode(item.mode)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[11px] font-bold min-h-[44px] justify-center',
                        active
                          ? 'bg-ink-900 border-ink-900 text-white'
                          : 'bg-white border-ink-100 text-ink-500'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed CTA — sits above bottom tab bar */}
      <div className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-white border-t border-ink-100 p-3 z-30 flex items-center justify-between gap-4 shadow-[0_-8px_30px_rgba(26,24,20,0.08)]">
        <div>
          <span className="block text-[11px] text-ink-400 tracking-wide font-bold">Total</span>
          <span className="font-serif text-lg font-bold text-ink-900 font-mono tabular-nums border-b-2 border-gold-600">
            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Button type="button" variant="gold" loading={submitting} onClick={handleSubmit} className="flex-1 max-w-[200px] text-xs uppercase">
          <Sparkles className="w-4 h-4" />
          Generate bill
        </Button>
      </div>
    </div>
  )
}
