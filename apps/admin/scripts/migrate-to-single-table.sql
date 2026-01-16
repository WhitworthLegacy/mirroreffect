-- =====================================================
-- MIGRATION: Simplification vers une seule table "events"
-- =====================================================
-- Ce script:
-- 1. Ajoute les colonnes de event_finance dans events
-- 2. Migre les données existantes
-- 3. Crée des vues calculées pour remplacer les tables monthly_stats, etc.
-- 4. Supprime les anciennes tables
--
-- IMPORTANT: Faire un backup avant d'exécuter!

-- =====================================================
-- ÉTAPE 1: Ajouter les nouvelles colonnes à events
-- =====================================================

-- Colonnes de event_finance
ALTER TABLE events ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS student_hours NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS student_rate_cents INTEGER DEFAULT 1400; -- 14€/h par défaut
ALTER TABLE events ADD COLUMN IF NOT EXISTS km_one_way NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS km_total NUMERIC;
ALTER TABLE events ADD COLUMN IF NOT EXISTS fuel_cost_cents INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS commercial_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS commercial_commission_cents INTEGER;

-- Colonnes pour ZenFacture (références factures)
ALTER TABLE events ADD COLUMN IF NOT EXISTS deposit_invoice_ref TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS balance_invoice_ref TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS invoice_deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS invoice_balance_paid BOOLEAN DEFAULT FALSE;

-- Date de closing/signature (pour calculs mensuels)
ALTER TABLE events ADD COLUMN IF NOT EXISTS closing_date DATE;

-- =====================================================
-- ÉTAPE 2: Migrer les données de event_finance vers events
-- =====================================================

-- Migre seulement les colonnes qui existent dans event_finance
UPDATE events e
SET
  student_name = ef.student_name,
  student_hours = ef.student_hours,
  student_rate_cents = COALESCE(ef.student_rate_cents, 1400),
  km_one_way = ef.km_one_way,
  km_total = ef.km_total,
  fuel_cost_cents = ef.fuel_cost_cents,
  commercial_name = ef.commercial_name,
  commercial_commission_cents = ef.commercial_commission_cents
FROM event_finance ef
WHERE ef.event_id = e.id;

-- =====================================================
-- ÉTAPE 3: Créer les vues calculées
-- =====================================================

-- Vue: Statistiques mensuelles calculées (remplace monthly_stats)
DROP VIEW IF EXISTS v_monthly_stats CASCADE;

