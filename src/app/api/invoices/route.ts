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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          },
        },
      ]
    }

    if (category) {
      where.items = {
        some: { category },
      }
    }

    if (startDate || endDate) {
      where.invoiceDate = {}
      if (startDate) {
        where.invoiceDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.invoiceDate.lte = end
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      invoiceDate,
      isFinalized,
      subtotal,
      discountAmount = 0,
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountPaid = 0,
      paymentMode = 'Cash',
      items = [],
    } = body

    const paid = parseFloat(String(amountPaid)) || 0
    const total = parseFloat(String(totalAmount)) || 0
    const discount = roundMoney(parseFloat(String(discountAmount)) || 0)
    const mappedItems = mapItems(items)

    if (!mappedItems.length || mappedItems.some((i) => !i.description || i.rate <= 0)) {
      return NextResponse.json(
        { error: 'At least one valid line item with description and rate is required.' },
        { status: 400 }
      )
    }

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Resolve or create customer
      let resolvedCustomerId = customerId as string | undefined
      if (!resolvedCustomerId) {
        if (!customerName || !customerPhone) {
          throw new Error('Customer Name and Phone are required to create a new customer.')
        }

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

      // 2. Business settings
      let settings = await tx.businessSettings.findUnique({
        where: { id: 'default' },
      })
      if (!settings) {
        settings = await tx.businessSettings.create({ data: { id: 'default' } })
      }

      // 3. Atomic order ID if finalized
      let orderId: string | null = null
      let status = 'draft'

      if (isFinalized) {
        const updatedSettings = await tx.businessSettings.update({
          where: { id: 'default' },
          data: { nextInvoiceNum: { increment: 1 } },
        })
        const seqNum = updatedSettings.nextInvoiceNum - 1
        orderId = `${settings.invoicePrefix}${String(seqNum).padStart(4, '0')}`
        status = statusFromAmounts(total, paid)
      }

      const pendingAmount = total - paid

      return tx.invoice.create({
        data: {
          orderId,
          customerId: resolvedCustomerId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          status,
          subtotal: parseFloat(String(subtotal)) || 0,
          discountAmount: discount,
          cgstAmount: parseFloat(String(cgstAmount)) || 0,
          sgstAmount: parseFloat(String(sgstAmount)) || 0,
          totalAmount: total,
          amountPaid: paid,
          pendingAmount,
          paymentMode,
          termsText: settings.termsAndConds,
          items: {
            create: mappedItems,
          },
          payments:
            isFinalized && paid > 0
              ? {
                  create: {
                    amount: paid,
                    mode: paymentMode,
                    note: 'Initial payment recorded during invoice finalization.',
                    date: invoiceDate ? new Date(invoiceDate) : new Date(),
                  },
                }
              : undefined,
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      })
    })

    return NextResponse.json(invoice)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error creating invoice:', error)
    const status = message.includes('required') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
