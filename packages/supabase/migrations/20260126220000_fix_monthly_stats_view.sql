-- Migration: Fix v_monthly_stats view to use correct pack UUIDs
-- Date: 2026-01-26
-- Problem: View was filtering by pack_id::text LIKE '%decouv%' but pack_id is UUID

-- Pack UUIDs:
-- f7e853c1-7a52-46d5-a3c5-139e34867901 = Découverte
-- c9f8258c-f087-4118-a44c-680c9882c04c = Essentiel
-- ba72aeeb-e1c8-45a5-a27f-916a60d701eb = Premium

DROP VIEW IF EXISTS v_monthly_stats CASCADE;

CREATE VIEW v_monthly_stats AS
WITH
-- Pack IDs constants
pack_ids AS (
  SELECT
    'f7e853c1-7a52-46d5-a3c5-139e34867901'::uuid as decouverte,
    'c9f8258c-f087-4118-a44c-680c9882c04c'::uuid as essentiel,
    'ba72aeeb-e1c8-45a5-a27f-916a60d701eb'::uuid as premium
),
-- Paramètres KPI
kpi AS (
  SELECT
    23.12 as pack_cost_decouverte,
    46.25 as pack_cost_essentiel,
    92.50 as pack_cost_premium,
    14.00 as student_hourly_rate,
    905.36 as fixed_monthly_charges
),
-- Générer les 36 derniers mois (étendu pour couvrir plus de données)
months AS (
  SELECT
    gs::date AS month_start,
    TO_CHAR(gs, 'YYYY-MM')::text AS month_key
  FROM generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '36 months'),
    date_trunc('month', CURRENT_DATE + INTERVAL '24 months'),
    INTERVAL '1 month'
  ) AS gs
),
-- Closings (basé sur closing_date)
closings AS (
  SELECT
    date_trunc('month', closing_date::date)::date AS month_start,
    COUNT(*) AS closing_count,
    COUNT(*) FILTER (WHERE pack_id = (SELECT decouverte FROM pack_ids)) AS closing_decouverte,
    COUNT(*) FILTER (WHERE pack_id = (SELECT essentiel FROM pack_ids)) AS closing_essentiel,
    COUNT(*) FILTER (WHERE pack_id = (SELECT premium FROM pack_ids)) AS closing_premium,
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
    COUNT(*) FILTER (WHERE pack_id = (SELECT decouverte FROM pack_ids)) AS events_decouverte,
    COUNT(*) FILTER (WHERE pack_id = (SELECT essentiel FROM pack_ids)) AS events_essentiel,
    COUNT(*) FILTER (WHERE pack_id = (SELECT premium FROM pack_ids)) AS events_premium,
    COALESCE(SUM(total_cents) FILTER (WHERE LOWER(COALESCE(event_type, '')) != 'b2b'), 0) AS total_b2c_cents,
    COALESCE(SUM(total_cents) FILTER (WHERE LOWER(COALESCE(event_type, '')) = 'b2b'), 0) AS total_b2b_cents,
    COALESCE(SUM(total_cents), 0) AS total_event_cents,
    COALESCE(SUM(deposit_cents), 0) AS deposits_event_cents,
    COALESCE(SUM(balance_due_cents), 0) AS remaining_event_cents,
    COALESCE(SUM(transport_fee_cents), 0) AS transport_cents,
    COALESCE(SUM(student_hours), 0) AS student_hours_total,
    COALESCE(SUM(student_rate_cents), 0) AS student_cost_cents,
    COALESCE(SUM(fuel_cost_cents), 0) AS fuel_cost_cents,
    COUNT(*) FILTER (WHERE pack_id = (SELECT decouverte FROM pack_ids)) AS pack_count_decouverte,
    COUNT(*) FILTER (WHERE pack_id = (SELECT essentiel FROM pack_ids)) AS pack_count_essentiel,
    COUNT(*) FILTER (WHERE pack_id = (SELECT premium FROM pack_ids)) AS pack_count_premium
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
  COALESCE(ms.leads_meta, 0) AS leads_total,

  -- Closings
  COALESCE(c.closing_count, 0) AS closing_total,
  COALESCE(c.closing_decouverte, 0) AS closing_decouverte,
  COALESCE(c.closing_essentiel, 0) AS closing_essentiel,
  COALESCE(c.closing_premium, 0) AS closing_premium,
  COALESCE(c.deposits_signed_cents, 0) AS deposits_signed_cents,

  -- Total acomptes signés ce mois (pour closing)
  COALESCE(c.deposits_signed_cents, 0) AS total_closed_cents,

  -- Events
  COALESCE(e.events_count, 0) AS events_count,
  COALESCE(e.events_decouverte, 0) AS events_decouverte,
  COALESCE(e.events_essentiel, 0) AS events_essentiel,
  COALESCE(e.events_premium, 0) AS events_premium,

  -- Revenus (en cents, pas de conversion HT car les montants sont déjà stockés en TTC dans events)
  COALESCE(e.total_b2c_cents, 0) AS total_b2c_cents,
  COALESCE(e.total_b2b_cents, 0) AS total_b2b_cents,
  COALESCE(e.total_event_cents, 0) AS total_event_cents,
  COALESCE(e.deposits_event_cents, 0) AS deposits_event_cents,
  COALESCE(e.remaining_event_cents, 0) AS remaining_event_cents,
  COALESCE(c.deposits_signed_cents, 0) + COALESCE(e.remaining_event_cents, 0) AS ca_acomptes_restants_cents,
  COALESCE(e.total_event_cents, 0) + COALESCE(e.transport_cents, 0) AS ca_total_cents,
  COALESCE(e.transport_cents, 0) AS transport_cents,

  -- Coûts (en cents)
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

  -- Marges (Marge brute = Total Event - Coût Packs)
  ROUND(
    COALESCE(e.total_event_cents, 0) - (
      COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
      COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
      COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
    )
  )::bigint AS gross_margin_cents,

  -- Cashflow brut = CA (Acomptes + Restants) - Coûts variables
  ROUND(
    (COALESCE(c.deposits_signed_cents, 0) + COALESCE(e.remaining_event_cents, 0)) - (
      COALESCE(e.pack_count_decouverte, 0) * kpi.pack_cost_decouverte * 100 +
      COALESCE(e.pack_count_essentiel, 0) * kpi.pack_cost_essentiel * 100 +
      COALESCE(e.pack_count_premium, 0) * kpi.pack_cost_premium * 100
    ) - COALESCE(e.student_cost_cents, 0)
      - COALESCE(e.fuel_cost_cents, 0)
      - COALESCE(cc.commercial_commission_cents, 0)
  )::bigint AS cashflow_gross_cents,

  -- Cashflow net = Cashflow brut - Charges fixes
  ROUND(
    (COALESCE(c.deposits_signed_cents, 0) + COALESCE(e.remaining_event_cents, 0)) - (
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
LEFT JOIN monthly_marketing_stats ms ON ms.month::text = TO_CHAR(m.month_start, 'YYYY-MM')::text
ORDER BY m.month_start DESC;
