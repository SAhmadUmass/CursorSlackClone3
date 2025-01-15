# State Management Optimization Steps

Below is a step-by-step guide to help a junior developer implement the changes listed under “State Management Optimization” in the refactoring checklist. These steps do not contain actual code but include pseudocode where necessary.

---

## 1. Set Up React Query / SWR for Message Fetching

1. **Create or Update a Shared Store / Context**  
   - Location recommendation:  
     - “src/context/MessageContext.ts” (if you prefer React Context), or  
     - “src/store/messageStore.ts” (if using something like Zustand).  
   - This file is responsible for holding and updating the centralized message state.

2. **Install React Query or SWR**  
   - Ensure you have the library installed. If not, do so in your project.

3. **Update Message Fetching Logic (e.g., in “src/components/chat/DMChatWindow.tsx” or “ChatWindow.tsx”)**  
   - Replace direct calls to Supabase or any old fetching method with a call to your React Query / SWR hook.  
   - Example Pseudocode (not real code):
     ```
     const { data: messages, isLoading, error } = useMessagesQuery(conversationId)
     ```
   - Store these fetched messages in your new shared store if you wish to share them across components.

---

## 2. Implement Pagination in the API & Front End

1. **Server-Side Pagination (e.g., in “src/app/api/messages/route.ts”)**  
   - Add parameters (e.g., `?page=X&pageSize=Y`) to your API route so it only returns the required slice of messages.

2. **Client-Side Integration**  
   - Update your React Query / SWR hook to handle next-page/previous-page logic.  
   - Example Pseudocode:
     ```
     const fetchMessages = async (page, pageSize) => {
       // call your messages API endpoint with page & pageSize
       // return the sliced messages
     }
     ```

3. **UI Pagination Controls**  
   - Add buttons or infinite scrolling logic in your chat components.  
   - Keep track of the current page and total pages, and pass them to your React Query / SWR fetch function.

---

## 3. Implement Optimistic Updates

1. **Pseudocode Overview**  
   ```
   const handleSendMessage = (newMessage) => {
     // 1. Update local store or query cache optimistically
     // 2. Send request to server
     // 3. If server fails, revert the changes
   }
   ```
2. **Apply to Chat Components**  
   - In components like “DMChatWindow” or “ChatWindow,” wrap your mutation logic (the function that sends new messages to the server) in optimistic updates.

3. **Rollback on Error**  
   - If the API request to send the message fails, revert the local changes in your shared store or React Query / SWR cache.

---

## 4. Add Comprehensive Error Handling

1. **Global Error Handling (Store / Context)**  
   - In your shared context or store, handle errors from any message-related API calls.  
   - Display user-friendly error messages, and log the original errors for debugging.

2. **Per-Component Error Handling**  
   - Display fallback UI or error states in chat components (e.g., “DMChatWindow,” “ChatWindow”).  
   - Show a retry button or brief instructions if failures occur.

---

## 5. Remove or Redirect Old Messaging Hooks

1. **Identify Deprecated Hooks**  
   - For instance, “useRealtimeMessages” or “useMessageSubscription” might be pointing to old subscription logic.  
   - Confirm which code sections can be removed or updated.

2. **Consolidate Logic**  
   - Fold any remaining real-time subscription logic into your new React Query / SWR cache updates to maintain a single source of truth.  
   - Use your new store or context to unify the message flow.

3. **Final Cleanup**  
   - Delete or deprecate any files / hooks that are no longer needed.  
   - Re-test your entire messaging flow to confirm everything still works.

---

## 6. Final Testing & Validation

1. **Check Basic Fetching**  
   - Verify messages load from the server and display correctly.

2. **Test Pagination**  
   - Ensure the user can click “Load More” (or scroll) to see older messages.  

3. **Polling or Real-Time Updates**  
   - Confirm that newly received messages appear without manual refresh.

4. **Optimistic Updates**  
   - Send a new message. Make sure it immediately appears in the chat.  
   - Simulate a server failure (e.g., debugging mode). Confirm the message is removed from the UI.

5. **Error Handling**  
   - Force an error in the network or server.  
   - Ensure the UI displays a meaningful message.

---

## Summary

You will:

1. Introduce React Query or SWR for message data.  
2. Implement server-side pagination and UI controls for pagination.  
3. Perform optimistic updates and ensure error handling.  
4. Consolidate existing hooks and contexts around a single source of truth.  
5. Test end-to-end for proper functionality and graceful failure states.