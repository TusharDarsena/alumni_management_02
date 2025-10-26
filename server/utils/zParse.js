import { z } from "zod";

export async function zParse(body, schema, res) {
  const result = await schema.safeParseAsync(body);

  if (!result.success) {
    res.status(400).json({ message: result.error.message });
    return null;
  }

  return result.data;
}
