# AI Chat Implementation Plan
**Below is a step-by-step outline specifically tailored for a developer integrating Pinecone-based vector search.** This includes which files to edit, which parts can be deprecated, and a high-level approach without any actual code lines. (Pseudocode snippets are allowed but no line numbers.)

---

## 1. Confirm Vector Database Requirements

1. **Check Pinecone Setup**  
   - Make sure you have Pinecone credentials (API key, environment, index name) in your environment variables.  
   - Verify that the necessary environment checks are in place, usually in a file like “src/lib/rag/pinecone.ts.”  
   - If these variables are missing, the vector DB logic will be skipped or not called at all.

2. **Decide If You’re Ready for Context Retrieval**  
   - If you haven’t done any context retrieval yet, you can temporarily skip the vector search step. This means you’ll return a simple AI response with no references to Pinecone data.  
   - Otherwise, continue with the steps below to hook in the Pinecone search.

> **Files to Review**  
> - “src/lib/rag/pinecone.ts” (your Pinecone client setup)  
> - “docs/ai-chat-implementation.md” (especially “### 3. Vector Search Integration”)  

---

## 2. Integrate Embeddings (If Not Already Done)

1. **Check or Create an Embeddings Function**  
   - Look for a file like “src/lib/rag/embeddings.ts.” This is where you’d have a function that sends text to OpenAI’s embedding endpoint and returns numeric vectors.  
   - If you haven’t set one up, create a simple function in “src/lib/rag/embeddings.ts.” You can label any half-finished or obsolete embedding code as “deprecated” so it doesn’t confuse you later.

2. **Test Basic Embedding Generation**  
   - Use a small piece of text (e.g., “Hello world”) and confirm your function returns a vector array.  
   - If it fails, log the error and check your OpenAI API keys.

> **Files to Edit or Mark as Deprecated**  
> - “src/lib/rag/embeddings.ts” (new or existing embeddings logic)  
> - Any duplicate or outdated embedding files (mark them clearly as deprecated)

---

## 3. Decide on a Namespace or Index Scheme

1. **Namespace Conventions**  
   - If your chat system supports multiple conversation types (channel, DM, AI, etc.), decide if you want separate Pinecone namespaces (e.g., “dm-messages,” “channel-messages”) or a single overarching namespace with metadata filters.  
   - The file “src/lib/rag/pinecone.ts” may already have code for handling namespaces.

2. **Metadata Handling**  
   - Confirm you store or remove any unneeded fields that might cause “invalid data” errors (like complex objects). Typically, Pinecone expects strings, numbers, or boolean values in metadata.  
   - Update any old code that references fields like “channel_id” or “dm_channel_id” if you’ve shifted to “conversation_id” or “conversation_type.”

> **Files to Revisit**  
> - “src/lib/rag/pinecone.ts” for cleaning metadata  
> - “docs/message-data-model.md” or “docs/refactoring-checklist.md” if you changed “channel_id” to “conversation_id” in metadata

---

## 4. Perform a Vector Search (High-Level Flow)

1. **Embed the User Query**  
   - When a user types a question, run the input through your embeddings function.  
   - This yields a query vector.

2. **Query Pinecone**  
   - Pass that query vector into something like a “queryVectors(queryVector, namespace, topK)” function, located in “src/lib/rag/pinecone.ts.”  
   - This should return a list of the most similar items (messages, documents, etc.) from Pinecone.

3. **Combine Results for Your LLM**  
   - Once you have the similar items from Pinecone, you can incorporate them into the prompt you send to OpenAI (or whichever LLM you’re using).  
   - For instance, “system: Here are relevant messages: [top messages from Pinecone]. User asked: [user question].”  
   - If you’re not fully ready, just return a generic AI response and ignore the vector search results for now.

> **Files to Implement or Adjust**  
> - “src/app/api/ask” or “src/app/api/ai-chat/messages/route.ts” (whatever your new “search” or “ask” endpoint is)  
> - “src/lib/rag/pinecone.ts” (queryVectors function)  
> - Any AI prompt-building file (if you incorporate the search results into a prompt)

---

## 5. Handle Metadata Filtering (Optional Next Step)

1. **Filter by Date/User/Channel**  
   - If you want only recent messages or specific channels, pass a metadata filter when calling Pinecone.  
   - Example pseudocode:  
     ```
     const filter = {
       channel_id: desiredChannel,
       date: { $gt: startDate, $lt: endDate },
     }
     queryVectors(queryVector, namespace, topK, filter)
     ```
   - Pinecone filtering can be tricky if the data isn’t stored as strings or numbers. Make sure your metadata usage is consistent or skip advanced filters temporarily.

2. **Deprecate or Comment Out Partial Filtering Code**  
   - If you have half-completed or experimental filter logic causing errors, either remove it or wrap it in comments.  
   - Keep the system stable before adding more complexity.

> **Files to Update**  
> - “src/lib/rag/pinecone.ts” (extend query function to accept filters)  
> - “docs/ai-chat-implementation.md” → “### 3. Vector Search Integration” (document your final filter approach)

---

## 6. Test, Log, and Debug

1. **Basic End-to-End Testing**  
   - Type a query in your AI interface. Observe whether “queryVectors” is called (add temporary console logs in “src/lib/rag/pinecone.ts”).  
   - If you see no logs, your code might be skipping the vector search logic entirely.

2. **Check Return Data**  
   - Log the topK results from Pinecone. Confirm you receive an array of items with the correct metadata.  
   - Make sure you pass those items to your LLM prompt if you’ve wired everything up.

3. **Refine or Optimize**  
   - If performance is slow, consider fewer topK results or checking “batch” queries.  
   - If accuracy is off, you might want to adjust your embedding model or create a better prompt structure.

> **Files Where Logging Helps**  
> - “src/lib/rag/pinecone.ts” (check if the query function is actually called)  
> - “src/app/api/ai-chat/messages/route.ts” (or your ask endpoint) to log the final prompt and confirm references are included

---

## 7. Deprecate Old Vector Storage Logic

1. **Check for Duplicates**  
   - If you once had a file like “src/lib/rag/vectordb.ts” (marked as deprecated), ensure you’re not accidentally calling it.  
   - Remove or comment out any references in your codebase to these old vector functions.  
   - Make it clear in your docs or code comments that “pinecone.ts” is the current source of truth.

2. **Summarize in Documentation**  
   - In “docs/ai-chat-debug” (or “docs/ai-chat-implementation.md”), note that the older vector functions are no longer used.  
   - This prevents new developers from picking them up by mistake.

---

## 8. Gradually Enhance the System

1. **Add Error Handling**  
   - If Pinecone is down or your query fails, return a graceful fallback: “AI is currently unavailable—please try again.”

2. **Scale to Production**  
   - If all goes well, you can keep building more advanced features, like ranking or weighting results based on conversation type or user roles.

---

**Summary of Key File Changes**

- **“src/lib/rag/pinecone.ts”**:  
  Main place for connecting and querying Pinecone. Make sure both an upsert and a queryVectors function exist. If you have older vector store files (e.g., “vectordb.ts”), mark them as deprecated.

- **“src/lib/rag/embeddings.ts”**:  
  Oversees how you generate embeddings (using OpenAI or another provider). Double-check your environment keys and confirm the function is working before hooking in the vector search.

- **“docs/ai-chat-implementation.md” → “### 3. Vector Search Integration”**:  
  Contains instructions or references for setting up advanced features. Update this section to document your final approach and any partial features that you decided not to implement yet.

- **(Optional) Old Vector Logic**:  
  “src/lib/rag/vectordb.ts” or any other file with outdated references to channel_id or dm_channel_id. If you’ve moved to conversation_id, be sure to remove or rename those references.

By tackling each item above as a discrete step—embedding, query logic, integrating results into prompts, and then adding optional filters—you’ll smoothly transition from a simple AI chat into a fully retrieval-augmented system using Pinecone.

1. Core RAG Files (`src/lib/rag/`):
   - `index.ts` - Main exports
   - `types.ts` - Type definitions
   - `messages.ts` - Message fetching utilities
   - `embeddings.ts` - OpenAI embedding generation
   - `pinecone.ts` - Pinecone vector operations
   - `realtime.ts` - Real-time message processing

2. API Routes:
   - `src/app/api/ai-chat/messages/route.ts` - Main route handler for AI chat
   - `src/app/api/rag/test/route.ts` - Test endpoint for RAG functionality

3. Component Files:
   - `AIChatWindow.tsx` - Handles AI chat interface
   - `MessageList.tsx` - Displays messages

The main workflow is:
1. Messages are processed in real-time using `realtime.ts`
2. Embeddings are generated using OpenAI through `embeddings.ts`
3. Vectors are stored in Pinecone using `pinecone.ts`
4. When a query comes in, the route handler in `messages/route.ts` handles the search and response generation

Would you like me to explain any specific part of this implementation in more detail?
