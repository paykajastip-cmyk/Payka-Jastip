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
  AdminSettings,
  ServiceArea,
  UserRole,
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

interface AppContextType {
  // Current user & authentication
  currentUser: Profile;
  allUsers: Profile[];
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
  markNotificationRead: (id: string) => void;
  adminSettings: AdminSettings;
  updateAdminSettings: (settings: Partial<AdminSettings>) => void;

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
    email: 'admin@paykajastip.com',
    full_name: 'Super Admin Payka',
    phone: '081254321098',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    created_at: '2026-01-01',
  };

  const merchantUser: Profile = {
    id: 'merchant-user-1',
    email: 'haji.aman@paykajastip.com',
    full_name: 'Haji Aman (Merchant Bakmi)',
    phone: '081345678901',
    role: 'merchant',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    created_at: '2026-01-10',
  };

  const driverUser: Profile = {
    id: 'driver-user-1',
    email: 'budi.driver@paykajastip.com',
    full_name: 'Budi Santoso (Driver Payka 01)',
    phone: '081255443322',
    role: 'driver',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    created_at: '2026-01-05',
  };

  const allUsers: Profile[] = [
    adminUser,
    merchantUser,
    driverUser,
    ...INITIAL_CUSTOMERS,
  ];

  // States
  const [currentUser, setCurrentUser] = useState<Profile>(() =>
    loadStorage('user', INITIAL_CUSTOMERS[0])
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

  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadStorage('notifications', [
      {
        id: 'notif-1',
        user_id: 'cust-1',
        title: 'Selamat Datang di PAYKAJASTIP!',
        message: 'Gunakan kode voucher PAYKABARU untuk hemat Rp10.000 pada pesanan pertamamu di Singkawang.',
        type: 'promo',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ])
  );

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
  useEffect(() => saveStorage('user', currentUser), [currentUser]);
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
  useEffect(() => saveStorage('notifications', notifications), [notifications]);

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

  // Switch role or switch user profile
  const switchUser = (user: Profile) => {
    setCurrentUser(user);
  };

  const setUserRole = (role: UserRole) => {
    if (role === 'admin') setCurrentUser(adminUser);
    else if (role === 'merchant') setCurrentUser(merchantUser);
    else if (role === 'driver') setCurrentUser(driverUser);
    else setCurrentUser(INITIAL_CUSTOMERS[0]);
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
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNum,
      customer_id: currentUser.id,
      customer_name: orderData.customer_name || currentUser.full_name,
      customer_phone: orderData.customer_phone || currentUser.phone,
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

    // Add notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: currentUser.id,
        title: 'Pesanan Berhasil Dibuat',
        message: `Pesanan #${newOrder.order_number} berhasil dibuat. Silakan lakukan pembayaran manual.`,
        type: 'order',
        order_id: newOrder.id,
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    note?: string
  ): boolean => {
    let updated = false;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          updated = true;
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
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          user_id: currentUser.id,
          title: 'Status Pesanan Berubah',
          message: `Status pesanan #${orderId} kini: ${status}`,
          type: 'order',
          order_id: orderId,
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
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

    // Notification for admin and customer
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: currentUser.id,
        title: 'Bukti Pembayaran Diterima',
        message: `Bukti transfer Anda telah dikirim dan sedang diverifikasi oleh Admin.`,
        type: 'payment',
        order_id: orderId,
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
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
            verified_by: currentUser.full_name,
            rejection_reason: rejectionReason,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === payment.order_id) {
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

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: payment.order_id,
        title: isApproved ? 'Pembayaran Terverifikasi (PAID)' : 'Pembayaran Ditolak',
        message: isApproved
          ? `Pembayaran untuk order #${payment.order_number} telah disetujui Admin. Toko sedang memproses barang.`
          : `Pembayaran ditolak: ${rejectionReason || 'Bukti transfer tidak sesuai'}.`,
        type: 'payment',
        order_id: payment.order_id,
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
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

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: req.customer_id,
        title: 'Permintaan Jastip Dibuat',
        message: `Permintaan Jastip #${reqNum} telah dibuat. Silakan konfirmasi via WhatsApp.`,
        type: 'order',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return newReq;
  };

  const updateJastipStatus = (
    id: string,
    status: JastipRequest['status'],
    driverId?: string
  ) => {
    const driver = driverId ? drivers.find((d) => d.id === driverId) : undefined;
    setJastipRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              ...(driver && { driver_id: driver.id, driver_name: driver.name }),
            }
          : r
      )
    );
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

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        user_id: req.customer_id,
        title: 'Pengantaran Barang Didaftarkan',
        message: `Pesanan antar barang #${reqNum} telah terdaftar. Driver terdekat akan disiapkan.`,
        type: 'delivery',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    return newReq;
  };

  const updateDeliveryStatus = (
    id: string,
    status: DeliveryRequest['status'],
    driverId?: string
  ) => {
    const driver = driverId ? drivers.find((d) => d.id === driverId) : undefined;
    setDeliveryRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              ...(driver && { driver_id: driver.id, driver_name: driver.name }),
            }
          : r
      )
    );
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

  const updateAdminSettings = (settings: Partial<AdminSettings>) => {
    setAdminSettings((prev) => ({ ...prev, ...settings }));
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

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
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
  const currentDriver = drivers.find((d) => d.user_id === currentUser.id) || drivers[0];

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
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
        markNotificationRead,
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
