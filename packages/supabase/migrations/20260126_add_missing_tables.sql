-- Migration: Ajouter les tables manquantes pour la migration GAS → Supabase
-- Date: 2026-01-26

-- =============================================================================
-- 1. Ajouter event_id à la table events (identifiant métier unique)
-- =============================================================================
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_id TEXT UNIQUE;

-- Générer event_id pour les lignes existantes qui n'en ont pas
UPDATE public.events
SET event_id = 'EVT-' || EXTRACT(EPOCH FROM created_at)::BIGINT || '-' || UPPER(SUBSTRING(id::TEXT, 1, 6))
WHERE event_id IS NULL;

-- Index pour recherche rapide par event_id
CREATE INDEX IF NOT EXISTS idx_events_event_id ON public.events(event_id);

-- Ajouter payment_id pour lier aux paiements Mollie
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- =============================================================================
-- 2. Table leads (prospects du funnel de réservation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identifiant métier unique
  lead_id TEXT UNIQUE NOT NULL,

  -- Progression dans le funnel
  step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'progress', -- progress, converted, abandoned

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

  -- Prix affichés
  transport_euros DECIMAL(10,2),
  total DECIMAL(10,2),
  acompte DECIMAL(10,2),

  -- UTM tracking
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,

  -- Nurturing
  promo_sent_at TIMESTAMPTZ,
  converted_event_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON public.leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Trigger pour updated_at
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
-- 3. Table payments (paiements Mollie)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identifiants
  payment_id TEXT UNIQUE NOT NULL, -- Mollie tr_xxx
  event_id TEXT NOT NULL,

  -- Provider
  provider TEXT DEFAULT 'mollie',
  provider_payment_id TEXT,

  -- Montant et statut
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'open', -- open, paid, failed, expired, canceled
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- =============================================================================
-- 4. Table notifications_log (historique des emails envoyés)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identifiants
  notification_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  event_id TEXT,

  -- Email details
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  locale TEXT DEFAULT 'fr',
  payload JSONB,

  -- Scheduling
  send_after TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'queued', -- queued, sent, failed
  sent_at TIMESTAMPTZ,
  resend_message_id TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications_log(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_notifications_template ON public.notifications_log(template_key);

-- =============================================================================
-- 5. Supprimer la table monthly_marketing_stats (optionnel)
-- =============================================================================
-- DROP TABLE IF EXISTS public.monthly_marketing_stats;
-- Décommente la ligne ci-dessus si tu veux la supprimer

-- =============================================================================
-- Résumé des changements :
-- - events: ajout event_id, payment_id
-- - leads: nouvelle table pour le funnel
-- - payments: nouvelle table pour Mollie
-- - notifications_log: nouvelle table pour les emails
-- =============================================================================
