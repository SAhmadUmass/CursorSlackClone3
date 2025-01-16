-- Add new columns to messages table
ALTER TABLE messages
ADD COLUMN conversation_id UUID REFERENCES conversations(id),
ADD COLUMN conversation_type conversation_type;

-- Migrate channel messages
UPDATE messages
SET conversation_id = channel_id,
    conversation_type = 'channel'
WHERE channel_id IS NOT NULL;

-- Migrate DM messages
UPDATE messages
SET conversation_id = dm_channel_id,
    conversation_type = 'dm'
WHERE dm_channel_id IS NOT NULL;

-- Make new columns required
ALTER TABLE messages
ALTER COLUMN conversation_id SET NOT NULL,
ALTER COLUMN conversation_type SET NOT NULL;

-- Drop old columns and constraints
ALTER TABLE messages
DROP CONSTRAINT messages_channel_id_fkey,
DROP CONSTRAINT messages_channel_type_check,
DROP COLUMN channel_id,
DROP COLUMN dm_channel_id;

-- Drop old tables
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS dm_channels CASCADE; 