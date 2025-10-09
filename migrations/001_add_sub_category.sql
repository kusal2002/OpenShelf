-- Migration: add sub_category column to materials table if missing
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Optional: set a default value for existing rows where sub_category is NULL
UPDATE public.materials
SET sub_category = 'Other'
WHERE sub_category IS NULL;
