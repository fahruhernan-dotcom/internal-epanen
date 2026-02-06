-- ============================================
-- FINANCIAL REPORTS UPGRADE V2 (CONSOLIDATED)
-- Run this single script to apply ALL database changes for the Financial Reports functionality.
-- ============================================

-- 1. CREATE AI SUMMARIES TABLE
-- Stores AI-generated insights for specific time periods to cache results.
CREATE TABLE IF NOT EXISTS public.financial_period_summaries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    period_type text NOT NULL CHECK (period_type IN ('monthly', 'weekly', 'custom', 'daily')),
    summary_text text,
    period_label text, -- e.g. "January 2026"
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT financial_period_summaries_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_finance_summaries_dates ON financial_period_summaries(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_finance_summaries_company ON financial_period_summaries(company_id);

-- RLS
ALTER TABLE financial_period_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read financial summaries"
  ON financial_period_summaries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert financial summaries"
  ON financial_period_summaries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update financial summaries"
  ON financial_period_summaries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. CREATE UNIFIED FINANCE DOCUMENTS VIEW
-- This View allows the frontend to read Revenue/Expense metadata from RAG chunks.
DROP VIEW IF EXISTS public.v_all_finance_docs;

CREATE OR REPLACE VIEW public.v_all_finance_docs AS
SELECT
  id,
  content,
  metadata,
  created_at,
  'ePanen' as company_name,
  '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid as company_id
FROM finance_epanen

UNION ALL

SELECT
  id,
  content,
  metadata,
  created_at,
  'Kaja' as company_name,
  '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id
FROM finance_kaja

UNION ALL

SELECT
  id,
  content,
  metadata,
  created_at,
  'Lyori' as company_name,
  '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id
FROM finance_lyori

UNION ALL

SELECT
  id,
  content,
  metadata,
  created_at,
  'Melon' as company_name,
  '9c839312-d9ff-40c0-9800-732877cd7287'::uuid as company_id
FROM finance_melon

UNION ALL

SELECT
  id,
  content,
  metadata,
  created_at,
  'Moafarm' as company_name,
  '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id
FROM finance_moafarm;

-- Permissions
GRANT SELECT ON public.v_all_finance_docs TO authenticated;
GRANT SELECT ON public.v_all_finance_docs TO anon;

-- Comments
COMMENT ON TABLE financial_period_summaries IS 'Stores AI-generated insights to prevent re-generation.';
COMMENT ON VIEW public.v_all_finance_docs IS 'Unified view of all finance RAG documents for financial reporting.';
