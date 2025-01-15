import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().optional(),
    PINECONE_API_KEY: z.string().optional(),
    PINECONE_ENVIRONMENT: z.string().optional(),
    PINECONE_INDEX: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    PINECONE_INDEX: process.env.PINECONE_INDEX,
  },
}) 