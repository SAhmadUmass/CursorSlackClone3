-- Add RLS policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read conversations"
    ON conversations FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation creators can delete their conversations"
    ON conversations FOR DELETE
    USING (auth.uid() = created_by);

-- Add RLS policies for messages in the new schema
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages"
    ON messages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Message creators can update their messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Message creators can delete their messages"
    ON messages FOR DELETE
    USING (auth.uid() = user_id); 