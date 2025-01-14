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