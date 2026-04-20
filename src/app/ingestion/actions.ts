'use server'

import { prisma } from '@/lib/prisma'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { SendMessageCommand } from '@aws-sdk/client-sqs'
import { v4 as uuidv4 } from 'uuid'
import { AlcoholType, LabelType } from '@prisma/client'
import { s3Client, sqsClient, SQS_QUEUE_URL } from '@/worker/config'

async function uploadToS3(file: File, ttbId: string, type: LabelType) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const ext = file.name.split('.').pop() || 'jpg'
  const key = `labels/${ttbId}/${type}-${uuidv4()}.${ext}`

  // In local development, you might be using AWS SSO, `~/.aws/credentials`, or aws-vault, 
  // so we shouldn't rely on AWS_ACCESS_KEY_ID to determine if we are mocking.
  // Instead, we will only mock if explicitly told to via an environment variable.
  const isMock = process.env.MOCK_AWS === 'true'

  if (!isMock) {
    await s3Client.send(new PutObjectCommand({
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
          { type: 'FRONT' as const, s3_key: frontKey },
          ...(backKey ? [{ type: 'BACK' as const, s3_key: backKey }] : [])
        ]
      }
    }
  })

  const isMock = process.env.MOCK_AWS === 'true'

  if (!isMock) {
    await sqsClient.send(new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL || '',
      MessageBody: JSON.stringify({ applicationId: application.id })
    }))
  } else {
    console.log(`[Mock SQS] Sent message for applicationId ${application.id}`)
  }

  return { success: true, applicationId: application.id }
}