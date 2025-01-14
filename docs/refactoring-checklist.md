# Messaging System Refactoring Checklist

## Current Pain Points
- Complex message handling between DMs and regular channels
- Redundant subscription logic
- Scattered message-related code
- Multiple state management approaches
- Duplicated fetch logic

## 1. Message Data Model Consolidation
- [ ] Unify message schema for both DM and channel messages
  - [ ] Use a single `messages` table with a `type` field
  - [ ] Consolidate `channel_id` and `dm_channel_id` into a single `conversation_id`
  - [ ] Add discriminator field to distinguish between DM/Channel messages

## 2. Subscription System Simplification
- [ ] Create unified subscription hook `useMessageSubscription`
  - [ ] Combine DM and channel subscription logic
  - [ ] Implement smart caching for subscriptions
  - [ ] Add connection status management
- [ ] Remove redundant subscription files and hooks
  - [ ] Deprecate `useDMSubscription`
  - [ ] Deprecate separate channel subscriptions

## 3. Message Components Refactoring
- [ ] Create unified `ChatWindow` component
  - [ ] Abstract common messaging logic
  - [ ] Use composition for specific features
  - [ ] Implement proper loading states
- [ ] Implement proper message list virtualization
- [ ] Create reusable message input component

## 4. State Management Optimization
- [ ] Implement centralized message cache
  - [ ] Use React Query/SWR for message fetching
  - [ ] Implement optimistic updates
  - [ ] Add proper error handling
- [ ] Create message context for shared state
- [ ] Implement proper pagination

## 5. API Layer Consolidation
- [ ] Create unified message API endpoints
  - [ ] Single endpoint for message operations
  - [ ] Consistent error handling
  - [ ] Proper validation
- [ ] Implement proper rate limiting
- [ ] Add message queue for offline support

## 6. Performance Optimizations
- [ ] Implement proper message batching
- [ ] Add debouncing for real-time updates
- [ ] Optimize subscription payload size
- [ ] Add proper connection management

## 7. Testing & Documentation
- [ ] Add comprehensive tests for new components
- [ ] Update API documentation
- [ ] Add migration guide
- [ ] Document new message patterns

## Implementation Order
1. Start with data model changes
2. Implement new API layer
3. Create unified components
4. Migrate state management
5. Update subscription system
6. Add optimizations
7. Complete testing and documentation

## Success Metrics
- Reduced code complexity
- Fewer API calls
- Improved performance
- Better developer experience
- Easier maintenance 