CREATE VIEW v_monthly_stats AS
WITH event_data AS (
  SELECT
    DATE_TRUNC('month', event_date::date)::date AS month,
    id,
    event_date,
    pack_id,
    total_cents,
    deposit_cents,
    balance_due_cents,
    transport_fee_cents,
    closing_date,
    COALESCE(student_hours, 0) AS student_hours,
    COALESCE(student_rate_cents, 1400) AS student_rate_cents,
    COALESCE(fuel_cost_cents, 0) AS fuel_cost_cents,
    COALESCE(commercial_commission_cents, 0) AS commercial_commission_cents
  FROM events
  WHERE event_date IS NOT NULL
),
closing_data AS (
  SELECT
    DATE_TRUNC('month', closing_date)::date AS month,
    COUNT(*) AS closing_total,
    COUNT(CASE WHEN p.code = 'decouverte' THEN 1 END) AS closing_decouverte,
    COUNT(CASE WHEN p.code = 'essentiel' THEN 1 END) AS closing_essentiel,
    COUNT(CASE WHEN p.code = 'premium' THEN 1 END) AS closing_premium,
    COALESCE(SUM(e.deposit_cents), 0) AS deposits_signed_cents,
    COALESCE(SUM(e.total_cents), 0) AS total_closed_cents
  FROM events e
  LEFT JOIN packs p ON p.id = e.pack_id
  WHERE e.closing_date IS NOT NULL
  GROUP BY DATE_TRUNC('month', e.closing_date)::date
),
monthly_agg AS (
  SELECT
    ed.month,

    -- Events réalisés ce mois
    COUNT(*) AS events_count,
    COUNT(CASE WHEN p.code = 'decouverte' THEN 1 END) AS events_decouverte,
    COUNT(CASE WHEN p.code = 'essentiel' THEN 1 END) AS events_essentiel,
    COUNT(CASE WHEN p.code = 'premium' THEN 1 END) AS events_premium,

    -- Revenus des events (U-W dans Sheets)
    COALESCE(SUM(ed.total_cents), 0) AS total_event_cents,
    COALESCE(SUM(ed.deposit_cents), 0) AS deposits_event_cents,
    COALESCE(SUM(ed.balance_due_cents), 0) AS remaining_event_cents,
    COALESCE(SUM(ed.transport_fee_cents), 0) AS transport_cents,

    -- Heures et coûts étudiants
    SUM(ed.student_hours) AS student_hours,
    SUM(ed.student_hours * ed.student_rate_cents) AS student_cost_cents,

    -- Autres coûts
    SUM(ed.fuel_cost_cents) AS fuel_cost_cents,
    SUM(ed.commercial_commission_cents) AS commercial_commission_cents,

    -- Coût des packs (basé sur prix pack)
    SUM(COALESCE(p.price_current_cents, 0)) AS pack_cost_cents

  FROM event_data ed
  LEFT JOIN packs p ON p.id = ed.pack_id
  GROUP BY ed.month
)
SELECT
  COALESCE(ma.month, cd.month) AS month,

  -- Closings du mois (basé sur closing_date)
  COALESCE(cd.closing_total, 0) AS closing_total,
  COALESCE(cd.closing_decouverte, 0) AS closing_decouverte,
  COALESCE(cd.closing_essentiel, 0) AS closing_essentiel,
  COALESCE(cd.closing_premium, 0) AS closing_premium,
  COALESCE(cd.deposits_signed_cents, 0) AS deposits_signed_cents,
  COALESCE(cd.total_closed_cents, 0) AS total_closed_cents,

  -- Events réalisés (basé sur event_date)
  COALESCE(ma.events_count, 0) AS events_count,
  COALESCE(ma.events_decouverte, 0) AS events_decouverte,
  COALESCE(ma.events_essentiel, 0) AS events_essentiel,
  COALESCE(ma.events_premium, 0) AS events_premium,

  -- Revenus
  COALESCE(ma.total_event_cents, 0) AS total_event_cents,
  COALESCE(ma.deposits_event_cents, 0) AS deposits_event_cents,
  COALESCE(ma.remaining_event_cents, 0) AS remaining_event_cents,
  COALESCE(ma.transport_cents, 0) AS transport_cents,

  -- CA Total = Acomptes signés + Soldes events (X = P + W)
  COALESCE(cd.deposits_signed_cents, 0) + COALESCE(ma.remaining_event_cents, 0) AS ca_total_cents,

  -- Coûts
  COALESCE(ma.student_hours, 0) AS student_hours,
  COALESCE(ma.student_cost_cents, 0) AS student_cost_cents,
  COALESCE(ma.fuel_cost_cents, 0) AS fuel_cost_cents,
  COALESCE(ma.commercial_commission_cents, 0) AS commercial_commission_cents,
  COALESCE(ma.pack_cost_cents, 0) AS pack_cost_cents,

  -- Marge brute opérationnelle = Total events - (Étudiants + Essence + Commissions)
  (COALESCE(ma.total_event_cents, 0)
    - COALESCE(ma.student_cost_cents, 0)
    - COALESCE(ma.fuel_cost_cents, 0)
    - COALESCE(ma.commercial_commission_cents, 0)
  ) AS gross_margin_cents,

  -- Cashflow brut mensuel = Acomptes signés + Paiements soldes - Coûts variables
  (COALESCE(cd.deposits_signed_cents, 0)
    + COALESCE(ma.deposits_event_cents, 0)
    - COALESCE(ma.student_cost_cents, 0)
    - COALESCE(ma.fuel_cost_cents, 0)
    - COALESCE(ma.commercial_commission_cents, 0)
  ) AS cashflow_gross_cents

FROM monthly_agg ma
FULL OUTER JOIN closing_data cd ON ma.month = cd.month
ORDER BY month DESC;

-- Vue: Statistiques étudiants par mois (remplace student_monthly_stats)
DROP VIEW IF EXISTS v_student_monthly_stats CASCADE;

CREATE VIEW v_student_monthly_stats AS
SELECT
  DATE_TRUNC('month', event_date::date)::date AS month,
  student_name,
  SUM(COALESCE(student_hours, 0)) AS total_hours,
  SUM(COALESCE(student_hours, 0) * COALESCE(student_rate_cents, 1400)) AS total_remuneration_cents,
  COUNT(*) AS event_count,
  AVG(COALESCE(student_rate_cents, 1400))::integer AS avg_rate_cents
FROM events
WHERE student_name IS NOT NULL AND event_date IS NOT NULL
GROUP BY DATE_TRUNC('month', event_date::date)::date, student_name
ORDER BY month DESC, student_name;

-- Vue: Statistiques commerciaux par mois (remplace commercial_monthly_stats partiellement)
DROP VIEW IF EXISTS v_commercial_monthly_stats CASCADE;

