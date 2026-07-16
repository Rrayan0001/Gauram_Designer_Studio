'use client'

import { useState, useEffect, use } from 'react'
import InvoiceForm from '@/components/InvoiceForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Invoice not found')
        return res.json()
      })
      .then((data) => {
        if (data.status !== 'draft') {
          throw new Error('Only draft invoices can be edited.')
        }
        setInvoice(data)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <span className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Loading invoice draft...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border border-gray-200 p-6 rounded-2xl text-center space-y-4">
        <div className="text-rose-500 text-lg font-bold">Error</div>
        <p className="text-xs text-gray-500">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-100 border border-gray-300 text-gray-900 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    )
  }

  return <InvoiceForm initialInvoice={invoice} />
}
