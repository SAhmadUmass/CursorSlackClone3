# Retrieval-Augmented Generation (RAG) Checklist

Below is a more detailed breakdown of Steps 1 and 2, including every small task you need for a working RAG MVP.

## File Structure
```
src/lib/rag/
├── index.ts              # Main exports
├── types.ts             # Types for RAG operations
├── messages.ts          # Message fetching utilities
├── embeddings.ts        # OpenAI embedding generation (TODO)
├── pinecone.ts          # Pinecone operations (TODO)
└── utils/
    ├── batch.ts        # Batching utilities (TODO)
    └── errors.ts       # Error handling (TODO)
```

## Step 1: Embed Existing Messages and Store in Vector Database

1. Prepare the Environment  
   - [x] Ensure you have an OpenAI API key and store it in an environment variable (e.g., OPENAI_API_KEY).  
   - [x] Obtain the credentials for your vector database (Pinecone, Supabase Vector).  
   - [x] Verify that these keys are also securely stored in environment variables (e.g., PINECONE_API_KEY, PINECONE_ENV, etc.).

2. Gather Dependencies  
   - [x] Install any needed libraries:  
     • openai (for embeddings)  
     • axios or node-fetch (HTTP requests)  
     • pinecone-client (or other vector DB client)  
   - [x] Confirm your package.json is updated accordingly.

3. Fetch Messages from Your Database  
   - [x] Connect to the application database (e.g., using Supabase or another driver).  
   - [x] Write a function or script to query all messages you plan to embed (or limit to a subset).  
   - [x] Inspect data to ensure you have unique IDs, the message text, and any relevant metadata (e.g., channel_id, user_id).

4. Chunk or Prepare Message Content  
   - [x] Decide whether each message is short enough to embed directly, or if you need to split longer content into multiple chunks.
     > Decision: Messages are short chat messages, so we'll embed them directly without chunking.  
   - [ ] (Optional - Deferred) Create a helper function to split large messages if needed in the future.

5. Generate Embeddings via OpenAI (text-embedding-ada-002 or another model)  
   - [x] For each message (or chunk), send the text to OpenAI's embedding endpoint.  
   - [ ] Store the returned vector in memory or in a list for later bulk insertion.

6. Upsert Embeddings to Vector Database  
   - [x] Connect to Pinecone (or your chosen vector store) using your credentials.  
   - [x] Create a "namespace" or index if required.  
   - [x] For each embedding, store:  
     • A unique ID (e.g., the message's UUID).  
     • The embedding (vector).  
     • Message metadata (e.g., message content, sender ID).  
   - [ ] Insert or upsert them in bulk to speed up the process.

7. Validate the Upsert  
   - [ ] Double-check the inserted vectors by querying the vector DB for random items.  
   - [ ] Confirm the index reports the same number of items as you inserted.

8. Keep the Script Maintained  
   - [ ] Save your embedding script or code to a separate file (e.g., embedMessages.js).  
   - [ ] Plan a strategy to periodically re-run or update embeddings for new messages.

## Implementation Progress

### Completed Files:
1. `src/lib/rag/types.ts`
   - MessageForEmbedding interface
   - BatchProcessingResult interface
   - MessageBatch interface

2. `src/lib/rag/messages.ts`
   - fetchMessageBatch function
   - Batch size configuration
   - Pagination support

3. `src/lib/rag/index.ts`
   - Central exports

### Pending Implementation:
1. `src/lib/rag/embeddings.ts`
   - OpenAI client setup
   - Embedding generation
   - Rate limiting
   - Error handling

2. `src/lib/rag/pinecone.ts`
   - Pinecone client setup
   - Vector storage
   - Batch upsert operations
   - Query operations

3. `src/lib/rag/utils/`
   - Batching utilities
   - Error handling
   - Retry logic

## Step 2: Query the Vector Database and Generate an LLM Answer

1. Create an "Ask" or "Search" Endpoint in Your Backend  
   - [ ] Set up a new Express route (e.g., POST /api/ask) that receives the user's query.  
   - [ ] Ensure that any required authentication or rate-limiting middleware is applied.

2. Embed the User's Query  
   - [ ] Call the OpenAI embedding endpoint again, but this time for the user's query.  
   - [ ] Retrieve the resulting vector.

3. Perform a Similarity Search in the Vector DB  
   - [ ] Use the query embedding to find top-K most relevant messages or chunks in Pinecone (or equivalent).  
   - [ ] Make sure you request metadata (the original text or content) in the query results.  
   - [ ] Decide how many chunks to retrieve (top 3, 5, etc.) based on prompt size or response needs.

4. Construct a Prompt for the LLM  
   - [ ] Combine the retrieved message content into a single "context block."  
   - [ ] Append the user's question to this context.  
   - [ ] If using ChatGPT-style calls, structure them as "system" plus "user" or "assistant" messages.  
   - [ ] If using GPT-3 or GPT-4 completion, build a structured prompt with instructions, context, and the user's question.

5. Send the Prompt to OpenAI  
   - [ ] Call the appropriate endpoint (e.g., /v1/chat/completions or /v1/completions).  
   - [ ] Pass in your constructed prompt (or messages array).  
   - [ ] Choose model parameters (e.g., model: "gpt-3.5-turbo", max_tokens, temperature, etc.).

6. Parse and Return the Answer  
   - [ ] Extract the text or content from the LLM's response.  
   - [ ] Return it as JSON in your /api/ask route's response (e.g., { answer: "..." }).  
   - [ ] Handle error scenarios gracefully (e.g., if the LLM times out or the vector DB query fails).

7. Integrate into Your UI  
   - [ ] On the client side, create a function (e.g., askAI) that sends the user's question to /api/ask.  
   - [ ] Display the returned answer in your chat UI or console for testing.  
   - [ ] Handle loading states and possible error messages.

8. Confirm End-to-End Works  
   - [ ] Start your server and client.  
   - [ ] Trigger the route with a sample question.  
   - [ ] Verify relevant context is retrieved from the vector DB.  
   - [ ] Check that the final answer references that context accurately.

## Real-Time Processing Plan

1. Message Creation Hook
   - [ ] Identify the message creation flow in the application
   - [ ] Add a post-save hook or event handler for new messages
   - [ ] Ensure the hook captures all necessary message metadata

2. Real-Time Embedding Generation
   - [ ] Create a streamlined version of embedding generation for single messages
   - [ ] Add error handling specific to real-time processing
   - [ ] Implement retry logic for failed embedding attempts
   - [ ] Add logging for monitoring and debugging

3. Vector Storage Updates
   - [ ] Modify Pinecone upsert function to handle single message updates
   - [ ] Ensure atomic operations for vector storage
   - [ ] Add validation to confirm successful storage

4. Monitoring & Fallback
   - [ ] Add telemetry to track real-time processing success rate
   - [ ] Create a fallback queue for failed operations
   - [ ] Set up alerts for processing failures
   - [ ] Add a recovery process for missed messages

5. Testing & Validation
   - [ ] Create test cases for the real-time processing flow
   - [ ] Verify embedding generation speed meets real-time requirements
   - [ ] Test concurrent message handling
   - [ ] Validate end-to-end flow with the search functionality

Implementation Notes:
- Process messages immediately after creation
- Use background processing if embedding takes too long
- Keep batch processing endpoint as a fallback
- Monitor OpenAI API rate limits in real-time context
