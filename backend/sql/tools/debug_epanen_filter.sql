-- Diagnostic Query for ePanen Data
SELECT 
  'finance_epanen' as source,
  id, 
  created_at, 
  metadata->>'date' as meta_date,
  '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0' as expected_id
FROM finance_epanen
ORDER BY created_at DESC
LIMIT 10;

SELECT 
  'v_all_finance_docs' as source,
  id, 
  company_name, 
  company_id, 
  created_at
FROM v_all_finance_docs
WHERE company_name = 'ePanen'
ORDER BY created_at DESC
LIMIT 10;
