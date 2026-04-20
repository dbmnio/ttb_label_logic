'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function lockAndSelectApplication(applicationId: string) {
  const currentUserId = 'worker_123' // Hardcoded for MVP

  // Transaction for concurrency control
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.findUnique({
        where: { id: applicationId }
      })

      if (!app) {
        throw new Error('Application not found')
      }

      if (app.status !== 'READY') {
        throw new Error('Application is not ready for verification')
      }

      if (app.user_id && app.user_id !== currentUserId) {
        // Check if lock expired (e.g. lock expires after 30 mins)
        const lockExpired = app.locked_at && (new Date().getTime() - app.locked_at.getTime() > 30 * 60 * 1000)
        if (!lockExpired) {
          throw new Error('Application is currently locked by another worker')
        }
      }

      // Lock it
      return await tx.application.update({
        where: { id: applicationId },
        data: {
          user_id: currentUserId,
          locked_at: new Date(),
          status: app.status // It must be READY based on the check above
        }
      })
    })
  } catch (error) {
    console.error("Locking error:", error)
    throw error
  }

  if (updated) {
    redirect(`/verify/${applicationId}`)
  }
}