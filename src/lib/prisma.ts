import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Establecer la zona horaria a México (solo PostgreSQL)
async function setTimezone() {
  try {
    await prisma.$executeRaw`SET TIME ZONE 'America/Mexico_City'`
  } catch (error) {
    console.warn('No se pudo establecer la zona horaria (quizás no es PostgreSQL):', error)
  }
}

// Ejecutar al inicio y luego en cada conexión si es necesario
setTimezone()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma