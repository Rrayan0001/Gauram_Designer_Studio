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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, address, notes } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    if (phone !== undefined && !phone.trim()) {
      return NextResponse.json({ error: 'Phone cannot be empty' }, { status: 400 })
    }

    if (phone) {
      const existing = await prisma.customer.findFirst({
        where: {
          phone,
          id: { not: id }
        }
      })
      if (existing) {
        return NextResponse.json({ error: 'Phone number is already registered to another client' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (address !== undefined) updateData.address = address.trim() || null
    if (notes !== undefined) updateData.notes = notes

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating customer details:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { invoices: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      const invoiceIds = customer.invoices.map((inv) => inv.id)

      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({
          where: { invoiceId: { in: invoiceIds } }
        })

        await tx.invoiceItem.deleteMany({
          where: { invoiceId: { in: invoiceIds } }
        })

        await tx.invoice.deleteMany({
          where: { customerId: id }
        })
      }

      await tx.customer.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Customer and all associated records deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
