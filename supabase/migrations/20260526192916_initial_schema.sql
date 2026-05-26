/*
  # Initial Schema for ЦСОП Варна Document Management System

  ## Tables Created
  1. `profiles` - User profiles with roles (admin, secretary, viewer)
  2. `incoming` - Incoming mail register (Входяща поща)
  3. `outgoing` - Outgoing mail register (Изходяща поща)
  4. `orders` - Orders register (Заповеди)
  5. `contracts` - Contracts register (Договори)

  ## Security
  - RLS enabled on all tables
  - profiles: users see own, admin sees all
  - registers: authenticated can SELECT, admin/secretary can INSERT/UPDATE, admin can DELETE

  ## Notes
  - First registered user auto-becomes admin via trigger
  - Document numbers format: sequential/year e.g. "15/2026"
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'secretary', 'viewer')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to auto-create profile and make first user admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count int;
  user_role text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'viewer';
  END IF;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    user_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Incoming mail table
CREATE TABLE IF NOT EXISTS incoming (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  from_whom text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  description text DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incoming ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view incoming"
  ON incoming FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and secretary can insert incoming"
  ON incoming FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin and secretary can update incoming"
  ON incoming FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin can delete incoming"
  ON incoming FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Outgoing mail table
CREATE TABLE IF NOT EXISTS outgoing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  to_whom text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  description text DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outgoing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view outgoing"
  ON outgoing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and secretary can insert outgoing"
  ON outgoing FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin and secretary can update outgoing"
  ON outgoing FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin can delete outgoing"
  ON outgoing FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and secretary can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin and secretary can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  counterparty text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  description text DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and secretary can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin and secretary can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  ));

CREATE POLICY "Admin can delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incoming_date ON incoming(date DESC);
CREATE INDEX IF NOT EXISTS idx_incoming_number ON incoming(number);
CREATE INDEX IF NOT EXISTS idx_outgoing_date ON outgoing(date DESC);
CREATE INDEX IF NOT EXISTS idx_outgoing_number ON outgoing(number);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(number);
CREATE INDEX IF NOT EXISTS idx_contracts_date ON contracts(date DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(number);
