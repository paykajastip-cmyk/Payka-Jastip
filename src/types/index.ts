export type UserRole = 'customer' | 'merchant' | 'driver' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  avatar_url?: string;
  created_at: string;
  rejection_reason?: string;
  // Merchant details
  store_name?: string;
  store_address?: string;
  district?: string;
  city?: string;
  store_description?: string;
  opening_hours?: string;
  // Driver details
  vehicle_type?: 'Motor' | 'Mobil' | 'Pickup';
  vehicle_plate?: string;
}

export interface MerchantRegisterInput {
  owner_name: string;
  store_name: string;
  phone: string;
  email: string;
  password?: string;
  store_address: string;
  district: string;
  city: string;
  description: string;
  opening_hours: string;
}

export interface DriverRegisterInput {
  full_name: string;
  phone: string;
  email: string;
  password?: string;
  address: string;
  district: string;
  city: string;
  vehicle_type: 'Motor' | 'Mobil' | 'Pickup';
  vehicle_plate: string;
}

export type StoreType = 'offline' | 'online' | 'umkm' | 'home_business';
export type LocationStatus = 'pending' | 'verified';

export interface Store {
  id: string;
  merchant_id: string;
  name: string;
  slug: string;
  logo_url: string;
  banner_url: string;
  category: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string; // Singkawang Barat, Tengah, Timur, Utara, Selatan, Bengkayang
  subdistrict?: string;
  whatsapp: string;
  opening_hours: string;
  is_open: boolean;
  rating: number;
  review_count: number;
  store_type: StoreType;
  location_status: LocationStatus;
  is_active: boolean;
  is_demo?: boolean;
  created_at: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface ProductVariation {
  name: string; // e.g. "Ukuran", "Rasa", "Level Pedas"
  options: string[]; // ["Kecil", "Sedang", "Besar"]
}

export interface Product {
  id: string;
  store_id: string;
  store_name?: string;
  name: string;
  price: number;
  promo_price?: number;
  description: string;
  category: string;
  stock: number;
  weight_gram: number;
  variations?: ProductVariation[];
  is_available: boolean;
  image_url: string;
  is_demo?: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations?: Record<string, string>;
  notes?: string;
}

export type OrderStatus =
  | 'MENUNGGU KONFIRMASI'
  | 'TOKO MENERIMA'
  | 'MENUNGGU DRIVER'
  | 'DRIVER MENUJU LOKASI'
  | 'BARANG DIAMBIL'
  | 'DRIVER MENUJU CUSTOMER'
  | 'SELESAI'
  | 'DIBATALKAN';

export type PaymentStatus =
  | 'waiting_payment'
  | 'waiting_confirmation'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  variations?: Record<string, string>;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  tracking_token?: string;
  is_guest?: boolean;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  store_id: string;
  store_name: string;
  store_phone: string;
  store_address: string;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  order_type: 'delivery' | 'pickup';
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount_amount: number;
  promo_code?: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_id?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_number: string;
  payment_method: string; // 'QRIS' | 'E-WALLET' | 'TRANSFER_BANK'
  payment_status: PaymentStatus;
  amount: number;
  proof_url?: string;
  proof_name?: string;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface JastipRequest {
  id: string;
  request_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  item_name: string;
  quantity: number;
  target_store: string;
  pickup_address: string;
  delivery_address: string;
  notes?: string;
  photo_url?: string;
  estimated_budget?: number;
  service_fee: number;
  status: 'PENDING' | 'ACCEPTED' | 'PURCHASED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  driver_id?: string;
  driver_name?: string;
  created_at: string;
}

export type DeliverySize = 'S' | 'M' | 'L' | 'CUSTOM';

export interface DeliveryRequest {
  id: string;
  request_number: string;
  customer_id: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  item_type: string;
  package_size: DeliverySize;
  weight_kg: number;
  notes?: string;
  fee: number;
  route_schedule_id?: string;
  route_name?: string;
  status: 'PENDING' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
  driver_id?: string;
  driver_name?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  vehicle_type: 'Motor' | 'Mobil' | 'Pickup';
  vehicle_plate: string;
  is_online: boolean;
  current_lat: number;
  current_lng: number;
  rating: number;
  total_deliveries: number;
  is_active: boolean;
  is_demo?: boolean;
  created_at: string;
}

export interface ServiceRate {
  id: string;
  service_type: 'food_delivery' | 'jastip' | 'package_delivery';
  base_rate: number; // default: 10000
  per_km_rate: number; // default: 3000
  minimum_rate: number; // default: 15000
  service_fee: number; // default: 2000
  size_s_rate: number; // default: 15000
  size_m_rate: number; // default: 20000
  size_l_rate: number; // default: 25000
}

export interface ServiceArea {
  id: string;
  name: string;
  district: string;
  is_active: boolean;
  fee_multiplier: number;
}

export interface Schedule {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  departure_time: string; // e.g. "06.00 WIB"
  days: string; // "Senin - Jumat"
  is_active: boolean;
}

export interface Promo {
  id: string;
  code: string;
  title: string;
  discount_type: 'percent' | 'nominal' | 'free_shipping';
  discount_value: number;
  min_order: number;
  max_discount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  store_id?: string;
  driver_id?: string;
  store_rating: number;
  driver_rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'delivery' | 'promo' | 'system';
  order_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminSettings {
  app_name: string;
  tagline: string;
  whatsapp_admin: string;
  payment_recipient_name: string;
  payment_account_number: string;
  payment_channel_name: string; // 'DANA' | 'QRIS' | 'BCA' | 'MANDIRI' | 'BRI'
  payment_qr_url: string;
  payment_instructions: string;
  is_payment_configured: boolean;
  base_delivery_fee: number;
  per_km_fee: number;
  service_fee: number;
}

export interface OsmPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hours?: string;
  phone?: string;
  website?: string;
  distance_km?: number;
}
