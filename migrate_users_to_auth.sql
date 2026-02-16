-- Enable pgcrypto for password hashing
create extension if not exists "pgcrypto";

-- Migration: Insert users from public.users into auth.users (for Phone Auth)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    phone,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
SELECT
    '00000000-0000-0000-0000-000000000000', -- instance_id
    gen_random_uuid(), -- id
    'authenticated', -- aud
    'authenticated', -- role
    NULL, -- email (using phone)
    -- Normalize Phone Number: Ensure it starts with 62
    CASE 
        WHEN phone_number::text LIKE '0%' THEN '62' || substring(phone_number::text from 2)
        WHEN phone_number::text LIKE '62%' THEN phone_number::text
        ELSE '62' || phone_number::text 
    END AS phone,
    -- Hash the password using bcrypt. Fallback to 'epanen2026' if null
    crypt(coalesce(password, 'epanen2026'), gen_salt('bf')),
    NULL, -- email_confirmed_at
    now(), -- phone_confirmed_at (auto confirm)
    NULL,
    NULL,
    '{"provider": "phone", "providers": ["phone"]}'::jsonb, -- raw_app_meta_data
    json_build_object(
        'full_name', full_name,
        'role', role,
        'migrated', true
    )::jsonb, -- raw_user_meta_data
    now(),
    now(),
    '',
    '',
    '',
    ''
FROM public.users
WHERE 
    -- Only migrate users who have a phone number
    phone_number IS NOT NULL 
    -- Prevent duplicates if run multiple times (check by phone)
    AND NOT EXISTS (
        SELECT 1 FROM auth.users au 
        WHERE au.phone = CASE 
            WHEN users.phone_number::text LIKE '0%' THEN '62' || substring(users.phone_number::text from 2)
            WHEN users.phone_number::text LIKE '62%' THEN users.phone_number::text
            ELSE '62' || users.phone_number::text 
        END
    );

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed. Check auth.users for new entries.';
END $$;
