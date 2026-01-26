-- =============================================================================
-- MIRROREFFECT - Schéma Supabase Complet
-- =============================================================================
-- Fichier centralisé avec toutes les tables, views et indexes
-- Dernière mise à jour: 2026-01-26
-- =============================================================================

-- =============================================================================
-- TABLE: events (table principale - remplace sheet "Clients")
-- =============================================================================
-- Contient toutes les données client/événement
-- Les montants sont stockés en CENTS (INTEGER) pour éviter les erreurs de float

CREATE TABLE IF NOT EXISTS public.events (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE,                           -- Identifiant métier (EVT-xxx)
  payment_id TEXT,                                -- Mollie payment ID (tr_xxx)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Client
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  language TEXT DEFAULT 'fr',                     -- 'fr' ou 'nl'

  -- Event
  event_date DATE,                                -- Date de l'événement
  event_type TEXT,                                -- 'B2B', 'Mariage', 'Anniversaire', 'Bapteme', etc.
  address TEXT,
  zone_id TEXT,                                   -- ID zone pour tarifs transport
  on_site_contact TEXT,
  guest_count INTEGER,
  status TEXT DEFAULT 'active',                   -- 'active', 'cancelled', 'completed'

  -- Pack & Prix (en CENTS)
  pack_id TEXT,                                   -- 'decouverte', 'essentiel', 'premium'
  total_cents INTEGER,                            -- Prix total TTC
  transport_fee_cents INTEGER DEFAULT 0,
  deposit_cents INTEGER,                          -- Acompte payé
  balance_due_cents INTEGER,                      -- Solde restant
  balance_status TEXT,                            -- 'pending', 'paid'

  -- Closing (pour stats mensuelles)
  closing_date DATE,                              -- Date paiement acompte = closing

  -- RH & Logistique
  student_name TEXT,
  student_hours NUMERIC,
  student_rate_cents INTEGER DEFAULT 1400,        -- 14€/h par défaut
  km_one_way NUMERIC,
  km_total NUMERIC,
  fuel_cost_cents INTEGER,

  -- Commercial
  commercial_name TEXT,
  commercial_commission_cents INTEGER,

  -- Factures ZenFacture
  deposit_invoice_ref TEXT,
  balance_invoice_ref TEXT,
  invoice_deposit_paid BOOLEAN DEFAULT FALSE,
  invoice_balance_paid BOOLEAN DEFAULT FALSE
);

-- Indexes events
CREATE INDEX IF NOT EXISTS idx_events_event_id ON public.events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_email ON public.events(client_email);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_closing_date ON public.events(closing_date);
CREATE INDEX IF NOT EXISTS idx_events_student_name ON public.events(student_name);
CREATE INDEX IF NOT EXISTS idx_events_commercial_name ON public.events(commercial_name);
CREATE INDEX IF NOT EXISTS idx_events_pack_id ON public.events(pack_id);
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
  id TEXT PRIMARY KEY,                            -- 'decouverte', 'essentiel', 'premium'
  code TEXT UNIQUE,                               -- même que id, pour compatibilité
  name_fr TEXT NOT NULL,
  name_nl TEXT,
  price_current_cents INTEGER NOT NULL,           -- Prix actuel TTC en cents
  price_original_cents INTEGER,                   -- Prix original (barré)
  impressions_included INTEGER DEFAULT 0,         -- Nombre d'impressions incluses
  cost_cents INTEGER,                             -- Coût du pack pour marge
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales packs
INSERT INTO public.packs (id, code, name_fr, name_nl, price_current_cents, impressions_included, cost_cents)
VALUES
  ('decouverte', 'decouverte', 'Découverte', 'Ontdekking', 34900, 50, 2312),   -- 349€, coût 23.12€
  ('essentiel', 'essentiel', 'Essentiel', 'Essentieel', 44900, 100, 4625),     -- 449€, coût 46.25€
  ('premium', 'premium', 'Premium', 'Premium', 54900, 150, 9250)               -- 549€, coût 92.50€
ON CONFLICT (id) DO NOTHING;


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

  -- Prix affichés (en EUROS, décimal)
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

-- Indexes leads
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON public.leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

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
  template_key TEXT NOT NULL,                     -- 'CONFIRMATION_MAIL', 'AVIS_GOOGLE', etc.
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
CREATE INDEX IF NOT EXISTS idx_notifications_template ON public.notifications_log(template_key);


-- =============================================================================
-- TABLE: monthly_stats (données Meta Ads - non calculables)
-- =============================================================================
-- Cette table garde uniquement les données marketing externes
-- Les autres stats sont calculées via v_monthly_stats

