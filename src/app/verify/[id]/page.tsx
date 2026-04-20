import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import VerificationWizard from '@/components/verification-wizard'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VerifyPage(props: PageProps) {
  const params = await props.params
  const applicationId = params.id

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      images: true,
      verification: true,
    }
  })

  if (!application) {
    notFound()
  }

  if (application.status !== 'READY') {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center p-10 bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Application Not Ready</h2>
          <p className="text-muted-foreground">
            This application is currently in the {application.status} state. It cannot be verified until automated processing is complete.
          </p>
          <a href="/queue" className="text-primary hover:underline">
            Return to Queue
          </a>
        </div>
      </div>
    )
  }

  // For this prototype, we'll assume the front image is the one we want to verify.
  const frontImage = application.images.find(img => img.type === 'FRONT') || application.images[0]
  
  let presignedUrl = ''
  if (frontImage) {
    const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'ttb-label-images',
      Key: `${process.env.S3_BUCKET_PREFIX || ''}${frontImage.s3_key}`
    })
    try {
      presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    } catch (error) {
      console.error("Failed to generate presigned URL for image:", error)
    }
  }
  
  // Transform DB output into something easily usable by the client
  // Fallback to empty states if no verification data yet
  const checklistData = application.verification?.checklist_json || {}
  const rawOcrData = application.verification?.raw_ocr_json || []

  return (
    <div className="flex-1 w-full flex flex-col bg-background">
      {/* Main split screen */}
      <main className="flex-1 overflow-hidden">
        <VerificationWizard
          applicationId={application.id}
          imageUrl={presignedUrl}
          checklistData={checklistData as any}
          rawOcrData={rawOcrData as any}
        />
      </main>
    </div>
  )
}
