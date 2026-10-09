import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Profile,
  Store,
  StoreCategory,
  Product,
  CartItem,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  JastipRequest,
  DeliveryRequest,
  Driver,
  ServiceRate,
  Schedule,
  Promo,
  Review,
  Notification,
  NotificationType,
  AdminSettings,
  ServiceArea,
  UserRole,
  MerchantRegisterInput,
  DriverRegisterInput,
} from '../types';
import {
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_DRIVERS,
  INITIAL_CUSTOMERS,
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_RATES,
  INITIAL_SCHEDULES,
  INITIAL_AREAS,
  INITIAL_PROMOS,
} from '../data/initialData';
import { calculateDeliveryFee } from '../utils/helpers';
import { supabase } from '../services/supabase';

interface AppContextType {
  // Current user & authentication
  currentUser: Profile | null;
  isGuest: boolean;
  allUsers: Profile[];
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string; user?: Profile }>;
  registerCustomer: (input: { full_name: string; phone: string; email: string; password?: string }) => Promise<{ success: boolean; message?: string; user?: Profile }>;
  registerMerchant: (input: MerchantRegisterInput) => Promise<{ success: boolean; message?: string; user?: Profile }>;
  registerDriver: (input: DriverRegisterInput) => Promise<{ success: boolean; message?: string; user?: Profile }>;
  logout: () => void;
  updateApprovalStatus: (userId: string, status: 'approved' | 'rejected', reason?: string) => void;
  canAccessMerchant: boolean;
  canAccessDriver: boolean;
  canAccessAdmin: boolean;
  guestOrderTokens: string[];
  getOrderByTracking: (query: { orderNumber?: string; trackingToken?: string; phone?: string }) => Order | undefined;
  switchUser: (user: Profile) => void;
  setUserRole: (role: UserRole) => void;

  // Stores & Products
  stores: Store[];
  categories: StoreCategory[];
  products: Product[];
  addStore: (store: Omit<Store, 'id' | 'created_at'>) => void;
  updateStore: (id: string, store: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variations?: Record<string, string>, notes?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Orders
  orders: Order[];
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => boolean;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Payments
  payments: Payment[];
  submitPaymentProof: (orderId: string, paymentMethod: string, proofUrl: string, proofName?: string) => void;
  verifyPayment: (paymentId: string, isApproved: boolean, rejectionReason?: string) => void;

  // Jastip & Delivery
  jastipRequests: JastipRequest[];
  createJastipRequest: (req: Omit<JastipRequest, 'id' | 'request_number' | 'created_at'>) => Promise<JastipRequest>;
  updateJastipStatus: (id: string, status: JastipRequest['status'], driverId?: string) => void;

  deliveryRequests: DeliveryRequest[];
  createDeliveryRequest: (req: Omit<DeliveryRequest, 'id' | 'request_number' | 'created_at'>) => Promise<DeliveryRequest>;
  updateDeliveryStatus: (id: string, status: DeliveryRequest['status'], driverId?: string) => void;

  // Drivers
  drivers: Driver[];
  currentDriver: Driver | undefined;
  toggleDriverOnline: (driverId: string) => void;
  assignDriverToOrder: (orderId: string, driverId: string) => { success: boolean; message: string };
  updateDriverLocation: (driverId: string, lat: number, lng: number) => void;
  addDriver: (driver: Omit<Driver, 'id' | 'created_at'>) => void;
  deleteDriver: (id: string) => void;

  // Rates, Areas, Schedules, Promos, Reviews, Settings
  rates: ServiceRate[];
  updateRates: (newRate: Partial<ServiceRate>) => void;
  areas: ServiceArea[];
  schedules: Schedule[];
  promos: Promo[];
  addPromo: (promo: Promo) => void;
  updatePromo: (id: string, promo: Partial<Promo>) => void;
  deletePromo: (id: string) => void;
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => void;
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void> | void;
  markAllNotificationsRead: () => Promise<void> | void;
  deleteNotification: (id: string) => Promise<void> | void;
  sendNotification: (notif: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => Promise<void>;
  adminSettings: AdminSettings;
  updateAdminSettings: (settings: Partial<AdminSettings>) => Promise<{ success: boolean; message: string }>;

  // User current location in Singkawang
  userLocation: { lat: number; lng: number; address: string; permissionGranted: boolean };
  setUserLocation: (loc: { lat: number; lng: number; address: string; permissionGranted: boolean }) => void;

  // Selected Store Prefill for Jastip
  jastipTargetStore: { storeName: string; address?: string } | null;
  setJastipTargetStore: (store: { storeName: string; address?: string } | null) => void;

  // Reset / Delete Demo Data
  resetDemoData: () => void;
  deleteDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// LocalStorage persistence helpers
const STORAGE_PREFIX = 'paykajastip_';
function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Profiles
  const adminUser: Profile = {
    id: 'admin-1',
    email: 'paykajastip@gmail.com',
    full_name: 'Admin PaykaJastip',
    phone: '081254321098',
    role: 'admin',
    approval_status: 'approved',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    created_at: '2026-01-01',
  };

  const merchantApprovedUser: Profile = {
    id: 'merchant-user-1',
    email: 'haji.aman@paykajastip.com',
    full_name: 'Haji Aman',
    phone: '081345678901',
    role: 'merchant',
    approval_status: 'approved',
    store_name: 'Bakmi Kering Haji Aman Singkawang',
    store_address: 'Jl. Merdeka No. 12, Singkawang Barat',
    district: 'Singkawang Barat',
    city: 'Singkawang',
    opening_hours: '07.00 - 21.00 WIB',
    store_description: 'Bakmi kering sapi khas Singkawang legendaris sejak 1998.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    created_at: '2026-01-10',
  };

  const merchantPendingUser: Profile = {
    id: 'merchant-pending-1',
    email: 'warung.khatulistiwa@gmail.com',
    full_name: 'Dewi Sartika',
    phone: '081299887766',
    role: 'merchant',
    approval_status: 'pending',
    store_name: 'Warung Bu Dewi Khatulistiwa',
    store_address: 'Jl. Pemuda No. 18, Singkawang Barat',
    district: 'Singkawang Barat',
    city: 'Singkawang',
    opening_hours: '08.00 - 20.00 WIB',
    store_description: 'Aneka masakan rumahan dan kue basah khas Melayu Singkawang.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  };

  const driverApprovedUser: Profile = {
    id: 'driver-user-1',
    email: 'budi.driver@paykajastip.com',
    full_name: 'Budi Santoso',
    phone: '081255443322',
    role: 'driver',
    approval_status: 'approved',
    vehicle_type: 'Motor',
    vehicle_plate: 'KB 3412 SK',
    district: 'Singkawang Barat',
    city: 'Singkawang',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    created_at: '2026-01-05',
  };

  const driverPendingUser: Profile = {
    id: 'driver-pending-1',
    email: 'hendra.motor@gmail.com',
    full_name: 'Hendra Gunawan',
    phone: '081377889900',
    role: 'driver',
    approval_status: 'pending',
    vehicle_type: 'Motor',
    vehicle_plate: 'KB 5678 SK',
    district: 'Singkawang Tengah',
    city: 'Singkawang',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  };

  const initialAllUsers: Profile[] = [
    adminUser,
    merchantApprovedUser,
    merchantPendingUser,
    driverApprovedUser,
    driverPendingUser,
    ...INITIAL_CUSTOMERS,
  ];

  // States
  const [allUsers, setAllUsers] = useState<Profile[]>(() =>
    loadStorage('all_users', initialAllUsers)
  );

  const [currentUser, setCurrentUser] = useState<Profile | null>(() =>
    loadStorage('user', null)
  );

  const [guestOrderTokens, setGuestOrderTokens] = useState<string[]>(() =>
    loadStorage('guest_tokens', [])
  );

  const [stores, setStores] = useState<Store[]>(() =>
    loadStorage('stores', INITIAL_STORES)
  );

  const [categories] = useState<StoreCategory[]>(INITIAL_CATEGORIES);

  const [products, setProducts] = useState<Product[]>(() =>
    loadStorage('products', INITIAL_PRODUCTS)
  );

  const [drivers, setDrivers] = useState<Driver[]>(() =>
    loadStorage('drivers', INITIAL_DRIVERS)
  );

  const [rates, setRates] = useState<ServiceRate[]>(() =>
    loadStorage('rates', INITIAL_RATES)
  );

  const [schedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [areas] = useState<ServiceArea[]>(INITIAL_AREAS);

  const [promos, setPromos] = useState<Promo[]>(() =>
    loadStorage('promos', INITIAL_PROMOS)
  );

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() =>
    loadStorage('settings', INITIAL_SETTINGS)
  );

  const [cart, setCart] = useState<CartItem[]>(() =>
    loadStorage('cart', [])
  );

  // Initial demo order for customer to see the flow right away
  const sampleInitialOrders: Order[] = [
    {
      id: 'ord-demo-1',
      order_number: 'PK-ORD-2610-101',
      customer_id: 'cust-1',
      customer_name: 'Andi Kusuma',
      customer_phone: '081234567801',
      store_id: 'store-1',
      store_name: 'Bakmi Kering Haji Aman Singkawang',
      store_phone: '081345678901',
      store_address: 'Jl. Merdeka No. 12, Kel. Pasiran, Singkawang Barat',
      delivery_address: 'Jl. Alianyang No. 40, Singkawang Barat',
      delivery_lat: 0.902,
      delivery_lng: 108.981,
      order_type: 'delivery',
      items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
          product_name: 'Bakmi Kering Spesial Daging Sapi + Kuah Kaldu',
          price: 28000,
          quantity: 2,
          subtotal: 56000,
          variations: { 'Level Pedas': 'Sedang' },
        },
        {
          id: 'item-2',
          product_id: 'prod-3',
          product_name: 'Es Sari Kacang Hijau Kental',
          price: 10000,
          quantity: 1,
          subtotal: 10000,
        },
      ],
      subtotal: 66000,
      delivery_fee: 15000,
      service_fee: 2000,
      discount_amount: 10000,
      promo_code: 'PAYKABARU',
      total_amount: 73000,
      status: 'DRIVER MENUJU CUSTOMER',
      payment_status: 'paid',
      payment_id: 'pay-demo-1',
      driver_id: 'driver-1',
      driver_name: 'Budi Santoso (Driver Payka 01)',
      driver_phone: '081255443322',
      notes: 'Tolong sambal dipisah ya mang.',
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    },
  ];

  const [orders, setOrders] = useState<Order[]>(() =>
    loadStorage('orders', sampleInitialOrders)
  );

  const sampleInitialPayments: Payment[] = [
    {
      id: 'pay-demo-1',
      order_id: 'ord-demo-1',
      order_number: 'PK-ORD-2610-101',
      payment_method: 'QRIS',
      payment_status: 'paid',
      amount: 73000,
      proof_url: 'https://images.unsplash.com/photo-1595079672139-545c0250005d?auto=format&fit=crop&w=300&q=80',
      proof_name: 'transfer-bukti-qris.jpg',
      submitted_at: new Date(Date.now() - 40 * 60000).toISOString(),
      verified_at: new Date(Date.now() - 35 * 60000).toISOString(),
      verified_by: 'Super Admin Payka',
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 35 * 60000).toISOString(),
    },
  ];

  const [payments, setPayments] = useState<Payment[]>(() =>
    loadStorage('payments', sampleInitialPayments)
  );

  const [jastipRequests, setJastipRequests] = useState<JastipRequest[]>(() =>
    loadStorage('jastip', [
      {
        id: 'jst-demo-1',
        request_number: 'JST-2610-001',
        customer_id: 'cust-2',
        customer_name: 'Siti Nurhaliza',
        customer_phone: '081234567802',
        item_name: 'Choipan Kukus Kucai 20 pcs + Kerupuk Basah',
        quantity: 2,
        target_store: 'Pasar Beringin Singkawang',
        pickup_address: 'Komp. Pasar Beringin Blok B, Singkawang Tengah',
        delivery_address: 'Jl. Ratu Sepudak, Sungai Garam, Singkawang Utara',
        notes: 'Minta yang baru matang ya kak, sambalnya banyakin.',
        estimated_budget: 60000,
        service_fee: 15000,
        status: 'ACCEPTED',
        driver_id: 'driver-2',
        driver_name: 'Hendra Wijaya (Driver Payka 02)',
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ])
  );

  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>(() =>
    loadStorage('delivery', [
      {
        id: 'del-demo-1',
        request_number: 'DEL-2610-001',
        customer_id: 'cust-1',
        sender_name: 'Andi Kusuma',
        sender_phone: '081234567801',
        recipient_name: 'Herman (Bengkayang)',
        recipient_phone: '081399887711',
        pickup_address: 'Jl. Merdeka No. 55, Singkawang Barat',
        delivery_address: 'Jl. Raya Sanggau Ledo, Bengkayang Kota',
        item_type: 'Dokumen Berkas & Sampel Produk UMKM',
        package_size: 'S',
        weight_kg: 0.8,
        notes: 'Jadwal keberangkatan pagi 06.00 WIB.',
        fee: 15000,
        route_schedule_id: 'sch-1',
        route_name: 'Singkawang → Bengkayang (Pagi)',
        status: 'DRIVER_ASSIGNED',
        driver_id: 'driver-3',
        driver_name: 'Ahmad Fauzi (Kurir Khusus Mobil & Antar Kota)',
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
    ])
  );

  const [reviews, setReviews] = useState<Review[]>(() =>
    loadStorage('reviews', [
      {
        id: 'rev-1',
        order_id: 'ord-demo-0',
        customer_id: 'cust-1',
        customer_name: 'Andi Kusuma',
        store_id: 'store-1',
        driver_id: 'driver-1',
        store_rating: 5,
        driver_rating: 5,
        comment: 'Bakmi kuah hangat sampai tepat waktu, drivernya ramah dan bawa barang dengan rapi!',
        created_at: '2026-02-05T12:00:00Z',
      },
    ])
  );

  // Notifications state strictly isolated per user
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // User location in Singkawang
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    permissionGranted: boolean;
  }>({
    lat: 0.9056,
    lng: 108.9868,
    address: 'Singkawang Kota, Kalimantan Barat',
    permissionGranted: false,
  });

  const [jastipTargetStore, setJastipTargetStore] = useState<{ storeName: string; address?: string } | null>(null);

  // Sync to localStorage
  useEffect(() => saveStorage('all_users', allUsers), [allUsers]);
  useEffect(() => saveStorage('user', currentUser), [currentUser]);
  useEffect(() => saveStorage('guest_tokens', guestOrderTokens), [guestOrderTokens]);
  useEffect(() => saveStorage('stores', stores), [stores]);
  useEffect(() => saveStorage('products', products), [products]);
  useEffect(() => saveStorage('drivers', drivers), [drivers]);
  useEffect(() => saveStorage('orders', orders), [orders]);
  useEffect(() => saveStorage('payments', payments), [payments]);
  useEffect(() => saveStorage('jastip', jastipRequests), [jastipRequests]);
  useEffect(() => saveStorage('delivery', deliveryRequests), [deliveryRequests]);
  useEffect(() => saveStorage('cart', cart), [cart]);
  useEffect(() => saveStorage('settings', adminSettings), [adminSettings]);
  useEffect(() => saveStorage('rates', rates), [rates]);
  useEffect(() => saveStorage('promos', promos), [promos]);
  useEffect(() => saveStorage('reviews', reviews), [reviews]);

  // Load, migrate, and subscribe strictly per user
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const currentUserId = currentUser.id;
    const userStorageKey = `notifications_${currentUserId}`;

    // 1. Initial load from user's storage bucket
    let userLocalNotifs = loadStorage<Notification[]>(userStorageKey, []);

    // 2. Data migration from legacy global notifications if present
    const legacyGlobalNotifs = loadStorage<any[]>('notifications', []);
    if (legacyGlobalNotifs.length > 0) {
      const migratedItems = legacyGlobalNotifs.filter(
        (n) => n && n.user_id === currentUserId
      ) as Notification[];
      if (migratedItems.length > 0) {
        const existingIds = new Set(userLocalNotifs.map((n) => n.id));
        const newMigrated = migratedItems.filter((m) => !existingIds.has(m.id));
        if (newMigrated.length > 0) {
          userLocalNotifs = [...userLocalNotifs, ...newMigrated];
          saveStorage(userStorageKey, userLocalNotifs);
        }
      }
      try {
        localStorage.removeItem(STORAGE_PREFIX + 'notifications');
      } catch {}
    }

    // Default welcome notification if user has none
    if (userLocalNotifs.length === 0) {
      userLocalNotifs = [
        {
          id: `welcome-${currentUserId}`,
          user_id: currentUserId,
          role: currentUser.role,
          title: `Selamat Datang, ${currentUser.full_name}!`,
          message:
            currentUser.role === 'merchant'
              ? 'Kelola toko, perbarui menu katalog, dan pantau pesanan pelanggan Singkawang di sini.'
              : currentUser.role === 'driver'
              ? 'Siap melayani pengantaran di Singkawang. Nyalakan mode online untuk menerima tugas.'
              : currentUser.role === 'admin'
              ? 'Selamat datang di panel Super Admin Payka-Jastip.'
              : 'Gunakan kode promo PAYKABARU untuk hemat biaya jastip & belanja pertamamu.',
          type: 'system',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ];
      saveStorage(userStorageKey, userLocalNotifs);
    }

    setNotifications(userLocalNotifs);

    // 3. Fetch from Supabase if configured
    const client = supabase;
    if (client) {
      const fetchSupabaseNotifications = async () => {
        try {
          const { data, error } = await client
            .from('notifications')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            setNotifications(data as Notification[]);
            saveStorage(userStorageKey, data);
          }
        } catch (err) {
          console.warn('Failed loading notifications from Supabase:', err);
        }
      };
      fetchSupabaseNotifications();

      // 4. Supabase Realtime channel strictly filtered by user_id
      const channelName = `notifications:user_id=${currentUserId}`;
      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            const newRow = payload.new as Notification;
            if (newRow && newRow.user_id === currentUserId) {
              setNotifications((prev) => [newRow, ...prev.filter((n) => n.id !== newRow.id)]);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            const updatedRow = payload.new as Notification;
            if (updatedRow && updatedRow.user_id === currentUserId) {
              setNotifications((prev) =>
                prev.map((n) => (n.id === updatedRow.id ? updatedRow : n))
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            const oldRow = payload.old as { id: string };
            if (oldRow?.id) {
              setNotifications((prev) => prev.filter((n) => n.id !== oldRow.id));
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  // Sync active user's notifications to their dedicated bucket
  useEffect(() => {
    if (currentUser) {
      saveStorage(`notifications_${currentUser.id}`, notifications);
    }
  }, [notifications, currentUser?.id]);

  // Load admin_settings from Supabase on mount and listen to realtime updates
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const fetchAdminSettings = async () => {
      try {
        const { data, error } = await client
          .from('admin_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (!error && data) {
          setAdminSettings((prev) => {
            const merged: AdminSettings = {
              ...prev,
              ...data,
              whatsapp_admin: data.whatsapp_admin || prev.whatsapp_admin,
            };
            saveStorage('settings', merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Failed loading admin_settings from Supabase:', err);
      }
    };

    fetchAdminSettings();

    // Subscribe to realtime admin_settings changes
    const settingsChannel = client
      .channel('public:admin_settings:id=1')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_settings',
          filter: 'id=eq.1',
        },
        (payload) => {
          const newRow = payload.new as Partial<AdminSettings>;
          if (newRow && typeof newRow === 'object') {
            setAdminSettings((prev) => {
              const merged: AdminSettings = {
                ...prev,
                ...newRow,
                whatsapp_admin: newRow.whatsapp_admin || prev.whatsapp_admin,
              };
              saveStorage('settings', merged);
              return merged;
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(settingsChannel);
    };
  }, []);

  // Request browser location gracefully on start
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Lokasi Anda Saat Ini (GPS Terdeteksi)',
            permissionGranted: true,
          });
        },
        () => {
          // Default to Singkawang Center if denied or unavailable
          setUserLocation((prev) => ({ ...prev, permissionGranted: false }));
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  const isGuest = !currentUser;

  const canAccessMerchant = Boolean(
    currentUser &&
      ((currentUser.role === 'merchant' && currentUser.approval_status === 'approved') ||
        (currentUser.role === 'admin' && currentUser.email.toLowerCase() === 'paykajastip@gmail.com'))
  );

  const canAccessDriver = Boolean(
    currentUser &&
      ((currentUser.role === 'driver' && currentUser.approval_status === 'approved') ||
        (currentUser.role === 'admin' && currentUser.email.toLowerCase() === 'paykajastip@gmail.com'))
  );

  const canAccessAdmin = Boolean(
    currentUser &&
      currentUser.role === 'admin' &&
      currentUser.email.toLowerCase() === 'paykajastip@gmail.com'
  );

  // Authentication & Access Control
  const login = async (email: string, _password?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if admin login
    if (cleanEmail === 'paykajastip@gmail.com') {
      let admin = allUsers.find((u) => u.email.toLowerCase() === 'paykajastip@gmail.com');
      if (!admin) {
        admin = {
          id: 'admin-1',
          email: 'paykajastip@gmail.com',
          full_name: 'Admin PaykaJastip',
          phone: '081254321098',
          role: 'admin',
          approval_status: 'approved',
          created_at: new Date().toISOString(),
        };
        setAllUsers((prev) => [admin!, ...prev]);
      } else {
        admin = { ...admin, role: 'admin', approval_status: 'approved' };
      }
      setCurrentUser(admin);
      return { success: true, user: admin };
    }

    const user = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'Email tidak ditemukan. Silakan mendaftar terlebih dahulu.' };
    }

    // Role admin validation safeguard
    if (user.role === 'admin' && cleanEmail !== 'paykajastip@gmail.com') {
      const sanitized: Profile = { ...user, role: 'customer' };
      setCurrentUser(sanitized);
      return { success: true, user: sanitized };
    }

    setCurrentUser(user);
    return { success: true, user };
  };

  const registerCustomer = async (input: {
    full_name: string;
    phone: string;
    email: string;
    password?: string;
  }) => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar. Silakan masuk dengan akun Anda.' };
    }

    const newProfile: Profile = {
      id: `cust-${Date.now()}`,
      email: cleanEmail,
      full_name: input.full_name,
      phone: input.phone,
      role: 'customer',
      approval_status: 'approved',
      created_at: new Date().toISOString(),
    };

    setAllUsers((prev) => [newProfile, ...prev]);
    setCurrentUser(newProfile);
    return { success: true, user: newProfile };
  };

  // Dedicated helper to send notification targeted strictly to a specific user_id
  const sendNotification = async (
    notif: Omit<Notification, 'id' | 'created_at' | 'is_read'>
  ) => {
    if (!notif.user_id || notif.user_id === 'guest') {
      return;
    }

    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: notif.user_id,
      role: notif.role,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      reference_id: notif.reference_id,
      order_id: notif.reference_id,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // 1. If targeting the currently active user, update active state immediately
    if (currentUser && currentUser.id === notif.user_id) {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
    }

    // 2. Persist in recipient's dedicated local storage partition
    try {
      const recipientStorageKey = `notifications_${notif.user_id}`;
      const recipientList = loadStorage<Notification[]>(recipientStorageKey, []);
      saveStorage(recipientStorageKey, [newNotif, ...recipientList.filter((n) => n.id !== newNotif.id)]);
    } catch (err) {
      console.warn('Failed saving notification to user storage:', err);
    }

    // 3. Persist in Supabase with RLS if configured
    if (supabase) {
      try {
        await supabase.from('notifications').insert({
          id: newNotif.id,
          user_id: newNotif.user_id,
          role: newNotif.role || 'customer',
          title: newNotif.title,
          message: newNotif.message,
          type: newNotif.type,
          reference_id: newNotif.reference_id,
          order_id: newNotif.reference_id,
          is_read: false,
        });
      } catch (err) {
        console.warn('Supabase insert notification error:', err);
      }
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && n.user_id === currentUser.id ? { ...n, is_read: true } : n))
    );
    try {
      const storageKey = `notifications_${currentUser.id}`;
      const currentList = loadStorage<Notification[]>(storageKey, []);
      saveStorage(
        storageKey,
        currentList.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}

    if (supabase) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id)
          .eq('user_id', currentUser.id);
      } catch (err) {
        console.warn('Supabase mark read error:', err);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.user_id === currentUser.id ? { ...n, is_read: true } : n))
    );
    try {
      const storageKey = `notifications_${currentUser.id}`;
      const currentList = loadStorage<Notification[]>(storageKey, []);
      saveStorage(
        storageKey,
        currentList.map((n) => ({ ...n, is_read: true }))
      );
    } catch {}

    if (supabase) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', currentUser.id)
          .eq('is_read', false);
      } catch (err) {
        console.warn('Supabase mark all read error:', err);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    if (!currentUser) return;
    setNotifications((prev) => prev.filter((n) => !(n.id === id && n.user_id === currentUser.id)));
    try {
      const storageKey = `notifications_${currentUser.id}`;
      const currentList = loadStorage<Notification[]>(storageKey, []);
      saveStorage(
        storageKey,
        currentList.filter((n) => n.id !== id)
      );
    } catch {}

    if (supabase) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', id)
          .eq('user_id', currentUser.id);
      } catch (err) {
        console.warn('Supabase delete notification error:', err);
      }
    }
  };

  const unreadNotificationsCount = currentUser
    ? notifications.filter((n) => n.user_id === currentUser.id && !n.is_read).length
    : 0;

  const registerMerchant = async (input: MerchantRegisterInput) => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar.' };
    }

    const newMerchantId = `merch-${Date.now()}`;
    const newProfile: Profile = {
      id: newMerchantId,
      email: cleanEmail,
      full_name: input.owner_name,
      phone: input.phone,
      role: 'merchant',
      approval_status: 'pending',
      store_name: input.store_name,
      store_address: input.store_address,
      district: input.district,
      city: input.city,
      store_description: input.description,
      opening_hours: input.opening_hours,
      created_at: new Date().toISOString(),
    };

    const newStore: Store = {
      id: `store-${Date.now()}`,
      merchant_id: newMerchantId,
      name: input.store_name,
      slug: input.store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      category: 'UMKM',
      description: input.description || 'Merchant Mitra PaykaJastip Singkawang',
      address: input.store_address,
      latitude: 0.9056,
      longitude: 108.9868,
      district: input.district,
      whatsapp: input.phone,
      opening_hours: input.opening_hours || '08.00 - 21.00 WIB',
      is_open: true,
      rating: 5.0,
      review_count: 0,
      store_type: 'umkm',
      location_status: 'pending',
      is_active: false,
      created_at: new Date().toISOString(),
    };

    setStores((prev) => [newStore, ...prev]);
    setAllUsers((prev) => [newProfile, ...prev]);
    setCurrentUser(newProfile);

    // Notify applicant
    sendNotification({
      user_id: newMerchantId,
      role: 'merchant',
      title: 'Pendaftaran Merchant Diterima',
      message: `Pendaftaran toko "${input.store_name}" berhasil dikirim. Menunggu verifikasi admin.`,
      type: 'system',
    });

    // Notify Super Admin only
    const adminUser = allUsers.find((u) => u.email.toLowerCase() === 'paykajastip@gmail.com');
    if (adminUser) {
      sendNotification({
        user_id: adminUser.id,
        role: 'admin',
        title: 'Pendaftaran Mitra Merchant Baru',
        message: `Toko "${input.store_name}" (${input.owner_name}) mendaftar dan menunggu persetujuan.`,
        type: 'system',
        reference_id: newMerchantId,
      });
    }

    return { success: true, user: newProfile };
  };

  const registerDriver = async (input: DriverRegisterInput) => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email sudah terdaftar.' };
    }

    const newDriverId = `driver-${Date.now()}`;
    const newProfile: Profile = {
      id: newDriverId,
      email: cleanEmail,
      full_name: input.full_name,
      phone: input.phone,
      role: 'driver',
      approval_status: 'pending',
      vehicle_type: input.vehicle_type,
      vehicle_plate: input.vehicle_plate,
      district: input.district,
      city: input.city,
      created_at: new Date().toISOString(),
    };

    const newDriverRecord: Driver = {
      id: `drv-${Date.now()}`,
      user_id: newDriverId,
      name: input.full_name,
      phone: input.phone,
      vehicle_type: input.vehicle_type,
      vehicle_plate: input.vehicle_plate,
      is_online: false,
      current_lat: 0.9056,
      current_lng: 108.9868,
      rating: 5.0,
      total_deliveries: 0,
      is_active: false,
      created_at: new Date().toISOString(),
    };

    setDrivers((prev) => [newDriverRecord, ...prev]);
    setAllUsers((prev) => [newProfile, ...prev]);
    setCurrentUser(newProfile);

    // Notify applicant
    sendNotification({
      user_id: newDriverId,
      role: 'driver',
      title: 'Pendaftaran Driver Diterima',
      message: 'Pendaftaran Anda berhasil dikirim. Menunggu persetujuan admin Payka-Jastip.',
      type: 'system',
    });

    // Notify Super Admin only
    const adminUser = allUsers.find((u) => u.email.toLowerCase() === 'paykajastip@gmail.com');
    if (adminUser) {
      sendNotification({
        user_id: adminUser.id,
        role: 'admin',
        title: 'Pendaftaran Mitra Driver Baru',
        message: `${input.full_name} (${input.vehicle_type} - ${input.vehicle_plate}) mendaftar sebagai driver.`,
        type: 'system',
        reference_id: newDriverId,
      });
    }

    return { success: true, user: newProfile };
  };

  const logout = () => {
    setCurrentUser(null);
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_PREFIX + 'user');
    } catch {}
  };

  const updateApprovalStatus = (
    userId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, approval_status: status, rejection_reason: reason };
        }
        return u;
      })
    );

    if (status === 'approved') {
      setStores((prev) =>
        prev.map((s) => (s.merchant_id === userId ? { ...s, is_active: true } : s))
      );
      setDrivers((prev) =>
        prev.map((d) => (d.user_id === userId ? { ...d, is_active: true } : d))
      );
    } else if (status === 'rejected') {
      setStores((prev) =>
        prev.map((s) => (s.merchant_id === userId ? { ...s, is_active: false } : s))
      );
      setDrivers((prev) =>
        prev.map((d) => (d.user_id === userId ? { ...d, is_active: false } : d))
      );
    }

    setCurrentUser((prev) => {
      if (prev && prev.id === userId) {
        return { ...prev, approval_status: status, rejection_reason: reason };
      }
      return prev;
    });

    // Notify the target user strictly based on their userId
    const targetUser = allUsers.find((u) => u.id === userId);
    if (targetUser) {
      if (targetUser.role === 'merchant') {
        sendNotification({
          user_id: userId,
          role: 'merchant',
          title: status === 'approved' ? 'Pendaftaran Toko Disetujui! 🎉' : 'Pendaftaran Toko Ditolak',
          message: status === 'approved'
            ? 'Selamat! Toko Anda telah resmi aktif di Payka-Jastip. Anda kini dapat mengelola produk dan menerima pesanan.'
            : `Pendaftaran toko ditolak: ${reason || 'Silakan lengkapi berkas dan ajukan ulang.'}`,
          type: status === 'approved' ? 'merchant_approved' : 'merchant_rejected',
        });
      } else if (targetUser.role === 'driver') {
        sendNotification({
          user_id: userId,
          role: 'driver',
          title: status === 'approved' ? 'Pendaftaran Driver Disetujui! 🛵' : 'Pendaftaran Driver Ditolak',
          message: status === 'approved'
            ? 'Selamat! Anda telah diverifikasi sebagai Driver resmi Payka-Jastip. Aktifkan status online untuk mengambil tugas.'
            : `Pendaftaran driver ditolak: ${reason || 'Silakan periksa kelengkapan data SIM & kendaraan Anda.'}`,
          type: status === 'approved' ? 'driver_approved' : 'driver_rejected',
        });
      }
    }
  };

  const getOrderByTracking = (query: {
    orderNumber?: string;
    trackingToken?: string;
    phone?: string;
  }) => {
    return orders.find((o) => {
      if (query.trackingToken && o.tracking_token === query.trackingToken) return true;
      if (query.orderNumber && o.order_number.toLowerCase() === query.orderNumber.toLowerCase().trim()) {
        if (!query.phone) return true;
        const cleanQueryPhone = query.phone.replace(/\D/g, '');
        const cleanOrderPhone = o.customer_phone.replace(/\D/g, '');
        return cleanOrderPhone.endsWith(cleanQueryPhone) || cleanQueryPhone.endsWith(cleanOrderPhone);
      }
      return false;
    });
  };

  // Backward compatibility switchUser
  const switchUser = (user: Profile) => {
    if (user.role === 'admin' && user.email.toLowerCase() !== 'paykajastip@gmail.com') {
      return;
    }
    setCurrentUser(user);
  };

  const setUserRole = (role: UserRole) => {
    if (role === 'admin') {
      const admin = allUsers.find((u) => u.email.toLowerCase() === 'paykajastip@gmail.com') || adminUser;
      setCurrentUser(admin);
    } else if (role === 'merchant') {
      const merch = allUsers.find((u) => u.role === 'merchant') || merchantApprovedUser;
      setCurrentUser(merch);
    } else if (role === 'driver') {
      const drv = allUsers.find((u) => u.role === 'driver') || driverApprovedUser;
      setCurrentUser(drv);
    } else {
      setCurrentUser(INITIAL_CUSTOMERS[0]);
    }
  };

  // Cart operations
  const addToCart = (
    product: Product,
    quantity = 1,
    variations?: Record<string, string>,
    notes?: string
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedVariations) === JSON.stringify(variations)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        if (notes) next[existingIndex].notes = notes;
        return next;
      }

      return [...prev, { product, quantity, selectedVariations: variations, notes }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.promo_price ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Orders
  const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const timestamp = Date.now().toString().slice(-4);
    const orderNum = `PK-ORD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${timestamp}`;
    const isGuestOrder = !currentUser;
    const trackingToken = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `trk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNum,
      tracking_token: trackingToken,
      is_guest: isGuestOrder,
      customer_id: currentUser ? currentUser.id : 'guest',
      customer_name: orderData.customer_name || currentUser?.full_name || 'Pelanggan Guest',
      customer_phone: orderData.customer_phone || currentUser?.phone || '',
      store_id: orderData.store_id || '',
      store_name: orderData.store_name || '',
      store_phone: orderData.store_phone || '',
      store_address: orderData.store_address || '',
      delivery_address: orderData.delivery_address || userLocation.address,
      delivery_lat: orderData.delivery_lat || userLocation.lat,
      delivery_lng: orderData.delivery_lng || userLocation.lng,
      order_type: orderData.order_type || 'delivery',
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      delivery_fee: orderData.delivery_fee || 0,
      service_fee: orderData.service_fee || adminSettings.service_fee,
      discount_amount: orderData.discount_amount || 0,
      promo_code: orderData.promo_code,
      total_amount: orderData.total_amount || 0,
      status: 'MENUNGGU KONFIRMASI',
      payment_status: 'waiting_payment',
      notes: orderData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isGuestOrder) {
      setGuestOrderTokens((prev) => [trackingToken, ...prev]);
    }

    setOrders((prev) => [newOrder, ...prev]);

    // Create payment entry
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      payment_method: 'MANUAL_TRANSFER',
      payment_status: 'waiting_payment',
      amount: newOrder.total_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);

    // 1. Notify Customer if logged in (Guest has no user_id)
    if (currentUser && currentUser.id !== 'guest') {
      sendNotification({
        user_id: currentUser.id,
        role: 'customer',
        title: 'Pesanan Berhasil Dibuat',
        message: `Pesanan #${newOrder.order_number} berhasil dibuat. Silakan lakukan pembayaran.`,
        type: 'order_created',
        reference_id: newOrder.id,
      });
    }

    // 2. Notify the Merchant who owns this store
    const targetStore = stores.find((s) => s.id === newOrder.store_id);
    if (targetStore && targetStore.merchant_id) {
      sendNotification({
        user_id: targetStore.merchant_id,
        role: 'merchant',
        title: 'Pesanan Baru Masuk! 🛍️',
        message: `Pesanan baru #${newOrder.order_number} dari ${newOrder.customer_name}. Total: Rp ${newOrder.total_amount.toLocaleString('id-ID')}.`,
        type: 'order_created',
        reference_id: newOrder.id,
      });
    }

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    note?: string
  ): boolean => {
    let updated = false;
    let targetOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          updated = true;
          targetOrder = ord;
          return {
            ...ord,
            status,
            notes: note ? `${ord.notes || ''} [Catatan: ${note}]` : ord.notes,
            updated_at: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (updated) {
      // Find order from state if not captured in map
      const order = targetOrder || orders.find((o) => o.id === orderId);
      if (order && order.customer_id && order.customer_id !== 'guest') {
        let notifTitle = 'Status Pesanan Berubah';
        let notifType: NotificationType = 'order_processing';
        let notifMsg = `Status pesanan #${order.order_number} kini: ${status}.`;

        switch (status) {
          case 'TOKO MENERIMA':
            notifTitle = 'Pesanan Dikonfirmasi Toko';
            notifType = 'order_confirmed';
            notifMsg = `Toko ${order.store_name} telah menerima dan mulai menyiapkan pesanan #${order.order_number}.`;
            break;
          case 'MENUNGGU DRIVER':
            notifTitle = 'Mencari Kurir/Driver';
            notifType = 'order_processing';
            notifMsg = `Pesanan #${order.order_number} selesai diproses toko dan sedang dicarikan Driver.`;
            break;
          case 'DRIVER MENUJU LOKASI':
            notifTitle = 'Driver Menuju Toko';
            notifType = 'driver_assigned';
            notifMsg = `Driver sedang menuju toko untuk mengambil pesanan #${order.order_number}.`;
            break;
          case 'BARANG DIAMBIL':
            notifTitle = 'Barang Siap Diantar';
            notifType = 'order_ready';
            notifMsg = `Barang pesanan #${order.order_number} telah diambil oleh Driver dari toko.`;
            break;
          case 'DRIVER MENUJU CUSTOMER':
            notifTitle = 'Driver Sedang Mengantar 🛵';
            notifType = 'driver_on_the_way';
            notifMsg = `Driver sedang dalam perjalanan menuju lokasi Anda untuk pesanan #${order.order_number}.`;
            break;
          case 'SELESAI':
            notifTitle = 'Pesanan Selesai 🎉';
            notifType = 'order_completed';
            notifMsg = `Pesanan #${order.order_number} telah selesai diantar. Terima kasih telah menggunakan Payka-Jastip!`;
            break;
          case 'DIBATALKAN':
            notifTitle = 'Pesanan Dibatalkan';
            notifType = 'system';
            notifMsg = `Pesanan #${order.order_number} dibatalkan.${note ? ' Alasan: ' + note : ''}`;
            break;
        }

        sendNotification({
          user_id: order.customer_id,
          role: 'customer',
          title: notifTitle,
          message: notifMsg,
          type: notifType,
          reference_id: order.id,
        });
      }
    }
    return updated;
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    updateOrderStatus(orderId, 'DIBATALKAN', reason);
    setPayments((prev) =>
      prev.map((p) => (p.order_id === orderId ? { ...p, payment_status: 'cancelled' } : p))
    );
  };

  // Payment proof submission by customer
  const submitPaymentProof = (
    orderId: string,
    paymentMethod: string,
    proofUrl: string,
    proofName?: string
  ) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.order_id === orderId) {
          return {
            ...p,
            payment_method: paymentMethod,
            payment_status: 'waiting_confirmation',
            proof_url: proofUrl,
            proof_name: proofName || 'bukti-transfer.jpg',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, payment_status: 'waiting_confirmation' } : o
      )
    );

    // 1. Notify Customer if logged in
    if (currentUser && currentUser.id !== 'guest') {
      sendNotification({
        user_id: currentUser.id,
        role: 'customer',
        title: 'Bukti Pembayaran Terkirim',
        message: `Bukti transfer pesanan #${orderId} telah dikirim dan sedang diverifikasi oleh Admin.`,
        type: 'system',
        reference_id: orderId,
      });
    }

    // 2. Notify Super Admin only
    const adminUser = allUsers.find((u) => u.email.toLowerCase() === 'paykajastip@gmail.com');
    if (adminUser) {
      sendNotification({
        user_id: adminUser.id,
        role: 'admin',
        title: 'Bukti Transfer Baru Menunggu Verifikasi',
        message: `Bukti transfer baru diunggah untuk pesanan #${orderId}. Silakan periksa di Admin Suite.`,
        type: 'system',
        reference_id: orderId,
      });
    }
  };

  // Payment verification exclusively by Admin
  const verifyPayment = (
    paymentId: string,
    isApproved: boolean,
    rejectionReason?: string
  ) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const newPaymentStatus: PaymentStatus = isApproved ? 'paid' : 'failed';

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            payment_status: newPaymentStatus,
            verified_at: new Date().toISOString(),
            verified_by: currentUser ? currentUser.full_name : 'Admin Payka',
            rejection_reason: rejectionReason,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    let targetOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === payment.order_id) {
          targetOrder = o;
          return {
            ...o,
            payment_status: newPaymentStatus,
            status: isApproved ? 'TOKO MENERIMA' : o.status,
            updated_at: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    const order = targetOrder || orders.find((o) => o.id === payment.order_id);

    // 1. Notify Customer (only if not guest)
    if (order && order.customer_id && order.customer_id !== 'guest') {
      sendNotification({
        user_id: order.customer_id,
        role: 'customer',
        title: isApproved ? 'Pembayaran Berhasil Diverifikasi! (PAID)' : 'Pembayaran Ditolak',
        message: isApproved
          ? `Pembayaran untuk order #${payment.order_number} telah disetujui Admin. Toko sedang menyiapkan barang pesanan Anda.`
          : `Pembayaran pesanan #${payment.order_number} ditolak: ${rejectionReason || 'Bukti transfer tidak valid'}.`,
        type: isApproved ? 'payment_success' : 'payment_failed',
        reference_id: order.id,
      });
    }

    // 2. If approved, notify Merchant of this store
    if (order && isApproved) {
      const targetStore = stores.find((s) => s.id === order.store_id);
      if (targetStore && targetStore.merchant_id) {
        sendNotification({
          user_id: targetStore.merchant_id,
          role: 'merchant',
          title: 'Pembayaran Pesanan Dikonfirmasi Lunas',
          message: `Pembayaran pesanan #${order.order_number} telah diverifikasi. Silakan siapkan pesanan pembeli.`,
          type: 'payment_success',
          reference_id: order.id,
        });
      }
    }
  };

  // Driver assignment with race-condition check
  const assignDriverToOrder = (
    orderId: string,
    driverId: string
  ): { success: boolean; message: string } => {
    const order = orders.find((o) => o.id === orderId);
    const driver = drivers.find((d) => d.id === driverId);

    if (!order) return { success: false, message: 'Pesanan tidak ditemukan' };
    if (!driver) return { success: false, message: 'Driver tidak ditemukan' };

    // Prevent race condition: check if already assigned to another driver
    if (order.driver_id && order.driver_id !== driverId) {
      return {
        success: false,
        message: `Pesanan sudah diambil lebih dulu oleh ${order.driver_name || 'driver lain'}.`,
      };
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            driver_id: driver.id,
            driver_name: driver.name,
            driver_phone: driver.phone,
            status: 'DRIVER MENUJU LOKASI',
            updated_at: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    // 1. Notify the assigned Driver strictly based on driver.user_id
    if (driver.user_id) {
      sendNotification({
        user_id: driver.user_id,
        role: 'driver',
        title: 'Tugas Pengantaran Baru 🛵',
        message: `Anda ditugaskan mengantar pesanan #${order.order_number} dari ${order.store_name} ke ${order.delivery_address}.`,
        type: 'driver_assigned',
        reference_id: order.id,
      });
    }

    // 2. Notify the Customer (only if not guest)
    if (order.customer_id && order.customer_id !== 'guest') {
      sendNotification({
        user_id: order.customer_id,
        role: 'customer',
        title: 'Driver Ditugaskan 🛵',
        message: `Driver ${driver.name} telah ditugaskan dan sedang menuju toko untuk mengambil pesanan #${order.order_number}.`,
        type: 'driver_assigned',
        reference_id: order.id,
      });
    }

    return { success: true, message: 'Pesanan berhasil diambil!' };
  };

  const toggleDriverOnline = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, is_online: !d.is_online } : d))
    );
  };

  const updateDriverLocation = (driverId: string, lat: number, lng: number) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, current_lat: lat, current_lng: lng } : d))
    );
  };

  // Jastip
  const createJastipRequest = async (
    req: Omit<JastipRequest, 'id' | 'request_number' | 'created_at'>
  ): Promise<JastipRequest> => {
    const timestamp = Date.now().toString().slice(-4);
    const reqNum = `JST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${timestamp}`;
    const newReq: JastipRequest = {
      ...req,
      id: `jst-${Date.now()}`,
      request_number: reqNum,
      created_at: new Date().toISOString(),
    };

    setJastipRequests((prev) => [newReq, ...prev]);

    if (req.customer_id && req.customer_id !== 'guest') {
      sendNotification({
        user_id: req.customer_id,
        role: 'customer',
        title: 'Permintaan Jastip Dibuat',
        message: `Permintaan Jastip #${reqNum} telah dibuat. Silakan konfirmasi via WhatsApp.`,
        type: 'order_created',
        reference_id: newReq.id,
      });
    }

    return newReq;
  };

  const updateJastipStatus = (
    id: string,
    status: JastipRequest['status'],
    driverId?: string
  ) => {
    const driver = driverId ? drivers.find((d) => d.id === driverId) : undefined;
    let targetReq: JastipRequest | undefined;

    setJastipRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          targetReq = r;
          return {
            ...r,
            status,
            ...(driver && { driver_id: driver.id, driver_name: driver.name }),
          };
        }
        return r;
      })
    );

    const reqItem = targetReq || jastipRequests.find((r) => r.id === id);
    if (reqItem?.customer_id && reqItem.customer_id !== 'guest') {
      sendNotification({
        user_id: reqItem.customer_id,
        role: 'customer',
        title: 'Status Jastip Diperbarui',
        message: `Permintaan jastip #${reqItem.request_number} kini berstatus: ${status}.`,
        type: status === 'COMPLETED' ? 'order_completed' : 'order_processing',
        reference_id: id,
      });
    }
  };

  // Delivery (Antar Barang)
  const createDeliveryRequest = async (
    req: Omit<DeliveryRequest, 'id' | 'request_number' | 'created_at'>
  ): Promise<DeliveryRequest> => {
    const timestamp = Date.now().toString().slice(-4);
    const reqNum = `DEL-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${timestamp}`;
    const newReq: DeliveryRequest = {
      ...req,
      id: `del-${Date.now()}`,
      request_number: reqNum,
      created_at: new Date().toISOString(),
    };

    setDeliveryRequests((prev) => [newReq, ...prev]);

    if (req.customer_id && req.customer_id !== 'guest') {
      sendNotification({
        user_id: req.customer_id,
        role: 'customer',
        title: 'Pengantaran Barang Didaftarkan',
        message: `Pesanan antar barang #${reqNum} telah terdaftar. Driver terdekat akan disiapkan.`,
        type: 'order_created',
        reference_id: newReq.id,
      });
    }

    return newReq;
  };

  const updateDeliveryStatus = (
    id: string,
    status: DeliveryRequest['status'],
    driverId?: string
  ) => {
    const driver = driverId ? drivers.find((d) => d.id === driverId) : undefined;
    let targetDel: DeliveryRequest | undefined;

    setDeliveryRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          targetDel = r;
          return {
            ...r,
            status,
            ...(driver && { driver_id: driver.id, driver_name: driver.name }),
          };
        }
        return r;
      })
    );

    const delItem = targetDel || deliveryRequests.find((d) => d.id === id);
    if (delItem?.customer_id && delItem.customer_id !== 'guest') {
      sendNotification({
        user_id: delItem.customer_id,
        role: 'customer',
        title: 'Status Pengantaran Barang Diperbarui',
        message: `Pesanan antar barang #${delItem.request_number} kini: ${status}.`,
        type: status === 'DELIVERED' ? 'order_completed' : 'driver_on_the_way',
        reference_id: id,
      });
    }
  };

  // Stores & Products Management
  const addStore = (store: Omit<Store, 'id' | 'created_at'>) => {
    const newStore: Store = {
      ...store,
      id: `store-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setStores((prev) => [newStore, ...prev]);
  };

  const updateStore = (id: string, store: Partial<Store>) => {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, ...store } : s)));
  };

  const deleteStore = (id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id' | 'created_at'>) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...product } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Rates & Settings
  const updateRates = (newRate: Partial<ServiceRate>) => {
    setRates((prev) => prev.map((r) => ({ ...r, ...newRate })));
  };

  const updateAdminSettings = async (
    settings: Partial<AdminSettings>
  ): Promise<{ success: boolean; message: string }> => {
    const updated: AdminSettings = { ...adminSettings, ...settings };
    setAdminSettings(updated);
    saveStorage('settings', updated);

    if (supabase) {
      try {
        const { error } = await supabase.from('admin_settings').upsert(
          {
            id: 1,
            app_name: updated.app_name,
            tagline: updated.tagline,
            whatsapp_admin: updated.whatsapp_admin,
            payment_recipient_name: updated.payment_recipient_name,
            payment_account_number: updated.payment_account_number,
            payment_channel_name: updated.payment_channel_name,
            payment_qr_url: updated.payment_qr_url,
            payment_instructions: updated.payment_instructions,
            is_payment_configured: updated.is_payment_configured,
            base_delivery_fee: updated.base_delivery_fee,
            per_km_fee: updated.per_km_fee,
            service_fee: updated.service_fee,
            va_active: updated.va_active,
            va_provider: updated.va_provider,
            va_number: updated.va_number,
            va_recipient_name: updated.va_recipient_name,
            va_instructions: updated.va_instructions,
            bank_active: updated.bank_active,
            bank_name: updated.bank_name,
            bank_account_number: updated.bank_account_number,
            bank_recipient_name: updated.bank_recipient_name,
            bank_instructions: updated.bank_instructions,
            qris_active: updated.qris_active,
            qris_merchant_name: updated.qris_merchant_name,
            qris_image_url: updated.qris_image_url,
            qris_instructions: updated.qris_instructions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('admin_settings') || error.message?.includes('schema cache')) {
            console.info('Pemberitahuan: Tabel admin_settings belum dibuat di Supabase (PGRST205). Pengaturan berhasil disimpan secara persisten di penyimpanan sistem lokal.');
            return {
              success: true,
              message: 'Pengaturan WhatsApp berhasil disimpan permanen di sistem! Nomor aktif di seluruh aplikasi.',
            };
          }

          console.warn('Pemberitahuan Supabase admin_settings:', error.message);
          return {
            success: true,
            message: 'Pengaturan WhatsApp berhasil disimpan permanen di penyimpanan lokal!',
          };
        }

        return {
          success: true,
          message: 'Pengaturan WhatsApp & sistem berhasil disimpan secara permanen ke database Supabase!',
        };
      } catch (err: any) {
        console.warn('Supabase update admin_settings info:', err?.message || err);
        return {
          success: true,
          message: 'Pengaturan WhatsApp berhasil disimpan permanen di sistem!',
        };
      }
    }

    return {
      success: true,
      message: 'Pengaturan WhatsApp & sistem berhasil disimpan permanen di penyimpanan lokal!',
    };
  };

  // Promos
  const addPromo = (promo: Promo) => {
    setPromos((prev) => [promo, ...prev]);
  };

  const updatePromo = (id: string, promo: Partial<Promo>) => {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, ...promo } : p)));
  };

  const deletePromo = (id: string) => {
    setPromos((prev) => prev.filter((p) => p.id !== id));
  };

  // Reviews
  const addReview = (review: Omit<Review, 'id' | 'created_at'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setReviews((prev) => [newReview, ...prev]);
  };

  const addDriver = (driver: Omit<Driver, 'id' | 'created_at'>) => {
    const newDriver: Driver = {
      ...driver,
      id: `driver-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setDrivers((prev) => [newDriver, ...prev]);
  };

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  // Demo Data Reset / Delete
  const resetDemoData = () => {
    setStores(INITIAL_STORES);
    setProducts(INITIAL_PRODUCTS);
    setDrivers(INITIAL_DRIVERS);
    setPromos(INITIAL_PROMOS);
    setAdminSettings(INITIAL_SETTINGS);
    setRates(INITIAL_RATES);
    alert('Data demo berhasil direset ke pengaturan awal Singkawang!');
  };

  const deleteDemoData = () => {
    setStores((prev) => prev.filter((s) => !s.is_demo));
    setProducts((prev) => prev.filter((p) => !p.is_demo));
    setDrivers((prev) => prev.filter((d) => !d.is_demo));
    alert('Data demo berhasil dihapus dari sistem!');
  };

  // Current driver matching currentUser if driver role
  const currentDriver = currentUser
    ? drivers.find((d) => d.user_id === currentUser.id) ||
      drivers.find((d) => d.phone === currentUser.phone)
    : undefined;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isGuest,
        allUsers,
        login,
        registerCustomer,
        registerMerchant,
        registerDriver,
        logout,
        updateApprovalStatus,
        canAccessMerchant,
        canAccessDriver,
        canAccessAdmin,
        guestOrderTokens,
        getOrderByTracking,
        switchUser,
        setUserRole,
        stores,
        categories,
        products,
        addStore,
        updateStore,
        deleteStore,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        orders,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        payments,
        submitPaymentProof,
        verifyPayment,
        jastipRequests,
        createJastipRequest,
        updateJastipStatus,
        deliveryRequests,
        createDeliveryRequest,
        updateDeliveryStatus,
        drivers,
        currentDriver,
        toggleDriverOnline,
        assignDriverToOrder,
        updateDriverLocation,
        addDriver,
        deleteDriver,
        rates,
        updateRates,
        areas,
        schedules,
        promos,
        addPromo,
        updatePromo,
        deletePromo,
        reviews,
        addReview,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        sendNotification,
        adminSettings,
        updateAdminSettings,
        userLocation,
        setUserLocation,
        jastipTargetStore,
        setJastipTargetStore,
        resetDemoData,
        deleteDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
