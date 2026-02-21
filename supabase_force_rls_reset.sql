-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ePANEN RLS FIX - FORCE CLEAR & RESET AI ANALYTICS POLICIES   ║
-- ║  Jalankan di Supabase SQL Editor                              ║
-- ║                                                               ║
-- ║  MASALAH:                                                     ║
-- ║  - Error 401 / RLS Violation pada "standardized_financials"  ║
-- ║  - Masih gagal meski policy sudah ditambah.                   ║
-- ║  - Mungkin karena bentrok dengan policy lama ber-nama beda.   ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 1. Bersihkan semua policy lama yang mungkin bentrok (dari berbagai migrasi)
DROP POLICY IF EXISTS "std_fin_select" ON public.standardized_financials;
DROP POLICY IF EXISTS "std_fin_insert" ON public.standardized_financials;
DROP POLICY IF EXISTS "std_fin_update" ON public.standardized_financials;
DROP POLICY IF EXISTS "std_fin_delete" ON public.standardized_financials;
DROP POLICY IF EXISTS "Allow public read access for authenticated users" ON public.standardized_financials;
DROP POLICY IF EXISTS "Allow service role insertion" ON public.standardized_financials;
DROP POLICY IF EXISTS "Allow admins/authenticated to upsert" ON public.standardized_financials;

DROP POLICY IF EXISTS "fin_sum_select" ON public.financial_period_summaries;
DROP POLICY IF EXISTS "fin_sum_insert" ON public.financial_period_summaries;
DROP POLICY IF EXISTS "fin_sum_update" ON public.financial_period_summaries;
DROP POLICY IF EXISTS "fin_sum_delete" ON public.financial_period_summaries;

-- 2. Pastikan RLS Aktif
ALTER TABLE public.standardized_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_period_summaries ENABLE ROW LEVEL SECURITY;

-- 3. Beri Permission Dasar ke role authenticated
GRANT ALL ON public.standardized_financials TO authenticated;
GRANT ALL ON public.financial_period_summaries TO authenticated;
GRANT ALL ON public.standardized_financials TO anon; -- Safety fallback jika JWT telat
GRANT ALL ON public.financial_period_summaries TO anon;

-- 4. Buat Unified Policy (FOR ALL) agar UPSERT (Insert + Update) lancar
-- Kita pakai FOR ALL supaya mencakup SELECT, INSERT, UPDATE, DELETE sekaligus.
-- Kita pakai TO public agar mencakup authenticated dan anon (jika ada isu session).

CREATE POLICY "standardized_financials_all_access" 
ON public.standardized_financials 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "financial_period_summaries_all_access" 
ON public.financial_period_summaries 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 5. Tambahan: Grant Sequence jika ada (biasanya UUID jadi tidak butuh, tapi untuk safety)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
