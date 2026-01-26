-- Migration: Créer les Views pour calculer les stats mensuelles
-- Reproduit exactement les formules du Google Sheets Stats
-- Date: 2026-01-26

-- =============================================================================
-- 1. Vue mensuelle principale (v_monthly_stats)
-- =============================================================================
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
    905.36 as fixed_monthly_charges -- Charges fixes: Zen Facture (12€) + GSM/Wifi (130.48€) + Compta (150€) + Garage (120€) + Canva (9.16€) + ChatGPT (20€) + Camionnette (463.72€)
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
    -- Revenus HT (divisé par 1.21 pour TVA)
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
    -- Pack counts pour calculer coût packs
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
-- 2. Vue stats par étudiant (v_student_monthly_stats)
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
  COALESCE(SUM(e.student_hours), 0) AS hours_corrected, -- Peut être ajusté manuellement
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
-- 3. Vue stats par commercial (v_commercial_monthly_stats)
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
-- Notes importantes :
--
-- 1. closing_date = date de paiement de l'acompte (pour compter les closings)
-- 2. event_date = date de l'événement (pour compter les events réalisés)
-- 3. Tous les montants sont divisés par 1.21 pour obtenir le HT (TVA 21% Belgique)
-- 4. Coûts de packs : Découverte=23.12€, Essentiel=46.25€, Premium=92.50€
-- 5. Taux horaire étudiant : 14€/h
-- 6. Charges fixes mensuelles : 905.36€
--    - Zen Facture: 12€
--    - GSM + Wifi: 130.48€
--    - Compta: 150€
--    - Garage: 120€
--    - Canva: 9.16€
--    - ChatGPT: 20€
--    - Camionnette: 463.72€
-- =============================================================================
