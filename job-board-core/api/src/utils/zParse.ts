import { Response } from "express"
import { z } from "zod"

export async function zParse<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
  res: Response
): Promise<T | null> {
  const result = await schema.safeParseAsync(body)

  if (!result.success) {
    res.status(400).json({ message: result.error.message })
    return null
  }

  return result.data
}
