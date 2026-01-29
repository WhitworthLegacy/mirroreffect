-- Migration: Fix notification duplicates by adding unique constraints
-- Date: 2026-01-29
-- Issue: Multiple notifications can be created for the same template_key + email + event

-- =============================================================================
-- 1. Clean up any existing duplicates before adding constraint
-- =============================================================================

-- Keep only the oldest notification for each combination (most likely the correct one)
DELETE FROM public.notifications a
USING public.notifications b
WHERE a.id > b.id
  AND a.template_key = b.template_key
  AND a.to_email = b.to_email
  AND COALESCE(a.event_id::text, '') = COALESCE(b.event_id::text, '');

-- =============================================================================
-- 2. Add unique constraint to prevent future duplicates
-- =============================================================================

-- For event-based notifications (booking confirmations, post-event emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_event_template
  ON public.notifications(template_key, to_email, event_id)
  WHERE event_id IS NOT NULL;

-- For non-event notifications (nurture sequences)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_nurture_template
  ON public.notifications(template_key, to_email)
  WHERE event_id IS NULL;

-- =============================================================================
-- 3. Add index for better query performance on deduplication checks
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_template_email
  ON public.notifications(template_key, to_email);

CREATE INDEX IF NOT EXISTS idx_notifications_send_after
  ON public.notifications(send_after)
  WHERE status = 'queued';

-- =============================================================================
-- 4. Add email unsubscribe tracking table for granular control
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'all')),
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, category)
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email
  ON public.email_unsubscribes(email);

-- Enable RLS
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to unsubscribes" ON public.email_unsubscribes
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. Add lead_event tracking to prevent lead matching issues
-- =============================================================================

-- Track which lead led to which event for better data integrity
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS converted_event_id UUID REFERENCES events(id);

CREATE INDEX IF NOT EXISTS idx_leads_converted_event
  ON public.leads(converted_event_id)
  WHERE converted_event_id IS NOT NULL;