CREATE VIEW v_commercial_monthly_stats AS
SELECT
  DATE_TRUNC('month', closing_date::date)::date AS month,
  commercial_name,
  COUNT(*) AS closed_deals,
  SUM(COALESCE(total_cents, 0)) AS total_sales_cents,
  SUM(COALESCE(commercial_commission_cents, 0)) AS total_commission_cents,
  AVG(COALESCE(total_cents, 0))::integer AS avg_deal_cents
FROM events
WHERE commercial_name IS NOT NULL AND closing_date IS NOT NULL
GROUP BY DATE_TRUNC('month', closing_date::date)::date, commercial_name
ORDER BY month DESC, commercial_name;

-- =====================================================
-- ÉTAPE 4: Permissions
-- =====================================================

GRANT SELECT ON v_monthly_stats TO authenticated, anon;
GRANT SELECT ON v_student_monthly_stats TO authenticated, anon;
GRANT SELECT ON v_commercial_monthly_stats TO authenticated, anon;

-- =====================================================
-- ÉTAPE 5: Index pour performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_closing_date ON events(closing_date);
CREATE INDEX IF NOT EXISTS idx_events_student_name ON events(student_name);
CREATE INDEX IF NOT EXISTS idx_events_commercial_name ON events(commercial_name);
CREATE INDEX IF NOT EXISTS idx_events_pack_id ON events(pack_id);

-- =====================================================
-- ÉTAPE 6: Trigger pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_events_updated_at ON events;
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- =====================================================
-- ÉTAPE 7: Supprimer les anciennes tables (ATTENTION!)
-- =====================================================
-- Décommenter ces lignes SEULEMENT après avoir vérifié que tout fonctionne
--
-- TABLES À SUPPRIMER:
-- - event_finance: données migrées vers events
-- - student_monthly_stats: remplacée par v_student_monthly_stats (vue)
-- - commercial_monthly_stats: remplacée par v_commercial_monthly_stats (vue)
--
-- TABLE À GARDER:
-- - monthly_stats: contient leads_meta et spent_meta_cents (données Meta Ads)
--   Ces données viennent de l'extérieur et ne peuvent pas être calculées.

-- DROP TABLE IF EXISTS event_finance CASCADE;
-- DROP TABLE IF EXISTS student_monthly_stats CASCADE;
-- DROP TABLE IF EXISTS commercial_monthly_stats CASCADE;

-- NE PAS SUPPRIMER monthly_stats! (contient leads_meta, spent_meta_cents de Meta Ads)

-- =====================================================
-- ÉTAPE 8: Simplifier monthly_stats (optionnel)
-- =====================================================
-- Si tu veux nettoyer monthly_stats pour ne garder que les colonnes Meta Ads:
-- (Attention: backup avant!)
--
-- ALTER TABLE monthly_stats DROP COLUMN IF EXISTS closing_total;
-- ALTER TABLE monthly_stats DROP COLUMN IF EXISTS closing_decouverte;
-- ALTER TABLE monthly_stats DROP COLUMN IF EXISTS closing_essentiel;
-- ALTER TABLE monthly_stats DROP COLUMN IF EXISTS closing_premium;
-- ALTER TABLE monthly_stats DROP COLUMN IF EXISTS deposits_signed_cents;
-- ALTER TABLE monthly_stats DROP COLUMN IF EXISTS total_closed_cents;
-- etc...
--
-- Ou créer une nouvelle table simplifiée:
-- CREATE TABLE IF NOT EXISTS marketing_stats (
--   month DATE PRIMARY KEY,
--   leads_meta INTEGER DEFAULT 0,
--   spent_meta_cents INTEGER DEFAULT 0,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- INSERT INTO marketing_stats (month, leads_meta, spent_meta_cents)
-- SELECT month, leads_meta, spent_meta_cents FROM monthly_stats;
-- DROP TABLE monthly_stats;
-- ALTER TABLE marketing_stats RENAME TO monthly_stats;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON VIEW v_monthly_stats IS 'Statistiques mensuelles calculées automatiquement depuis events. Calcule closings, revenus, coûts et marges.';
COMMENT ON VIEW v_student_monthly_stats IS 'Statistiques étudiants par mois calculées depuis events.';
COMMENT ON VIEW v_commercial_monthly_stats IS 'Statistiques commerciaux par mois calculées depuis events.';
COMMENT ON TABLE monthly_stats IS 'Données marketing Meta Ads (leads_meta, spent_meta_cents). Les autres stats sont dans v_monthly_stats.';
