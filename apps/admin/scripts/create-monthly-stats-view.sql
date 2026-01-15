-- Vue calculée pour les statistiques mensuelles
-- Remplace les formules Google Sheets avec des calculs SQL automatiques
-- Exécuter dans Supabase SQL Editor

-- =====================================================
-- ÉTAPE 1: Ajouter la colonne closing_date si absente
-- =====================================================
-- Cette colonne correspond à la colonne R de ton Sheets (Date de Closing/Signature)
-- Exécute d'abord cette commande séparément si la colonne n'existe pas:
--
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS closing_date DATE;
--

-- =====================================================
-- ÉTAPE 2: Créer la vue calculée
-- =====================================================

-- Supprime la vue existante si elle existe
DROP VIEW IF EXISTS monthly_stats_calculated;

-- Crée la vue avec tous les calculs automatiques
CREATE VIEW monthly_stats_calculated AS
WITH monthly_events AS (
  -- Base: événements groupés par mois avec leurs finances
  SELECT
    DATE_TRUNC('month', e.event_date::date)::date AS month,
    e.id AS event_id,
    e.event_date,
    e.pack_id,
    e.total_cents,
    e.deposit_cents,
    e.transport_fee_cents,
    e.balance_due_cents,
    COALESCE(ef.student_hours, 0) AS student_hours,
    COALESCE(ef.student_rate_cents, 1400) AS student_rate_cents,  -- Default 14€/h
    COALESCE(ef.fuel_cost_cents, 0) AS fuel_cost_cents,
    COALESCE(ef.commercial_commission_cents, 0) AS commercial_commission_cents,
    COALESCE(ef.gross_margin_cents, 0) AS gross_margin_cents
  FROM events e
  LEFT JOIN event_finance ef ON ef.event_id = e.id
  WHERE e.event_date IS NOT NULL
),
pack_prices AS (
  -- Prix des packs pour calculer les coûts
  SELECT
    id,
    code,
    COALESCE(price_current_cents, 0) AS price_cents
  FROM packs
),
monthly_aggregates AS (
  -- Agrégations mensuelles
  SELECT
    me.month,

    -- Nombre d'événements total
    COUNT(me.event_id) AS events_count,

    -- Events par type de pack
    COUNT(CASE WHEN p.code = 'decouverte' THEN 1 END) AS events_decouverte,
    COUNT(CASE WHEN p.code = 'essentiel' THEN 1 END) AS events_essentiel,
    COUNT(CASE WHEN p.code = 'premium' THEN 1 END) AS events_premium,

    -- Revenus
    COALESCE(SUM(me.total_cents), 0) AS total_event_cents,
    COALESCE(SUM(me.deposit_cents), 0) AS deposits_event_cents,
    COALESCE(SUM(me.balance_due_cents), 0) AS remaining_event_cents,
    COALESCE(SUM(me.transport_fee_cents), 0) AS transport_cents,

    -- CA Total = Acomptes + Soldes (équivalent à P2 + W2 dans Sheets)
    COALESCE(SUM(me.deposit_cents), 0) + COALESCE(SUM(me.balance_due_cents), 0) AS ca_total_cents,

    -- Heures étudiants
    SUM(me.student_hours) AS student_hours,

    -- Coût étudiants (heures × taux)
    SUM(me.student_hours * me.student_rate_cents) AS student_cost_cents,

    -- Coût carburant
    SUM(me.fuel_cost_cents) AS fuel_cost_cents,

    -- Commissions commerciales
    SUM(me.commercial_commission_cents) AS commercial_commission_cents,

    -- Coût des packs (basé sur le prix du pack)
    SUM(COALESCE(p.price_cents, 0)) AS pack_cost_cents

  FROM monthly_events me
  LEFT JOIN pack_prices p ON p.id = me.pack_id
  GROUP BY me.month
)
SELECT
  ma.month,

  -- Events
  ma.events_count,
  ma.events_decouverte,
  ma.events_essentiel,
  ma.events_premium,

  -- Revenus
  ma.total_event_cents,
  ma.deposits_event_cents,
  ma.remaining_event_cents,
  ma.transport_cents,
  ma.ca_total_cents,

  -- Coûts
  ma.student_hours,
  ma.student_cost_cents,
  ma.fuel_cost_cents,
  ma.commercial_commission_cents,
  ma.pack_cost_cents,

  -- Marge brute = Total événements - (Coût étudiants + Transport + Commissions + Coût packs)
  -- Équivalent à: b2 = U2 - AA2 - Z2 - AC2 - AD2
  (ma.total_event_cents
    - COALESCE(ma.student_cost_cents, 0)
    - COALESCE(ma.transport_cents, 0)
    - COALESCE(ma.commercial_commission_cents, 0)
    - COALESCE(ma.pack_cost_cents, 0)
  ) AS gross_margin_cents,

  -- Cashflow brut = CA Total - Coûts variables
  (ma.ca_total_cents
    - COALESCE(ma.student_cost_cents, 0)
    - COALESCE(ma.fuel_cost_cents, 0)
    - COALESCE(ma.commercial_commission_cents, 0)
  ) AS cashflow_gross_cents

