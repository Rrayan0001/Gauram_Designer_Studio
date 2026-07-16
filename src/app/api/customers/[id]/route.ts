import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { invoiceDate: 'desc' },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Compute sums
    const totalBilled = customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalPaid = customer.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
    const totalPending = customer.invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0)

    const result = {
      ...customer,
      totalBilled,
      totalPaid,
      totalPending,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching customer detail:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
