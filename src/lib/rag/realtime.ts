import { Message, ConversationType } from '@/types'
import { processMessageForEmbedding } from './messages'
import { upsertVectors } from './pinecone'
import { generateEmbeddings } from './embeddings'

// Error types for better error handling
export enum ProcessingErrorType {
  VALIDATION = 'validation',
  EMBEDDING = 'embedding',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}

export class ProcessingError extends Error {
  constructor(
    message: string,
    public type: ProcessingErrorType,
    public messageId: string
  ) {
    super(message)
    this.name = 'ProcessingError'
  }
}

interface ProcessMessageOptions {
  // Which conversation types to process
  processTypes: ConversationType[]
  // Whether to throw errors (default: false, just log them)
  throwErrors: boolean
  // Custom namespace prefix (default: conversation type)
  namespacePrefix?: string
}

const DEFAULT_OPTIONS: Required<Omit<ProcessMessageOptions, 'namespacePrefix'>> = {
  processTypes: ['channel' as const], // Default to only processing channel messages
  throwErrors: false
}

/**
 * Validates and formats a namespace string
 * Ensures consistent namespace format across the application
 */
function formatNamespace(prefix: string, conversationType: ConversationType, conversationId: string): string {
  // Remove any invalid characters
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9-_]/g, '')
  const cleanType = conversationType.replace(/[^a-zA-Z0-9-_]/g, '')
  
  return `${cleanPrefix}-${cleanType}-${conversationId}`
}

/**
 * Process a message in the background for RAG
 * @param message The message to process
 * @param options Configuration options for processing
 * @returns Promise<boolean> Whether the message was processed successfully
 * @throws {ProcessingError} When throwErrors is true and an error occurs
 */
export async function processMessageBackground(
  message: Message,
  options?: Partial<ProcessMessageOptions>
): Promise<boolean> {
  const finalOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  }

  try {
    // Validate message
    if (!message.content?.trim()) {
      throw new ProcessingError(
        'Message content is empty',
        ProcessingErrorType.VALIDATION,
        message.id
      )
    }

    // Check if we should process this message type
    if (!finalOptions.processTypes.includes(message.conversation_type)) {
      return false
    }

    try {
      // Process message for embedding
      const vectorMessage = processMessageForEmbedding(message)

      // Generate embedding
      const [embedding] = await generateEmbeddings([message.content]).catch(error => {
        throw new ProcessingError(
          `Failed to generate embedding: ${error.message}`,
          ProcessingErrorType.EMBEDDING,
          message.id
        )
      })
      
      // Add embedding to vector message
      const vectorWithEmbedding = {
        ...vectorMessage,
        embedding
      }

      // Determine and format namespace
      const basePrefix = finalOptions.namespacePrefix || 'rag'
      const namespace = formatNamespace(basePrefix, message.conversation_type, message.conversation_id)

      // Upload to vector database
      await upsertVectors([vectorWithEmbedding], namespace).catch(error => {
        throw new ProcessingError(
          `Failed to store vector: ${error.message}`,
          ProcessingErrorType.STORAGE,
          message.id
        )
      })

      return true
    } catch (error) {
      if (error instanceof ProcessingError) {
        throw error
      }
      throw new ProcessingError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ProcessingErrorType.UNKNOWN,
        message.id
      )
    }
  } catch (error) {
    const errorMessage = error instanceof ProcessingError
      ? `${error.type} error processing message ${error.messageId}: ${error.message}`
      : `Unknown error processing message ${message.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
    
    console.error(errorMessage)
    
    if (finalOptions.throwErrors) {
      throw error
    }
    
    return false
  }
}

/**
 * Process multiple messages in the background
 * Continues processing even if some messages fail
 */
export async function processMessagesBackground(
  messages: Message[],
  options?: Partial<ProcessMessageOptions>
): Promise<{
  successful: string[] // IDs of successfully processed messages
  failed: Array<{ id: string; error: ProcessingErrorType }> // IDs and error types of failed messages
}> {
  const results = await Promise.allSettled(
    messages.map(msg => processMessageBackground(msg, options))
  )

  return results.reduce((acc, result, index) => {
    const messageId = messages[index].id
    if (result.status === 'fulfilled' && result.value) {
      acc.successful.push(messageId)
    } else {
      const error = result.status === 'rejected' && result.reason instanceof ProcessingError
        ? result.reason.type
        : ProcessingErrorType.UNKNOWN
      acc.failed.push({ id: messageId, error })
    }
    return acc
  }, {
    successful: [] as string[],
    failed: [] as Array<{ id: string; error: ProcessingErrorType }>
  })
}

// Deprecated functions and types below

/**
 * @deprecated Use ProcessMessageOptions instead
 */
export interface LegacyProcessOptions {
  throwErrors?: boolean
  namespace?: string
}

/**
 * @deprecated Use processMessageBackground with processTypes: ['channel'] instead
 */
export async function processChannelMessage(message: Message, options?: LegacyProcessOptions): Promise<boolean> {
  console.warn('Deprecated: Use processMessageBackground with processTypes: ["channel"] instead')
  return processMessageBackground(message, {
    processTypes: ['channel'],
    throwErrors: options?.throwErrors,
    namespacePrefix: options?.namespace
  })
}

/**
 * @deprecated Use processMessageBackground with processTypes: ['dm'] instead
 */
export async function processDMMessage(message: Message, options?: LegacyProcessOptions): Promise<boolean> {
  console.warn('Deprecated: Use processMessageBackground with processTypes: ["dm"] instead')
  return processMessageBackground(message, {
    processTypes: ['dm'],
    throwErrors: options?.throwErrors,
    namespacePrefix: options?.namespace
  })
}

/**
 * @deprecated Use processMessagesBackground instead
 */
export async function processChannelMessages(messages: Message[], options?: LegacyProcessOptions): Promise<string[]> {
  console.warn('Deprecated: Use processMessagesBackground instead')
  const results = await processMessagesBackground(messages, {
    processTypes: ['channel'],
    throwErrors: options?.throwErrors,
    namespacePrefix: options?.namespace
  })
  return results.successful
} 