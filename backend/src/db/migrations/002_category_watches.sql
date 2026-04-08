-- Category watches: user subscribes to a product category with a price-drop threshold
CREATE TABLE category_watches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_key     VARCHAR(50)  NOT NULL,
  category_name    VARCHAR(100) NOT NULL,
  threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  notify_enabled   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_key)
);

-- Price cache for items found in category scans (shared across users)
CREATE TABLE category_price_cache (
  asin         VARCHAR(20)  NOT NULL,
  category_key VARCHAR(50)  NOT NULL,
  title        TEXT,
  image_url    TEXT,
  product_url  TEXT,
  last_price   NUMERIC(10,2),
  currency     VARCHAR(10)  NOT NULL DEFAULT 'USD',
  last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY(asin, category_key)
);

-- Add category-alert columns to the shared alerts table
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS category_key VARCHAR(50),
  ADD COLUMN IF NOT EXISTS asin         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS image_url    TEXT,
  ADD COLUMN IF NOT EXISTS product_url  TEXT;