CREATE TABLE IF NOT EXISTS public.monthly_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL UNIQUE,

  -- Marketing Meta Ads (données externes, non calculables)
  leads_meta INTEGER DEFAULT 0,
  spent_meta_cents INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_stats_month ON public.monthly_stats(month);


-- =============================================================================
-- TABLE: accounting_transactions (comptabilité)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date DATE NOT NULL,
  counterparty TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  sent_to_accountant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON public.accounting_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_counterparty ON public.accounting_transactions(counterparty);


-- =============================================================================
-- VIEW: v_monthly_stats (statistiques mensuelles calculées)
-- =============================================================================
-- Remplace les calculs Google Sheets
-- Calcule automatiquement depuis la table events

DROP VIEW IF EXISTS v_monthly_stats CASCADE;

CREATE VIEW v_monthly_stats AS
WITH
-- Paramètres KPI
kpi AS (
  SELECT
    23.12 as pack_cost_decouverte,  -- Coût pack Découverte
    46.25 as pack_cost_essentiel,   -- Coût pack Essentiel
    92.50 as pack_cost_premium,     -- Coût pack Premium
    14.00 as student_hourly_rate,   -- Taux horaire étudiant
    905.36 as fixed_monthly_charges -- Charges fixes mensuelles
    -- Détail charges fixes:
    -- Zen Facture: 12€
    -- GSM + Wifi: 130.48€
    -- Compta: 150€
    -- Garage: 120€
    -- Canva: 9.16€
    -- ChatGPT: 20€
    -- Camionnette: 463.72€
),
-- Générer les 24 derniers mois
months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '24 months'),
    date_trunc('month', CURRENT_DATE),
    INTERVAL '1 month'
  )::date AS month_start
),
-- Closings (basé sur closing_date = date paiement acompte)
closings AS (
  SELECT
    date_trunc('month', closing_date::date)::date AS month_start,
    COUNT(*) AS closing_count,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%decouv%' OR LOWER(pack_id) = 'discovery') AS closing_decouverte,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%essent%' OR LOWER(pack_id) = 'essential') AS closing_essentiel,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%premi%') AS closing_premium,
    COALESCE(SUM(deposit_cents), 0) AS deposits_signed_cents
  FROM events
  WHERE closing_date IS NOT NULL
  GROUP BY date_trunc('month', closing_date::date)
),
-- Events réalisés (basé sur event_date)
events_done AS (
  SELECT
    date_trunc('month', event_date::date)::date AS month_start,
    COUNT(*) AS events_count,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%decouv%' OR LOWER(pack_id) = 'discovery') AS events_decouverte,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%essent%' OR LOWER(pack_id) = 'essential') AS events_essentiel,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%premi%') AS events_premium,
    -- Revenus HT (divisé par 1.21 pour TVA 21% Belgique)
    COALESCE(SUM(total_cents) FILTER (WHERE LOWER(event_type) != 'b2b'), 0) / 1.21 AS total_b2c_cents_ht,
    COALESCE(SUM(total_cents) FILTER (WHERE LOWER(event_type) = 'b2b'), 0) / 1.21 AS total_b2b_cents_ht,
    COALESCE(SUM(total_cents), 0) / 1.21 AS total_event_cents_ht,
    COALESCE(SUM(deposit_cents), 0) / 1.21 AS deposits_event_cents_ht,
    COALESCE(SUM(balance_due_cents), 0) / 1.21 AS remaining_event_cents_ht,
    COALESCE(SUM(transport_fee_cents), 0) / 1.21 AS transport_cents_ht,
    -- Coûts
    COALESCE(SUM(student_hours), 0) AS student_hours_total,
    COALESCE(SUM(student_rate_cents), 0) AS student_cost_cents,
    COALESCE(SUM(fuel_cost_cents), 0) AS fuel_cost_cents,
    -- Pack counts pour calcul coût packs
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%decouv%' OR LOWER(pack_id) = 'discovery') AS pack_count_decouverte,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%essent%' OR LOWER(pack_id) = 'essential') AS pack_count_essentiel,
    COUNT(*) FILTER (WHERE LOWER(pack_id) LIKE '%premi%') AS pack_count_premium
  FROM events
  WHERE event_date IS NOT NULL
  GROUP BY date_trunc('month', event_date::date)
),
-- Commissions commerciaux (basé sur closing_date)
commercial_comm AS (
  SELECT
    date_trunc('month', closing_date::date)::date AS month_start,
    COALESCE(SUM(commercial_commission_cents), 0) AS commercial_commission_cents
  FROM events
  WHERE closing_date IS NOT NULL
  GROUP BY date_trunc('month', closing_date::date)
)
SELECT
  TO_CHAR(m.month_start, 'YYYY-MM') AS month,
  m.month_start,

  -- Closings
  COALESCE(c.closing_count, 0) AS closing_total,
  COALESCE(c.closing_decouverte, 0) AS closing_decouverte,
  COALESCE(c.closing_essentiel, 0) AS closing_essentiel,
  COALESCE(c.closing_premium, 0) AS closing_premium,
  COALESCE(c.deposits_signed_cents, 0) AS deposits_signed_cents,

  -- Events
  COALESCE(e.events_count, 0) AS events_count,
  COALESCE(e.events_decouverte, 0) AS events_decouverte,
  COALESCE(e.events_essentiel, 0) AS events_essentiel,
  COALESCE(e.events_premium, 0) AS events_premium,

  -- Revenus HT (en cents)
  ROUND(COALESCE(e.total_b2c_cents_ht, 0))::bigint AS total_b2c_cents_ht,
  ROUND(COALESCE(e.total_b2b_cents_ht, 0))::bigint AS total_b2b_cents_ht,
  ROUND(COALESCE(e.total_event_cents_ht, 0))::bigint AS total_event_cents_ht,
  ROUND(COALESCE(e.deposits_event_cents_ht, 0))::bigint AS deposits_event_cents_ht,
  ROUND(COALESCE(e.remaining_event_cents_ht, 0))::bigint AS remaining_event_cents_ht,
  ROUND(COALESCE(c.deposits_signed_cents, 0) / 1.21 + COALESCE(e.remaining_event_cents_ht, 0))::bigint AS ca_acomptes_restants_cents_ht,
  ROUND(COALESCE(e.total_event_cents_ht, 0) + COALESCE(e.transport_cents_ht, 0))::bigint AS ca_total_cents_ht,
  ROUND(COALESCE(e.transport_cents_ht, 0))::bigint AS transport_cents_ht,

  -- Coûts
  ROUND(
    COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
    COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
    COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
  )::bigint AS pack_cost_cents,
  COALESCE(e.student_hours_total, 0) AS student_hours,
  COALESCE(e.student_cost_cents, 0) AS student_cost_cents,
  COALESCE(e.fuel_cost_cents, 0) AS fuel_cost_cents,
  COALESCE(cc.commercial_commission_cents, 0) AS commercial_commission_cents,
  ROUND(kpi.fixed_monthly_charges * 100)::bigint AS fixed_charges_cents,

  -- Marges
  ROUND(
    COALESCE(e.total_event_cents_ht, 0) - (
      COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
      COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
      COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
    )
  )::bigint AS gross_margin_cents,

  -- Cashflow brut = CA - Coût packs - Staff - Essence - Comm commerciaux
  ROUND(
    (COALESCE(c.deposits_signed_cents, 0) / 1.21 + COALESCE(e.remaining_event_cents_ht, 0)) - (
      COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
      COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
      COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
    ) - COALESCE(e.student_cost_cents, 0)
      - COALESCE(e.fuel_cost_cents, 0)
      - COALESCE(cc.commercial_commission_cents, 0)
  )::bigint AS cashflow_gross_cents,

  -- Cashflow net = Cashflow brut - Charges fixes mensuelles
  ROUND(
    (COALESCE(c.deposits_signed_cents, 0) / 1.21 + COALESCE(e.remaining_event_cents_ht, 0)) - (
      COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
      COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
      COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
    ) - COALESCE(e.student_cost_cents, 0)
      - COALESCE(e.fuel_cost_cents, 0)
      - COALESCE(cc.commercial_commission_cents, 0)
      - (kpi.fixed_monthly_charges * 100)
  )::bigint AS cashflow_net_cents

