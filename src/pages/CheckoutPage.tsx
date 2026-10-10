import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Truck,
  ShoppingBag,
  Store,
  Ticket,
  Check,
  AlertCircle,
  FileText,
  CreditCard,
  ChevronRight,
  QrCode,
  Wallet,
  Building2,
  ShieldCheck,
  Info,
  Banknote,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CartItem, Order, OrderItem } from '../types';
import {
  formatRupiah,
  calculateDistanceKm,
  calculateDeliveryFee,
} from '../utils/helpers';
import { LocationPickerModal } from '../components/Map/LocationPickerModal';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
  setActiveTab: (tab: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBack,
  onOrderCreated,
  setActiveTab,
}) => {
  const {
    cart,
    clearCart,
    currentUser,
    stores,
    userLocation,
    adminSettings,
    rates,
    promos,
    createOrder,
  } = useApp();

  // Form State
  const [customerName, setCustomerName] = useState(currentUser?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(userLocation.address || 'Singkawang');
  const [deliveryLat, setDeliveryLat] = useState<number>(userLocation.lat || 0.9056);
  const [deliveryLng, setDeliveryLng] = useState<number>(userLocation.lng || 108.9868);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active payment methods configured dynamically by Super Admin
  const availablePaymentMethods = useMemo(() => {
    const list: Array<{
      id: 'BANK' | 'VA' | 'DANA' | 'QRIS';
      name: string;
      category: string;
      accountNumber?: string;
      recipientName?: string;
      instructions?: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [];

    // A. Pembayaran Bank
    if (adminSettings.bank_active && (adminSettings.bank_account_number || adminSettings.payment_account_number)) {
      list.push({
        id: 'BANK',
        name: adminSettings.bank_name || 'Transfer Bank',
        category: 'Transfer Bank Manual',
        accountNumber: adminSettings.bank_account_number || adminSettings.payment_account_number,
        recipientName: adminSettings.bank_recipient_name || adminSettings.payment_recipient_name,
        instructions: adminSettings.bank_instructions || 'Transfer sesuai nominal tagihan, simpan resi dan unggah bukti pembayaran.',
        icon: Building2,
      });
    }

    // B. Pembayaran Virtual Account
    if (adminSettings.va_active && adminSettings.va_number) {
      list.push({
        id: 'VA',
        name: adminSettings.va_provider || 'Virtual Account',
        category: 'Virtual Account',
        accountNumber: adminSettings.va_number,
        recipientName: adminSettings.va_recipient_name,
        instructions: adminSettings.va_instructions || 'Bayar melalui menu Virtual Account bank Anda lalu unggah bukti transfer.',
        icon: ShieldCheck,
      });
    }

    // C. Pembayaran DANA
    if (adminSettings.dana_active && adminSettings.dana_number) {
      list.push({
        id: 'DANA',
        name: 'DANA E-Wallet',
        category: 'Dompet Digital DANA',
        accountNumber: adminSettings.dana_number,
        recipientName: adminSettings.dana_recipient_name || 'PAYKA JASTIP',
        instructions: adminSettings.dana_instructions || 'Transfer saldo ke nomor akun DANA di atas dan kirim bukti tangkapan layar.',
        icon: Wallet,
      });
    }

    // D. Pembayaran QRIS
    if (adminSettings.qris_active && (adminSettings.qris_image_url || adminSettings.payment_qr_url)) {
      list.push({
        id: 'QRIS',
        name: adminSettings.qris_merchant_name || 'QRIS Resmi PAYKA',
        category: 'Semua E-Wallet & Mobile Banking',
        recipientName: adminSettings.qris_merchant_name || 'PAYKAJASTIP',
        instructions: adminSettings.qris_instructions || 'Scan kode QRIS resmi via BCA Mobile, GoPay, OVO, ShopeePay, atau DANA.',
        icon: QrCode,
      });
    }

    // E. Pembayaran COD (Bayar di Tempat)
    if (adminSettings.cod_active !== false) {
      list.push({
        id: 'COD',
        name: 'COD (Bayar di Tempat)',
        category: 'Bayar Tunai ke Kurir / Driver',
        recipientName: 'Kurir / Driver Payka Singkawang',
        instructions: adminSettings.cod_instructions || 'Bayar tunai kepada driver saat pesanan tiba di lokasi Anda. Mohon siapkan uang pas sesuai total belanja.',
        icon: Banknote,
      });
    }

    return list;
  }, [adminSettings]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'BANK' | 'VA' | 'DANA' | 'QRIS' | 'COD'>('BANK');

  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.some((m) => m.id === selectedPaymentMethod)) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods, selectedPaymentMethod]);

  // Group cart items by store
  const storeGroups = useMemo(() => {
    const map = new Map<string, { store: any; items: CartItem[] }>();

    cart.forEach((item) => {
      const storeId = item.product.store_id;
      const st = stores.find((s) => s.id === storeId) || {
        id: storeId,
        name: item.product.store_name || 'Toko Singkawang',
        address: 'Singkawang',
        phone: '081200000000',
        latitude: 0.9056,
        longitude: 108.9868,
      };

      if (!map.has(storeId)) {
        map.set(storeId, { store: st, items: [] });
      }
      map.get(storeId)!.items.push(item);
    });

    return Array.from(map.entries());
  }, [cart, stores]);

  const activeRate = rates[0] || {
    base_rate: adminSettings.base_delivery_fee,
    per_km_rate: adminSettings.per_km_fee,
    minimum_rate: 15000,
    service_fee: adminSettings.service_fee,
  };

  // Calculations across stores
  const cartSubtotal = cart.reduce((sum, item) => {
    const p = item.product.promo_price ?? item.product.price;
    return sum + p * item.quantity;
  }, 0);

  // Calculate delivery fee for each store based on selected deliveryLat/deliveryLng
  const storeDeliveryFees = useMemo(() => {
    return storeGroups.map(([, group]) => {
      const dist = calculateDistanceKm(
        deliveryLat,
        deliveryLng,
        group.store.latitude,
        group.store.longitude
      );
      return calculateDeliveryFee(
        dist,
        activeRate.base_rate,
        activeRate.per_km_rate,
        activeRate.minimum_rate
      );
    });
  }, [storeGroups, deliveryLat, deliveryLng, activeRate]);

  const totalDeliveryFee = storeDeliveryFees.reduce((a, b) => a + b, 0);
  const serviceFee = activeRate.service_fee;

  // Apply Promo discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (cartSubtotal < appliedPromo.min_order) return 0;

    if (appliedPromo.discount_type === 'nominal') {
      return Math.min(appliedPromo.discount_value, cartSubtotal);
    }
    if (appliedPromo.discount_type === 'percent') {
      const disc = (cartSubtotal * appliedPromo.discount_value) / 100;
      return Math.min(disc, appliedPromo.max_discount || disc);
    }
    if (appliedPromo.discount_type === 'free_shipping') {
      return Math.min(appliedPromo.discount_value, totalDeliveryFee);
    }
    return 0;
  }, [appliedPromo, cartSubtotal, totalDeliveryFee]);

  const grandTotal = Math.max(
    0,
    cartSubtotal + totalDeliveryFee + serviceFee - discountAmount
  );

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    const found = promos.find((p) => p.code.toUpperCase() === code && p.is_active);
    if (!found) {
      setPromoError('Kode promo tidak valid atau sudah kadaluarsa.');
      return;
    }

    if (cartSubtotal < found.min_order) {
      setPromoError(
        `Minimum pesanan untuk voucher ini adalah ${formatRupiah(found.min_order)}.`
      );
      return;
    }

    setAppliedPromo(found);
    setPromoCodeInput('');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!customerPhone || cleanPhone.length < 9) {
      alert('Mohon isi nomor WhatsApp aktif untuk konfirmasi pengantaran.');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('Mohon tentukan alamat lengkap pengantaran di Singkawang.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create separate orders if multi-store
      let firstOrderId = '';

      for (let i = 0; i < storeGroups.length; i++) {
        const [storeId, group] = storeGroups[i];
        const storeSubtotal = group.items.reduce((s, it) => {
          const p = it.product.promo_price ?? it.product.price;
          return s + p * it.quantity;
        }, 0);

        const storeOngkir = storeDeliveryFees[i];
        // Split discount proportionately
        const storeDiscount =
          cartSubtotal > 0
            ? Math.round((storeSubtotal / cartSubtotal) * discountAmount)
            : 0;

        const storeTotal =
          storeSubtotal +
          storeOngkir +
          (i === 0 ? serviceFee : 0) -
          storeDiscount;

        const orderItems: OrderItem[] = group.items.map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          product_id: it.product.id,
          product_name: it.product.name,
          price: it.product.promo_price ?? it.product.price,
          quantity: it.quantity,
          subtotal:
            (it.product.promo_price ?? it.product.price) * it.quantity,
          variations: it.selectedVariations,
          notes: it.notes,
        }));

        const newOrder = await createOrder({
          customer_name: customerName,
          customer_phone: customerPhone,
          store_id: storeId,
          store_name: group.store.name,
          store_phone: group.store.whatsapp || group.store.phone || '081200000000',
          store_address: group.store.address,
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
          order_type: 'delivery',
          items: orderItems,
          subtotal: storeSubtotal,
          delivery_fee: storeOngkir,
          service_fee: i === 0 ? serviceFee : 0,
          discount_amount: storeDiscount,
          promo_code: appliedPromo?.code,
          total_amount: Math.max(0, storeTotal),
          payment_method: selectedPaymentMethod,
          notes: orderNotes,
        });

        if (!firstOrderId) {
          firstOrderId = newOrder.id;
        }
      }

      clearCart();
      setIsSubmitting(false);
      onOrderCreated(firstOrderId);
    } catch {
      setIsSubmitting(false);
      alert('Terjadi kesalahan saat membuat order. Silakan coba lagi.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Keranjang Kosong</h3>
        <button
          onClick={() => setActiveTab('stores')}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Lihat Toko
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Top Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            Konfirmasi Checkout Pesanan
          </h1>
          <p className="text-xs text-slate-500">
            Periksa detail pengantaran dan rincian biaya.
          </p>
        </div>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="space-y-4">
        {/* Contact Info Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
            <span>Data Kontak Pemesan</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Penerima
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nomor WhatsApp (Aktif)
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Driver &amp; Admin akan menghubungi via WhatsApp ini.
              </span>
            </div>
          </div>
        </div>

        {/* Order Delivery Method Card - Strictly Kurir Payka */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
              <span>Metode Pengiriman</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Eksklusif Kurir Payka
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-sky-300 bg-sky-50/70 text-sky-950 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">Diantar Kurir Payka</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Resmi Singkawang
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Pesanan dijemput kurir resmi Payka langsung dari toko dan diantarkan ke alamat tujuan Anda.
              </p>
            </div>
          </div>

          {/* Delivery Address & Map Pinpoint */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 block">
                Alamat Lengkap Pengantaran di Singkawang <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 transition active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Pilih Titik di Peta</span>
              </button>
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, patokan / kelurahan..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Titik Koordinat: [{deliveryLat.toFixed(5)}, {deliveryLng.toFixed(5)}]</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="text-sky-600 font-bold hover:underline shrink-0 ml-2"
              >
                Ubah Titik
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan Pengantaran (Opsional)
            </label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Contoh: titip di pagar depan / rumah cat pagar biru"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* Promo Voucher Applicator */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-amber-500" />
            <span>Voucher Diskon &amp; Promo</span>
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              placeholder="Masukkan kode promo (contoh: PAYKABARU)"
              className="flex-1 px-3 py-2 text-xs uppercase rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-bold"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 transition"
            >
              Gunakan
            </button>
          </div>

          {promoError && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{promoError}</span>
            </p>
          )}

          {appliedPromo && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>
                  Voucher <strong>{appliedPromo.code}</strong> berhasil dipasang!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAppliedPromo(null)}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Payment Method Selector Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              <span>Metode Pembayaran Resmi</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">
              {availablePaymentMethods.length} Metode Aktif
            </span>
          </div>

          {availablePaymentMethods.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Metode Pembayaran Online Belum Diaktifkan</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Anda tetap dapat membuat pesanan. Admin akan memberikan rekening manual via WhatsApp.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">
                Pilih metode pembayaran yang Anda inginkan (hanya metode aktif dari Admin):
              </p>

              <div className="grid grid-cols-1 gap-2">
                {availablePaymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedPaymentMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedPaymentMethod(m.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-sky-600 bg-sky-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>{m.name}</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 shrink-0">
                            {m.id}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {m.category} {m.accountNumber ? `• ${m.accountNumber}` : ''}
                        </p>

                        {isSelected && m.instructions && (
                          <div className="mt-2 p-2.5 rounded-xl bg-white border border-sky-200/70 text-[11px] text-slate-700 space-y-1">
                            <div className="flex items-center gap-1 font-bold text-sky-700 text-[10px] uppercase">
                              <Info className="w-3 h-3" />
                              <span>Petunjuk Pembayaran:</span>
                            </div>
                            <p className="leading-relaxed text-slate-600">{m.instructions}</p>
                            {m.recipientName && (
                              <p className="text-[10px] text-slate-500 font-semibold pt-0.5">
                                Penerima: {m.recipientName}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2.5 shadow-xs text-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
            Rincian Pembayaran
          </h3>

          <div className="flex justify-between text-slate-600">
            <span>Subtotal Produk ({cart.length} item)</span>
            <span className="font-semibold text-slate-800">{formatRupiah(cartSubtotal)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Biaya Pengantaran (Kurir Payka)</span>
            <span className="font-semibold text-slate-800">
              {formatRupiah(totalDeliveryFee)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Biaya Layanan Aplikasi</span>
            <span className="font-semibold text-slate-800">{formatRupiah(serviceFee)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Diskon Voucher ({appliedPromo?.code})</span>
              <span>- {formatRupiah(discountAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
            <span>Total Tagihan:</span>
            <span className="text-base text-sky-600">{formatRupiah(grandTotal)}</span>
          </div>

          <p className="text-[10px] text-slate-400 italic pt-1">
            * Pembayaran manual via Transfer / QRIS pada langkah berikutnya. Verifikasi resmi
            dilakukan oleh Admin PAYKAJASTIP.
          </p>
        </div>

        {/* Fixed Submit CTA */}
        <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-extrabold text-xs shadow-xl shadow-sky-600/30 flex items-center justify-between active:scale-98 transition"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Buat Pesanan & Bayar'}</span>
            </div>
            <span>{formatRupiah(grandTotal)} →</span>
          </button>
        </div>
      </form>

      {/* Interactive OpenStreetMap Delivery Location Picker Modal */}
      {showLocationPicker && (
        <LocationPickerModal
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          initialLat={deliveryLat}
          initialLng={deliveryLng}
          initialAddress={deliveryAddress}
          storeLat={storeGroups[0]?.[1]?.store?.latitude}
          storeLng={storeGroups[0]?.[1]?.store?.longitude}
          storeName={storeGroups[0]?.[1]?.store?.name}
          onSelectLocation={(lat, lng, addr) => {
            setDeliveryLat(lat);
            setDeliveryLng(lng);
            if (addr) setDeliveryAddress(addr);
          }}
        />
      )}
    </div>
  );
};
