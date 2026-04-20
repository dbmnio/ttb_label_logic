'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function approveApplication(id: string) {
  await prisma.application.update({
    where: { id },
    data: {
      status: 'PROCESSED',
      user_id: null,
      locked_at: null
    }
  })
  
  redirect('/queue')
}

export async function rejectApplication(id: string, reason: string) {
  // In a real system, you might save the rejection reason to a comment history
  await prisma.application.update({
    where: { id },
    data: {
      status: 'PENDING', // send back to start or a separate REJECTED state
      user_id: null,
      locked_at: null
    }
  })
  
  redirect('/queue')
}
