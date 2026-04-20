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
  await prisma.application.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejection_reason: reason,
      user_id: null,
      locked_at: null
    }
  })
  
  redirect('/queue')
}
