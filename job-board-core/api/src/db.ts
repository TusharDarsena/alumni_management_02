// Use a default-import fallback so the import works whether the package is resolved as ESM or CJS.
import _prismaPkg from "@prisma/client"
const { PrismaClient } = _prismaPkg as any

export const db = new PrismaClient()
