import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { statusFromAmounts } from '@/lib/billing'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, amount, mode, note, date, action } = body

    // Legacy / accidental Settings calls: redirect-compatible handlers
    if (action === 'reset_counter') {
      const settings = await prisma.businessSettings.upsert({
        where: { id: 'default' },
        update: { nextInvoiceNum: 1 },
        create: { id: 'default', nextInvoiceNum: 1 },
      })
      return NextResponse.json({ success: true, nextInvoiceNum: settings.nextInvoiceNum })
    }

    if (amount === undefined || amount === null || amount === '' || !invoiceId || !mode) {
      return NextResponse.json(
        { error: 'Invoice ID, Amount, and Payment Mode are required' },
        { status: 400 }
      )
    }

    const payAmount = parseFloat(amount)
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      })

      if (!invoice) {
        return { error: 'Invoice not found' as const, status: 404 as const }
      }

      if (invoice.status === 'draft') {
        return { error: 'Cannot record payment on a draft invoice' as const, status: 400 as const }
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: payAmount,
          mode,
          note,
          date: date ? new Date(date) : new Date(),
        },
      })

      const newAmountPaid = invoice.amountPaid + payAmount
      const newPendingAmount = invoice.totalAmount - newAmountPaid
      const newStatus = statusFromAmounts(invoice.totalAmount, newAmountPaid)

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          pendingAmount: newPendingAmount,
          status: newStatus,
          paymentMode: mode,
        },
        include: {
          payments: true,
          customer: true,
        },
      })

      return { payment, invoice: updatedInvoice }
    })

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    // Support Settings backup URL that still points at payments
    if (searchParams.get('action') === 'export_db') {
      const [settings, customers, invoices, items, payments] = await Promise.all([
        prisma.businessSettings.findMany(),
        prisma.customer.findMany(),
        prisma.invoice.findMany(),
        prisma.invoiceItem.findMany(),
        prisma.payment.findMany(),
      ])
      return NextResponse.json({
        exportedAt: new Date().toISOString(),
        businessSettings: settings,
        customers,
        invoices,
        invoiceItems: items,
        payments,
      })
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
