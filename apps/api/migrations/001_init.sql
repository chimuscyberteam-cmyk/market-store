CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icon  TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_zmw   NUMERIC(10,2) NOT NULL CHECK (price_zmw > 0),
  image_urls  JSONB NOT NULL DEFAULT '[]',
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','removed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_seller   ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_status   ON items(status);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON messages(item_id, sender_id, receiver_id, created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           UUID NOT NULL REFERENCES items(id),
  buyer_id          UUID NOT NULL REFERENCES users(id),
  seller_id         UUID NOT NULL REFERENCES users(id),
  distance_meters   INTEGER NOT NULL,
  delivery_fee_zmw  NUMERIC(10,2) NOT NULL,
  item_price_zmw    NUMERIC(10,2) NOT NULL,
  total_zmw         NUMERIC(10,2) NOT NULL,
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('pod','momo')),
  payment_status    TEXT NOT NULL DEFAULT 'pending',
  status            TEXT NOT NULL DEFAULT 'pending',
  delivery_lat      DOUBLE PRECISION NOT NULL,
  delivery_lng      DOUBLE PRECISION NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer  ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES users(id),
  ratee_id   UUID NOT NULL REFERENCES users(id),
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (name, slug, icon) VALUES
  ('Food & Groceries',   'food',        'FB'),
  ('Clothing & Fashion', 'clothing',    'CL'),
  ('Electronics',        'electronics', 'EL'),
  ('Books & Stationery', 'books',       'BK'),
  ('Home & Furniture',   'home',        'HM'),
  ('Beauty & Health',    'beauty',      'BT'),
  ('Sports & Outdoors',  'sports',      'SP'),
  ('Services',           'services',    'SV'),
  ('Other',              'other',       'OT')
ON CONFLICT (slug) DO NOTHING;
