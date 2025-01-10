-- Update constraints for DM messages
ALTER TABLE messages
DROP CONSTRAINT messages_channel_id_fkey,
ALTER COLUMN channel_id DROP NOT NULL,
ADD CONSTRAINT messages_channel_id_fkey 
    FOREIGN KEY (channel_id) 
    REFERENCES channels(id) 
    ON DELETE CASCADE,
ADD CONSTRAINT messages_channel_type_check 
    CHECK (
        (channel_id IS NOT NULL AND dm_channel_id IS NULL) OR
        (channel_id IS NULL AND dm_channel_id IS NOT NULL)
    ); 