import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true, // sslmode=verify-full
    ca: fs.readFileSync('/Users/dave/.local/ssh/global-bundle.pem').toString(), // sslrootcert
  },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create a mock application
  const app = await prisma.application.create({
    data: {
      ttb_id: 'TTB-' + Math.floor(Math.random() * 100000),
      brand_name: 'Mock Bourbon',
      alcohol_type: 'DISTILLED_SPIRITS',
      status: 'READY',
      images: {
        create: [
          {
            type: 'FRONT',
            s3_key: 'mock/front-label.jpg'
          }
        ]
      },
      verification: {
        create: {
          checklist_json: {
            brand_name: { value: 'Mock Bourbon', polygon_id: 1 },
            class_type: { value: 'Kentucky Straight Bourbon Whiskey', polygon_id: 2 },
            net_contents: { value: '750 ml', polygon_id: 3 },
            alcohol_content: { value: '45% ALC/VOL', polygon_id: 4 },
            government_warning: { value: true, polygon_id: 5 }
          },
          raw_ocr_json: [
            { Id: 1, Type: 'LINE', DetectedText: 'Mock Bourbon', Geometry: { BoundingBox: { Width: 0.5, Height: 0.1, Left: 0.25, Top: 0.1 } } },
            { Id: 2, Type: 'LINE', DetectedText: 'Kentucky Straight Bourbon Whiskey', Geometry: { BoundingBox: { Width: 0.6, Height: 0.05, Left: 0.2, Top: 0.25 } } },
            { Id: 3, Type: 'LINE', DetectedText: '750 ml', Geometry: { BoundingBox: { Width: 0.2, Height: 0.05, Left: 0.1, Top: 0.8 } } },
            { Id: 4, Type: 'LINE', DetectedText: '45% ALC/VOL', Geometry: { BoundingBox: { Width: 0.3, Height: 0.05, Left: 0.6, Top: 0.8 } } },
            { Id: 5, Type: 'LINE', DetectedText: 'GOVERNMENT WARNING: ...', Geometry: { BoundingBox: { Width: 0.8, Height: 0.1, Left: 0.1, Top: 0.9 } } }
          ]
        }
      }
    }
  })

  console.log('Created mock application with ID:', app.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })