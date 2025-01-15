import { OpenAI } from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { MessageSource } from '@/types'
import { env } from '@/env.mjs'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

const pinecone = new Pinecone()

const SYSTEM_PROMPT = `You are a friendly and helpful AI assistant in a chat application. While you have access to conversation history and can help users find past discussions, you can also engage in general conversation about any topic.

Feel free to:
- Have natural, friendly conversations
- Share knowledge and insights
- Help with questions and tasks
- Make relevant suggestions

When referencing past messages:
- Quote relevant parts when helpful
- Provide context about the conversation
- Be natural about incorporating past context

Keep your responses:
- Friendly and conversational
- Clear and helpful
- Natural and engaging

If you don't find relevant context for a question, just respond normally as a helpful assistant would. You don't need to always reference past messages.`

export async function POST(request: Request) {
  try {
    console.log('AI Chat: Received request')
    
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('AI Chat: No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, conversation_id } = await request.json()
    console.log('AI Chat: Query received:', query)

    if (!query || !conversation_id) {
      console.log('AI Chat: Missing required fields')
      return NextResponse.json({ error: 'Query and conversation_id are required' }, { status: 400 })
    }

    // Initialize Pinecone
    console.log('AI Chat: Initializing Pinecone')
    const index = pinecone.Index(env.PINECONE_INDEX_TWO!)

    // Get query embedding
    console.log('AI Chat: Generating query embedding')
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    })

    // Search Pinecone with metadata
    console.log('AI Chat: Searching Pinecone')
    const queryResponse = await index.query({
      vector: queryEmbedding.data[0].embedding,
      topK: 5,
      includeMetadata: true,
    })

    console.log('AI Chat: Found matches:', queryResponse.matches?.length)

    // Transform matches into source citations
    const sources: MessageSource[] = queryResponse.matches
      ?.filter(match => match.metadata)
      .map(match => ({
        id: match.id,
        content: match.metadata?.content as string,
        created_at: match.metadata?.created_at as string,
        conversation_id: match.metadata?.conversation_id as string,
        conversation_type: match.metadata?.conversation_type as 'channel' | 'dm',
        user: {
          id: match.metadata?.user_id as string,
          full_name: match.metadata?.user_name as string,
        }
      })) || []

    // Format source messages for context, including timestamps
    const sourceMessages = sources.map(source => {
      const date = new Date(source.created_at)
      const timeAgo = getTimeAgo(date)
      return `${source.user.full_name} (${timeAgo}): "${source.content}"`
    }).join('\n\n')

    console.log('AI Chat: Generating response')
    // Generate AI response
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Here are some relevant messages from the conversation history:

${sourceMessages}

User's question: ${query}

Provide a helpful response using this context. If the context isn't relevant to the question, you can say so.`
        }
      ],
      temperature: 0.7, // Slightly creative but still focused
      stream: true,
    })

    console.log('AI Chat: Streaming response')
    // Return streaming response with sources
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the sources
          controller.enqueue(encoder.encode(JSON.stringify({ sources }) + '\n'))

          // Then stream the AI response
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (error) {
          console.error('AI Chat: Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream)

  } catch (error) {
    console.error('AI Chat Error:', error)
    console.error('AI Chat Error Details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    })
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

// Helper function to format timestamps
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
} 