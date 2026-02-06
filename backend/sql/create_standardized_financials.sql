-- Table to store AI-normalized financial data
-- This acts as a cache for AI processing results to reduce costs and latency.

CREATE TABLE IF NOT EXISTS public.standardized_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL UNIQUE, -- ID of the original document/chunk analyzed
    company_name TEXT NOT NULL,
    revenue NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    net_profit NUMERIC DEFAULT 0,
    report_date DATE,
    ai_reasoning TEXT, -- Stores logic/notes from AI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standardized_financials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access for authenticated users" 
ON public.standardized_financials FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role insertion" 
ON public.standardized_financials FOR ALL 
TO service_role 
USING (true);

-- Policy for web app users (Temporary broad policy, refine if needed)
CREATE POLICY "Allow admins/authenticated to upsert" 
ON public.standardized_financials FOR ALL 
USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_std_fin_company ON public.standardized_financials(company_name);
CREATE INDEX IF NOT EXISTS idx_std_fin_date ON public.standardized_financials(report_date);
