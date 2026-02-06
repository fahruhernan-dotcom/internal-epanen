-- Table to store AI-generated summaries for Company Profiles
CREATE TABLE IF NOT EXISTS company_profile_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE company_profile_summaries ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow everyone to read (authenticated)
CREATE POLICY "Allow read access to everyone" 
ON company_profile_summaries FOR SELECT 
TO authenticated
USING (true);

-- Allow system/service/authenticated users to insert/update
CREATE POLICY "Allow insert/update to authenticated" 
ON company_profile_summaries FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant access
GRANT ALL ON company_profile_summaries TO authenticated;
GRANT ALL ON company_profile_summaries TO service_role;
