-- Start a transaction
BEGIN;

-- Add 'ai' as a valid value for conversation_type enum
ALTER TYPE conversation_type ADD VALUE IF NOT EXISTS 'ai';

-- Commit the transaction to ensure the enum value is available
COMMIT;

-- Now create the policies in a separate transaction
BEGIN;

-- Update RLS policies to handle AI conversations
CREATE POLICY "Users can read their AI conversations"
    ON conversations FOR SELECT
    USING (
        type = 'ai' AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can create AI conversations"
    ON conversations FOR INSERT
    WITH CHECK (
        type = 'ai' AND
        auth.uid() = created_by
    );

COMMIT; 