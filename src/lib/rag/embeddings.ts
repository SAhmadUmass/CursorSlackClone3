import OpenAI from 'openai'
import { env } from '@/env.mjs'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts,
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
} 