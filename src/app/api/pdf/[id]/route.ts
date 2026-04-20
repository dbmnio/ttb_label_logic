import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: { images: true }
    })

    if (!application) {
      return new NextResponse('Application not found', { status: 404 })
    }

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    // Add a page
    const page = pdfDoc.addPage([600, 800])
    const { width, height } = page.getSize()

    // Title
    page.drawText('TTB FORM 5100.31 (MOCK)', {
      x: 50,
      y: height - 50,
      size: 20,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
    })

    // Metadata
    const startY = height - 100
    const lineSpacing = 25

    page.drawText(`TTB ID: ${application.ttb_id}`, { x: 50, y: startY, size: 12, font: timesBoldFont })
    page.drawText(`Brand Name: ${application.brand_name}`, { x: 50, y: startY - lineSpacing, size: 12, font: timesRomanFont })
    page.drawText(`Alcohol Type: ${application.alcohol_type.replace('_', ' ')}`, { x: 50, y: startY - 2 * lineSpacing, size: 12, font: timesRomanFont })
    page.drawText(`Current Status: ${application.status}`, { x: 50, y: startY - 3 * lineSpacing, size: 12, font: timesRomanFont })

    // "FOR TTB USE ONLY" Stamp
    const stampY = startY - 6 * lineSpacing
    page.drawRectangle({
      x: 50,
      y: stampY - 50,
      width: 300,
      height: 80,
      borderColor: application.status === 'PROCESSED' ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),
      borderWidth: 3,
    })

    const stampText = application.status === 'PROCESSED' ? 'APPROVED' : application.status
    page.drawText(stampText, {
      x: 70,
      y: stampY,
      size: 24,
      font: timesBoldFont,
      color: application.status === 'PROCESSED' ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0),
    })

    page.drawText(`Date: ${application.updated_at.toLocaleDateString()}`, {
      x: 70,
      y: stampY - 20,
      size: 10,
      font: timesRomanFont,
    })
    
    page.drawText(`Reviewer: Auto/Worker System`, {
      x: 70,
      y: stampY - 35,
      size: 10,
      font: timesRomanFont,
    })

    if (application.status === 'REJECTED' && application.rejection_reason) {
      page.drawText(`Reason: ${application.rejection_reason}`, {
        x: 70,
        y: stampY - 50,
        size: 10,
        font: timesRomanFont,
        color: rgb(0.8, 0, 0),
      })
    }

    // In a real system, you'd fetch the image bytes from S3 and embed it here:
    // const imageBytes = await getImageBytesFromS3(...)
    // const image = await pdfDoc.embedJpg(imageBytes)
    // page.drawImage(image, { x: ..., y: ..., width: ..., height: ... })

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save()

    // Return the PDF to the client
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ttb-label-${application.ttb_id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
