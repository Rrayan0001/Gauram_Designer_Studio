import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with default business settings only...')

  // Only ensure default BusinessSettings exist — no fake customers or invoices
  const settings = await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Gauram Designer Studio',
      address: '2nd Floor, RRR Complex, No. 5, Budigere Rd, near Raymond Store, Devanahalli, Bengaluru, Karnataka 562110',
      phone: '+91 99004 69746',
      email: 'gauramfashionacademy@gmail.com',
      website: 'www.gauramfashionacademy.com',
      gstin: '29GYCPP4290P1ZG',
      termsAndConds:
        '1. Advance payment is non-refundable.\n2. Rental deposit terms apply.\n3. Alteration requests are accepted within 7 days of delivery.\n4. Rental outfits must be returned in original condition; damage charges apply.',
      invoicePrefix: 'GDS/2026/',
      nextInvoiceNum: 1,
    },
  })

  console.log('Business settings ready:', settings.name)
  console.log('Seed complete — no fake customers or invoices added.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
