-- Insert the AI user if it doesn't exist
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    instance_id
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'ai@assistant.com',
    jsonb_build_object(
        'full_name', 'AI Assistant',
        'avatar_url', null
    ),
    NOW(),
    NOW(),
    '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policy to allow the AI user to send messages
CREATE POLICY "Allow AI user to send messages"
    ON messages FOR INSERT
    WITH CHECK (
        user_id = '00000000-0000-0000-0000-000000000000'
    ); 