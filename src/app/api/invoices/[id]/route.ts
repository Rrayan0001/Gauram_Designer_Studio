import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 1. Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      invoiceDate,
      isFinalizing, // set to true if updating from draft to finalized
      subtotal,
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountPaid = existingInvoice.amountPaid,
      paymentMode = existingInvoice.paymentMode,
      items = [],
    } = body

    // 2. Resolve Customer if details changed
    let resolvedCustomerId = customerId || existingInvoice.customerId
    if (!customerId && customerName && customerPhone) {
      const customer = await prisma.customer.upsert({
        where: { phone: customerPhone },
        update: {
          name: customerName,
          address: customerAddress || undefined,
        },
        create: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress || undefined,
        },
      })
      resolvedCustomerId = customer.id
    }

    // 3. Finalization Checks & Number Locking
    let orderId = existingInvoice.orderId
    let status = existingInvoice.status

    if (existingInvoice.status === 'draft') {
      if (isFinalizing) {
        const settings = await prisma.businessSettings.findUnique({
          where: { id: 'default' },
        })
        if (!settings) {
          return NextResponse.json({ error: 'Business settings not found.' }, { status: 500 })
        }

        const prefix = settings.invoicePrefix
        const seqNum = settings.nextInvoiceNum
        const formattedSeq = String(seqNum).padStart(4, '0')
        orderId = `${prefix}${formattedSeq}`

        // Recalculate status based on amount paid
        const pending = totalAmount - amountPaid
        if (pending <= 0) {
          status = 'paid'
        } else if (amountPaid > 0) {
          status = 'partial'
        } else {
          status = 'pending'
        }

        // Increment sequence in settings
        await prisma.businessSettings.update({
          where: { id: 'default' },
          data: { nextInvoiceNum: seqNum + 1 },
        })

        // Also, record the initial payment if payment is recorded now
        if (amountPaid > 0) {
          await prisma.payment.create({
            data: {
              invoiceId: id,
              amount: amountPaid,
              mode: paymentMode,
              note: 'Initial payment recorded during invoice finalization.',
              date: invoiceDate ? new Date(invoiceDate) : new Date(),
            }
          })
        }
      }
    } else {
      // For finalized invoices, recompute status based on updated amounts
      const pending = totalAmount - amountPaid
      if (pending <= 0) {
        status = 'paid'
      } else if (amountPaid > 0) {
        status = 'partial'
      } else {
        status = 'pending'
      }
    }

    const pendingAmount = totalAmount - amountPaid

    // 4. Update Invoice - Re-create all items for simplicity
    // delete previous items first
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    })

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        orderId,
        customerId: resolvedCustomerId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : existingInvoice.invoiceDate,
        status,
        subtotal,
        cgstAmount,
        sgstAmount,
        totalAmount,
        amountPaid,
        pendingAmount,
        paymentMode,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            category: item.category,
            hsnSacCode: item.hsnSacCode,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount || 0,
            amount: item.amount,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.invoice.delete({
      where: { id },
    })
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully.' })
  } catch (error: any) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
