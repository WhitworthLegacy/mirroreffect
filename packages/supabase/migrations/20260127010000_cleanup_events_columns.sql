-- Migration: Simplifier la table events - hard data uniquement
-- Date: 2026-01-27
-- Les calculs (marge, KM, coûts) sont désormais gérés dans Google Sheets

-- 0) Supprimer les views qui dépendent des colonnes à supprimer
DROP VIEW IF EXISTS v_monthly_stats CASCADE;
DROP VIEW IF EXISTS v_student_monthly_stats CASCADE;
DROP VIEW IF EXISTS v_commercial_monthly_stats CASCADE;

-- 1) Supprimer les colonnes de calcul (gardées dans Google Sheets)
ALTER TABLE public.events DROP COLUMN IF EXISTS zone_id;
ALTER TABLE public.events DROP COLUMN IF EXISTS on_site_contact;
ALTER TABLE public.events DROP COLUMN IF EXISTS student_hours;
ALTER TABLE public.events DROP COLUMN IF EXISTS student_rate_cents;
ALTER TABLE public.events DROP COLUMN IF EXISTS km_one_way;
ALTER TABLE public.events DROP COLUMN IF EXISTS km_total;
ALTER TABLE public.events DROP COLUMN IF EXISTS fuel_cost_cents;
ALTER TABLE public.events DROP COLUMN IF EXISTS commercial_commission_cents;
ALTER TABLE public.events DROP COLUMN IF EXISTS deposit_invoice_ref;
ALTER TABLE public.events DROP COLUMN IF EXISTS balance_invoice_ref;
ALTER TABLE public.events DROP COLUMN IF EXISTS invoice_deposit_paid;
ALTER TABLE public.events DROP COLUMN IF EXISTS invoice_balance_paid;

-- 2) Supprimer les indexes obsolètes
DROP INDEX IF EXISTS idx_events_closing_date;
DROP INDEX IF EXISTS idx_events_student_name;
DROP INDEX IF EXISTS idx_events_commercial_name;
DROP INDEX IF EXISTS idx_events_pack_id;

-- 3) Supprimer la table monthly_stats (stats dans Google Sheets)
DROP TABLE IF EXISTS public.monthly_stats CASCADE;

-- 4) Supprimer la table accounting_transactions (non utilisée)
DROP TABLE IF EXISTS public.accounting_transactions CASCADE;

-- 5) Supprimer la table monthly_marketing_stats (stats dans Google Sheets)
DROP TABLE IF EXISTS public.monthly_marketing_stats CASCADE;

-- 6) Les views ont déjà été supprimées en début de migration

-- 7) Simplifier la table packs
ALTER TABLE public.packs DROP COLUMN IF EXISTS price_original_cents;
ALTER TABLE public.packs DROP COLUMN IF EXISTS impressions_included;
ALTER TABLE public.packs DROP COLUMN IF EXISTS cost_cents;
ALTER TABLE public.packs DROP COLUMN IF EXISTS updated_at;

-- 8) Simplifier la table leads
ALTER TABLE public.leads DROP COLUMN IF EXISTS transport_euros;
ALTER TABLE public.leads DROP COLUMN IF EXISTS total;
ALTER TABLE public.leads DROP COLUMN IF EXISTS acompte;
ALTER TABLE public.leads DROP COLUMN IF EXISTS promo_sent_at;
