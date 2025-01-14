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

-- Create reference tables for type safety
CREATE TABLE conversation_refs (
    id uuid,
    type conversation_type,
    PRIMARY KEY (id, type)
);

-- Populate reference tables from existing data
INSERT INTO conversation_refs (id, type)
SELECT id, 'channel'::conversation_type FROM channels;

INSERT INTO conversation_refs (id, type)
SELECT id, 'dm'::conversation_type FROM dm_channels;

-- Add trigger to maintain conversation_refs
CREATE OR REPLACE FUNCTION maintain_conversation_refs()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO conversation_refs (id, type)
        VALUES (NEW.id, TG_ARGV[0]::conversation_type);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM conversation_refs 
        WHERE id = OLD.id AND type = TG_ARGV[0]::conversation_type;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for channels
DROP TRIGGER IF EXISTS channel_refs_trigger ON channels;
CREATE TRIGGER channel_refs_trigger
    AFTER INSERT OR DELETE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION maintain_conversation_refs('channel');

-- Create triggers for dm_channels
DROP TRIGGER IF EXISTS dm_channel_refs_trigger ON dm_channels;
CREATE TRIGGER dm_channel_refs_trigger
    AFTER INSERT OR DELETE ON dm_channels
    FOR EACH ROW
    EXECUTE FUNCTION maintain_conversation_refs('dm');

-- Add new columns to messages table
ALTER TABLE messages
ADD COLUMN conversation_type conversation_type,
ADD COLUMN conversation_id uuid;

-- Migrate existing data
UPDATE messages 
SET conversation_type = 'channel',
    conversation_id = channel_id
WHERE channel_id IS NOT NULL;

UPDATE messages 
SET conversation_type = 'dm',
    conversation_id = dm_channel_id
WHERE dm_channel_id IS NOT NULL;

-- Make new columns required
ALTER TABLE messages
ALTER COLUMN conversation_type SET NOT NULL,
ALTER COLUMN conversation_id SET NOT NULL;

-- Add appropriate indexes and constraints
CREATE INDEX idx_messages_conversation ON messages(conversation_id, conversation_type);

-- Add foreign key constraint to conversation_refs
ALTER TABLE messages
ADD CONSTRAINT messages_conversation_fkey
    FOREIGN KEY (conversation_id, conversation_type)
    REFERENCES conversation_refs(id, type)
    ON DELETE CASCADE;

-- Create function for channel deletion trigger
CREATE OR REPLACE FUNCTION delete_channel_messages()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM messages 
    WHERE conversation_type = 'channel' 
    AND conversation_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create function for dm channel deletion trigger
CREATE OR REPLACE FUNCTION delete_dm_messages()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM messages 
    WHERE conversation_type = 'dm' 
    AND conversation_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS channel_delete_trigger ON channels;
CREATE TRIGGER channel_delete_trigger
    BEFORE DELETE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION delete_channel_messages();

DROP TRIGGER IF EXISTS dm_channel_delete_trigger ON dm_channels;
CREATE TRIGGER dm_channel_delete_trigger
    BEFORE DELETE ON dm_channels
    FOR EACH ROW
    EXECUTE FUNCTION delete_dm_messages();

-- Drop old columns and constraints
ALTER TABLE messages
DROP CONSTRAINT messages_channel_id_fkey,
DROP CONSTRAINT messages_channel_type_check,
DROP COLUMN channel_id,
DROP COLUMN dm_channel_id;



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

To do:
- [x] Updating queries to use conversation_id and conversation_type instead of channel_id and dm_channel_id
  - [x] Updated useRealtimeMessages hook
  - [x] Updated subscription service
  - [x] Updated DMChatWindow component
  - [x] Updated Message type definition
- [x] Updating the RAG system to work with the new schema
  - [x] Updated message upload endpoint to handle both channel and DM messages
  - [x] Updated AI chat endpoint to use conversation_id and conversation_type
  - [x] Updated Pinecone metadata schema
  - [x] Updated message source formatting
- [x] Updating channel management to maintain the conversation_refs table

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