FROM months m
CROSS JOIN kpi
LEFT JOIN closings c ON c.month_start = m.month_start
LEFT JOIN events_done e ON e.month_start = m.month_start
LEFT JOIN commercial_comm cc ON cc.month_start = m.month_start
ORDER BY m.month_start DESC;


-- =============================================================================
-- VIEW: v_student_monthly_stats (stats étudiants par mois)
-- =============================================================================

DROP VIEW IF EXISTS v_student_monthly_stats CASCADE;

CREATE VIEW v_student_monthly_stats AS
WITH
student_hourly_rate AS (SELECT 14.00 AS rate),
months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '12 months'),
    date_trunc('month', CURRENT_DATE),
    INTERVAL '1 month'
  )::date AS month_start
),
students AS (
  SELECT DISTINCT student_name
  FROM events
  WHERE student_name IS NOT NULL AND student_name != ''
)
SELECT
  TO_CHAR(m.month_start, 'YYYY-MM') AS month,
  s.student_name,
  COALESCE(SUM(e.student_hours), 0) AS hours,
  COALESCE(SUM(e.student_hours), 0) AS hours_corrected,
  ROUND(COALESCE(SUM(e.student_hours), 0) * r.rate * 100)::bigint AS remuneration_cents,
  ROUND(COALESCE(SUM(e.student_hours), 0) * r.rate * 100)::bigint AS total_cents
