-- Migration: Table pour les stats marketing manuelles
-- Date: 2026-01-26
-- Ces champs ne peuvent pas être calculés automatiquement depuis les events

-- =============================================================================
-- Table monthly_marketing_stats
-- Stocke les stats manuelles: Leads META, Spent META, Leads Total
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.monthly_marketing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Mois au format YYYY-MM (clé unique)
  month TEXT UNIQUE NOT NULL,

  -- Stats META (Facebook/Instagram Ads)
  leads_meta INTEGER DEFAULT 0,
  spent_meta_cents INTEGER DEFAULT 0,  -- En cents pour précision

  -- Stats Total (tous canaux confondus)
  leads_total INTEGER DEFAULT 0,

  -- Notes optionnelles
  notes TEXT
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_marketing_stats_month ON public.monthly_marketing_stats(month);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_marketing_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketing_stats_updated_at ON public.monthly_marketing_stats;
CREATE TRIGGER trigger_marketing_stats_updated_at
  BEFORE UPDATE ON public.monthly_marketing_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_stats_updated_at();

-- =============================================================================
-- Importer les données historiques depuis Stats.csv
-- =============================================================================
INSERT INTO public.monthly_marketing_stats (month, leads_meta, spent_meta_cents, leads_total) VALUES
  ('2025-09', 217, 48824, 217),
  ('2025-10', 278, 97343, 278),
  ('2025-11', 194, 101949, 194),
  ('2025-12', 172, 91094, 193),
  ('2026-01', 159, 100955, 159)
ON CONFLICT (month) DO UPDATE SET
  leads_meta = EXCLUDED.leads_meta,
  spent_meta_cents = EXCLUDED.spent_meta_cents,
  leads_total = EXCLUDED.leads_total;

-- =============================================================================
-- Mettre à jour v_monthly_stats pour inclure les stats marketing
-- =============================================================================
DROP VIEW IF EXISTS v_monthly_stats CASCADE;

CREATE VIEW v_monthly_stats AS
WITH
-- Paramètres KPI
kpi AS (
  SELECT
    23.12 as pack_cost_decouverte,
    46.25 as pack_cost_essentiel,
    92.50 as pack_cost_premium,
    14.00 as student_hourly_rate,
    905.36 as fixed_monthly_charges
),
-- Générer les 24 derniers mois
months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '24 months'),
    date_trunc('month', CURRENT_DATE),
    INTERVAL '1 month'
  )::date AS month_start
),
-- Closings (basé sur closing_date)
closings AS (
  SELECT
    date_trunc('month', closing_date::date)::date AS month_start,
    COUNT(*) AS closing_count,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%decouv%' OR LOWER(COALESCE(pack_id::text, '')) = 'discovery') AS closing_decouverte,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%essent%' OR LOWER(COALESCE(pack_id::text, '')) = 'essential') AS closing_essentiel,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%premi%') AS closing_premium,
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
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%decouv%' OR LOWER(COALESCE(pack_id::text, '')) = 'discovery') AS events_decouverte,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%essent%' OR LOWER(COALESCE(pack_id::text, '')) = 'essential') AS events_essentiel,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%premi%') AS events_premium,
    COALESCE(SUM(total_cents) FILTER (WHERE LOWER(COALESCE(event_type, '')) != 'b2b'), 0) / 1.21 AS total_b2c_cents_ht,
    COALESCE(SUM(total_cents) FILTER (WHERE LOWER(COALESCE(event_type, '')) = 'b2b'), 0) / 1.21 AS total_b2b_cents_ht,
    COALESCE(SUM(total_cents), 0) / 1.21 AS total_event_cents_ht,
    COALESCE(SUM(deposit_cents), 0) / 1.21 AS deposits_event_cents_ht,
    COALESCE(SUM(balance_due_cents), 0) / 1.21 AS remaining_event_cents_ht,
    COALESCE(SUM(transport_fee_cents), 0) / 1.21 AS transport_cents_ht,
    COALESCE(SUM(student_hours), 0) AS student_hours_total,
    COALESCE(SUM(student_rate_cents), 0) AS student_cost_cents,
    COALESCE(SUM(fuel_cost_cents), 0) AS fuel_cost_cents,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%decouv%' OR LOWER(COALESCE(pack_id::text, '')) = 'discovery') AS pack_count_decouverte,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%essent%' OR LOWER(COALESCE(pack_id::text, '')) = 'essential') AS pack_count_essentiel,
    COUNT(*) FILTER (WHERE LOWER(COALESCE(pack_id::text, '')) LIKE '%premi%') AS pack_count_premium
  FROM events
  WHERE event_date IS NOT NULL
  GROUP BY date_trunc('month', event_date::date)
),
-- Commissions commerciaux
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

  -- Marketing stats (from manual table)
  COALESCE(ms.leads_meta, 0) AS leads_meta,
  COALESCE(ms.spent_meta_cents, 0) AS spent_meta_cents,
  COALESCE(ms.leads_total, 0) AS leads_total,

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

  -- Revenus HT
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

  -- Cashflow brut
  ROUND(
    (COALESCE(c.deposits_signed_cents, 0) / 1.21 + COALESCE(e.remaining_event_cents_ht, 0)) - (
      COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
      COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
      COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
    ) - COALESCE(e.student_cost_cents, 0)
      - COALESCE(e.fuel_cost_cents, 0)
      - COALESCE(cc.commercial_commission_cents, 0)
  )::bigint AS cashflow_gross_cents,

  -- Cashflow net
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
LEFT JOIN monthly_marketing_stats ms ON ms.month = TO_CHAR(m.month_start, 'YYYY-MM')
ORDER BY m.month_start DESC;
