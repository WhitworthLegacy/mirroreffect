-- =============================================================================
-- MIRROREFFECT - Schéma Supabase Simplifié
-- =============================================================================
-- Hard data uniquement - les calculs sont dans Google Sheets
-- Dernière mise à jour: 2026-01-27
-- =============================================================================

-- =============================================================================
-- TABLE: events (données clients/événements - hard data uniquement)
-- =============================================================================
-- Les montants sont stockés en CENTS (INTEGER)
-- Les calculs (marge, KM, coûts) sont gérés dans Google Sheets

CREATE TABLE IF NOT EXISTS public.events (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,                           -- Identifiant métier (EVT-xxx)
  payment_id TEXT,                                -- Mollie payment ID (tr_xxx)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Client (hard data)
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  language TEXT DEFAULT 'fr',                     -- 'fr' ou 'nl'

  -- Event (hard data)
  event_date DATE,                                -- Date de l'événement
  event_type TEXT,                                -- 'B2B', 'Mariage', 'Anniversaire', etc.
  address TEXT,
  guest_count INTEGER,
  status TEXT DEFAULT 'active',                   -- 'active', 'cancelled', 'completed'

  -- Pack & Prix (hard data - en CENTS)
  pack_id TEXT,                                   -- UUID du pack
  total_cents INTEGER,                            -- Prix total TTC
  transport_fee_cents INTEGER DEFAULT 0,
  deposit_cents INTEGER,                          -- Acompte payé
  balance_due_cents INTEGER,                      -- Solde restant
  balance_status TEXT DEFAULT 'pending',          -- 'pending', 'paid'

  -- Closing date (pour sync avec Google Sheets)
  closing_date DATE,                              -- Date paiement acompte

  -- Assignations (référence, calculs dans Google Sheets)
  student_name TEXT,
  commercial_name TEXT
);

-- Indexes events (seulement les essentiels)
CREATE INDEX IF NOT EXISTS idx_events_event_id ON public.events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_email ON public.events(client_email);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_events_updated_at ON public.events;
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();


-- =============================================================================
-- TABLE: packs (définition des packs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,                               -- 'decouverte', 'essentiel', 'premium'
  name_fr TEXT NOT NULL,
  name_nl TEXT,
  price_current_cents INTEGER NOT NULL,           -- Prix actuel TTC en cents
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales packs
INSERT INTO public.packs (code, name_fr, name_nl, price_current_cents)
VALUES
  ('decouverte', 'Découverte', 'Ontdekking', 34900),   -- 349€
  ('essentiel', 'Essentiel', 'Essentieel', 44900),     -- 449€
  ('premium', 'Premium', 'Premium', 54900)             -- 549€
ON CONFLICT (code) DO NOTHING;


-- =============================================================================
-- TABLE: leads (prospects du funnel de réservation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identifiant métier
  lead_id TEXT UNIQUE NOT NULL,

  -- Progression funnel
  step INTEGER DEFAULT 1,                         -- 1-7
  status TEXT DEFAULT 'progress',                 -- 'progress', 'converted', 'abandoned'

  -- Contact
  nom TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  language TEXT DEFAULT 'FR',

  -- Préférences événement
  date_event TEXT,
  lieu_event TEXT,
  pack TEXT,
  invites TEXT,

  -- UTM tracking
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,

  -- Conversion
  converted_event_id TEXT
);

-- Indexes leads
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON public.leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();


-- =============================================================================
-- TABLE: payments (paiements Mollie)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  -- Identifiants
  payment_id TEXT UNIQUE NOT NULL,                -- Mollie tr_xxx
  event_id TEXT NOT NULL,                         -- Lien vers events.event_id

  -- Provider
  provider TEXT DEFAULT 'mollie',
  provider_payment_id TEXT,

  -- Montant et statut
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'open',                     -- 'open', 'paid', 'failed', 'expired', 'canceled'
  paid_at TIMESTAMPTZ
);

-- Indexes payments
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);


-- =============================================================================
-- TABLE: notifications_log (historique emails envoyés)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identifiants
  notification_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  event_id TEXT,

  -- Email details
  template_key TEXT NOT NULL,                     -- 'B2C_BOOKING_CONFIRMED', etc.
  to_email TEXT NOT NULL,
  locale TEXT DEFAULT 'fr',
  payload JSONB,

  -- Scheduling
  send_after TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'queued',                   -- 'queued', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  resend_message_id TEXT,
  error TEXT
);

-- Indexes notifications
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications_log(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications_log(status);


-- =============================================================================
-- PERMISSIONS (RLS)
-- =============================================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Policies (service role full access)
CREATE POLICY "service_role_events" ON public.events FOR ALL USING (true);
CREATE POLICY "service_role_packs" ON public.packs FOR ALL USING (true);
CREATE POLICY "service_role_leads" ON public.leads FOR ALL USING (true);
CREATE POLICY "service_role_payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "service_role_notifications" ON public.notifications_log FOR ALL USING (true);

-- Public read access for packs
CREATE POLICY "public_read_packs" ON public.packs FOR SELECT USING (true);


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.events IS 'Événements/clients - hard data uniquement. Calculs dans Google Sheets.';
COMMENT ON TABLE public.packs IS 'Définition des packs (Découverte, Essentiel, Premium).';
COMMENT ON TABLE public.leads IS 'Prospects du funnel de réservation.';
COMMENT ON TABLE public.payments IS 'Paiements Mollie.';
COMMENT ON TABLE public.notifications_log IS 'Historique emails envoyés via Resend.';