FROM months m
CROSS JOIN students s
CROSS JOIN student_hourly_rate r
LEFT JOIN events e ON
  e.student_name = s.student_name
  AND date_trunc('month', e.event_date::date) = m.month_start
GROUP BY m.month_start, s.student_name, r.rate
HAVING COALESCE(SUM(e.student_hours), 0) > 0
ORDER BY m.month_start DESC, s.student_name;


-- =============================================================================
-- VIEW: v_commercial_monthly_stats (stats commerciaux par mois)
-- =============================================================================

DROP VIEW IF EXISTS v_commercial_monthly_stats CASCADE;

CREATE VIEW v_commercial_monthly_stats AS
WITH
months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '12 months'),
    date_trunc('month', CURRENT_DATE),
    INTERVAL '1 month'
  )::date AS month_start
),
commercials AS (
  SELECT DISTINCT commercial_name
  FROM events
  WHERE commercial_name IS NOT NULL AND commercial_name != ''
)
SELECT
  TO_CHAR(m.month_start, 'YYYY-MM') AS month,
  c.commercial_name,
  COUNT(e.id) AS closings_count,
  COUNT(e.id) FILTER (WHERE LOWER(e.pack_id) LIKE '%decouv%' OR LOWER(e.pack_id) = 'discovery') AS closings_decouverte,
  COUNT(e.id) FILTER (WHERE LOWER(e.pack_id) LIKE '%essent%' OR LOWER(e.pack_id) = 'essential') AS closings_essentiel,
  COUNT(e.id) FILTER (WHERE LOWER(e.pack_id) LIKE '%premi%') AS closings_premium,
  COALESCE(SUM(e.commercial_commission_cents), 0) AS commission_cents,
  COALESCE(SUM(e.total_cents), 0) AS total_signed_cents
FROM months m
CROSS JOIN commercials c
LEFT JOIN events e ON
  e.commercial_name = c.commercial_name
  AND date_trunc('month', e.closing_date::date) = m.month_start
GROUP BY m.month_start, c.commercial_name
HAVING COUNT(e.id) > 0
ORDER BY m.month_start DESC, c.commercial_name;


-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

-- Policies (service role full access)
CREATE POLICY "Enable all access for service role" ON public.events FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.packs FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.leads FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.payments FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.notifications_log FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.monthly_stats FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.accounting_transactions FOR ALL USING (true);

-- Views (lecture pour authenticated et anon)
GRANT SELECT ON v_monthly_stats TO authenticated, anon;
GRANT SELECT ON v_student_monthly_stats TO authenticated, anon;
GRANT SELECT ON v_commercial_monthly_stats TO authenticated, anon;


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.events IS 'Table principale des événements/clients. Remplace le sheet Google "Clients".';
COMMENT ON TABLE public.packs IS 'Définition des packs (Découverte, Essentiel, Premium) avec prix et coûts.';
COMMENT ON TABLE public.leads IS 'Prospects du funnel de réservation. Tracking step par step.';
COMMENT ON TABLE public.payments IS 'Historique des paiements Mollie.';
COMMENT ON TABLE public.notifications_log IS 'Log des emails envoyés via Resend.';
COMMENT ON TABLE public.monthly_stats IS 'Données Meta Ads (leads_meta, spent_meta_cents). Stats calculées dans v_monthly_stats.';
COMMENT ON TABLE public.accounting_transactions IS 'Transactions comptables.';

COMMENT ON VIEW v_monthly_stats IS 'Statistiques mensuelles calculées automatiquement depuis events. Inclut closings, revenus HT, coûts et marges.';
COMMENT ON VIEW v_student_monthly_stats IS 'Statistiques étudiants par mois calculées depuis events.';
COMMENT ON VIEW v_commercial_monthly_stats IS 'Statistiques commerciaux par mois calculées depuis events.';


-- =============================================================================
-- KPI REFERENCE (pour documentation)
-- =============================================================================
--
-- Coûts des packs:
--   - Découverte: 23.12€
--   - Essentiel: 46.25€
--   - Premium: 92.50€
--
-- Taux horaire étudiant: 14€/h
--
-- Charges fixes mensuelles: 905.36€
--   - Zen Facture: 12€
--   - GSM + Wifi: 130.48€
--   - Compta: 150€
--   - Garage: 120€
--   - Canva: 9.16€
--   - ChatGPT: 20€
--   - Camionnette: 463.72€
--
-- TVA Belgique: 21% (division par 1.21 pour HT)
--
-- Logique Stats:
--   - closing_date = date paiement acompte (pour compter les closings)
--   - event_date = date de l'événement (pour compter les events réalisés)
-- =============================================================================
