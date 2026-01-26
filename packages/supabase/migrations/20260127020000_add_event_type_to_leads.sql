-- Migration: Ajouter event_type à la table leads
-- Date: 2026-01-27

-- Ajouter la colonne event_type pour stocker le type d'événement (Mariage, Anniversaire, Bapteme, etc.)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Commentaire explicatif
COMMENT ON COLUMN public.leads.event_type IS 'Type d''événement: Mariage, Anniversaire, Bapteme, etc.';
