### Step-by-Step Plan for Creating a Unified “ChatWindow” Component

Below is a breakdown of tasks designed for a junior developer with minimal assumptions about existing knowledge. These steps follow best practices and point out which files will likely be touched.

---

## 1. Identify & Review Existing Files

1. **DMChatWindow**  
   Located in “src/components/chat/dm-channels/DMChatWindow.tsx”. It handles direct messaging logic, subscriptions, and message sending.

2. **AIChatWindow**  
   Found in “src/components/chat/ai-chat/AIChatWindow.tsx”. Similar design patterns but includes AI-specific logic (like streaming responses and referencing context).

3. **MessageList**  
   A shared component in “src/components/chat/message-list.tsx” that already displays messages in both DM and AI contexts.

4. **Docs & Checklists**  
   - “docs/refactoring-checklist.md” outlines the unified ChatWindow requirement and loading state improvements.  
   - “docs/message-system.md” provides guidance on message typing, conversation types, and best practices.

---

## 2. Extract the Common Logic

1. **Study DMChatWindow vs. AIChatWindow**  
   - Both fetch messages, maintain local state, display messages, and provide an input field.  
   - Common functionalities to extract include message display, loading states, and sending new messages.

2. **Outline Shared Behaviors** (No Code Yet — Just Pseudocode)  
   ```
   component ChatWindow:
     - state: messages, isLoading, newMessageText
     - effect: fetch messages from Supabase (or other store)
     - effect: handle real-time subscription updates
     - function: handleSendMessage
       - if AI mode: send query to AI endpoint
       - else if DM or channel: insert new message to “messages” table
     - return: 
       header (title, presence info?), 
       MessageList, 
       message input field
   ```
   This pseudocode captures the essence of a shared ChatWindow.

---

## 3. Decide on Composition vs. Props

1. **Composition Approach**  
   - The new ChatWindow can accept child components or “slots” that handle specialized behaviors (like the AI’s streaming logic).
   - In that case, ChatWindow handles the general UI skeleton while you inject AI streaming or DM logic as needed.

2. **Prop-based Approach**  
   - Alternatively, pass a “mode” prop (e.g., “dm”, “channel”, or “ai”).  
   - The ChatWindow can conditionally run different logic based on the prop.  

3. **Choose the Approach**  
   - If architecture calls for more flexible patterns, composition might be better.  
   - If simplicity is preferred, a “mode” prop with branching logic is simpler to implement.

---

## 4. Create a New “ChatWindow” File

1. **File Location**  
   - “src/components/chat/chat-window.tsx” (or a similar name).  

2. **Initial Structure** (Pseudocode, no actual code lines):  
   ```
   export function ChatWindow({ mode, conversationId, ...props }) {
     // State: messages, isLoading, newMessage
     // Effects: fetch messages, subscribe to updates
     // handleSendMessage: switch if mode === 'ai' || 'dm' || 'channel'
     // Return layout with:
     //   - header with info
     //   - <MessageList />
     //   - input for new messages
   }
   ```

3. **Required Props**  
   - `conversationId`: The ID of the DM or channel.  
   - `mode`: “dm” | “channel” | “ai”.  
   - Possibly others for customization.

---

## 5. Migrate Shared Logic From DMChatWindow & AIChatWindow

1. **Fetch & Subscription**  
   - Move the Supabase `fetchMessages()` or AI processing logic to your new ChatWindow.  
   - If you are using different endpoints (e.g., for AI vs. normal messages), conditionally run them according to the mode.

2. **Set `messages` & `isLoading`**  
   - Use the same approach as in DMChatWindow: store messages in a `useState` and have an initial load effect that fetches data.  
   - Keep a subscription effect that updates messages in real-time.

3. **Sending Messages**  
   - For AI, call your AI endpoint.  
   - For standard DMs/Channels, insert into “messages” with the correct `conversation_type`.  
   - Use the client-generated ID approach to ensure no duplicates.

4. **Loading States**  
   - Implement a simple loading spinner or skeleton if `isLoading` is true.  
   - Display `MessageList` only after messages are loaded.

5. **Error Handling**  
   - Wrap fetch or AI calls with try/catch, and set an error state — or incorporate a toast notification if the project uses one.

---

## 6. Replace DMChatWindow & AIChatWindow With the New Component

1. **DMChatWindow**  
   - Either remove or refactor it to return the newly created ChatWindow.  
   - For example, define:
     - a “mode” = “dm”.
     - “conversationId” from the DM channel ID.
     - any custom overhead (like showing the other user’s name in the header) can be done via additional props.

2. **AIChatWindow**  
   - Similarly, pass `mode="ai"` and possibly some AI-specific configurations (e.g., custom prompt placeholders).  
   - If you still need advanced AI logic, either pass in child components or separate callback props for AI streaming.

---

## 7. Implement Message List Virtualization (Optional Next Step)

1. **Why Virtualization?**  
   - If you have thousands of messages, rendering them all can be slow. Use a library like “react-virtualized” or “react-window”.
2. **Where to Integrate?**  
   - Inside the “MessageList” component at “src/components/chat/message-list.tsx”.  
   - Instead of a basic `.map(...)`, wrap the message array in a virtualization container.
3. **Testing**  
   - Verify that older messages only render when you scroll, improving performance.

---

## 8. Create a Reusable Message Input

1. **Purpose**  
   - You shouldn’t repeat the same input + button logic for every chat window.  
   - This component can handle “Enter to send,” multiline text, and so on.

2. **Implementation Steps**  
   - Create a new file, e.g., “src/components/chat/message-input.tsx”.
   - Accept props like `value`, `onChange`, `onSend`, and `placeholder`.
   - Replace your existing `<input>` + `<button>` usage in DMChatWindow/AIChatWindow with the new component.

---

## 9. Verify Everything Works

1. **Local Testing**  
   - Run the dev server, open a DM or AI chat, and confirm messages are loading.  
   - Send a new message and watch real-time subscription calls come in.
2. **Check for Console Errors**  
   - Look out for missing props or mismatched types.  
   - Confirm no unhandled promise rejections in your fetch logic.
3. **Perform Integration Tests**  
   - Ensure the new ChatWindow integrates properly with AI calls (if “mode=ai”).  
   - Check that direct messages show the correct user data (if “mode=dm” or “channel”).

---

## 10. Clean Up & Remove Old Files If Desired

1. **DMChatWindow.tsx & AIChatWindow.tsx**  
   - Optionally delete them or keep them as minimal wrappers around ChatWindow if you need custom headers.  
   - Remove duplicated logic to prevent confusion.
2. **Documentation**  
   - Update references in “docs/refactoring-checklist.md” (under “Create unified `ChatWindow` component”) to reflect that it’s complete.
3. **Long-Term Enhancements**  
   - Expand virtualization.  
   - Add error boundaries.  
   - Introduce user presence logic from your subscription data.  
   - Implement message threading or reaction features if needed.

---

### Relevant Files to Modify

- “src/components/chat/dm-channels/DMChatWindow.tsx”  
- “src/components/chat/ai-chat/AIChatWindow.tsx”  
- “src/components/chat/chat-window.tsx” (brand new)  
- “src/components/chat/message-list.tsx” (for virtualization)  
- “src/components/chat/message-input.tsx” (new reusable input)

No actual code was provided here; these steps only show the overall plan and some pseudocode. You can use this roadmap to begin refactoring confidently.