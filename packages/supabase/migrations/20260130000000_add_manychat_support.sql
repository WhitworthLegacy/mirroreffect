-- Migration: Add ManyChat support
-- Date: 2026-01-30
-- Purpose: Store ManyChat subscriber_id for bidirectional sync

-- =============================================================================
-- Add manychat_subscriber_id to leads table
-- =============================================================================
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS manychat_subscriber_id TEXT;

-- =============================================================================
-- Add index for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_manychat_subscriber
  ON public.leads(manychat_subscriber_id)
  WHERE manychat_subscriber_id IS NOT NULL;

-- =============================================================================
-- Add comment for documentation
-- =============================================================================
COMMENT ON COLUMN public.leads.manychat_subscriber_id IS 'ManyChat subscriber ID for linking to Messenger conversations';

-- =============================================================================
-- Add unique constraint to prevent duplicate subscribers
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_manychat_subscriber_unique
  ON public.leads(manychat_subscriber_id)
  WHERE manychat_subscriber_id IS NOT NULL AND manychat_subscriber_id != '';
