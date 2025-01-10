import { z } from 'zod'

export const createDMChannelSchema = z.object({
  other_user_id: z.string().uuid()
})

export const sendDMMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  client_generated_id: z.string()
}) 