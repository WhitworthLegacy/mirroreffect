-- Add description column to payments (stores Mollie payment description = client email)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS description TEXT;
