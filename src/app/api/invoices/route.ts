import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Build Prisma query filters
    const where: any = {}

    // Status filter
    if (status) {
      where.status = status
    }

    // Search filter: Order ID, Customer Name, Customer Phone
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        {
          customer: {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      ]
    }

    // Category filter: checks if any item matches the category
    if (category) {
      where.items = {
        some: { category },
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.invoiceDate = {}
      if (startDate) {
        where.invoiceDate.gte = new Date(startDate)
      }
      if (endDate) {
        // Set end of day for the end date
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
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
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
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountPaid = 0,
      paymentMode = 'Cash',
      items = [],
    } = body

    // 1. Resolve or Create Customer
    let resolvedCustomerId = customerId
    if (!resolvedCustomerId) {
      if (!customerName || !customerPhone) {
        return NextResponse.json({ error: 'Customer Name and Phone are required to create a new customer.' }, { status: 400 })
      }
      
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

    // 2. Fetch Business Settings for Default Terms & Sequence numbering
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' },
    })
    
    if (!settings) {
      return NextResponse.json({ error: 'Business settings not found.' }, { status: 500 })
    }

    // 3. Generate Sequential Order ID if Finalized
    let orderId = null
    let status = 'draft'
    
    if (isFinalized) {
      const prefix = settings.invoicePrefix
      const seqNum = settings.nextInvoiceNum
      const formattedSeq = String(seqNum).padStart(4, '0')
      orderId = `${prefix}${formattedSeq}`
      
      // Recalculate status based on amount paid vs total
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
    }

    const pendingAmount = totalAmount - amountPaid

    // 4. Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        customerId: resolvedCustomerId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        status,
        subtotal,
        cgstAmount,
        sgstAmount,
        totalAmount,
        amountPaid,
        pendingAmount,
        paymentMode,
        termsText: settings.termsAndConds,
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
        // Auto-record the payment record if finalized and payment made
        payments: isFinalized && amountPaid > 0 ? {
          create: {
            amount: amountPaid,
            mode: paymentMode,
            note: 'Initial payment recorded during invoice finalization.',
            date: invoiceDate ? new Date(invoiceDate) : new Date(),
          }
        } : undefined,
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
