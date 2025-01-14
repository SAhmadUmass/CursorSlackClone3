# Message System Architecture

## Overview
The message system has been refactored to use a unified data model and API for both channel messages and direct messages (DMs). This document explains the design decisions, implementation details, and how to use the new system.

## Data Model

### Database Schema
```sql
-- Core type for message classification
CREATE TYPE conversation_type AS ENUM ('channel', 'dm');

-- Reference table for conversation integrity
CREATE TABLE conversation_refs (
    id uuid,
    type conversation_type,
    PRIMARY KEY (id, type)
);

-- Unified messages table
ALTER TABLE messages (
    -- ... existing columns ...
    conversation_id uuid,
    conversation_type conversation_type,
    FOREIGN KEY (conversation_id, conversation_type) 
    REFERENCES conversation_refs(id, type)
);
```

### Key Features
- Single source of truth for messages
- Type-safe conversation references
- Automatic reference maintenance through triggers
- Cascading deletes for cleanup

## API Endpoints

### Unified Message Endpoint
`/api/conversations/[id]/messages`

#### Usage
```typescript
// Channel messages
GET/POST /api/conversations/{channelId}/messages?type=channel

// DM messages
GET/POST /api/conversations/{dmChannelId}/messages?type=dm
```

#### Security
- Authentication required for all operations
- Access control based on conversation type:
  - Channels: Must exist
  - DMs: User must be a participant

## Implementation Details

### Automatic Reference Management
The system uses PostgreSQL triggers to maintain the `conversation_refs` table:
- `maintain_conversation_refs()`: Keeps references in sync
- `channel_refs_trigger`: Handles channel references
- `dm_channel_refs_trigger`: Handles DM references

### Message Lifecycle
1. Client generates UUID for deduplication
2. Server validates access and conversation type
3. Message is stored with conversation reference
4. Triggers maintain referential integrity

## Migration Notes
- Old endpoints are deprecated but maintained for backward compatibility
- Warning messages guide developers to new endpoints
- Database changes are backward compatible
- Frontend should be updated to use new unified endpoint

## Best Practices
1. Always specify conversation type in requests
2. Use client-generated IDs for message deduplication
3. Handle both channel and DM cases in frontend components
4. Use type guards for conversation type checking

## Type Definitions
```typescript
type ConversationType = 'channel' | 'dm';

interface Message {
  id: string;
  content: string;
  user_id: string;
  conversation_id: string;
  conversation_type: ConversationType;
  // ... other fields
}
```

## Future Considerations
- Message threading support
- Rich message content
- Message editing history
- Read receipts
- Message reactions 