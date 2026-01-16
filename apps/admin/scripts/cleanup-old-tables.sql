-- =====================================================
-- CLEANUP: Supprimer les anciennes tables et vues
-- =====================================================
-- Exécuter APRÈS avoir vérifié que migrate-to-single-table.sql fonctionne
-- IMPORTANT: Faire un backup avant!

-- Supprimer les anciennes vues (de create-monthly-stats-view.sql)
DROP VIEW IF EXISTS monthly_dashboard CASCADE;
DROP VIEW IF EXISTS monthly_closings_calculated CASCADE;
DROP VIEW IF EXISTS monthly_stats_calculated CASCADE;

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS event_finance CASCADE;
DROP TABLE IF EXISTS student_monthly_stats CASCADE;
DROP TABLE IF EXISTS commercial_monthly_stats CASCADE;

-- NE PAS SUPPRIMER monthly_stats (contient leads_meta, spent_meta_cents)

-- Vérification: affiche les tables/vues restantes
-- SELECT table_name, table_type FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
