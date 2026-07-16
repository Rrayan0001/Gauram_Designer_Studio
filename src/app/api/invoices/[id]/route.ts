import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hsnForCategory, roundMoney, statusFromAmounts } from '@/lib/billing'

function mapItems(items: Array<Record<string, unknown>>) {
  return items.map((item) => {
    const category = String(item.category || "Women's Wear")
    const quantity = parseInt(String(item.quantity ?? 1), 10) || 1
    const rate = parseFloat(String(item.rate ?? 0)) || 0
    const discount = parseFloat(String(item.discount ?? 0)) || 0
    const amount =
      item.amount !== undefined && item.amount !== null
        ? parseFloat(String(item.amount)) || 0
        : roundMoney(quantity * rate - discount)

    return {
      description: String(item.description || ''),
      category,
      hsnSacCode: String(item.hsnSacCode || hsnForCategory(category)),
      quantity,
      rate,
      discount,
      amount,
    }
  })
}

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, payments: true },
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
      isFinalizing,
      subtotal,
      discountAmount = existingInvoice.discountAmount ?? 0,
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountPaid = existingInvoice.amountPaid,
      paymentMode = existingInvoice.paymentMode,
      items = [],
    } = body

    const paid = parseFloat(String(amountPaid)) || 0
    const total = parseFloat(String(totalAmount)) || 0
    const discount = roundMoney(parseFloat(String(discountAmount)) || 0)
    const mappedItems = mapItems(items)

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      let resolvedCustomerId = customerId || existingInvoice.customerId
      if (!customerId && customerName && customerPhone) {
        const customer = await tx.customer.upsert({
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

      let orderId = existingInvoice.orderId
      let status = existingInvoice.status
      let createInitialPayment = false

      if (existingInvoice.status === 'draft') {
        if (isFinalizing) {
          const settings = await tx.businessSettings.findUnique({
            where: { id: 'default' },
          })
          if (!settings) {
            throw new Error('Business settings not found.')
          }

          const updatedSettings = await tx.businessSettings.update({
            where: { id: 'default' },
            data: { nextInvoiceNum: { increment: 1 } },
          })
          const seqNum = updatedSettings.nextInvoiceNum - 1
          orderId = `${settings.invoicePrefix}${String(seqNum).padStart(4, '0')}`
          status = statusFromAmounts(total, paid)
          createInitialPayment = paid > 0
        }
      } else {
        // Finalized invoices: recompute status from amounts
        status = statusFromAmounts(total, paid)
      }

      const pendingAmount = total - paid

      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })

      if (createInitialPayment) {
        await tx.payment.create({
          data: {
            invoiceId: id,
            amount: paid,
            mode: paymentMode,
            note: 'Initial payment recorded during invoice finalization.',
            date: invoiceDate ? new Date(invoiceDate) : new Date(),
          },
        })
      }

      return tx.invoice.update({
        where: { id },
        data: {
          orderId,
          customerId: resolvedCustomerId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : existingInvoice.invoiceDate,
          status,
          subtotal: parseFloat(String(subtotal)) || 0,
          discountAmount: discount,
          cgstAmount: parseFloat(String(cgstAmount)) || 0,
          sgstAmount: parseFloat(String(sgstAmount)) || 0,
          totalAmount: total,
          amountPaid: paid,
          pendingAmount,
          paymentMode,
          items: {
            create: mappedItems,
          },
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      })
    })

    return NextResponse.json(updatedInvoice)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error updating invoice:', error)
    return NextResponse.json({ error: message }, { status: 500 })
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
