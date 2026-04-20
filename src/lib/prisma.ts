import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'

import * as path from 'path'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true, // sslmode=verify-full
    ca: fs.readFileSync(path.join(process.cwd(), 'certs', 'global-bundle.pem')).toString(), // sslrootcert
  },
})
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
