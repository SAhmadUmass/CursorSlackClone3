# Messaging System Refactoring Checklist

## Current Pain Points
- Complex message handling between DMs and regular channels
- Redundant subscription logic
- Scattered message-related code
- Multiple state management approaches
- Duplicated fetch logic

"What is this?" "This is a new data model"
-- Create conversation type enum
CREATE TYPE conversation_type AS ENUM ('channel', 'dm');

-- Create reference table for conversations
CREATE TABLE conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type conversation_type NOT NULL,
    name text,
    description text,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT timezone('utc'::text, NOW()) NOT NULL
);

-- Migrate existing channels and DMs to conversations
INSERT INTO conversations (id, type, name, description, created_by, created_at)
SELECT id, 'channel'::conversation_type, name, description, created_by, created_at
FROM channels;

INSERT INTO conversations (id, type, created_by, created_at)
SELECT id, 'dm'::conversation_type, user1_id, created_at
FROM dm_channels;

-- Add new columns to messages table
ALTER TABLE messages
ADD COLUMN conversation_id uuid,
ADD COLUMN conversation_type conversation_type;

-- Migrate existing message data
UPDATE messages 
SET conversation_id = channel_id,
    conversation_type = 'channel'
WHERE channel_id IS NOT NULL;

UPDATE messages 
SET conversation_id = dm_channel_id,
    conversation_type = 'dm'
WHERE dm_channel_id IS NOT NULL;

-- Make new columns required
ALTER TABLE messages
ALTER COLUMN conversation_id SET NOT NULL,
ALTER COLUMN conversation_type SET NOT NULL;

-- Add index and foreign key
CREATE INDEX idx_messages_conversation ON messages(conversation_id, conversation_type);
ALTER TABLE messages
ADD CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id)
    ON DELETE CASCADE;

-- Drop old columns and tables
ALTER TABLE messages
DROP COLUMN channel_id,
DROP COLUMN dm_channel_id;

DROP TABLE channels;
DROP TABLE dm_channels;


## 1. Message Data Model Consolidation
- [x] Unify message schema for both DM and channel messages
  - [x] Use a single `messages` table with a `type` field
  - [x] Consolidate `channel_id` and `dm_channel_id` into a single `conversation_id`
  - [x] Add discriminator field to distinguish between DM/Channel messages
    The main changes will involve:
    [x] Consolidating /api/messages/route.ts and /api/dm-channels/[channelId]/messages/route.ts into a single endpoint
    [x] Created New Unified Endpoint at /api/conversations/[id]/messages:
        - Handles both channel and DM messages
        - Uses new schema with conversation_id and conversation_type
        - Proper access control for both types
        - Consistent response format
        - Type-safe implementation
    [x] Added Deprecation Notices to old endpoints:
        - /api/messages/route.ts for channel messages
        - /api/dm-channels/[channelId]/messages/route.ts for DM messages
        - Warning messages to guide developers to new endpoint


## 2. Subscription System Simplification
- [x] Create unified subscription hook useMessageSubscription
- [x] Combine DM and channel subscription logic (implemented in useMessageSubscription.ts with conversationType: 'channel' | 'dm')
- [ ] Implement smart caching for subscriptions (using processedMessages ref and useChatStore)
- [x] Add connection status management (added status state with 'connecting' | 'connected' | 'disconnected' | 'reconnecting')
- [x] Remove redundant subscription files and hooks
- [x] Deprecate useDMSubscription (added deprecation notice and backwards compatibility)
- [x] Deprecate separate channel subscriptions (using unified hook with conversationType)

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