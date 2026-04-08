-- DropAlert — Initial Schema

-- Extension for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  display_name     TEXT,
  expo_push_token  TEXT,                    -- Expo push token for FCM delivery
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────
-- One row per unique Amazon ASIN; shared across all users tracking that item.
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  brand           TEXT,
  image_url       TEXT,
  product_url     TEXT NOT NULL,
  current_price   NUMERIC(10,2),
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  availability    TEXT,                     -- 'Available', 'OutOfStock', etc.
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);

-- ─── Price History ────────────────────────────────────────────────────────────
-- Append-only time-series table. Powers sparklines in the dashboard.
CREATE TABLE IF NOT EXISTS price_history (
  id          BIGSERIAL PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price       NUMERIC(10,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'USD',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_time
  ON price_history(product_id, recorded_at DESC);

-- ─── Tracked Products (user → product subscription) ──────────────────────────
CREATE TABLE IF NOT EXISTS tracked_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,  -- alert when drop >= this %
  target_price      NUMERIC(10,2),                        -- optional hard price target
  notify_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_tracked_products_user ON tracked_products(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_products_product ON tracked_products(product_id);

-- ─── Alerts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price    NUMERIC(10,2) NOT NULL,
  new_price    NUMERIC(10,2) NOT NULL,
  drop_percent NUMERIC(5,2)  NOT NULL,
  message      TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unread
  ON alerts(user_id, is_read) WHERE is_read = FALSE;

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
