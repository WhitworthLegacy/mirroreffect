-- Migration: Standardize event status values
-- Date: 2026-01-30
-- Purpose: Migrate all 'confirmed' status to 'active' to match codebase expectations

-- Show current distribution
DO $$
DECLARE
  confirmed_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO confirmed_count FROM public.events WHERE status = 'confirmed';
  SELECT COUNT(*) INTO active_count FROM public.events WHERE status = 'active';

  RAISE NOTICE 'Before migration:';
  RAISE NOTICE '  confirmed: % events', confirmed_count;
  RAISE NOTICE '  active: % events', active_count;
END $$;

-- Migrate all 'confirmed' → 'active'
UPDATE public.events
SET status = 'active',
    updated_at = NOW()
WHERE status = 'confirmed';

-- Show result
DO $$
DECLARE
  confirmed_count INTEGER;
  active_count INTEGER;
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO confirmed_count FROM public.events WHERE status = 'confirmed';
  SELECT COUNT(*) INTO active_count FROM public.events WHERE status = 'active';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE '';
  RAISE NOTICE 'After migration:';
  RAISE NOTICE '  confirmed: % events', confirmed_count;
  RAISE NOTICE '  active: % events', active_count;
  RAISE NOTICE '  ✅ Migrated % events', updated_count;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.events.status IS 'Event status: active (confirmed/upcoming), cancelled, completed. Default: active';
