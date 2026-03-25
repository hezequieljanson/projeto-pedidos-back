-- ============================================================
-- Sistema de Pedidos — Schema Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- -----------------------------------------------------------
-- PROFILES (estende auth.users)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------
-- PRODUCTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- ORDERS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total       NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- ORDER ITEMS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------
-- FUNCTION: decrement_stock (chamada pelo backend)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - amount,
      updated_at = NOW()
  WHERE id = product_id AND stock >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- PRODUCTS (leitura pública, escrita via backend com service_role)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

-- ORDERS (user vê somente os seus)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------
-- SEED: Produtos de exemplo
-- -----------------------------------------------------------
INSERT INTO public.products (name, description, price, stock, category, image_url) VALUES
  ('Notebook Dell XPS 15', 'Notebook premium com Intel Core i7, 16GB RAM, 512GB SSD', 7999.90, 10, 'Eletrônicos', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400'),
  ('Smartphone Samsung Galaxy S24', 'Tela AMOLED 6.2", câmera 50MP, 256GB', 4299.00, 25, 'Eletrônicos', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'),
  ('Fone Sony WH-1000XM5', 'Cancelamento de ruído ativo, 30h de bateria', 1599.90, 40, 'Áudio', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400'),
  ('Teclado Mecânico Keychron K2', 'Switch Red, RGB, compacto 75%', 459.90, 30, 'Periféricos', 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'),
  ('Monitor LG UltraWide 34"', 'IPS 3440x1440, 144Hz, FreeSync', 3299.00, 8, 'Monitores', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'),
  ('Cadeira Gamer DXRacer', 'Ergonômica, couro PU, ajuste lombar', 1899.90, 15, 'Móveis', 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400'),
  ('Mouse Logitech MX Master 3', 'Wireless, 4000 DPI, scroll MagSpeed', 599.90, 50, 'Periféricos', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
  ('SSD Samsung 970 EVO 1TB', 'NVMe M.2, leitura 3500MB/s', 499.90, 35, 'Armazenamento', 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400');
