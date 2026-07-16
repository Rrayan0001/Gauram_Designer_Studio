import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''

    const customers = await prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query } },
            ],
          }
        : undefined,
      include: {
        invoices: {
          select: {
            totalAmount: true,
            amountPaid: true,
            pendingAmount: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const summary = customers.map((c) => {
      const totalBilled = c.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const totalPaid = c.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
      const totalPending = c.invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0)

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        totalBilled,
        totalPaid,
        totalPending,
        orderCount: c.invoices.length,
      }
    })

    return NextResponse.json(summary)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, address } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 })
    }

    const existing = await prisma.customer.findUnique({
      where: { phone },
    })

    if (existing) {
      const updated = await prisma.customer.update({
        where: { phone },
        data: {
          name,
          address: address || existing.address,
        },
      })
      return NextResponse.json(updated)
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
      },
    })

    return NextResponse.json(customer)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
