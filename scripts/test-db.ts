import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('--- Database Verification Test ---')
  try {
    // 1. Fetch Business Settings
    const settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' },
    })
    console.log('✅ Settings Fetch: SUCCESS')
    console.log(`   Business Name: ${settings?.name}`)
    console.log(`   GSTIN: ${settings?.gstin}`)

    // 2. Fetch Customers
    const customers = await prisma.customer.findMany()
    console.log('✅ Customers Fetch: SUCCESS')
    console.log(`   Total Customers: ${customers.length}`)
    customers.forEach((c) => {
      console.log(`   - ${c.name} (${c.phone})`)
    })

    // 3. Fetch Invoices and calculate outstanding dues sum
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: true,
      },
    })
    console.log('✅ Invoices Fetch: SUCCESS')
    console.log(`   Total Invoices: ${invoices.length}`)
    
    let totalDuesSum = 0
    invoices.forEach((inv) => {
      totalDuesSum += inv.pendingAmount
      console.log(`   - Order ID: ${inv.orderId || 'Draft'}, Customer: ${inv.customer.name}, Status: ${inv.status}, Dues: ₹${inv.pendingAmount}`)
    })
    console.log(`   Total Dues Sum: ₹${totalDuesSum}`)

    console.log('---------------------------------')
    console.log('🎉 ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!')
  } catch (error) {
    console.error('❌ Database Verification Test: FAILED', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
