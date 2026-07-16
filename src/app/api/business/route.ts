import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function pickSettings(body: Record<string, unknown>): Prisma.BusinessSettingsUpdateInput {
  const data: Prisma.BusinessSettingsUpdateInput = {}

  if (typeof body.name === 'string') data.name = body.name
  if (typeof body.address === 'string') data.address = body.address
  if (typeof body.phone === 'string') data.phone = body.phone
  if (typeof body.email === 'string') data.email = body.email
  if (typeof body.website === 'string') data.website = body.website
  if (typeof body.gstin === 'string') data.gstin = body.gstin
  if (typeof body.termsAndConds === 'string') data.termsAndConds = body.termsAndConds
  if (typeof body.invoicePrefix === 'string') data.invoicePrefix = body.invoicePrefix
  if (typeof body.logoUrl === 'string' || body.logoUrl === null) {
    data.logoUrl = body.logoUrl as string | null
  }
  if (body.nextInvoiceNum !== undefined && body.nextInvoiceNum !== null) {
    const n = parseInt(String(body.nextInvoiceNum), 10)
    data.nextInvoiceNum = Number.isFinite(n) && n >= 1 ? n : 1
  }

  return data
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'export_db') {
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

    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' },
    })
    return NextResponse.json(settings)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const data = pickSettings(body)

    const settings = await prisma.businessSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        ...(data as Prisma.BusinessSettingsCreateInput),
      },
    })
    return NextResponse.json(settings)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const action = body?.action

    if (action === 'reset_counter') {
      const settings = await prisma.businessSettings.upsert({
        where: { id: 'default' },
        update: { nextInvoiceNum: 1 },
        create: { id: 'default', nextInvoiceNum: 1 },
      })
      return NextResponse.json({ success: true, nextInvoiceNum: settings.nextInvoiceNum })
    }

    const data = pickSettings(body)
    const settings = await prisma.businessSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        ...(data as Prisma.BusinessSettingsCreateInput),
      },
    })
    return NextResponse.json(settings)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('Error in business POST:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
