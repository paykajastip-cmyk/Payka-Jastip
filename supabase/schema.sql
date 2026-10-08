-- =========================================================================
-- PAYKAJASTIP: COMPLETE POSTGRESQL & SUPABASE DATABASE SCHEMA WITH RLS
-- Tagline: "Jastip, Belanja & Antar Barang di Singkawang"
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'driver', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MERCHANT PROFILES
CREATE TABLE IF NOT EXISTS public.merchant_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  ktp_number TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STORE CATEGORIES
CREATE TABLE IF NOT EXISTS public.store_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY DEFAULT ('store-' || uuid_generate_v4()::text),
  merchant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  category TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  district TEXT NOT NULL,
  subdistrict TEXT,
  whatsapp TEXT NOT NULL,
  opening_hours TEXT NOT NULL DEFAULT '08.00 - 21.00 WIB',
  is_open BOOLEAN DEFAULT true,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  store_type TEXT NOT NULL DEFAULT 'offline' CHECK (store_type IN ('offline', 'online', 'umkm', 'home_business')),
  location_status TEXT NOT NULL DEFAULT 'pending' CHECK (location_status IN ('pending', 'verified')),
  is_active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS public.product_categories (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT ('prod-' || uuid_generate_v4()::text),
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  promo_price NUMERIC(12, 2) CHECK (promo_price >= 0),
  description TEXT,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  weight_gram INTEGER NOT NULL DEFAULT 500,
  variations JSONB,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ord-' || uuid_generate_v4()::text),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  store_name TEXT NOT NULL,
  store_phone TEXT NOT NULL,
  store_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  order_type TEXT NOT NULL DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
  subtotal NUMERIC(12, 2) NOT NULL,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  service_fee NUMERIC(12, 2) NOT NULL DEFAULT 2000,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  promo_code TEXT,
  total_amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'MENUNGGU KONFIRMASI' CHECK (status IN (
    'MENUNGGU KONFIRMASI', 'TOKO MENERIMA', 'MENUNGGU DRIVER',
    'DRIVER MENUJU LOKASI', 'BARANG DIAMBIL', 'DRIVER MENUJU CUSTOMER',
    'SELESAI', 'DIBATALKAN'
  )),
  payment_status TEXT NOT NULL DEFAULT 'waiting_payment' CHECK (payment_status IN (
    'waiting_payment', 'waiting_confirmation', 'paid', 'failed', 'cancelled'
  )),
  payment_id TEXT,
  driver_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY DEFAULT ('item-' || uuid_generate_v4()::text),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12, 2) NOT NULL,
  variations JSONB,
  notes TEXT
);

-- 9. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT ('pay-' || uuid_generate_v4()::text),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'waiting_payment' CHECK (payment_status IN (
    'waiting_payment', 'waiting_confirmation', 'paid', 'failed', 'cancelled'
  )),
  amount NUMERIC(12, 2) NOT NULL,
  proof_url TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. JASTIP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.jastip_requests (
  id TEXT PRIMARY KEY DEFAULT ('jst-' || uuid_generate_v4()::text),
  request_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  target_store TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  estimated_budget NUMERIC(12, 2) DEFAULT 0,
  service_fee NUMERIC(12, 2) DEFAULT 15000,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'ACCEPTED', 'PURCHASED', 'DELIVERING', 'COMPLETED', 'CANCELLED'
  )),
  driver_id TEXT,
  driver_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DELIVERY REQUESTS (ANTAR BARANG) TABLE
CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id TEXT PRIMARY KEY DEFAULT ('del-' || uuid_generate_v4()::text),
  request_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  item_type TEXT NOT NULL,
  package_size TEXT NOT NULL CHECK (package_size IN ('S', 'M', 'L', 'CUSTOM')),
  weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 1,
  notes TEXT,
  fee NUMERIC(12, 2) NOT NULL,
  route_schedule_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'DRIVER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'
  )),
  driver_id TEXT,
  driver_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY DEFAULT ('drv-' || uuid_generate_v4()::text),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Motor', 'Mobil', 'Pickup')),
  vehicle_plate TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. DRIVER LOCATIONS TABLE (Realtime tracking)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SERVICE RATES TABLE
CREATE TABLE IF NOT EXISTS public.service_rates (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,
  base_rate NUMERIC(10, 2) NOT NULL DEFAULT 10000,
  per_km_rate NUMERIC(10, 2) NOT NULL DEFAULT 3000,
  minimum_rate NUMERIC(10, 2) NOT NULL DEFAULT 15000,
  service_fee NUMERIC(10, 2) NOT NULL DEFAULT 2000,
  size_s_rate NUMERIC(10, 2) NOT NULL DEFAULT 15000,
  size_m_rate NUMERIC(10, 2) NOT NULL DEFAULT 20000,
  size_l_rate NUMERIC(10, 2) NOT NULL DEFAULT 25000
);

-- 16. SERVICE AREAS TABLE
CREATE TABLE IF NOT EXISTS public.service_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  fee_multiplier NUMERIC(4, 2) DEFAULT 1.0
);

-- 17. SCHEDULES TABLE (Singkawang - Bengkayang)
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  days TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 18. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  store_rating INTEGER CHECK (store_rating BETWEEN 1 AND 5),
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. PROMOS TABLE
CREATE TABLE IF NOT EXISTS public.promos (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'nominal', 'free_shipping')),
  discount_value NUMERIC(12, 2) NOT NULL,
  min_order NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 20. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  order_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_name TEXT NOT NULL DEFAULT 'PAYKAJASTIP',
  tagline TEXT NOT NULL DEFAULT 'Jastip, Belanja & Antar Barang di Singkawang',
  whatsapp_admin TEXT NOT NULL,
  payment_recipient_name TEXT,
  payment_account_number TEXT,
  payment_channel_name TEXT,
  payment_qr_url TEXT,
  payment_instructions TEXT,
  is_payment_configured BOOLEAN DEFAULT false,
  base_delivery_fee NUMERIC(10, 2) DEFAULT 10000,
  per_km_fee NUMERIC(10, 2) DEFAULT 3000,
  service_fee NUMERIC(10, 2) DEFAULT 2000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jastip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Public can read active stores & products
CREATE POLICY "Public can view active stores" ON public.stores FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view available products" ON public.products FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view active promos" ON public.promos FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read admin settings" ON public.admin_settings FOR SELECT USING (true);

-- Authenticated Users Policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Customers can view and create their own orders
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Merchants manage their stores and products
CREATE POLICY "Merchants manage their stores" ON public.stores FOR ALL USING (merchant_id = auth.uid());
CREATE POLICY "Merchants manage their products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.merchant_id = auth.uid())
);

-- Drivers can view orders assigned to them or unassigned waiting orders
CREATE POLICY "Drivers view assigned or open orders" ON public.orders FOR SELECT USING (
  status IN ('MENUNGGU DRIVER', 'DRIVER MENUJU LOKASI', 'BARANG DIAMBIL', 'DRIVER MENUJU CUSTOMER')
);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true) ON CONFLICT DO NOTHING;
