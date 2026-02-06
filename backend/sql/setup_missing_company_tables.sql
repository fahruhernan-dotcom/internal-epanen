-- ============================================
-- SETUP MISSING COMPANY TABLES & UNIFIED VIEWS
-- Run this script in Supabase SQL Editor to ensure all RAG tables exist.
-- ============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. FINANCE TABLES (RAG)
-- Standard schema for financial PDF chunks

CREATE TABLE IF NOT EXISTS public.finance_epanen (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768), -- Match n8n / OpenAI embedding dimension
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_epanen_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.finance_kaja (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_kaja_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.finance_lyori (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_lyori_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.finance_melon (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_melon_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.finance_moafarm (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT finance_moafarm_pkey PRIMARY KEY (id)
);

-- 3. GENERAL DOCUMENT TABLES (RAG)
-- Standard schema for general PDF chunks (SOP, Profile, etc.)

CREATE TABLE IF NOT EXISTS public.general_document_epanen (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT general_document_epanen_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.general_document_kaja (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT general_document_kaja_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.general_document_lyori (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT general_document_lyori_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.general_document_melon (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT general_document_melon_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.general_document_moafarm (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    content text,
    embedding vector(768),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT general_document_moafarm_pkey PRIMARY KEY (id)
);

-- 4. UPDATE UNIFIED VIEWS

-- Unified Finance View
DROP VIEW IF EXISTS public.v_all_finance_docs;
CREATE OR REPLACE VIEW public.v_all_finance_docs AS
SELECT id, content, metadata, created_at, 'ePanen' as company_name, '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid as company_id FROM finance_epanen
UNION ALL
SELECT id, content, metadata, created_at, 'Kaja' as company_name, '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id FROM finance_kaja
UNION ALL
SELECT id, content, metadata, created_at, 'Lyori' as company_name, '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id FROM finance_lyori
UNION ALL
SELECT id, content, metadata, created_at, 'Melon' as company_name, '9c839312-d9ff-40c0-9800-732877cd7287'::uuid as company_id FROM finance_melon
UNION ALL
SELECT id, content, metadata, created_at, 'Moafarm' as company_name, '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id FROM finance_moafarm;

-- Unified General Documents View
DROP VIEW IF EXISTS public.v_all_general_docs;
CREATE OR REPLACE VIEW public.v_all_general_docs AS
SELECT id, content, embedding, metadata, created_at, 'ePanen' as company_name, '3d0e89d1-76f5-421b-ba7b-c2c0dea6ebf0'::uuid as company_id FROM general_document_epanen
UNION ALL
SELECT id, content, embedding, metadata, created_at, 'Kaja' as company_name, '8523f28b-7f12-4455-a8a8-015d2a826d5c'::uuid as company_id FROM general_document_kaja
UNION ALL
SELECT id, content, embedding, metadata, created_at, 'Lyori' as company_name, '53af2fd7-685d-41b5-8daa-265fe3db9b46'::uuid as company_id FROM general_document_lyori
UNION ALL
SELECT id, content, embedding, metadata, created_at, 'Melon' as company_name, '9c839312-d9ff-40c0-9800-732877cd7287'::uuid as company_id FROM general_document_melon
UNION ALL
SELECT id, content, embedding, metadata, created_at, 'Moafarm' as company_name, '5236043f-a9ce-498c-84c4-c5de16893ccd'::uuid as company_id FROM general_document_moafarm;

-- 5. PERMISSIONS
GRANT SELECT ON public.v_all_finance_docs TO authenticated, anon;
GRANT SELECT ON public.v_all_general_docs TO authenticated, anon;
