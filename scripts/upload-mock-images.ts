import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') })

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // AWS SDK automatically uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from env
})

const bucketName = process.env.S3_BUCKET_NAME
const bucketPrefix = process.env.S3_BUCKET_PREFIX || 'ttb_labeler/'

if (!bucketName) {
  console.error("❌ Error: S3_BUCKET_NAME is not defined in .env")
  process.exit(1)
}

const mockDir = path.join(__dirname, '../mock-labels')

async function uploadMockImages() {
  console.log(`🚀 Starting upload to bucket: ${bucketName}`)
  
  if (!fs.existsSync(mockDir)) {
    console.error(`❌ Directory not found: ${mockDir}`)
    console.log("Creating directory... Please place test images (e.g. bourbon.jpg) in the 'mock-labels' folder and run again.")
    fs.mkdirSync(mockDir, { recursive: true })
    return
  }

  const files = fs.readdirSync(mockDir)
  
  if (files.length === 0) {
    console.log(`⚠️ No files found in ${mockDir}. Please add some images (e.g., .jpg, .png) to test.`)
    return
  }

  for (const file of files) {
    // Skip hidden files
    if (file.startsWith('.')) continue

    const filePath = path.join(mockDir, file)
    const fileContent = fs.readFileSync(filePath)
    
    // Create the full S3 key (e.g., ttb_labeler/bourbon.jpg)
    const s3Key = `${bucketPrefix}${file}`

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg'
    })

    try {
      await s3Client.send(command)
      console.log(`✅ Successfully uploaded: ${s3Key}`)
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error)
    }
  }
  
  console.log('🎉 Upload script complete.')
}

uploadMockImages()
