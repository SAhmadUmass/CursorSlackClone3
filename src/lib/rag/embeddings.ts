import OpenAI from 'openai'
import { env } from '@/env.mjs'
import { MessageVector } from './types'

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

interface ProcessBatchResult {
  successful: Array<MessageVector & { values: number[] }>
  failed: MessageVector[]
  error?: string
}

export async function processMessageBatches(messages: MessageVector[]): Promise<ProcessBatchResult> {
  try {
    // Extract content from messages
    const texts = messages.map(msg => msg.content)
    
    // Generate embeddings for all texts
    const embeddings = await generateEmbeddings(texts)
    
    // Combine messages with their embeddings
    const successful = messages.map((msg, index) => ({
      ...msg,
      values: embeddings[index]
    }))
    
    return {
      successful,
      failed: [],
    }
  } catch (error) {
    console.error('Error processing message batch:', error)
    return {
      successful: [],
      failed: messages,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 