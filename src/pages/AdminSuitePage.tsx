import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  Store,
  Package,
  Bike,
  ClipboardList,
  ShoppingBag,
  Truck,
  MapPin,
  Percent,
  CreditCard,
  BarChart3,
  MessageCircle,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Navigation,
  User,
  X,
  Search,
  Filter,
  ExternalLink,
  Eye,
  Download,
  RefreshCw,
  Phone,
  Sparkles,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Copy,
  Database,
  Upload,
  Wallet,
  Building2,
  QrCode,
  ShieldCheck,
  Banknote,
  Layers,
  Compass,
  Image,
  Bot,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Store as StoreType,
  Product,
  Driver,
  Promo,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '../types';
import {
  formatRupiah,
  formatIndoDate,
  formatWhatsAppNumber,
  formatDisplayPhone,
  isValidWhatsAppNumber,
  createWhatsAppUrl,
  calculateDistanceKm,
} from '../utils/helpers';
import { SingkawangMap } from '../components/Map/SingkawangMap';

export const AdminSuitePage: React.FC = () => {
  const {
    currentUser,
    setUserRole,
    switchUser,
    stores,
    addStore,
    updateStore,
    deleteStore,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    drivers,
    toggleDriverOnline,
    addDriver,
    deleteDriver,
    orders,
    updateOrderStatus,
    assignDriverToOrder,
    payments,
    verifyPayment,
    jastipRequests,
    updateJastipStatus,
    deliveryRequests,
    updateDeliveryStatus,
    rates,
    updateRates,
    promos,
    addPromo,
    deletePromo,
    adminSettings,
    updateAdminSettings,
    allUsers,
    resetDemoData,
    deleteDemoData,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Search & Filter States
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeDistrictFilter, setStoreDistrictFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStoreFilter, setProductStoreFilter] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Payment Verification & Proof Modal
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<string | null>(null);

  // Store Management Modals
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    category: 'Makanan',
    store_type: 'umkm' as 'umkm' | 'offline' | 'online' | 'home_business',
    district: 'Singkawang Barat',
    address: 'Jl. Merdeka, Singkawang',
    whatsapp: '081254321098',
    opening_hours: '08.00 - 21.00 WIB',
    description: 'Pusat kuliner dan oleh-oleh khas Singkawang.',
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
    banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    latitude: 0.9056,
    longitude: 108.9868,
  });

  const [editStoreForm, setEditStoreForm] = useState({
    name: '',
    category: 'Makanan',
    store_type: 'umkm' as 'umkm' | 'offline' | 'online' | 'home_business',
    district: 'Singkawang Barat',
    address: 'Jl. Merdeka, Singkawang',
    whatsapp: '081254321098',
    opening_hours: '08.00 - 21.00 WIB',
    description: '',
    logo_url: '',
    banner_url: '',
    latitude: 0.9056,
    longitude: 108.9868,
    is_open: true,
    is_active: true,
  });

  // Product Management Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    store_id: stores[0]?.id || '',
    name: '',
    price: 15000,
    promo_price: 0,
    category: 'Makanan',
    description: '',
    stock: 50,
    weight_grams: 300,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
  });

  const [editProductForm, setEditProductForm] = useState({
    store_id: '',
    name: '',
    price: 15000,
    promo_price: 0,
    category: 'Makanan',
    description: '',
    stock: 50,
    weight_grams: 300,
    is_available: true,
    image_url: '',
  });

  // Driver Management Modal
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriverForm, setNewDriverForm] = useState({
    name: '',
    phone: '081345678901',
    vehicle_plate: 'KB 1234 SKW',
    vehicle_type: 'Motor' as 'Motor' | 'Mobil' | 'Pickup',
  });

  // Assign Driver Modal
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');

  // Admin Map Coordinator & Yellow Draggable Pin State (Perintah 1)
  const [storeSubTab, setStoreSubTab] = useState<'list' | 'map_add'>('list');
  const [selectedDetailStore, setSelectedDetailStore] = useState<StoreType | null>(null);
  const [confirmDeleteStore, setConfirmDeleteStore] = useState<StoreType | null>(null);
  const [storeMapFeedback, setStoreMapFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [selectedMapStoreId, setSelectedMapStoreId] = useState<string>(stores[0]?.id || '');
  const selectedMapStore = useMemo(
    () => stores.find((s) => s.id === selectedMapStoreId) || stores[0],
    [stores, selectedMapStoreId]
  );
  const [tempLat, setTempLat] = useState<number>(selectedMapStore ? selectedMapStore.latitude : 0.9056);
  const [tempLng, setTempLng] = useState<number>(selectedMapStore ? selectedMapStore.longitude : 108.9868);

  // Logo & Branding Settings states (Perintah 3)
  const [logoSaveLoading, setLogoSaveLoading] = useState(false);
  const [logoSaveFeedback, setLogoSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const faviconFileInputRef = useRef<HTMLInputElement | null>(null);

  // COD Settings states (Perintah 4)
  const [codSaveLoading, setCodSaveLoading] = useState(false);
  const [codSaveFeedback, setCodSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto Driver Dispatch states (Perintah 5)
  const [dispatchSaveLoading, setDispatchSaveLoading] = useState(false);
  const [dispatchSaveFeedback, setDispatchSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Settings form states
  const [settingsForm, setSettingsForm] = useState(adminSettings);

  // Sync settingsForm whenever adminSettings is updated or reloaded
  useEffect(() => {
    setSettingsForm(adminSettings);
  }, [adminSettings]);

  // WhatsApp Tab state & notification
  const [waSaveLoading, setWaSaveLoading] = useState(false);
  const [waSaveFeedback, setWaSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSaveWhatsApp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setWaSaveFeedback(null);

    const raw = (settingsForm.whatsapp_admin || '').trim();
    if (!raw) {
      setWaSaveFeedback({
        type: 'error',
        message: 'Nomor WhatsApp Admin wajib diisi.',
      });
      return;
    }

    if (!isValidWhatsAppNumber(raw)) {
      setWaSaveFeedback({
        type: 'error',
        message:
          'Format nomor WhatsApp tidak valid. Masukkan nomor dengan format 08... atau 628... (minimal 9 digit angka).',
      });
      return;
    }

    const clean = raw.replace(/[^0-9]/g, '');
    const normalized = clean.startsWith('62')
      ? '0' + clean.slice(2)
      : clean.startsWith('0')
      ? clean
      : '0' + clean;

    setWaSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        ...settingsForm,
        whatsapp_admin: normalized,
      });
      setSettingsForm((prev) => ({ ...prev, whatsapp_admin: normalized }));
      setWaSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setWaSaveFeedback({
        type: 'error',
        message: `Terjadi kesalahan saat menyimpan: ${err?.message || 'Error'}`,
      });
    } finally {
      setWaSaveLoading(false);
    }
  };

  // Section-specific payment states & feedbacks
  const [bankSaveLoading, setBankSaveLoading] = useState(false);
  const [bankSaveFeedback, setBankSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [vaSaveLoading, setVaSaveLoading] = useState(false);
  const [vaSaveFeedback, setVaSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [danaSaveLoading, setDanaSaveLoading] = useState(false);
  const [danaSaveFeedback, setDanaSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [qrisSaveLoading, setQrisSaveLoading] = useState(false);
  const [qrisSaveFeedback, setQrisSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [ratesSaveLoading, setRatesSaveLoading] = useState(false);
  const [ratesSaveFeedback, setRatesSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const qrisFileInputRef = useRef<HTMLInputElement>(null);

  // A. Save Bank Settings Handler
  const handleSaveBank = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBankSaveFeedback(null);
    if (!settingsForm.bank_name?.trim()) {
      setBankSaveFeedback({ type: 'error', message: 'Nama bank wajib diisi.' });
      return;
    }
    if (!settingsForm.bank_account_number?.trim()) {
      setBankSaveFeedback({ type: 'error', message: 'Nomor rekening bank wajib diisi.' });
      return;
    }
    if (!settingsForm.bank_recipient_name?.trim()) {
      setBankSaveFeedback({ type: 'error', message: 'Nama pemilik rekening wajib diisi.' });
      return;
    }

    setBankSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        bank_active: settingsForm.bank_active,
        bank_name: settingsForm.bank_name.trim(),
        bank_account_number: settingsForm.bank_account_number.trim(),
        bank_recipient_name: settingsForm.bank_recipient_name.trim(),
        bank_instructions: settingsForm.bank_instructions || '',
        payment_account_number: settingsForm.bank_account_number.trim(),
        payment_recipient_name: settingsForm.bank_recipient_name.trim(),
      });
      setBankSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setBankSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan pengaturan bank: ${err?.message || 'Error'}`,
      });
    } finally {
      setBankSaveLoading(false);
    }
  };

  // B. Save Virtual Account Settings Handler
  const handleSaveVA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVaSaveFeedback(null);
    if (!settingsForm.va_provider?.trim()) {
      setVaSaveFeedback({ type: 'error', message: 'Nama penyedia Virtual Account wajib diisi.' });
      return;
    }
    if (!settingsForm.va_number?.trim()) {
      setVaSaveFeedback({ type: 'error', message: 'Nomor Virtual Account wajib diisi.' });
      return;
    }
    if (!settingsForm.va_recipient_name?.trim()) {
      setVaSaveFeedback({ type: 'error', message: 'Nama penerima Virtual Account wajib diisi.' });
      return;
    }

    setVaSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        va_active: settingsForm.va_active,
        va_provider: settingsForm.va_provider.trim(),
        va_number: settingsForm.va_number.trim(),
        va_recipient_name: settingsForm.va_recipient_name.trim(),
        va_instructions: settingsForm.va_instructions || '',
      });
      setVaSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setVaSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan Virtual Account: ${err?.message || 'Error'}`,
      });
    } finally {
      setVaSaveLoading(false);
    }
  };

  // C. Save DANA Settings Handler
  const handleSaveDana = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDanaSaveFeedback(null);
    if (!settingsForm.dana_number?.trim()) {
      setDanaSaveFeedback({ type: 'error', message: 'Nomor akun DANA wajib diisi.' });
      return;
    }
    if (!settingsForm.dana_recipient_name?.trim()) {
      setDanaSaveFeedback({ type: 'error', message: 'Nama pemilik akun DANA wajib diisi.' });
      return;
    }

    setDanaSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        dana_active: settingsForm.dana_active,
        dana_number: settingsForm.dana_number.trim(),
        dana_recipient_name: settingsForm.dana_recipient_name.trim(),
        dana_instructions: settingsForm.dana_instructions || '',
      });
      setDanaSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setDanaSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan akun DANA: ${err?.message || 'Error'}`,
      });
    } finally {
      setDanaSaveLoading(false);
    }
  };

  // D. Save QRIS Settings Handler
  const handleSaveQris = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setQrisSaveFeedback(null);
    setQrisSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        qris_active: settingsForm.qris_active,
        qris_merchant_name: settingsForm.qris_merchant_name?.trim() || '',
        qris_image_url: settingsForm.qris_image_url?.trim() || '',
        payment_qr_url: settingsForm.qris_image_url?.trim() || '',
        qris_instructions: settingsForm.qris_instructions || '',
      });
      setQrisSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setQrisSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan QRIS: ${err?.message || 'Error'}`,
      });
    } finally {
      setQrisSaveLoading(false);
    }
  };

  // QRIS File Upload Handler
  const handleQrisFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setQrisSaveFeedback({
        type: 'error',
        message: 'File yang dipilih harus berupa file gambar (JPG, JPEG, PNG, atau WebP).',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSettingsForm((prev) => ({
          ...prev,
          qris_image_url: ev.target!.result as string,
        }));
        setQrisSaveFeedback({
          type: 'success',
          message: 'Gambar QRIS berhasil dimuat! Klik tombol "Simpan Pengaturan QRIS" di bawah untuk menyimpan.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // F. Save COD Payment Settings (Perintah 4)
  const handleSaveCOD = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCodSaveFeedback(null);
    setCodSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        cod_active: settingsForm.cod_active,
        cod_instructions: settingsForm.cod_instructions || '',
      });
      setCodSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setCodSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan pengaturan COD: ${err?.message || 'Error'}`,
      });
    } finally {
      setCodSaveLoading(false);
    }
  };

  // G. Save Logo & Branding Settings (Perintah 3)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoSaveFeedback({
        type: 'error',
        message: 'File logo harus berupa gambar (PNG, JPG, SVG, WebP).',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSettingsForm((prev) => ({
          ...prev,
          app_logo_url: ev.target!.result as string,
        }));
        setLogoSaveFeedback({
          type: 'success',
          message: 'Logo aplikasi berhasil dimuat ke form! Klik tombol "Simpan Pengaturan Logo" untuk menerapkan.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoSaveFeedback({
        type: 'error',
        message: 'File favicon harus berupa gambar (ICO, PNG, SVG).',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSettingsForm((prev) => ({
          ...prev,
          web_logo_url: ev.target!.result as string,
        }));
        setLogoSaveFeedback({
          type: 'success',
          message: 'Logo website/favicon berhasil dimuat ke form! Klik tombol "Simpan Pengaturan Logo" untuk menerapkan.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLogoSaveFeedback(null);
    setLogoSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        app_logo_url: settingsForm.app_logo_url?.trim() || '',
        web_logo_url: settingsForm.web_logo_url?.trim() || '',
      });
      setLogoSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setLogoSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan pengaturan logo: ${err?.message || 'Error'}`,
      });
    } finally {
      setLogoSaveLoading(false);
    }
  };

  const handleResetLogoSettings = async () => {
    setSettingsForm((prev) => ({
      ...prev,
      app_logo_url: '',
      web_logo_url: '',
    }));
    await updateAdminSettings({
      app_logo_url: '',
      web_logo_url: '',
    });
    setLogoSaveFeedback({
      type: 'success',
      message: 'Logo aplikasi & website berhasil direset ke logo default!',
    });
  };

  // H. Save Auto Driver Dispatch Settings (Perintah 5)
  const handleSaveDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDispatchSaveFeedback(null);
    setDispatchSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        auto_assign_driver: settingsForm.auto_assign_driver,
      });
      setDispatchSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setDispatchSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan pengaturan dispatch driver: ${err?.message || 'Error'}`,
      });
    } finally {
      setDispatchSaveLoading(false);
    }
  };

  // E. Save Rates & System Config Handler
  const handleSaveRatesAndSystem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRatesSaveFeedback(null);
    setRatesSaveLoading(true);
    try {
      const res = await updateAdminSettings({
        base_delivery_fee: Number(settingsForm.base_delivery_fee) || 10000,
        per_km_fee: Number(settingsForm.per_km_fee) || 3000,
        service_fee: Number(settingsForm.service_fee) || 2000,
        app_name: settingsForm.app_name || 'PAYKAJASTIP',
        tagline: settingsForm.tagline || '',
      });
      setRatesSaveFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setRatesSaveFeedback({
        type: 'error',
        message: `Gagal menyimpan tarif sistem: ${err?.message || 'Error'}`,
      });
    } finally {
      setRatesSaveLoading(false);
    }
  };

  // Promo form state
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoVal, setNewPromoVal] = useState<number>(10000);
  const [newPromoMin, setNewPromoMin] = useState<number>(30000);

  // Rate simulator state
  const [calcDist, setCalcDist] = useState<number>(4);

  // Overall KPIs calculation
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0),
    [orders]
  );

  const pendingPayments = useMemo(
    () => payments.filter((p) => p.payment_status === 'waiting_confirmation'),
    [payments]
  );

  const activeDriversCount = useMemo(() => drivers.filter((d) => d.is_online).length, [drivers]);
  const activeStoresCount = useMemo(() => stores.filter((s) => s.is_active).length, [stores]);

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: pendingPayments.length > 0 ? pendingPayments.length : null,
    },
    { id: 'orders', label: 'Orders', icon: ClipboardList, badge: orders.filter(o => o.status === 'MENUNGGU KONFIRMASI').length || null },
    { id: 'stores', label: 'Manajemen Toko', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'maps', label: 'Peta Toko (Titik Kuning)', icon: MapPin },
    { id: 'drivers', label: 'Drivers', icon: Bike },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'jastip', label: 'Jastip', icon: ShoppingBag },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'rates', label: 'Rates & Tarif', icon: Percent },
    { id: 'promos', label: 'Promo Vouchers', icon: Sparkles },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filtering orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.order_number.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.store_name.toLowerCase().includes(orderSearchQuery.toLowerCase());

      const matchStatus =
        orderStatusFilter === 'all'
          ? true
          : o.status.toLowerCase().replace(/\s+/g, '_') === orderStatusFilter.toLowerCase() ||
            o.status === orderStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // Filtering payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (paymentFilter === 'all') return true;
      return p.payment_status === paymentFilter;
    });
  }, [payments, paymentFilter]);

  // Filtering stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(storeSearchQuery.toLowerCase());
      const matchDistrict = storeDistrictFilter === 'all' || s.district === storeDistrictFilter;
      return matchSearch && matchDistrict;
    });
  }, [stores, storeSearchQuery, storeDistrictFilter]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearchQuery.toLowerCase());
      const matchStore = productStoreFilter === 'all' || p.store_id === productStoreFilter;
      return matchSearch && matchStore;
    });
  }, [products, productSearchQuery, productStoreFilter]);

  // Filtering users
  const filteredUsers = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.phone.includes(userSearchQuery)
    );
  }, [allUsers, userSearchQuery]);

  // Handle adding store
  const handleSaveNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreForm.name.trim()) return;
    addStore({
      merchant_id: 'merchant-admin',
      name: newStoreForm.name,
      slug: newStoreForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      logo_url: newStoreForm.logo_url,
      banner_url: newStoreForm.banner_url,
      category: newStoreForm.category,
      description: newStoreForm.description,
      address: newStoreForm.address,
      latitude: newStoreForm.latitude,
      longitude: newStoreForm.longitude,
      district: newStoreForm.district,
      whatsapp: newStoreForm.whatsapp,
      opening_hours: newStoreForm.opening_hours,
      is_open: true,
      rating: 5.0,
      review_count: 0,
      store_type: newStoreForm.store_type,
      location_status: 'verified',
      is_active: true,
    });
    setShowAddStoreModal(false);
  };

  // Handle opening store edit modal
  const handleOpenEditStore = (st: StoreType) => {
    setEditingStore(st);
    setEditStoreForm({
      name: st.name,
      category: st.category,
      store_type: st.store_type || 'umkm',
      district: st.district,
      address: st.address,
      whatsapp: st.whatsapp,
      opening_hours: st.opening_hours,
      description: st.description || '',
      logo_url: st.logo_url || '',
      banner_url: st.banner_url || '',
      latitude: st.latitude,
      longitude: st.longitude,
      is_open: st.is_open,
      is_active: st.is_active,
    });
  };

  // Handle saving store edit
  const handleSaveEditStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore || !editStoreForm.name.trim()) return;
    updateStore(editingStore.id, {
      name: editStoreForm.name,
      slug: editStoreForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category: editStoreForm.category,
      store_type: editStoreForm.store_type,
      district: editStoreForm.district,
      address: editStoreForm.address,
      whatsapp: editStoreForm.whatsapp,
      opening_hours: editStoreForm.opening_hours,
      description: editStoreForm.description,
      logo_url: editStoreForm.logo_url,
      banner_url: editStoreForm.banner_url,
      latitude: Number(editStoreForm.latitude),
      longitude: Number(editStoreForm.longitude),
      is_open: editStoreForm.is_open,
      is_active: editStoreForm.is_active,
    });
    setEditingStore(null);
  };

  // Handle adding product
  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.store_id) return;
    addProduct({
      store_id: newProductForm.store_id,
      name: newProductForm.name,
      price: Number(newProductForm.price),
      promo_price: Number(newProductForm.promo_price) || undefined,
      category: newProductForm.category,
      description: newProductForm.description,
      stock: Number(newProductForm.stock),
      weight_gram: Number(newProductForm.weight_grams),
      is_available: newProductForm.is_available,
      image_url: newProductForm.image_url,
    });
    setShowAddProductModal(false);
  };

  // Handle opening product edit modal
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProductForm({
      store_id: p.store_id,
      name: p.name,
      price: p.price,
      promo_price: p.promo_price || 0,
      category: p.category,
      description: p.description || '',
      stock: p.stock,
      weight_grams: p.weight_gram || 300,
      is_available: p.is_available,
      image_url: p.image_url,
    });
  };

  // Handle saving product edit
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProductForm.name.trim()) return;
    updateProduct(editingProduct.id, {
      store_id: editProductForm.store_id,
      name: editProductForm.name,
      price: Number(editProductForm.price),
      promo_price: Number(editProductForm.promo_price) || undefined,
      category: editProductForm.category,
      description: editProductForm.description,
      stock: Number(editProductForm.stock),
      weight_gram: Number(editProductForm.weight_grams),
      is_available: editProductForm.is_available,
      image_url: editProductForm.image_url,
    });
    setEditingProduct(null);
  };

  // Handle adding driver
  const handleSaveNewDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverForm.name.trim()) return;
    addDriver({
      user_id: `user-driver-${Date.now()}`,
      name: newDriverForm.name,
      phone: newDriverForm.phone,
      vehicle_type: newDriverForm.vehicle_type,
      vehicle_plate: newDriverForm.vehicle_plate,
      is_online: true,
      is_active: true,
      current_lat: 0.9056,
      current_lng: 108.9868,
      rating: 5.0,
      total_deliveries: 0,
    });
    setShowAddDriverModal(false);
  };

  // Handle assigning driver
  const handleConfirmAssignDriver = () => {
    if (!assigningOrder || !selectedDriverId) return;
    assignDriverToOrder(assigningOrder, selectedDriverId);
    setAssigningOrder(null);
  };

  // Handle save map coordinates
  const handleSaveCoordinates = () => {
    if (!selectedMapStore) return;
    updateStore(selectedMapStore.id, {
      latitude: tempLat,
      longitude: tempLng,
    });
    alert(`Koordinat ${selectedMapStore.name} berhasil disimpan ke [${tempLat.toFixed(5)}, ${tempLng.toFixed(5)}]!`);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Admin Title Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          {adminSettings.app_logo_url ? (
            <img
              src={adminSettings.app_logo_url}
              alt={adminSettings.app_name || 'Logo'}
              className="w-12 h-12 rounded-2xl object-cover bg-white p-1 border border-slate-700 shadow-lg shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
              <Shield className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">Super Admin PAYKAJASTIP</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PROD v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pusat kendali database, transaksi, maps, toko, kurir &amp; jastip Singkawang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => setShowSwitchModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 text-xs font-bold border border-slate-700 transition active:scale-95 shadow-xs"
            title="Ganti Mode Akun / Role"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>

          <button
            type="button"
            onClick={resetDemoData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition active:scale-95 shadow-xs"
            title="Reset ke pengaturan awal demo Singkawang"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Admin Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {navMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeAdminTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: DASHBOARD / OVERVIEW
      ========================================================================= */}
      {activeAdminTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Urgent Attention Alert: Pending Payments */}
          {pendingPayments.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-3xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0 animate-bounce" />
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide">
                    {pendingPayments.length} Pembayaran Menunggu Konfirmasi!
                  </h3>
                  <p className="text-[11px] text-amber-100">
                    Pelanggan telah mengunggah bukti transfer manual. Verifikasi sekarang agar pesanan dapat diproses toko.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAdminTab('payments')}
                className="px-3.5 py-1.5 rounded-xl bg-white text-amber-900 text-xs font-black shadow-xs hover:bg-amber-50 shrink-0"
              >
                Periksa
              </button>
            </div>
          )}

          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Omset</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-lg font-black text-slate-900 block truncate">
                {formatRupiah(totalRevenue)}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                +18.4% bulan ini
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pesanan</span>
                <ClipboardList className="w-4 h-4 text-sky-500" />
              </div>
              <span className="text-lg font-black text-slate-900 block">{orders.length}</span>
              <span className="text-[10px] text-sky-600 font-bold mt-1 block">
                {orders.filter((o) => o.status === 'SELESAI').length} pesanan selesai
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Toko Aktif</span>
                <Store className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-lg font-black text-slate-900 block">{activeStoresCount} Toko</span>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                {stores.length} total terdaftar
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Driver Online</span>
                <Bike className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-lg font-black text-slate-900 block">{activeDriversCount} Driver</span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                Siap ambil order
              </span>
            </div>
          </div>

          {/* System Status & Operational District Pills */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Status Operasional Area Singkawang &amp; Bengkayang</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Semua Jalur Aktif
              </span>
            </h3>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                'Singkawang Barat',
                'Singkawang Tengah',
                'Singkawang Timur',
                'Singkawang Utara',
                'Singkawang Selatan',
                'Singkawang Kota',
                'Bengkayang (Jadwal 06.00 & 16.00)',
              ].map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 text-[11px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{area}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pesanan Terbaru Masuk
              </h3>
              <button
                onClick={() => setActiveAdminTab('orders')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {orders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-slate-600 block">#{ord.order_number}</span>
                    <span className="text-slate-800 font-semibold truncate block">
                      {ord.customer_name} • {ord.store_name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-sky-700 block">{formatRupiah(ord.total_amount)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border text-slate-700">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PAYMENTS (MANUAL VERIFICATION)
      ========================================================================= */}
      {activeAdminTab === 'payments' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Verifikasi Pembayaran Manual ({filteredPayments.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Cek mutasi transfer BCA, BRI, Mandiri &amp; QRIS pelanggan secara manual.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'waiting_confirmation', label: 'Menunggu' },
                { id: 'paid', label: 'Lunas (Paid)' },
                { id: 'failed', label: 'Ditolak' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPaymentFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs whitespace-nowrap ${
                    paymentFilter === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Tidak ada data pembayaran pada kategori ini.
            </div>
          ) : (
            filteredPayments.map((pay) => (
              <div
                key={pay.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      #{pay.order_number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatIndoDate(pay.created_at)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pay.payment_status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pay.payment_status === 'waiting_confirmation'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : pay.payment_status === 'failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {pay.payment_status === 'waiting_confirmation'
                      ? 'MENUNGGU VERIFIKASI'
                      : pay.payment_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Jumlah Tagihan:</span>
                    <span className="text-xl font-black text-sky-600">
                      {formatRupiah(pay.amount)}
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      Metode Transfer: <strong className="text-slate-800">{pay.payment_method}</strong>
                    </p>
                    {pay.rejection_reason && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 bg-rose-50 p-2 rounded-xl">
                        Alasan Ditolak: {pay.rejection_reason}
                      </p>
                    )}
                    {pay.verified_by && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                        Diverifikasi oleh: {pay.verified_by}
                      </p>
                    )}
                  </div>

                  {/* Proof Screenshot */}
                  {pay.proof_url && (
                    <div className="shrink-0 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentProof(pay.proof_url || null)}
                        className="block w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:scale-105 transition relative group"
                        title="Klik untuk perbesar bukti transfer"
                      >
                        <img
                          src={pay.proof_url}
                          alt="Bukti Transfer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </button>
                      <span className="text-[10px] text-sky-600 font-bold mt-1">Lihat Bukti Foto</span>
                    </div>
                  )}
                </div>

                {/* Admin Approval Actions */}
                {pay.payment_status === 'waiting_confirmation' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalId(pay.id)}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                    >
                      Tolak Bukti
                    </button>

                    <button
                      type="button"
                      onClick={() => verifyPayment(pay.id, true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>KONFIRMASI LUNAS (PAID)</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: ORDERS MANAGEMENT
      ========================================================================= */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Manajemen Pesanan ({filteredOrders.length})
            </h3>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor pesanan, pemesan, atau toko..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="all">Semua Status</option>
                <option value="MENUNGGU KONFIRMASI">Menunggu Konfirmasi</option>
                <option value="TOKO MENERIMA">Toko Menerima</option>
                <option value="MENUNGGU DRIVER">Menunggu Driver</option>
                <option value="DRIVER MENUJU LOKASI">Driver Menuju Lokasi</option>
                <option value="BARANG DIAMBIL">Barang Diambil</option>
                <option value="DRIVER MENUJU CUSTOMER">Driver Menuju Customer</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                Tidak ada pesanan ditemukan.
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 text-xs shadow-2xs"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">#{ord.order_number}</span>
                      <span className="text-[10px] text-slate-400">{formatIndoDate(ord.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          updateOrderStatus(ord.id, e.target.value as OrderStatus, 'Diubah oleh Admin')
                        }
                        className="text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                      >
                        <option value="MENUNGGU KONFIRMASI">MENUNGGU KONFIRMASI</option>
                        <option value="TOKO MENERIMA">TOKO MENERIMA</option>
                        <option value="MENUNGGU DRIVER">MENUNGGU DRIVER</option>
                        <option value="DRIVER MENUJU LOKASI">DRIVER MENUJU LOKASI</option>
                        <option value="BARANG DIAMBIL">BARANG DIAMBIL</option>
                        <option value="DRIVER MENUJU CUSTOMER">DRIVER MENUJU CUSTOMER</option>
                        <option value="SELESAI">SELESAI</option>
                        <option value="DIBATALKAN">DIBATALKAN</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Toko / Merchant:</span>
                      <strong className="text-slate-800 text-xs">{ord.store_name}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block">Customer:</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800">{ord.customer_name}</strong>
                        <a
                          href={createWhatsAppUrl(ord.customer_phone, `Halo Kak ${ord.customer_name}, kami dari Admin PAYKAJASTIP terkait pesanan #${ord.order_number}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Rincian Produk ({ord.items ? ord.items.length : 0} item):
                    </span>
                    {(ord.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-700">
                        <span>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-slate-200/60 text-[11px] space-y-0.5 text-slate-500">
                      <div className="flex justify-between">
                        <span>Ongkos Kirim:</span>
                        <span>{formatRupiah(ord.delivery_fee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Layanan:</span>
                        <span>{formatRupiah(ord.service_fee)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Alamat Pengantaran:</span>
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-1">
                        {ord.delivery_address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Driver Assigned */}
                      {ord.driver_name ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-emerald-200">
                          <Bike className="w-3.5 h-3.5" />
                          <span>Kurir: {ord.driver_name}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAssigningOrder(ord.id)}
                          className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 hover:bg-sky-200 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tugaskan Kurir</span>
                        </button>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total:</span>
                        <strong className="text-sky-600 text-sm font-extrabold">
                          {formatRupiah(ord.total_amount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MANAJEMEN TOKO & PETA ADMIN (TITIK PENANDA KUNING - PERINTAH 1)
      ========================================================================= */}
      {activeAdminTab === 'stores' && (
        <div className="space-y-4">
          {/* Sub-Tabs Switcher for Stores */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setStoreSubTab('list')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  storeSubTab === 'list'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Daftar &amp; Katalog Toko ({filteredStores.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStoreSubTab('map_add')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  storeSubTab === 'map_add'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-300'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white"></span>
                <span>Peta Interaktif &amp; Tambah Toko (Titik Kuning)</span>
              </button>
            </div>

            {storeSubTab === 'list' && (
              <button
                type="button"
                onClick={() => setStoreSubTab('map_add')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Toko via Titik Kuning</span>
              </button>
            )}
          </div>

          {/* Feedback banner for store map action */}
          {storeMapFeedback && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                storeMapFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {storeMapFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{storeMapFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setStoreMapFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ===================================================================
              SUB-TAB 1: PETA INTERAKTIF & TAMBAH TOKO LANGSUNG (TITIK KUNING)
          =================================================================== */}
          {storeSubTab === 'map_add' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-md space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
                    📍
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    Penambahan &amp; Pengelolaan Toko Langsung pada Peta (Titik Kuning)
                  </h3>
                </div>
                <p className="text-xs text-slate-900 font-medium leading-relaxed max-w-3xl">
                  Ketuk lokasi yang diinginkan pada peta atau geser penanda kuning untuk menentukan posisi merchant secara akurat di Kota Singkawang.
                  Koordinat latitude &amp; longitude akan tersinkronisasi otomatis sebelum Anda menyimpan toko.
                </p>
              </div>

              {/* Coordinates Bar & Mode Selector */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 font-mono text-xs text-slate-700 flex-wrap">
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <span>TITIK KUNING TERKINI:</span>
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-xl">
                      Lat: <strong>{tempLat.toFixed(6)}</strong>
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-xl">
                      Lng: <strong>{tempLng.toFixed(6)}</strong>
                    </span>
                  </div>

                  {/* Move marker to existing store coordinates */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">Atur Toko Lain:</span>
                    <select
                      value={selectedMapStoreId}
                      onChange={(e) => {
                        setSelectedMapStoreId(e.target.value);
                        const st = stores.find((s) => s.id === e.target.value);
                        if (st) {
                          setTempLat(st.latitude);
                          setTempLng(st.longitude);
                          setNewStoreForm((prev) => ({
                            ...prev,
                            address: st.address,
                            district: st.district,
                            latitude: st.latitude,
                            longitude: st.longitude,
                          }));
                        }
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white"
                    >
                      {stores.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.district})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedMapStore) return;
                        updateStore(selectedMapStore.id, {
                          latitude: tempLat,
                          longitude: tempLng,
                        });
                        setStoreMapFeedback({
                          type: 'success',
                          message: `Koordinat ${selectedMapStore.name} berhasil diperbarui ke [${tempLat.toFixed(5)}, ${tempLng.toFixed(5)}]!`,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
                    >
                      Update Koordinat Toko Ini
                    </button>
                  </div>
                </div>

                {/* Leaflet Map with Admin Draggable Marker */}
                <div className="h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                  <SingkawangMap
                    adminMode={true}
                    initialLat={tempLat}
                    initialLng={tempLng}
                    onCoordinateChange={(lat, lng) => {
                      setTempLat(lat);
                      setTempLng(lng);
                      setNewStoreForm((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Form Tambah Toko Baru (Persisten ke Database) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Formulir Tambah Toko Baru dari Titik Peta
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Data toko akan tersimpan ke database utama dan langsung aktif pada katalog &amp; jastip.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newStoreForm.name.trim() || !newStoreForm.address.trim()) {
                      alert('Nama toko dan alamat lengkap wajib diisi.');
                      return;
                    }
                    addStore({
                      merchant_id: 'merchant-admin',
                      name: newStoreForm.name.trim(),
                      slug: newStoreForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                      logo_url:
                        newStoreForm.logo_url ||
                        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
                      banner_url:
                        newStoreForm.banner_url ||
                        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
                      category: newStoreForm.category,
                      description: newStoreForm.description || '',
                      address: newStoreForm.address.trim(),
                      latitude: tempLat,
                      longitude: tempLng,
                      district: newStoreForm.district,
                      whatsapp: newStoreForm.whatsapp.trim(),
                      opening_hours: newStoreForm.opening_hours || '08.00 - 21.00 WIB',
                      is_open: true,
                      rating: 5.0,
                      review_count: 0,
                      store_type: newStoreForm.store_type,
                      location_status: 'verified',
                      is_active: true,
                    });
                    setStoreMapFeedback({
                      type: 'success',
                      message: `Toko "${newStoreForm.name}" berhasil ditambahkan ke database dengan koordinat [${tempLat.toFixed(5)}, ${tempLng.toFixed(5)}]!`,
                    });
                    setNewStoreForm({
                      name: '',
                      category: 'Makanan',
                      store_type: 'umkm',
                      district: 'Singkawang Barat',
                      address: '',
                      whatsapp: '081254321098',
                      opening_hours: '08.00 - 21.00 WIB',
                      description: '',
                      logo_url: '',
                      banner_url: '',
                      latitude: tempLat,
                      longitude: tempLng,
                    });
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nama Toko / Merchant *:
                      </label>
                      <input
                        type="text"
                        required
                        value={newStoreForm.name}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, name: e.target.value })
                        }
                        placeholder="Contoh: Choipan Thien Thien"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Kategori Toko *:
                      </label>
                      <select
                        value={newStoreForm.category}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, category: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="Makanan">Makanan</option>
                        <option value="Minuman">Minuman</option>
                        <option value="Oleh-oleh">Oleh-oleh Khas Singkawang</option>
                        <option value="UMKM">UMKM &amp; Home Industry</option>
                        <option value="Sembako">Sembako &amp; Pasar Tradisional</option>
                        <option value="Fashion">Fashion &amp; Aksesoris</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Kecamatan di Singkawang *:
                      </label>
                      <select
                        value={newStoreForm.district}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, district: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="Singkawang Barat">Singkawang Barat</option>
                        <option value="Singkawang Tengah">Singkawang Tengah</option>
                        <option value="Singkawang Timur">Singkawang Timur</option>
                        <option value="Singkawang Utara">Singkawang Utara</option>
                        <option value="Singkawang Selatan">Singkawang Selatan</option>
                        <option value="Bengkayang">Bengkayang</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Alamat Lengkap Toko *:
                      </label>
                      <input
                        type="text"
                        required
                        value={newStoreForm.address}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, address: e.target.value })
                        }
                        placeholder="Jl. Merdeka No. 12, Melayu, Singkawang"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Readonly Latitude & Longitude from Yellow Pin */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200 font-mono">
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        Latitude (Otomatis dari Titik Kuning):
                      </label>
                      <input
                        type="number"
                        step="any"
                        readOnly
                        value={tempLat}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white font-bold text-amber-950"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                        Longitude (Otomatis dari Titik Kuning):
                      </label>
                      <input
                        type="number"
                        step="any"
                        readOnly
                        value={tempLng}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white font-bold text-amber-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        No WhatsApp Toko *:
                      </label>
                      <input
                        type="text"
                        required
                        value={newStoreForm.whatsapp}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, whatsapp: e.target.value })
                        }
                        placeholder="081254321098"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Jam Operasional Toko:
                      </label>
                      <input
                        type="text"
                        value={newStoreForm.opening_hours}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, opening_hours: e.target.value })
                        }
                        placeholder="08.00 - 21.00 WIB"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        URL Foto / Logo Toko (Opsional):
                      </label>
                      <input
                        type="text"
                        value={newStoreForm.logo_url}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, logo_url: e.target.value })
                        }
                        placeholder="https://.../logo.jpg"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        URL Banner Toko (Opsional):
                      </label>
                      <input
                        type="text"
                        value={newStoreForm.banner_url}
                        onChange={(e) =>
                          setNewStoreForm({ ...newStoreForm, banner_url: e.target.value })
                        }
                        placeholder="https://.../banner.jpg"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Deskripsi Toko (Opsional):
                    </label>
                    <textarea
                      rows={2}
                      value={newStoreForm.description}
                      onChange={(e) =>
                        setNewStoreForm({ ...newStoreForm, description: e.target.value })
                      }
                      placeholder="Pusat oleh-oleh dan kuliner khas Singkawang..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>SIMPAN TOKO BARU KE DATABASE</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ===================================================================
              SUB-TAB 2: DAFTAR & KATALOG TOKO LENGKAP
          =================================================================== */}
          {storeSubTab === 'list' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Katalog Toko Terdaftar ({filteredStores.length})
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Cari toko atau alamat..."
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />

                  <select
                    value={storeDistrictFilter}
                    onChange={(e) => setStoreDistrictFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="all">Semua Kecamatan</option>
                    <option value="Singkawang Barat">Singkawang Barat</option>
                    <option value="Singkawang Tengah">Singkawang Tengah</option>
                    <option value="Singkawang Timur">Singkawang Timur</option>
                    <option value="Singkawang Utara">Singkawang Utara</option>
                    <option value="Singkawang Selatan">Singkawang Selatan</option>
                    <option value="Bengkayang">Bengkayang</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredStores.map((st) => {
                  const storeProductsCount = products.filter((p) => p.store_id === st.id).length;
                  return (
                    <div
                      key={st.id}
                      className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={st.logo_url}
                          alt={st.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-slate-900 text-sm font-bold truncate">
                              {st.name}
                            </strong>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {st.category}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {storeProductsCount} Produk
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                st.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {st.is_active ? 'AKTIF' : 'NONAKTIF'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                            {st.address} • {st.district}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Buka: {st.opening_hours} • WA: {st.whatsapp} • [{st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                        {/* Detail Toko */}
                        <button
                          type="button"
                          onClick={() => setSelectedDetailStore(st)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                          title="Lihat detail lengkap toko"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>Detail</span>
                        </button>

                        {/* Edit Toko */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditStore(st)}
                          className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-[10px] font-bold flex items-center gap-1 border border-amber-200 transition active:scale-95 cursor-pointer"
                          title="Edit katalog dan data toko"
                        >
                          <Edit2 className="w-3 h-3 text-amber-600" />
                          <span>Edit</span>
                        </button>

                        {/* Quick View Products in Catalog */}
                        <button
                          type="button"
                          onClick={() => {
                            setProductStoreFilter(st.id);
                            setActiveAdminTab('products');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-[10px] font-bold flex items-center gap-1 border border-indigo-200 transition active:scale-95 cursor-pointer"
                          title="Lihat produk toko ini"
                        >
                          <Package className="w-3 h-3 text-indigo-600" />
                          <span>Produk ({storeProductsCount})</span>
                        </button>

                        {/* Atur Titik di Peta (Mengarahkan titik kuning ke koordinat toko) */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMapStoreId(st.id);
                            setTempLat(st.latitude);
                            setTempLng(st.longitude);
                            setStoreSubTab('map_add');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-[10px] font-bold flex items-center gap-1 border border-sky-200 transition active:scale-95 cursor-pointer"
                          title="Ubah titik koordinat di peta"
                        >
                          <MapPin className="w-3 h-3 text-sky-600" />
                          <span>Titik Peta</span>
                        </button>

                        {/* Toggle Aktif / Nonaktif */}
                        <button
                          type="button"
                          onClick={() => {
                            updateStore(st.id, { is_active: !st.is_active });
                            setStoreMapFeedback({
                              type: 'success',
                              message: `Status toko "${st.name}" berhasil diubah menjadi ${!st.is_active ? 'Aktif' : 'Nonaktif'}!`,
                            });
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer ${
                            st.is_active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {st.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>

                        {/* Delete Store */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteStore(st)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                          title="Hapus toko dengan konfirmasi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: PRODUCTS (ALL MERCHANTS CATALOG)
      ========================================================================= */}
      {activeAdminTab === 'products' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Katalog Semua Produk ({filteredProducts.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Kelola menu, harga, stok, dan ketersediaan barang merchant di PAYKAJASTIP.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
              />

              <select
                value={productStoreFilter}
                onChange={(e) => setProductStoreFilter(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium max-w-[160px]"
              >
                <option value="all">Semua Toko</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setNewProductForm((prev) => ({
                    ...prev,
                    store_id: productStoreFilter !== 'all' ? productStoreFilter : stores[0]?.id || '',
                  }));
                  setShowAddProductModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Produk</span>
              </button>
            </div>
          </div>

          {/* Active Store Filter Indicator */}
          {productStoreFilter !== 'all' && (
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-2xl text-xs text-sky-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Menampilkan produk untuk toko: <strong>{stores.find((s) => s.id === productStoreFilter)?.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProductStoreFilter('all')}
                className="text-[11px] font-bold text-sky-700 underline hover:text-sky-900"
              >
                Tampilkan Semua Toko
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredProducts.map((p) => {
              const storeOwner = stores.find((s) => s.id === p.store_id);
              return (
                <div
                  key={p.id}
                  className="bg-white p-3.5 rounded-3xl border border-slate-200 flex items-center gap-3 text-xs shadow-2xs hover:border-slate-300 transition"
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-sky-600 truncate block">
                      {storeOwner ? storeOwner.name : 'Toko'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs truncate">{p.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-black text-slate-800">{formatRupiah(p.price)}</span>
                      {p.promo_price ? (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1 rounded">
                          Promo {formatRupiah(p.promo_price)}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Stok: {p.stock} • {p.category}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    {/* Edit Product Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition active:scale-95"
                      title="Edit produk katalog"
                    >
                      <Edit2 className="w-2.5 h-2.5 text-amber-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateProduct(p.id, { is_available: !p.is_available })}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition active:scale-95 ${
                        p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.is_available ? 'Tersedia' : 'Habis'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus produk ${p.name}?`)) deleteProduct(p.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition active:scale-95"
                      title="Hapus produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ADMIN MAPS & COORDINATE ADJUSTMENT
      ========================================================================= */}
      {activeAdminTab === 'maps' && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Admin Map Editor Koordinat Merchant
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih toko dan geser marker kuning pada peta untuk mengatur koordinat akurat di Singkawang.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMapStoreId}
                  onChange={(e) => {
                    setSelectedMapStoreId(e.target.value);
                    const st = stores.find((s) => s.id === e.target.value);
                    if (st) {
                      setTempLat(st.latitude);
                      setTempLng(st.longitude);
                    }
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.district})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSaveCoordinates}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Koordinat</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
              <span>Toko: <strong>{selectedMapStore?.name}</strong></span>
              <span>Latitude: <strong>{tempLat.toFixed(6)}</strong></span>
              <span>Longitude: <strong>{tempLng.toFixed(6)}</strong></span>
            </div>
          </div>

          <div className="h-[480px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
            <SingkawangMap
              adminMode={true}
              initialLat={tempLat}
              initialLng={tempLng}
              onCoordinateChange={(lat, lng) => {
                setTempLat(lat);
                setTempLng(lng);
              }}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: DRIVERS MANAGEMENT
      ========================================================================= */}
      {activeAdminTab === 'drivers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Manajemen Driver &amp; Kurir ({drivers.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeDriversCount} driver online melayani pengiriman area Singkawang &amp; Bengkayang.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddDriverModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Driver</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {drivers.map((drv) => (
              <div
                key={drv.id}
                className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-slate-900 text-sm font-bold block truncate">{drv.name}</strong>
                    <span className="text-[11px] text-slate-500 block">
                      Plat: {drv.vehicle_plate} • {drv.vehicle_type.toUpperCase()}
                    </span>
                    <a
                      href={createWhatsAppUrl(drv.phone, `Halo ${drv.name}, dari Admin PAYKAJASTIP`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5 mt-0.5"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>{drv.phone}</span>
                    </a>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleDriverOnline(drv.id)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-extrabold transition ${
                      drv.is_online
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {drv.is_online ? 'ONLINE' : 'OFFLINE'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus driver ${drv.name}?`)) deleteDriver(drv.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Hapus driver"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: CUSTOMERS & USERS DIRECTORY
      ========================================================================= */}
      {activeAdminTab === 'customers' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Pengguna Terdaftar ({filteredUsers.length})
            </h3>

            <input
              type="text"
              placeholder="Cari nama, email, atau no HP..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white max-w-xs"
            />
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white p-3.5 rounded-3xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                    {u.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-slate-900 text-xs font-bold block truncate">{u.full_name}</strong>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {u.email} • {u.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                      u.role === 'admin'
                        ? 'bg-rose-100 text-rose-800'
                        : u.role === 'driver'
                        ? 'bg-amber-100 text-amber-800'
                        : u.role === 'merchant'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.role}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      switchUser(u);
                      alert(`Berpindah akun ke: ${u.full_name} (${u.role})`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    title="Uji coba aplikasi dengan akun user ini"
                  >
                    Switch User
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 9: JASTIP REQUESTS
      ========================================================================= */}
      {activeAdminTab === 'jastip' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Permintaan Jastip Belanja ({jastipRequests.length})
          </h3>

          {jastipRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Belum ada permintaan jastip.
            </div>
          ) : (
            jastipRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2.5 text-xs shadow-2xs"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-700">#{req.request_number}</span>
                  <select
                    value={req.status}
                    onChange={(e) => updateJastipStatus(req.id, e.target.value as any)}
                    className="text-xs font-bold px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="MENUNGGU KONFIRMASI">MENUNGGU KONFIRMASI</option>
                    <option value="DITERIMA">DITERIMA</option>
                    <option value="DIBELI">DIBELI</option>
                    <option value="DIANTAR">DIANTAR</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DIBATALKAN">DIBATALKAN</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Barang Titipan:</span>
                  <strong className="text-slate-900 text-sm">
                    {req.item_name} ({req.quantity} pcs)
                  </strong>
                  <p className="text-slate-600 mt-0.5">Toko Tujuan: {req.target_store}</p>
                  {req.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">Catatan: {req.notes}</p>}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Alamat Antar:</span>
                    <span className="text-slate-700 text-[11px] font-medium">{req.delivery_address}</span>
                  </div>

                  <a
                    href={createWhatsAppUrl(
                      req.customer_phone,
                      `Halo Kak ${req.customer_name}, pesanan Jastip #${req.request_number} (${req.item_name}) siap kami belikan.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 10: DELIVERY (ANTAR BARANG)
      ========================================================================= */}
      {activeAdminTab === 'delivery' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pengantaran Barang &amp; Dokumen ({deliveryRequests.length})
          </h3>

          {deliveryRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              Belum ada permintaan antar barang.
            </div>
          ) : (
            deliveryRequests.map((del) => (
              <div
                key={del.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2.5 text-xs shadow-2xs"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">#{del.request_number}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      Ukuran: {del.package_size} ({formatRupiah(del.fee)})
                    </span>
                  </div>
                  <select
                    value={del.status}
                    onChange={(e) => updateDeliveryStatus(del.id, e.target.value as any)}
                    className="text-xs font-bold px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="MENUNGGU KURIR">MENUNGGU KURIR</option>
                    <option value="DIJEMPUT">DIJEMPUT</option>
                    <option value="DIANTAR">DIANTAR</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DIBATALKAN">DIBATALKAN</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pengirim:</span>
                    <strong className="text-slate-800">{del.sender_name}</strong> ({del.sender_phone})
                    <p className="text-[11px] text-slate-600 mt-0.5">{del.pickup_address}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Penerima:</span>
                    <strong className="text-slate-800">{del.recipient_name}</strong> ({del.recipient_phone})
                    <p className="text-[11px] text-slate-600 mt-0.5">{del.delivery_address}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Isi Paket: <strong>{del.item_type}</strong>
                  </span>

                  <a
                    href={createWhatsAppUrl(
                      del.sender_phone,
                      `Halo Kak ${del.sender_name}, kurir PAYKAJASTIP bersiap mengambil paket #${del.request_number}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Chat Pengirim</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 11: RATES & TARIF CONFIGURATION
      ========================================================================= */}
      {activeAdminTab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pengaturan Tarif Ongkos Kirim &amp; Biaya Layanan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai tarif ini langsung berlaku saat customer melakukan checkout belanja, jastip, maupun antar barang.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tarif Dasar Pengantaran:
                </label>
                <input
                  type="number"
                  value={rates[0]?.base_rate || 10000}
                  onChange={(e) => updateRates({ base_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tarif per Kilometer:
                </label>
                <input
                  type="number"
                  value={rates[0]?.per_km_rate || 3000}
                  onChange={(e) => updateRates({ per_km_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tarif Minimal (Minimum Charge):
                </label>
                <input
                  type="number"
                  value={rates[0]?.minimum_rate || 15000}
                  onChange={(e) => updateRates({ minimum_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>

            {/* Package Size Rates */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                Tarif Paket Antar Barang (S / M / L):
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Paket S (Kecil/Dokumen)</span>
                  <span className="text-sm font-extrabold text-slate-800">Rp 15.000</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Paket M (Sedang/Dus)</span>
                  <span className="text-sm font-extrabold text-slate-800">Rp 20.000</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Paket L (Besar)</span>
                  <span className="text-sm font-extrabold text-slate-800">Rp 25.000</span>
                </div>
              </div>
            </div>

            {/* Live Calculation Simulator */}
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 block">
                Simulasi Perhitungan Ongkos Kirim:
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={calcDist}
                  onChange={(e) => setCalcDist(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-bold text-xs text-sky-900 w-16 text-right">{calcDist} km</span>
              </div>
              <p className="text-xs text-sky-800 font-semibold">
                Estimasi Ongkir ({calcDist} km):{' '}
                <strong className="text-sky-950 font-black">
                  {formatRupiah(
                    Math.max(
                      rates[0]?.minimum_rate || 15000,
                      (rates[0]?.base_rate || 10000) + (calcDist - 1) * (rates[0]?.per_km_rate || 3000)
                    )
                  )}
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 12: PROMO VOUCHERS
      ========================================================================= */}
      {activeAdminTab === 'promos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Buat Voucher Promo Baru
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="KODE (mis: PAYKAHEMAT)"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase font-mono font-bold"
              />
              <input
                type="text"
                placeholder="Judul Promo"
                value={newPromoTitle}
                onChange={(e) => setNewPromoTitle(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
              <input
                type="number"
                placeholder="Potongan (Rp)"
                value={newPromoVal}
                onChange={(e) => setNewPromoVal(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newPromoCode) return alert('Masukkan kode promo!');
                  addPromo({
                    id: `promo-${Date.now()}`,
                    code: newPromoCode,
                    title: newPromoTitle || newPromoCode,
                    discount_type: 'nominal',
                    discount_value: newPromoVal,
                    min_order: newPromoMin,
                    max_discount: newPromoVal,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
                    usage_limit: 100,
                    used_count: 0,
                    is_active: true,
                  });
                  setNewPromoCode('');
                  setNewPromoTitle('');
                  alert(`Promo ${newPromoCode} berhasil ditambahkan!`);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                + Tambah Promo
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Voucher Aktif ({promos.length})
            </h4>

            {promos.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                      {p.code}
                    </span>
                    <strong className="text-slate-800">{p.title}</strong>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Diskon: {formatRupiah(p.discount_value)} • Minimal Belanja: {formatRupiah(p.min_order)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => deletePromo(p.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Hapus voucher promo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 13: REPORTS (LAPORAN KEUANGAN & BISNIS)
      ========================================================================= */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Laporan Keuangan &amp; Penjualan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ringkasan transaksi dan perputaran dana belanja lokal Singkawang.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
                    JSON.stringify({ orders, payments, stores, products, generatedAt: new Date().toISOString() }, null, 2)
                  );
                  const dlAnchorElem = document.createElement('a');
                  dlAnchorElem.setAttribute('href', dataStr);
                  dlAnchorElem.setAttribute('download', `laporan-paykajastip-${new Date().toISOString().slice(0, 10)}.json`);
                  dlAnchorElem.click();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Laporan (JSON)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Transaksi Selesai</span>
                <span className="text-base font-black text-emerald-600">
                  {orders.filter((o) => o.status === 'SELESAI').length} Order
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Omset Selesai</span>
                <span className="text-base font-black text-slate-900">
                  {formatRupiah(
                    orders
                      .filter((o) => o.status === 'SELESAI')
                      .reduce((sum, o) => sum + o.total_amount, 0)
                  )}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Ongkir Terdistribusi</span>
                <span className="text-base font-black text-sky-600">
                  {formatRupiah(orders.reduce((sum, o) => sum + o.delivery_fee, 0))}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Biaya Layanan</span>
                <span className="text-base font-black text-amber-600">
                  {formatRupiah(orders.reduce((sum, o) => sum + o.service_fee, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 14: WHATSAPP GATEWAY & CUSTOMER SUPPORT
      ========================================================================= */}
      {activeAdminTab === 'whatsapp' && (
        <div className="space-y-4">
          {/* Status Feedback Notification */}
          {waSaveFeedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-2xs transition-all ${
                waSaveFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {waSaveFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold">
                    {waSaveFeedback.type === 'success' ? 'Pengaturan Berhasil Disimpan' : 'Penyimpanan Gagal'}
                  </h4>
                  <p className="text-xs mt-0.5 leading-relaxed">{waSaveFeedback.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaSaveFeedback(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Card: Status Nomor Aktif Saat Ini di Database */}
          <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                    Nomor WhatsApp Admin Aktif di Database
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {formatDisplayPhone(adminSettings.whatsapp_admin)}
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>Tersimpan di Sistem</span>
              </span>
            </div>
            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 flex-wrap gap-2">
              <span>
                Format Internasional: <strong>+{formatWhatsAppNumber(adminSettings.whatsapp_admin)}</strong>
              </span>
              <span>
                Tautan: <strong>wa.me/{formatWhatsAppNumber(adminSettings.whatsapp_admin)}</strong>
              </span>
            </div>
          </div>

          {/* Form Pengaturan Nomor WhatsApp */}
          <form
            onSubmit={handleSaveWhatsApp}
            className="bg-white rounded-3xl border border-slate-200 p-5 space-y-5 shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Nomor WhatsApp Resmi Admin</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Nomor ini digunakan sebagai kontak Customer Service resmi, konfirmasi pesanan jastip, kurir logistik, dan verifikasi pembayaran manual. Perubahan nomor yang disimpan langsung berlaku di seluruh website.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor WhatsApp Admin (08... atau 628...):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settingsForm.whatsapp_admin}
                    onChange={(e) => {
                      setSettingsForm({ ...settingsForm, whatsapp_admin: e.target.value });
                      if (waSaveFeedback) setWaSaveFeedback(null);
                    }}
                    placeholder="Contoh: 081254321098 atau 6281254321098"
                    className={`w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border font-bold tracking-wide focus:outline-hidden transition ${
                      isValidWhatsAppNumber(settingsForm.whatsapp_admin)
                        ? 'border-emerald-300 focus:border-emerald-500 bg-emerald-50/20'
                        : settingsForm.whatsapp_admin.trim().length > 0
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-200 focus:border-sky-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidWhatsAppNumber(settingsForm.whatsapp_admin) ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : settingsForm.whatsapp_admin.trim().length > 0 ? (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>

                {/* Validation helper text */}
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  {isValidWhatsAppNumber(settingsForm.whatsapp_admin) ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>
                        Format valid: +{formatWhatsAppNumber(settingsForm.whatsapp_admin)} (
                        {formatDisplayPhone(settingsForm.whatsapp_admin)})
                      </span>
                    </span>
                  ) : settingsForm.whatsapp_admin.trim().length > 0 ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Nomor tidak valid (minimal 9 digit angka dengan awalan 08 / 628)</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Gunakan format nomor seluler Indonesia yang aktif di WhatsApp
                    </span>
                  )}
                  <span className="text-slate-400 font-mono">
                    {settingsForm.whatsapp_admin.replace(/[^0-9]/g, '').length} digit
                  </span>
                </div>
              </div>

              {/* Action Buttons: Simpan & Kirim Pesan Tes */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="submit"
                  disabled={waSaveLoading || !isValidWhatsAppNumber(settingsForm.whatsapp_admin)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 ${
                    waSaveLoading || !isValidWhatsAppNumber(settingsForm.whatsapp_admin)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  }`}
                >
                  {waSaveLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Pengaturan</span>
                    </>
                  )}
                </button>

                <a
                  href={
                    isValidWhatsAppNumber(settingsForm.whatsapp_admin)
                      ? createWhatsAppUrl(
                          settingsForm.whatsapp_admin,
                          'Halo Admin PAYKAJASTIP Singkawang, ini adalah pesan tes dari panel Super Admin.'
                        )
                      : '#'
                  }
                  target={isValidWhatsAppNumber(settingsForm.whatsapp_admin) ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!isValidWhatsAppNumber(settingsForm.whatsapp_admin)) {
                      e.preventDefault();
                      setWaSaveFeedback({
                        type: 'error',
                        message: 'Masukkan nomor WhatsApp yang valid terlebih dahulu sebelum mengirim pesan tes.',
                      });
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 ${
                    isValidWhatsAppNumber(settingsForm.whatsapp_admin)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim Pesan Tes</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Information Card on Where this WhatsApp number is used */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Titik Integrasi Otomatis Nomor WhatsApp Admin:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                  <div>
                    <strong className="text-slate-800">Tombol Mengambang (Floating WA):</strong>
                    <p className="text-[11px] text-slate-500">Tombol hijau di pojok kanan bawah seluruh halaman.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                  <div>
                    <strong className="text-slate-800">Menu Profil &amp; Bantuan CS:</strong>
                    <p className="text-[11px] text-slate-500">Tombol "Hubungi Layanan Bantuan (WhatsApp)".</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                  <div>
                    <strong className="text-slate-800">Layanan Jastip:</strong>
                    <p className="text-[11px] text-slate-500">Konfirmasi pemesanan jastip belanja pasar &amp; toko.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                  <div>
                    <strong className="text-slate-800">Layanan Antar Barang:</strong>
                    <p className="text-[11px] text-slate-500">Konfirmasi pengantaran logistik paket Singkawang-Bengkayang.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supabase Database Cloud Sync Status & SQL Helper */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Sinkronisasi Database Cloud Supabase
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>{showSqlGuide ? 'Sembunyikan SQL' : 'Lihat Skrip SQL Supabase'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-[11px] text-slate-500">
                    Pengaturan nomor WhatsApp selalu tersimpan permanen di sistem aplikasi. Untuk sinkronisasi otomatis ke proyek cloud Supabase Anda, pastikan tabel <code>admin_settings</code> telah dibuat melalui Supabase SQL Editor.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `-- Skrip Pembuatan Tabel admin_settings PAYKAJASTIP
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  app_name TEXT NOT NULL DEFAULT 'PAYKAJASTIP',
  tagline TEXT NOT NULL DEFAULT 'Jastip, Belanja & Antar Barang di Singkawang',
  whatsapp_admin TEXT NOT NULL DEFAULT '081254321098',
  payment_recipient_name TEXT,
  payment_account_number TEXT,
  payment_channel_name TEXT,
  payment_qr_url TEXT,
  payment_instructions TEXT,
  is_payment_configured BOOLEAN DEFAULT false,
  base_delivery_fee NUMERIC(10, 2) DEFAULT 10000,
  per_km_fee NUMERIC(10, 2) DEFAULT 3000,
  service_fee NUMERIC(10, 2) DEFAULT 2000,
  bank_active BOOLEAN DEFAULT true,
  bank_name TEXT DEFAULT 'Bank BCA',
  bank_account_number TEXT DEFAULT '8175283921',
  bank_recipient_name TEXT DEFAULT 'PAYKA JASTIP SINGKAWANG',
  bank_instructions TEXT,
  va_active BOOLEAN DEFAULT true,
  va_provider TEXT DEFAULT 'BCA Virtual Account',
  va_number TEXT DEFAULT '8271081254321098',
  va_recipient_name TEXT DEFAULT 'PAYKA JASTIP SINGKAWANG',
  va_instructions TEXT,
  dana_active BOOLEAN DEFAULT true,
  dana_number TEXT DEFAULT '081254321098',
  dana_recipient_name TEXT DEFAULT 'PAYKA JASTIP SINGKAWANG',
  dana_instructions TEXT,
  qris_active BOOLEAN DEFAULT true,
  qris_merchant_name TEXT DEFAULT 'PAYKAJASTIP SINGKAWANG (QRIS RESMI)',
  qris_image_url TEXT,
  qris_instructions TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admin update admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admin insert admin settings" ON public.admin_settings;

CREATE POLICY "Public can read admin settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admin update admin settings" ON public.admin_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin insert admin settings" ON public.admin_settings FOR INSERT WITH CHECK (true);

INSERT INTO public.admin_settings (id, whatsapp_admin)
VALUES (1, '081254321098')
ON CONFLICT (id) DO NOTHING;`;
                      navigator.clipboard.writeText(sql);
                      setSqlCopied(true);
                      setTimeout(() => setSqlCopied(false), 3000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    {sqlCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Skrip SQL Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Skrip SQL admin_settings</span>
                      </>
                    )}
                  </button>
                </div>

                {showSqlGuide && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp_admin TEXT NOT NULL DEFAULT '081254321098',
  app_name TEXT NOT NULL DEFAULT 'PAYKAJASTIP',
  tagline TEXT NOT NULL DEFAULT 'Jastip, Belanja & Antar Barang di Singkawang',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read admin settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admin update admin settings" ON public.admin_settings FOR ALL USING (true);
INSERT INTO public.admin_settings (id, whatsapp_admin) VALUES (1, '081254321098') ON CONFLICT (id) DO NOTHING;`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 15: SETTINGS & PAYMENT CONFIGURATION (PISAHKAN METODE PEMBAYARAN)
      ========================================================================= */}
      {activeAdminTab === 'settings' && (
        <div className="space-y-5">
          {/* Top Banner Info */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-3xl p-5 text-white shadow-md space-y-1.5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">
                Rekening Pembayaran &amp; Konfigurasi Sistem
              </h3>
            </div>
            <p className="text-xs text-sky-100 leading-relaxed max-w-2xl">
              Pengaturan rekening dipisahkan menjadi 4 metode mandiri (Bank, Virtual Account, DANA, dan QRIS).
              Setiap metode yang diaktifkan akan <strong>otomatis tampil di halaman checkout pelanggan</strong>.
              Metode yang dinonaktifkan tidak akan ditampilkan kepada pelanggan.
            </p>
          </div>

          {/* =====================================================================
              A. PEMBAYARAN BANK
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>A. Pembayaran Bank</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settingsForm.bank_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {settingsForm.bank_active ? '● AKTIF DI CHECKOUT' : '○ NONAKTIF'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Transfer manual antar rekening (BCA, Mandiri, BRI, Bank Kalbar, dll)
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((prev) => ({ ...prev, bank_active: !prev.bank_active }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                  settingsForm.bank_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {settingsForm.bank_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Status: Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Status: Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline Feedback Banner */}
            {bankSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  bankSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {bankSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{bankSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBankSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bank Form Fields */}
            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Bank:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bank_name || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bank_name: e.target.value })
                    }
                    placeholder="Contoh: Bank BCA / Mandiri / BRI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Rekening Bank:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bank_account_number || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })
                    }
                    placeholder="Contoh: 8175283921"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Pemilik Rekening:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bank_recipient_name || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, bank_recipient_name: e.target.value })
                    }
                    placeholder="Contoh: PAYKA JASTIP SINGKAWANG"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Instruksi Pembayaran Manual Bank (Ditampilkan ke Pelanggan):
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.bank_instructions || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, bank_instructions: e.target.value })
                  }
                  placeholder="Contoh: Transfer sesuai total pesanan ke rekening BCA di atas. Simpan resi transfer dan unggah bukti pembayaran di aplikasi."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={bankSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{bankSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan Bank'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              B. PEMBAYARAN VIRTUAL ACCOUNT
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>B. Pembayaran Virtual Account</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settingsForm.va_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {settingsForm.va_active ? '● AKTIF DI CHECKOUT' : '○ NONAKTIF'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pembayaran praktis dengan kode nomor Virtual Account
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((prev) => ({ ...prev, va_active: !prev.va_active }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                  settingsForm.va_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {settingsForm.va_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Status: Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Status: Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline Feedback Banner */}
            {vaSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  vaSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {vaSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{vaSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVaSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* VA Form Fields */}
            <form onSubmit={handleSaveVA} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Penyedia Virtual Account:
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.va_provider || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, va_provider: e.target.value })
                    }
                    placeholder="Contoh: BCA Virtual Account / Mandiri VA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor Virtual Account:
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.va_number || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, va_number: e.target.value })
                    }
                    placeholder="Contoh: 8271081254321098"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Penerima VA:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.va_recipient_name || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, va_recipient_name: e.target.value })
                    }
                    placeholder="Contoh: PAYKA JASTIP SINGKAWANG"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Instruksi Pembayaran Manual Virtual Account:
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.va_instructions || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, va_instructions: e.target.value })
                  }
                  placeholder="Contoh: Buka m-BCA > Transfer > BCA Virtual Account > Masukkan nomor VA > Konfirmasi & upload bukti pembayaran."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={vaSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{vaSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan Virtual Account'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              C. PEMBAYARAN DANA
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>C. Pembayaran DANA</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settingsForm.dana_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {settingsForm.dana_active ? '● AKTIF DI CHECKOUT' : '○ NONAKTIF'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Transfer saldo langsung ke nomor dompet digital DANA resmi
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((prev) => ({ ...prev, dana_active: !prev.dana_active }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                  settingsForm.dana_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {settingsForm.dana_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Status: Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Status: Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline Feedback Banner */}
            {danaSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  danaSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {danaSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{danaSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDanaSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* DANA Form Fields */}
            <form onSubmit={handleSaveDana} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor DANA:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.dana_number || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, dana_number: e.target.value })
                    }
                    placeholder="Contoh: 081254321098"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Pemilik Akun DANA:
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.dana_recipient_name || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, dana_recipient_name: e.target.value })
                    }
                    placeholder="Contoh: PAYKA JASTIP SINGKAWANG"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Instruksi Pembayaran Manual DANA:
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.dana_instructions || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, dana_instructions: e.target.value })
                  }
                  placeholder="Contoh: Buka aplikasi DANA > Kirim > Masukkan nomor DANA di atas > Tulis nomor pesanan pada catatan > Konfirmasi & upload screenshot bukti transfer."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={danaSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{danaSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan DANA'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              D. PEMBAYARAN QRIS
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>D. Pembayaran QRIS</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settingsForm.qris_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {settingsForm.qris_active ? '● AKTIF DI CHECKOUT' : '○ NONAKTIF'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Scan kode QRIS resmi nasional untuk semua Mobile Banking &amp; E-Wallet
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((prev) => ({ ...prev, qris_active: !prev.qris_active }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                  settingsForm.qris_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {settingsForm.qris_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Status: Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Status: Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline Feedback Banner */}
            {qrisSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  qrisSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {qrisSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{qrisSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrisSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* QRIS Form Fields */}
            <form onSubmit={handleSaveQris} className="space-y-4 text-xs">
              {/* Image Preview & Upload / Replace / Remove Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block text-xs">
                  Pratinjau &amp; Upload Gambar QRIS:
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Container */}
                  <div className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white p-2 shadow-xs shrink-0 flex items-center justify-center">
                    {settingsForm.qris_image_url ? (
                      <img
                        src={settingsForm.qris_image_url}
                        alt="Preview QRIS"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-3 space-y-1 text-slate-400">
                        <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                        <span className="text-[11px] block">Belum ada gambar QRIS</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for QRIS Image */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Unggah berkas foto QRIS (JPG, PNG) dari galeri Anda, atau masukkan tautan URL gambar langsung di bawah.
                    </p>

                    {/* Hidden file input */}
                    <input
                      ref={qrisFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrisFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => qrisFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{settingsForm.qris_image_url ? 'Ganti QRIS' : 'Upload Gambar QRIS'}</span>
                      </button>

                      {settingsForm.qris_image_url && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsForm((prev) => ({ ...prev, qris_image_url: '' }));
                            setQrisSaveFeedback({
                              type: 'success',
                              message: 'Gambar QRIS dihapus dari form. Klik "Simpan Pengaturan QRIS" untuk memperbarui.',
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus QRIS</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                        Atau Masukkan URL Gambar QRIS:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.qris_image_url || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, qris_image_url: e.target.value })
                        }
                        placeholder="https://domain.com/qris-payka.jpg"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Merchant / Penerima QRIS:
                  </label>
                  <input
                    type="text"
                    value={settingsForm.qris_merchant_name || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, qris_merchant_name: e.target.value })
                    }
                    placeholder="Contoh: PAYKAJASTIP SINGKAWANG (QRIS RESMI)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Instruksi Scan QRIS (Ditampilkan ke Pelanggan):
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.qris_instructions || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, qris_instructions: e.target.value })
                    }
                    placeholder="Contoh: Scan kode QRIS menggunakan GoPay, OVO, DANA, BCA Mobile, atau aplikasi e-wallet / mobile banking apa pun. Upload tangkapan layar bukti bayar."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={qrisSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{qrisSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan QRIS'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              E. PEMBAYARAN COD (BAYAR DI TEMPAT) - PERINTAH 4
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>E. Pembayaran COD (Cash On Delivery)</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settingsForm.cod_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {settingsForm.cod_active ? '● AKTIF DI CHECKOUT' : '○ NONAKTIF'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pelanggan membayar uang tunai langsung ke Driver / Kurir saat pesanan jastip tiba di lokasi
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((prev) => ({ ...prev, cod_active: !prev.cod_active }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                  settingsForm.cod_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {settingsForm.cod_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Status: Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Status: Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline Feedback Banner */}
            {codSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  codSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {codSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{codSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCodSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* COD Form */}
            <form onSubmit={handleSaveCOD} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Instruksi &amp; Panduan COD (Ditampilkan di Checkout Pelanggan &amp; Konfirmasi):
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.cod_instructions || ''}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, cod_instructions: e.target.value })
                  }
                  placeholder="Contoh: Bayar tunai kepada driver saat pesanan tiba di lokasi Anda. Mohon siapkan uang pas sesuai total tagihan agar transaksi cepat dan lancar."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 text-emerald-950 text-[11px] space-y-1">
                <span className="font-bold block">💡 Integrasi Otomatis COD:</span>
                <p>
                  Jika status aktif, opsi pembayaran COD akan otomatis muncul di <strong>Checkout Produk</strong> dan <strong>Pemesanan Jastip Sekarang</strong>. Driver yang ditugaskan otomatis akan menerima catatan tagihan tunai untuk dibayarkan oleh pemesan saat barang sampai.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={codSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{codSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan COD'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              F. PENGATURAN LOGO APLIKASI & LOGO WEBSITE - PERINTAH 3
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    F. Penggantian Logo Aplikasi &amp; Logo Website
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan identitas visual PaykaJastip di navbar aplikasi, tab browser (favicon), dan header admin
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Feedback Banner */}
            {logoSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  logoSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {logoSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{logoSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSaveLogoSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. App Logo (Header Navbar & Splash) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      1. Logo Aplikasi (Header &amp; Navbar)
                    </span>
                    <span className="text-[10px] text-slate-400">PNG / SVG / JPG</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                      {settingsForm.app_logo_url ? (
                        <img
                          src={settingsForm.app_logo_url}
                          alt="App Logo Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs">
                          PJ
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{settingsForm.app_logo_url ? 'Ganti File' : 'Upload File'}</span>
                        </button>
                        {settingsForm.app_logo_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm((prev) => ({ ...prev, app_logo_url: '' }))
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Muncul di pojok kiri atas aplikasi pelanggan &amp; sidebar admin.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Atau Masukkan URL Gambar Logo Aplikasi:
                    </label>
                    <input
                      type="text"
                      value={settingsForm.app_logo_url || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, app_logo_url: e.target.value })
                      }
                      placeholder="https://domain.com/app-logo.png"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* 2. Web Logo / Favicon */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      2. Logo Website / Favicon Browser
                    </span>
                    <span className="text-[10px] text-slate-400">ICO / PNG / SVG</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                      {settingsForm.web_logo_url || settingsForm.app_logo_url ? (
                        <img
                          src={settingsForm.web_logo_url || settingsForm.app_logo_url}
                          alt="Web Logo Favicon Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-xs">
                          🌐
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        ref={faviconFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => faviconFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{settingsForm.web_logo_url ? 'Ganti File' : 'Upload File'}</span>
                        </button>
                        {settingsForm.web_logo_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm((prev) => ({ ...prev, web_logo_url: '' }))
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Ditampilkan pada favicon tab peramban web dan meta preview.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Atau Masukkan URL Favicon / Web Logo:
                    </label>
                    <input
                      type="text"
                      value={settingsForm.web_logo_url || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, web_logo_url: e.target.value })
                      }
                      placeholder="https://domain.com/favicon.png"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResetLogoSettings}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Logo Standar</span>
                </button>

                <button
                  type="submit"
                  disabled={logoSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{logoSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan Logo'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              G. PENCARIAN & PENUGASAN DRIVER OTOMATIS - PERINTAH 5
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>G. Auto-Dispatch Driver Terdekat</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        settingsForm.auto_assign_driver !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {settingsForm.auto_assign_driver !== false ? '● DISPATCH AKTIF' : '○ MANUAL (TUNGGU ADMIN)'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sistem otomatis mencari dan menugaskan driver terdekat tanpa menunggu verifikasi manual admin
                  </p>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((prev) => ({
                    ...prev,
                    auto_assign_driver: prev.auto_assign_driver === false ? true : false,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                  settingsForm.auto_assign_driver !== false
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {settingsForm.auto_assign_driver !== false ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Auto-Dispatch: Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-slate-400" />
                    <span>Auto-Dispatch: Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Inline Feedback Banner */}
            {dispatchSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  dispatchSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {dispatchSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{dispatchSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Dispatch details & save */}
            <form onSubmit={handleSaveDispatch} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Radius Pencarian:</span>
                  <span className="text-sm font-extrabold text-slate-800">Maks. 25 km</span>
                  <p className="text-[10px] text-slate-400">Seluruh area Singkawang &amp; sekitarnya</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Algoritma Penugasan:</span>
                  <span className="text-sm font-extrabold text-cyan-800">Jarak Terdekat (Haversine)</span>
                  <p className="text-[10px] text-slate-400">Memilih driver online dengan km terendah</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Notifikasi Real-time:</span>
                  <span className="text-sm font-extrabold text-emerald-700">Admin + Driver + User</span>
                  <p className="text-[10px] text-slate-400">Terkirim instan saat order dibuat</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={dispatchSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{dispatchSaveLoading ? 'Menyimpan...' : 'Simpan Pengaturan Auto-Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* =====================================================================
              H. BIAYA PENGANTARAN & KONFIGURASI SISTEM
          ===================================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    E. Tarif Kurir Payka &amp; Konfigurasi Sistem
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Tarif dasar pengiriman, jarak tempuh, dan biaya platform PAYKAJASTIP
                  </p>
                </div>
              </div>
            </div>

            {ratesSaveFeedback && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in ${
                  ratesSaveFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {ratesSaveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{ratesSaveFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRatesSaveFeedback(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSaveRatesAndSystem} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Biaya Ongkir Dasar (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settingsForm.base_delivery_fee ?? 10000}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        base_delivery_fee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tarif Per Km (Rp/km):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settingsForm.per_km_fee ?? 3000}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        per_km_fee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Biaya Layanan Aplikasi (Rp):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settingsForm.service_fee ?? 2000}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        service_fee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Aplikasi:</label>
                  <input
                    type="text"
                    value={settingsForm.app_name || 'PAYKAJASTIP'}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, app_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tagline:</label>
                  <input
                    type="text"
                    value={settingsForm.tagline || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, tagline: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={ratesSaveLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{ratesSaveLoading ? 'Menyimpan...' : 'Simpan Konfigurasi Tarif & Sistem'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS SECTION (Centered Vertically and Responsive)
      ========================================================================= */}

      {/* 1. Modal: Tambah Toko Baru */}
      {showAddStoreModal && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAddStoreModal(false)}
        >
          <div
            className="relative my-auto w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(85dvh,600px)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Tambah Toko Baru di Singkawang</h3>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStore} className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Choipan Thien Thien"
                  value={newStoreForm.name}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={newStoreForm.category}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Oleh-oleh">Oleh-oleh</option>
                    <option value="UMKM">UMKM</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Fashion">Fashion</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kecamatan:</label>
                  <select
                    value={newStoreForm.district}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Singkawang Barat">Singkawang Barat</option>
                    <option value="Singkawang Tengah">Singkawang Tengah</option>
                    <option value="Singkawang Timur">Singkawang Timur</option>
                    <option value="Singkawang Utara">Singkawang Utara</option>
                    <option value="Singkawang Selatan">Singkawang Selatan</option>
                    <option value="Bengkayang">Bengkayang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Merdeka No. 12, Singkawang"
                  value={newStoreForm.address}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No WhatsApp Toko:</label>
                  <input
                    type="text"
                    required
                    placeholder="081254321098"
                    value={newStoreForm.whatsapp}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jam Buka:</label>
                  <input
                    type="text"
                    placeholder="08.00 - 21.00 WIB"
                    value={newStoreForm.opening_hours}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, opening_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi produk atau spesialisasi toko..."
                  value={newStoreForm.description}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Simpan Toko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1b. Modal: Edit Katalog Toko */}
      {editingStore && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEditingStore(null)}
        >
          <div
            className="relative my-auto w-full max-w-sm sm:max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(85dvh,640px)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Edit Katalog &amp; Profil Toko</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    ID: {editingStore.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Perbarui profil, informasi kontak, jam buka, dan alamat merchant di Singkawang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStore} className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Usaha:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bakmi Kering Haji Aman"
                  value={editStoreForm.name}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Toko:</label>
                  <select
                    value={editStoreForm.category}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Oleh-oleh">Oleh-oleh</option>
                    <option value="UMKM">UMKM</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Jasa">Jasa</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Usaha:</label>
                  <select
                    value={editStoreForm.store_type}
                    onChange={(e) =>
                      setEditStoreForm({
                        ...editStoreForm,
                        store_type: e.target.value as 'umkm' | 'offline' | 'online' | 'home_business',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="umkm">UMKM Lokal</option>
                    <option value="offline">Toko Fisik / Offline</option>
                    <option value="online">Toko Online</option>
                    <option value="home_business">Usaha Rumahan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kecamatan:</label>
                  <select
                    value={editStoreForm.district}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="Singkawang Barat">Singkawang Barat</option>
                    <option value="Singkawang Tengah">Singkawang Tengah</option>
                    <option value="Singkawang Timur">Singkawang Timur</option>
                    <option value="Singkawang Utara">Singkawang Utara</option>
                    <option value="Singkawang Selatan">Singkawang Selatan</option>
                    <option value="Bengkayang">Bengkayang</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp Toko:</label>
                  <input
                    type="text"
                    required
                    placeholder="081254321098"
                    value={editStoreForm.whatsapp}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Merdeka No. 12, Kel. Pasiran"
                  value={editStoreForm.address}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jam Operasional / Buka:</label>
                <input
                  type="text"
                  placeholder="08.00 - 21.00 WIB"
                  value={editStoreForm.opening_hours}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, opening_hours: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat Toko:</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan menu spesial, keunggulan, atau ciri khas toko..."
                  value={editStoreForm.description}
                  onChange={(e) => setEditStoreForm({ ...editStoreForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Status Switches */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">Status Operasional Toko:</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Status Toko Buka / Tutup:</span>
                  <button
                    type="button"
                    onClick={() => setEditStoreForm({ ...editStoreForm, is_open: !editStoreForm.is_open })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                      editStoreForm.is_open ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {editStoreForm.is_open ? 'Buka Sekarang' : 'Tutup'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600">Tampilkan di Aplikasi (Aktif):</span>
                  <button
                    type="button"
                    onClick={() => setEditStoreForm({ ...editStoreForm, is_active: !editStoreForm.is_active })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
                      editStoreForm.is_active ? 'bg-sky-600 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {editStoreForm.is_active ? 'Aktif (Muncul di App)' : 'Nonaktif (Disembunyikan)'}
                  </button>
                </div>
              </div>

              {/* Logo URL & Preview */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Foto Logo / Profil Toko:</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editStoreForm.logo_url}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, logo_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="https://..."
                  />
                  {editStoreForm.logo_url ? (
                    <img
                      src={editStoreForm.logo_url}
                      alt="Logo Preview"
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : null}
                </div>
              </div>

              {/* Banner URL & Preview */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Banner Header Toko (Opsional):</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editStoreForm.banner_url}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, banner_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="https://..."
                  />
                  {editStoreForm.banner_url ? (
                    <img
                      src={editStoreForm.banner_url}
                      alt="Banner Preview"
                      className="w-14 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : null}
                </div>
              </div>

              {/* Map Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editStoreForm.latitude}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editStoreForm.longitude}
                    onChange={(e) => setEditStoreForm({ ...editStoreForm, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Toko</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Tambah Produk Baru */}
      {showAddProductModal && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAddProductModal(false)}
        >
          <div
            className="relative my-auto w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(85dvh,600px)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Tambah Produk Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Toko Pemilik:</label>
                <select
                  required
                  value={newProductForm.store_id}
                  onChange={(e) => setNewProductForm({ ...newProductForm, store_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Choipan Kukus Bengkuang (10 Pcs)"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Normal (Rp):</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Promo (Opsional):</label>
                  <input
                    type="number"
                    value={newProductForm.promo_price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, promo_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stok:</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.stock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Oleh-oleh">Oleh-oleh</option>
                    <option value="Sembako">Sembako</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi:</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan rasa, isi, atau porsi..."
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2b. Modal: Edit Produk Katalog */}
      {editingProduct && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="relative my-auto w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(85dvh,620px)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Edit Produk Katalog</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Perbarui harga, stok, ketersediaan, dan detail produk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Toko Pemilik:</label>
                <select
                  required
                  value={editProductForm.store_id}
                  onChange={(e) => setEditProductForm({ ...editProductForm, store_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bakmi Goreng Spesial"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Normal (Rp):</label>
                  <input
                    type="number"
                    required
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Promo (Opsional):</label>
                  <input
                    type="number"
                    value={editProductForm.promo_price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, promo_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-rose-600"
                    placeholder="0 jika tidak ada promo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stok:</label>
                  <input
                    type="number"
                    required
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Berat (Gram):</label>
                  <input
                    type="number"
                    required
                    value={editProductForm.weight_grams}
                    onChange={(e) => setEditProductForm({ ...editProductForm, weight_grams: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Oleh-oleh">Oleh-oleh</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Camilan">Camilan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ketersediaan:</label>
                  <button
                    type="button"
                    onClick={() => setEditProductForm({ ...editProductForm, is_available: !editProductForm.is_available })}
                    className={`w-full py-2 rounded-xl font-bold transition text-xs ${
                      editProductForm.is_available ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {editProductForm.is_available ? '✓ Tersedia untuk Pesanan' : '✗ Habis / Tidak Aktif'}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Produk:</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan rasa, isi porsi, atau catatan racikan..."
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Foto Produk:</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editProductForm.image_url}
                    onChange={(e) => setEditProductForm({ ...editProductForm, image_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="https://..."
                  />
                  {editProductForm.image_url ? (
                    <img
                      src={editProductForm.image_url}
                      alt="Product Preview"
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : null}
                </div>
              </div>

              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Produk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Tambah Driver */}
      {showAddDriverModal && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAddDriverModal(false)}
        >
          <div
            className="relative my-auto w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Tambah Driver / Kurir</h3>
              <button
                type="button"
                onClick={() => setShowAddDriverModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDriver} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Driver:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Pratama"
                  value={newDriverForm.name}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp:</label>
                <input
                  type="text"
                  required
                  placeholder="081345678901"
                  value={newDriverForm.phone}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Plat Kendaraan:</label>
                <input
                  type="text"
                  required
                  placeholder="KB 2345 SKW"
                  value={newDriverForm.vehicle_plate}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicle_plate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Simpan Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Tugaskan Driver ke Pesanan */}
      {assigningOrder && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setAssigningOrder(null)}
        >
          <div
            className="relative my-auto w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tugaskan Kurir ke Pesanan</h3>
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pilih salah satu driver yang sedang online untuk mengambil dan mengantar pesanan ini:
            </p>

            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.vehicle_plate}) - {d.is_online ? 'ONLINE' : 'OFFLINE'}
                </option>
              ))}
            </select>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignDriver}
                className="flex-1 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Tugaskan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Enlarge Proof of Payment */}
      {selectedPaymentProof && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPaymentProof(null)}
        >
          <div
            className="relative my-auto max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Bukti Transfer Asli</span>
              <button
                type="button"
                onClick={() => setSelectedPaymentProof(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 flex-1 overflow-auto flex items-center justify-center">
              <img
                src={selectedPaymentProof}
                alt="Bukti Transfer Penuh"
                className="max-h-[70vh] w-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Tolak Pembayaran */}
      {rejectModalId && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setRejectModalId(null)}
        >
          <div
            className="relative my-auto w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5 border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tolak Bukti Pembayaran</h3>
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Alasan penolakan (misal: nominal transfer tidak cocok, mutasi belum masuk)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-bold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  verifyPayment(rejectModalId, false, rejectionReason);
                  setRejectModalId(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
              >
                Tolak Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Switch Account */}
      {showSwitchModal && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowSwitchModal(false)}
        >
          <div
            className="relative my-auto w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(80dvh,540px)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Switch Account
                  </h3>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                    Pilih Role
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ganti akun &amp; peran untuk menguji seluruh fitur sistem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-90 shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable List Container */}
            <div className="mt-3.5 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 -mr-1 space-y-2.5">
              {/* 1. Customer */}
              <button
                type="button"
                onClick={() => {
                  setUserRole('customer');
                  setShowSwitchModal(false);
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser?.role === 'customer'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      1. Customer (Pembeli/Pelanggan)
                    </h4>
                    {currentUser?.role === 'customer' && (
                      <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Cari toko di peta, pesan produk, buat request jastip &amp; bayar.
                  </p>
                </div>
              </button>

              {/* 2. Merchant */}
              <button
                type="button"
                onClick={() => {
                  setUserRole('merchant');
                  setShowSwitchModal(false);
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser?.role === 'merchant'
                    ? 'border-blue-500 bg-blue-50/70 shadow-2xs ring-1 ring-blue-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      2. Merchant (Pemilik Toko/UMKM)
                    </h4>
                    {currentUser?.role === 'merchant' && (
                      <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Kelola profil toko, tambah produk, atur stok &amp; terima order.
                  </p>
                </div>
              </button>

              {/* 3. Driver */}
              <button
                type="button"
                onClick={() => {
                  setUserRole('driver');
                  setShowSwitchModal(false);
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser?.role === 'driver'
                    ? 'border-amber-500 bg-amber-50/70 shadow-2xs ring-1 ring-amber-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      3. Driver (Kurir Singkawang)
                    </h4>
                    {currentUser?.role === 'driver' && (
                      <span className="text-[9px] font-extrabold bg-amber-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Mode online/offline, ambil order, navigasi rute &amp; antar barang.
                  </p>
                </div>
              </button>

              {/* 4. Super Admin */}
              <button
                type="button"
                onClick={() => {
                  setUserRole('admin');
                  setShowSwitchModal(false);
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser?.role === 'admin'
                    ? 'border-rose-500 bg-rose-50/70 shadow-2xs ring-1 ring-rose-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      4. Super Admin PAYKAJASTIP
                    </h4>
                    {currentUser?.role === 'admin' && (
                      <span className="text-[9px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Verifikasi pembayaran manual, kelola toko, tarif, peta &amp; setting.
                  </p>
                </div>
              </button>
            </div>

            {/* Bottom Close Button */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-98"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
