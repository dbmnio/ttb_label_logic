import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') })

// Setup Database connection
const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/Users/dave/.local/ssh/global-bundle.pem').toString(),
  },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Setup SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL

async function runTest() {
  if (!SQS_QUEUE_URL) {
    console.error('❌ SQS_QUEUE_URL is not set in .env')
    process.exit(1)
  }

  console.log('🌱 Creating a fresh PENDING application in the database...')
  
  // 1. Create a "PENDING" application in the database, with no verification data yet
  const app = await prisma.application.create({
    data: {
      ttb_id: 'TEST-' + Math.floor(Math.random() * 100000),
      brand_name: 'Mock Bourbon AI Test',
      alcohol_type: 'DISTILLED_SPIRITS',
      status: 'PENDING',
      images: {
        create: [
          {
            type: 'FRONT',
            s3_key: 'bourbon.jpg' // Points to the file we just uploaded
          }
        ]
      }
    }
  })

  console.log(`✅ Created Application ID: ${app.id}`)
  console.log('📤 Sending message to SQS queue to trigger the AI Worker...')

  // 2. Send the message to SQS so the worker picks it up
  const command = new SendMessageCommand({
    QueueUrl: SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ applicationId: app.id }),
  })

  try {
    const result = await sqsClient.send(command)
    console.log(`✅ Successfully sent message to SQS. MessageId: ${result.MessageId}`)
    console.log('\n⏳ You can now run the worker using: npm run worker')
    console.log(`Once the worker completes, the application status will change to READY and you can view it at http://localhost:3000/queue`)
    console.dir(result, {depth: 5});
  } catch (error) {
    console.error('❌ Failed to send SQS message:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runTest()
