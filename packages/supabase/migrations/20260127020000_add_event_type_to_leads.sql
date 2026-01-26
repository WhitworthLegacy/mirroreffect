-- Migration: Ajouter les champs manquants à la table leads
-- Date: 2026-01-27
-- Capture complète des données dès l'étape 5 du funnel

-- Ajouter event_type pour stocker le type d'événement (Mariage, Anniversaire, Bapteme, etc.)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Ajouter zone pour stocker la zone géographique (BE, FR_NORD)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zone TEXT;

-- Ajouter vibe pour stocker l'ambiance choisie (chic, gold, romance, party)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS vibe TEXT;

-- Ajouter theme pour stocker le thème de couleur (classic, gold, rose, minimal, editorial)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS theme TEXT;

-- Ajouter priority pour stocker la priorité du client (ambiance, photos, souvenir)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS priority TEXT;

-- Commentaires explicatifs
COMMENT ON COLUMN public.leads.event_type IS 'Type d''événement: Mariage, Anniversaire, Bapteme, etc.';
COMMENT ON COLUMN public.leads.zone IS 'Zone géographique: BE ou FR_NORD';
COMMENT ON COLUMN public.leads.vibe IS 'Ambiance choisie: chic, gold, romance, party';
COMMENT ON COLUMN public.leads.theme IS 'Thème de couleur: classic, gold, rose, minimal, editorial';
COMMENT ON COLUMN public.leads.priority IS 'Priorité client: ambiance, photos, souvenir';
