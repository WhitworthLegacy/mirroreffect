-- Migration: Create leads, notifications, payments tables
-- Date: 2026-01-26

-- =============================================================================
-- Table Leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  step INTEGER,
  status TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  language TEXT DEFAULT 'fr',
  event_date DATE,
  event_location TEXT,
  pack_id UUID REFERENCES packs(id),
  guest_count INTEGER,
  transport_fee_cents INTEGER,
  total_cents INTEGER,
  deposit_cents INTEGER,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  promo_sent_at TIMESTAMPTZ
);

-- =============================================================================
-- Table Notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id TEXT,
  event_id UUID REFERENCES events(id),
  template_key TEXT,
  to_email TEXT,
  locale TEXT DEFAULT 'fr',
  payload JSONB,
  send_after TIMESTAMPTZ,
  status TEXT DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table Payments
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE,
  event_id UUID REFERENCES events(id),
  provider TEXT,
  provider_payment_id TEXT,
  amount_cents INTEGER,
  status TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(client_email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON public.notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- =============================================================================
-- RLS Policies (basic - allow service role full access)
-- =============================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "Service role has full access to leads" ON public.leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to payments" ON public.payments
  FOR ALL USING (true) WITH CHECK (true);
