-- ============================================
-- CLEANUP: Orphaned AI Summaries
-- Run this in Supabase SQL Editor to remove records with missing company_id
-- ============================================

DELETE FROM public.financial_period_summaries
WHERE company_id IS NULL;

-- Verification
SELECT COUNT(*) as remaining_summaries FROM public.financial_period_summaries;
