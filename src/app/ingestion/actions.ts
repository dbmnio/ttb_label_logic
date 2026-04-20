'use server'

import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from 'uuid'
import { AlcoholType, LabelType } from '@prisma/client'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
  }
})

const sqs = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
  }
})

async function uploadToS3(file: File, ttbId: string, type: LabelType) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const ext = file.name.split('.').pop() || 'jpg'
  const key = `labels/${ttbId}/${type}-${uuidv4()}.${ext}`

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'dummy') {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'ttb-labels-dev',
      Key: `${process.env.S3_BUCKET_PREFIX || ''}${key}`,
      Body: buffer,
      ContentType: file.type
    }))
  } else {
    console.log(`[Mock S3] Uploaded ${file.name} to ${key}`)
  }

  return key
}

export async function submitApplication(formData: FormData) {
  const ttbId = formData.get('ttbId') as string
  const brandName = formData.get('brandName') as string
  const alcoholType = formData.get('alcoholType') as AlcoholType
  const frontLabel = formData.get('frontLabel') as File
  const backLabel = formData.get('backLabel') as File | null

  if (!ttbId || !brandName || !alcoholType || !frontLabel || frontLabel.size === 0) {
    throw new Error('Missing required fields')
  }

  const frontKey = await uploadToS3(frontLabel, ttbId, 'FRONT')
  let backKey = null
  if (backLabel && backLabel.size > 0) {
    backKey = await uploadToS3(backLabel, ttbId, 'BACK')
  }

  const application = await prisma.application.create({
    data: {
      ttb_id: ttbId,
      brand_name: brandName,
      alcohol_type: alcoholType,
      images: {
        create: [
          { type: 'FRONT', s3_key: frontKey },
          ...(backKey ? [{ type: 'BACK', s3_key: backKey }] : [])
        ]
      }
    }
  })

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'dummy') {
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL || '',
      MessageBody: JSON.stringify({ applicationId: application.id })
    }))
  } else {
    console.log(`[Mock SQS] Sent message for applicationId ${application.id}`)
  }

  return { success: true, applicationId: application.id }
}