FROM monthly_aggregates ma
ORDER BY ma.month DESC;

-- Accorde les permissions de lecture
GRANT SELECT ON monthly_stats_calculated TO authenticated;
GRANT SELECT ON monthly_stats_calculated TO anon;

-- Commentaire sur la vue
COMMENT ON VIEW monthly_stats_calculated IS 'Vue calculée automatiquement depuis events/event_finance. Remplace les formules Google Sheets Stats.';


-- =====================================================
-- ÉTAPE 3: Vue des closings par mois (basée sur closing_date)
-- =====================================================
-- Équivalent des formules COUNTIFS sur Clients!$R:$R

DROP VIEW IF EXISTS monthly_closings_calculated;

CREATE VIEW monthly_closings_calculated AS
SELECT
  DATE_TRUNC('month', e.closing_date)::date AS month,

  -- Total closings du mois
  COUNT(*) AS closing_total,

  -- Closings par type de pack
  COUNT(CASE WHEN p.code = 'decouverte' THEN 1 END) AS closing_decouverte,
  COUNT(CASE WHEN p.code = 'essentiel' THEN 1 END) AS closing_essentiel,
  COUNT(CASE WHEN p.code = 'premium' THEN 1 END) AS closing_premium,

  -- Total des acomptes signés ce mois (colonne P dans Sheets)
  COALESCE(SUM(e.deposit_cents), 0) AS deposits_signed_cents

FROM events e
LEFT JOIN packs p ON p.id = e.pack_id
WHERE e.closing_date IS NOT NULL
GROUP BY DATE_TRUNC('month', e.closing_date)::date
ORDER BY month DESC;

GRANT SELECT ON monthly_closings_calculated TO authenticated;
GRANT SELECT ON monthly_closings_calculated TO anon;

COMMENT ON VIEW monthly_closings_calculated IS 'Closings par mois basés sur closing_date. Équivalent COUNTIFS Sheets sur colonne R.';


-- =====================================================
-- ÉTAPE 4: Vue combinée (Stats + Closings + Marketing)
-- =====================================================
-- Cette vue combine toutes les données pour avoir un tableau complet

DROP VIEW IF EXISTS monthly_dashboard;

CREATE VIEW monthly_dashboard AS
SELECT
  COALESCE(ev.month, cl.month) AS month,

  -- Closings (depuis closing_date)
  COALESCE(cl.closing_total, 0) AS closing_total,
  COALESCE(cl.closing_decouverte, 0) AS closing_decouverte,
  COALESCE(cl.closing_essentiel, 0) AS closing_essentiel,
  COALESCE(cl.closing_premium, 0) AS closing_premium,
  COALESCE(cl.deposits_signed_cents, 0) AS deposits_signed_cents,

  -- Events réalisés (depuis event_date)
  COALESCE(ev.events_count, 0) AS events_count,
  COALESCE(ev.events_decouverte, 0) AS events_decouverte,
  COALESCE(ev.events_essentiel, 0) AS events_essentiel,
  COALESCE(ev.events_premium, 0) AS events_premium,

  -- Revenus des events
  COALESCE(ev.total_event_cents, 0) AS total_event_cents,
  COALESCE(ev.deposits_event_cents, 0) AS deposits_event_cents,
  COALESCE(ev.transport_cents, 0) AS transport_cents,
  COALESCE(ev.ca_total_cents, 0) AS ca_total_cents,

  -- Coûts
  COALESCE(ev.student_hours, 0) AS student_hours,
  COALESCE(ev.student_cost_cents, 0) AS student_cost_cents,
  COALESCE(ev.fuel_cost_cents, 0) AS fuel_cost_cents,
  COALESCE(ev.commercial_commission_cents, 0) AS commercial_commission_cents,
  COALESCE(ev.pack_cost_cents, 0) AS pack_cost_cents,

  -- Marges
  COALESCE(ev.gross_margin_cents, 0) AS gross_margin_cents,
  COALESCE(ev.cashflow_gross_cents, 0) AS cashflow_gross_cents,

  -- Données marketing (depuis monthly_stats importées)
  ms.leads_meta,
  ms.spent_meta_cents,
  ms.cpl_meta_cents,

  -- Taux de conversion calculé
  CASE
    WHEN COALESCE(ms.leads_meta, 0) > 0
    THEN ROUND((COALESCE(cl.closing_total, 0)::numeric / ms.leads_meta) * 100, 1)
    ELSE 0
  END AS conversion_pct

FROM monthly_stats_calculated ev
FULL OUTER JOIN monthly_closings_calculated cl ON ev.month = cl.month
LEFT JOIN monthly_stats ms ON DATE_TRUNC('month', ms.month)::date = COALESCE(ev.month, cl.month)
ORDER BY month DESC;

GRANT SELECT ON monthly_dashboard TO authenticated;
GRANT SELECT ON monthly_dashboard TO anon;

COMMENT ON VIEW monthly_dashboard IS 'Vue dashboard complète combinant events, closings et marketing. Données calculées automatiquement.';
