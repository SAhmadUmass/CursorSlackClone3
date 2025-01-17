import { OpenAI } from 'openai'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { MessageSource, ConversationType } from '@/types'
import { env } from '@/env.mjs'
import { generateEmbeddings } from '@/lib/rag/embeddings'
import { queryVectors, listNamespaces } from '@/lib/rag/pinecone'
import { MessageSearchResult } from '@/lib/rag/types'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
})

interface PineconeMetadata {
  content: string
  user_name?: string
  user_id?: string
  created_at?: string
  conversation_type?: ConversationType
  [key: string]: any
}

// Format namespace consistently with realtime.ts
function formatNamespace(conversationType: ConversationType, conversationId: string): string {
  return `rag-${conversationType}-${conversationId}`
}

// Enhanced system prompt that includes context
function getSystemPrompt(context?: string): string {
  let prompt = `You are a friendly and helpful AI assistant in a chat application.

Keep your responses:
- Friendly and conversational
- Clear and helpful
- Natural and engaging
- ALWAYS quote relevant messages when they exist
- Be specific about what users have said in the chat

When referencing past messages:
- Use exact quotes when available
- Mention who said what
- Include when messages are from other channels`

  if (context) {
    prompt += `\n\nHere are relevant messages from previous conversations:\n${context}\n\n
When answering the user's question:
1. ALWAYS reference these messages if they're relevant
2. Use exact quotes from the messages
3. Mention which user said what
4. If someone has explicitly mentioned the topic, point that out
5. If the messages show direct discussion of the topic, highlight that

For example, if someone asks "Has anyone mentioned X?" and you see a message about X, say something like:
"Yes, [User] specifically said '[exact quote]' in [channel context]"`
  }

  return prompt
}

export async function POST(request: Request) {
  try {
    // Authentication check
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('AI Chat: Authentication failed', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Input validation
    const body = await request.json()
    const { query, conversation_id, conversation_type = 'channel' } = body

    if (!query?.trim() || !conversation_id?.trim()) {
      console.error('AI Chat: Missing required fields', { query, conversation_id })
      return NextResponse.json(
        { error: 'Query and conversation_id are required' },
        { status: 400 }
      )
    }

    // Check Pinecone index status
    console.log('AI Chat: Checking Pinecone index status...')
    await listNamespaces()

    // Generate embedding for the query
    console.log('AI Chat: Generating embedding for query:', query)
    const [queryEmbedding] = await generateEmbeddings([query])
    console.log('AI Chat: Embedding generated successfully')
    
    // Search for relevant messages in the conversation namespace
    const namespace = formatNamespace(conversation_type, conversation_id)
    console.log('AI Chat: Searching with params:', {
      conversationType: conversation_type,
      conversationId: conversation_id,
      embeddingLength: queryEmbedding.length,
      namespace
    })
    
    const searchResults = await queryVectors(
      queryEmbedding,
      namespace,
      5 // Get top 5 most relevant messages
    )
    
    console.log('AI Chat: Vector search results:', {
      matchCount: searchResults.matches.length,
      scores: searchResults.matches.slice(0, 3).map(m => m.score),
      sampleContent: searchResults.matches[0]?.metadata?.content
    })
    
    // Format messages as sources for the UI
    const sources: MessageSource[] = searchResults.matches
      .filter(match => match.metadata && typeof match.metadata === 'object')
      .map(match => {
        const metadata = match.metadata as PineconeMetadata
        const channelId = metadata.channel_id || ''
        return {
          id: match.id,
          content: metadata.content || '',
          created_at: metadata.created_at || new Date().toISOString(),
          user: {
            id: metadata.user_id || 'unknown',
            full_name: metadata.user_name || 'Unknown User'
          },
          score: match.score,
          channel_id: channelId,
          is_from_other_channel: channelId !== conversation_id
        }
      })
      // Sort by relevance score
      .sort((a, b) => (b.score || 0) - (a.score || 0))
    
    // Log all found sources for debugging
    console.log('AI Chat: All found sources:', sources.map(s => ({
      content: s.content,
      score: s.score,
      user: s.user.full_name,
      channel: s.channel_id
    })))
    
    // Format context for the LLM
    const context = sources.length > 0
      ? sources
          .filter(source => source.score && source.score > 0.85) // Only include highly relevant messages
          .map(source => {
            const channelContext = source.is_from_other_channel 
              ? ` (in channel ${source.channel_id})` 
              : ' (in current channel)'
            const relevance = source.score 
              ? ` [relevance: ${(source.score * 100).toFixed(1)}%]`
              : ''
            return `Message: [${source.user.full_name}${channelContext}${relevance}] said "${source.content}" at ${source.created_at}`
          })
          .join('\n\n')
      : undefined
    
    // Log final context being sent to AI
    console.log('AI Chat: Final context being sent to AI:', context || 'No context')
    
    // Create chat completion with streaming
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(context)
        },
        {
          role: 'user',
          content: query
        }
      ],
      stream: true,
      temperature: 0.5,
    })

    // Create and send the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        // Send sources as the first line
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
          sources,
          debug: {
            namespace,
            matchCount: searchResults.matches.length,
            hasContext: !!context,
            sourcesFromOtherChannels: sources.filter(s => s.is_from_other_channel).length
          }
        }) + '\n'))
        
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      }
    })

    return new Response(stream)
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'edge' 