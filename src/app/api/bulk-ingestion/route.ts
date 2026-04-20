import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { parse } from 'csv-parse/sync'
import { prisma } from '@/lib/prisma'
import { SendMessageCommand } from '@aws-sdk/client-sqs'
import { sqsClient, SQS_QUEUE_URL } from '@/worker/config'
import { AlcoholType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || !file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Please upload a valid .zip file.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const zip = new AdmZip(buffer)
    const zipEntries = zip.getEntries()

    // Find records.csv
    const recordsEntry = zipEntries.find(e => e.entryName.toLowerCase() === 'records.csv' || e.entryName.toLowerCase().endsWith('/records.csv'))
    if (!recordsEntry) {
      return NextResponse.json({ error: 'records.csv not found in the zip file.' }, { status: 400 })
    }

    // Read and parse CSV
    const csvContent = recordsEntry.getData().toString('utf8')
    // Expected headers: ttb_id,brand_name,alcohol_type,image_file
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[]

    if (records.length === 0) {
      return NextResponse.json({ error: 'records.csv is empty or invalid.' }, { status: 400 })
    }

    const createdApplications = []
    const errors = []

    // Validate and process each record
    for (const [index, record] of records.entries()) {
      const { ttb_id, brand_name, alcohol_type, image_file } = record

      if (!ttb_id || !brand_name || !alcohol_type || !image_file) {
        errors.push(`Row ${index + 1}: Missing required fields (ttb_id, brand_name, alcohol_type, image_file).`)
        continue
      }

      // Check if alcohol_type is valid
      if (!Object.values(AlcoholType).includes(alcohol_type as AlcoholType)) {
        errors.push(`Row ${index + 1}: Invalid alcohol_type '${alcohol_type}'. Must be MALT_BEVERAGE, WINE, or DISTILLED_SPIRITS.`)
        continue
      }

      // Check if image exists in the zip
      // Need to handle paths correctly. The image_file might just be the filename or have a path.
      // We look for any entry that ends with the image_file name to be safe in this MVP.
      const imageEntry = zipEntries.find(e => e.entryName.endsWith(image_file))
      if (!imageEntry) {
        errors.push(`Row ${index + 1}: Image file '${image_file}' not found in the zip.`)
        continue
      }

      // 1. Create DB Record
      try {
        const app = await prisma.application.create({
          data: {
            ttb_id,
            brand_name,
            alcohol_type: alcohol_type as AlcoholType,
            status: 'PENDING',
            images: {
              create: [
                {
                  type: 'FRONT',
                  // In a real app, we would upload this image to S3 here and save the s3_key
                  // For MVP, we'll pretend it's in S3 under `bulk/${image_file}`
                  s3_key: `bulk/${image_file}`
                }
              ]
            }
          }
        })

        createdApplications.push(app)

        // 2. Trigger Background Pipeline (SQS)
        if (SQS_QUEUE_URL) {
          const sendCommand = new SendMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: JSON.stringify({ applicationId: app.id }),
          })
          await sqsClient.send(sendCommand)
        } else {
          console.warn('SQS_QUEUE_URL not set. Skipping SQS message.')
        }

      } catch (err: any) {
        // e.g. Unique constraint violation on ttb_id
        errors.push(`Row ${index + 1} (${ttb_id}): Failed to save - ${err.message}`)
      }
    }

    if (errors.length > 0 && createdApplications.length === 0) {
      return NextResponse.json({ error: 'All records failed validation or saving.', details: errors }, { status: 400 })
    }

    return NextResponse.json({
      message: `Successfully processed ${createdApplications.length} records.`,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Bulk ingestion error:', error)
    return NextResponse.json({ error: 'Internal server error while processing the zip file.' }, { status: 500 })
  }
}
