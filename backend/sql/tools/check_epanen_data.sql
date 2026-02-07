-- ============================================
-- DATA INTEGRITY CHECK: ePanen & Finance Docs
-- Run this in Supabase SQL Editor to see where the data is.
-- ============================================

-- 1. Check counts in the Unified View
SELECT 
    company_name, 
    company_id, 
    COUNT(*) as doc_count 
FROM 
    v_all_finance_docs 
GROUP BY 
    company_name, company_id;

-- 2. Check if ePanen table itself has data
SELECT COUNT(*) as table_count FROM finance_epanen;

-- 3. Check sample data from ePanen to see metadata and dates
SELECT created_at, metadata FROM finance_epanen LIMIT 3;

-- 4. Check if the ePanen Company ID matches the companies table
SELECT id, name, code FROM companies WHERE name ILIKE 'ePanen%';
