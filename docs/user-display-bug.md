# User Display Name Bug Investigation

## Bug Description
- Message initially sends with correct user name
- Name changes to "Unknown User" shortly after sending
- Refreshing the page restores the correct user name
- Issue appears to be client-side state related

## Root Cause Analysis

### 1. Message Creation Flow
- Initial message is created with user data from client state
- Real-time subscription receives message update without full user data
- Message update overwrites the complete message object, including user data

### 2. Identified Issues
1. **Subscription Data Incompleteness**
   - Real-time updates from Supabase don't include complete user data
   - The subscription payload in `useRealtimeMessages` lacks user metadata
   - Message updates overwrite the entire message object

2. **State Management Gaps**
   - No preservation of user data during message updates
   - Client-side state gets overwritten by incomplete server data
   - No merging strategy for existing user data with updates

3. **Race Conditions**
   - Initial message send includes full user data
   - Real-time update arrives with partial data
   - No logic to preserve existing user data during updates

## Technical Details

### Current Implementation Issues
```typescript
// In DMChatWindow.tsx
const tempMessage = {
  user: {
    id: currentUser.id,
    email: currentUser.email || '',
    full_name: currentUser.user_metadata?.full_name || 'Unknown User',
    avatar_url: null,
  }
}

// In real-time subscription
// The update overwrites the entire message, including user data
setMessages((prev) => prev.map((msg) => 
  msg.id === message.id ? transformedMessage : msg
))
```

## Proposed Solutions

### 1. Enhance Message Update Logic
- Preserve existing user data during message updates
- Implement deep merge for message updates
- Only update specific fields from real-time events

### 2. Improve Subscription Data
- Include complete user data in subscription payload
- Add joins to fetch user data in real-time updates
- Cache user data client-side

### 3. State Management Improvements
- Implement user data caching
- Add state reconciliation logic
- Preserve metadata during updates

## Implementation Plan

### 1. Short-term Fix
1. Modify message update logic to preserve user data
2. Add user data caching layer
3. Implement deep merge for message updates

### 2. Long-term Improvements
1. Enhance Supabase subscriptions to include full user data
2. Add proper state management for user metadata
3. Implement robust caching strategy

## Next Steps
1. [ ] Implement message update preservation
2. [ ] Add user data caching
3. [ ] Test real-time updates
4. [ ] Verify user data persistence
5. [ ] Deploy and monitor fix

## Progress Tracking
- [x] Code review complete
- [x] Root cause identified
- [x] Solution proposed
- [ ] Fix implemented
- [ ] Testing completed 