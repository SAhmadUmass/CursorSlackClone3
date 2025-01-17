-- Add sources column to messages table
ALTER TABLE messages
ADD COLUMN sources JSONB[];

-- Update RLS policy to allow reading sources
CREATE POLICY "Anyone can read message sources"
    ON messages FOR SELECT
    USING (true); 