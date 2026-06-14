-- ============================================================
-- GBoost Database Schema
-- Supabase SQL Editor da ishga tushiring
-- ============================================================

-- 1. ADMINLAR JADVALI
CREATE TABLE IF NOT EXISTS admins (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  is_active   BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT ARRAY['orders','complaints','users','listings','payments'],
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID REFERENCES admins(id) ON DELETE SET NULL
);

-- 2. FOYDALANUVCHILAR JADVALI
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  role          TEXT DEFAULT 'client' CHECK (role IN ('client', 'booster')),
  karma         INTEGER DEFAULT 100 CHECK (karma >= 0 AND karma <= 100),
  is_active     BOOLEAN DEFAULT true,
  is_banned     BOOLEAN DEFAULT false,
  ban_reason    TEXT,
  games         TEXT[] DEFAULT '{}',
  total_orders  INTEGER DEFAULT 0,
  total_spent   BIGINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUYURTMALAR JADVALI
CREATE TABLE IF NOT EXISTS orders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  game        TEXT NOT NULL,
  service     TEXT NOT NULL,
  from_rank   TEXT NOT NULL,
  to_rank     TEXT NOT NULL,
  price       BIGINT NOT NULL,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','disputed')),
  booster     TEXT DEFAULT '',
  booster_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  note        TEXT,
  payment_method TEXT DEFAULT 'click',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SHIKOYATLAR JADVALI
CREATE TABLE IF NOT EXISTS complaints (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user     TEXT NOT NULL,
  from_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  against_user  TEXT NOT NULL,
  order_id      UUID REFERENCES orders(id) ON DELETE CASCADE,
  type          TEXT DEFAULT 'other' CHECK (type IN ('fraud','incomplete','other')),
  description   TEXT NOT NULL,
  status        TEXT DEFAULT 'new' CHECK (status IN ('new','reviewing','resolved','rejected')),
  resolved_by   TEXT,
  resolution    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TO'LOVLAR JADVALI
CREATE TABLE IF NOT EXISTS payments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('deposit','withdrawal','escrow_hold','escrow_release','refund')),
  amount      BIGINT NOT NULL,
  method      TEXT DEFAULT 'click' CHECK (method IN ('click','payme','uzcard','humo')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','frozen')),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AKKAUNT E'LONLARI JADVALI
CREATE TABLE IF NOT EXISTS listings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  game        TEXT NOT NULL,
  rank        TEXT NOT NULL,
  price       BIGINT NOT NULL,
  type        TEXT DEFAULT 'sale' CHECK (type IN ('sale','rent')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  description TEXT,
  win_rate    INTEGER DEFAULT 50,
  matches     INTEGER DEFAULT 0,
  verified    BOOLEAN DEFAULT false,
  reject_note TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. O'CHIRILGAN ADMINLAR (BLACKLIST)
CREATE TABLE IF NOT EXISTS deleted_admins (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_by TEXT
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Xavfsizlik
-- ============================================================
ALTER TABLE admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_admins ENABLE ROW LEVEL SECURITY;

-- Barcha operatsiyalarga ruxsat (service role orqali)
CREATE POLICY "Service role full access" ON admins
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON orders
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON complaints
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON payments
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON listings
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON deleted_admins
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME — O'zgarishlarni darhol yuborish
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- ============================================================
-- DEMO MA'LUMOTLAR
-- ============================================================
INSERT INTO users (name, email, phone, role, karma, total_orders, total_spent) VALUES
  ('Jasur Karimov',    'jasur@gmail.com',   '+998901234567', 'client',  85, 5,  450000),
  ('Bobur Toshmatov',  'bobur@gmail.com',   '+998902345678', 'booster', 92, 47, 0),
  ('Dilnoza Yusupova', 'dilnoza@gmail.com', '+998903456789', 'client',  70, 3,  280000),
  ('Sardor Rakhimov',  'sardor@gmail.com',  '+998904567890', 'booster', 78, 12, 0),
  ('Kamola Nazarova',  'kamola@gmail.com',  '+998905678901', 'client',  95, 8,  720000)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
