-- Add keyword watch support to category_watches
ALTER TABLE category_watches
  ADD COLUMN IF NOT EXISTS watch_type  VARCHAR(20) NOT NULL DEFAULT 'category',
  ADD COLUMN IF NOT EXISTS search_term TEXT;
