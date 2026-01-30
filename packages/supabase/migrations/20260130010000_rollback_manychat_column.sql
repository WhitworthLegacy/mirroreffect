-- Migration: Rollback ManyChat subscriber_id column
-- Date: 2026-01-30
-- Reason: Not needed for current use case

-- =============================================================================
-- Drop indexes first (must be done before dropping column)
-- =============================================================================
DROP INDEX IF EXISTS public.idx_leads_manychat_subscriber_unique;
DROP INDEX IF EXISTS public.idx_leads_manychat_subscriber;

-- =============================================================================
-- Drop the column
-- =============================================================================
ALTER TABLE public.leads DROP COLUMN IF EXISTS manychat_subscriber_id;
