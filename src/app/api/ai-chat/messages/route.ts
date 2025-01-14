import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { MessageSource } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone();

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

If you don't find relevant context for a question, just respond normally as a helpful assistant would. You don't need to always reference past messages.`;

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, conversation_id, conversation_type } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Generate embedding for the query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: lastMessage.content,
    });

    // Query Pinecone for similar messages
    const index = pinecone.index('rag-fusion-101-1536');
    const queryResponse = await index.query({
      vector: queryEmbedding.data[0].embedding,
      topK: 5,
      filter: {
        conversation_id: conversation_id,
        conversation_type: conversation_type
      },
      includeMetadata: true,
    });

    // Format relevant messages as sources
    const sources: MessageSource[] = queryResponse.matches.map((match) => ({
      id: match.id,
      content: match.metadata?.content as string,
      created_at: match.metadata?.timestamp as string,
      conversation_id: match.metadata?.conversation_id as string,
      conversation_type: match.metadata?.conversation_type as 'channel' | 'dm',
      user: {
        id: match.metadata?.user_id as string,
        full_name: match.metadata?.user_name as string,
      },
    }));

    // Prepare conversation history for the AI
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.isAI ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add system prompt
    const fullConversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
    ];

    // If we found relevant messages, add them as context
    if (sources.length > 0) {
      const contextMessage = {
        role: 'system',
        content: `Here are some relevant messages from the conversation:\n\n${sources
          .map(
            (s) =>
              `[${new Date(s.created_at).toLocaleString()}] ${s.user.full_name}: ${s.content}`
          )
          .join('\n\n')}`,
      };
      fullConversation.splice(1, 0, contextMessage);
    }

    // Get AI response
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: fullConversation as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      content: response.choices[0].message.content,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 