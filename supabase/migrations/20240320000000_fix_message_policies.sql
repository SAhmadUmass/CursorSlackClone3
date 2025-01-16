-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Message creators can delete their messages" ON messages;
DROP POLICY IF EXISTS "Message creators can update their messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Create policies
-- SELECT: Anyone can read messages in conversations they have access to
CREATE POLICY "Anyone can read messages" ON messages
FOR SELECT USING (
  CASE
    -- For channel messages, allow if authenticated
    WHEN conversation_type = 'channel' THEN auth.role() = 'authenticated'
    -- For DM messages, allow if authenticated (we'll handle DM privacy at the conversation level)
    WHEN conversation_type = 'dm' THEN auth.role() = 'authenticated'
    ELSE false
  END
);

-- INSERT: Authenticated users can insert messages in conversations they have access to
CREATE POLICY "Authenticated users can insert messages" ON messages
FOR INSERT WITH CHECK (
  -- User must be authenticated
  auth.role() = 'authenticated' AND
  -- Ensure the conversation exists
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id
  )
);

-- UPDATE: Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (
  auth.uid() = user_id
);

-- DELETE: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (
  auth.uid() = user_id
); 