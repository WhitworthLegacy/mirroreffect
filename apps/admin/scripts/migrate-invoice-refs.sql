-- =====================================================
-- MIGRATION: Migrer deposit_invoice_ref et balance_invoice_ref
-- =====================================================
-- Ce script migre les références de factures depuis event_finance vers events
-- Exécuter dans Supabase SQL Editor

-- Migrer deposit_invoice_ref et balance_invoice_ref si elles existent dans event_finance
UPDATE events e
SET
  deposit_invoice_ref = ef.deposit_invoice_ref,
  balance_invoice_ref = ef.balance_invoice_ref
FROM event_finance ef
WHERE ef.event_id = e.id
  AND (ef.deposit_invoice_ref IS NOT NULL OR ef.balance_invoice_ref IS NOT NULL);

-- Vérifier les résultats
SELECT 
  COUNT(*) as total_events,
  COUNT(deposit_invoice_ref) as events_with_deposit_ref,
  COUNT(balance_invoice_ref) as events_with_balance_ref
FROM events;
