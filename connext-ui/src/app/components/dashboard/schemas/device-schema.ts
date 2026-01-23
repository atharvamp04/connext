// schemas/node-schema.ts
import { z } from "zod"

export const nodeSchema = z.object({
  id: z.number(),
  pubkey: z.string(),
  name: z.string(),
  ip: z.string(),
  region: z.string(),
  status: z.enum(["online", "offline"]),
  last_seen: z.string(),
})

export type Node = z.infer<typeof nodeSchema>
