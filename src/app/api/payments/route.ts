import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceId, amount, mode, note, date } = body

    if (!invoiceId || !amount || !mode) {
      return NextResponse.json({ error: 'Invoice ID, Amount, and Payment Mode are required' }, { status: 400 })
    }

    // 1. Fetch invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // 2. Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: parseFloat(amount),
        mode,
        note,
        date: date ? new Date(date) : new Date(),
      },
    })

    // 3. Update Invoice totals and status
    const newAmountPaid = invoice.amountPaid + parseFloat(amount)
    const newPendingAmount = invoice.totalAmount - newAmountPaid
    
    let newStatus = invoice.status
    if (newPendingAmount <= 0) {
      newStatus = 'paid'
    } else if (newAmountPaid > 0) {
      newStatus = 'partial'
    } else {
      newStatus = 'pending'
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        pendingAmount: newPendingAmount,
        status: newStatus,
      },
      include: {
        payments: true,
        customer: true,
      },
    })

    return NextResponse.json({ payment, invoice: updatedInvoice })
  } catch (error: any) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
