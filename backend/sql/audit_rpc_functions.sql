-- ============================================
-- RPC FUNCTION AUDIT
-- Run this in Supabase SQL Editor to see all existing 'match_' functions.
-- This is non-destructive and only reads the information schema.
-- ============================================

SELECT
    routine_name as function_name,
    routine_type as type,
    data_type as return_data_type
FROM
    information_schema.routines
WHERE
    routine_schema = 'public'
    AND routine_name LIKE 'match_%'
ORDER BY
    routine_name;
