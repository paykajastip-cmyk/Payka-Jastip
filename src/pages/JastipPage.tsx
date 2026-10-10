import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Send,
  MapPin,
  Camera,
  CheckCircle2,
  FileText,
  Phone,
  HelpCircle,
  Clock,
  ExternalLink,
  Store as StoreIcon,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  Wallet,
  QrCode,
  Banknote,
  ArrowLeft,
  ChevronRight,
  Bike,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JastipRequest, Order } from '../types';
import { formatRupiah, createWhatsAppUrl } from '../utils/helpers';

interface JastipPageProps {
  setActiveTab: (tab: string) => void;
  onOpenOrder?: (order: Order) => void;
}

export const JastipPage: React.FC<JastipPageProps> = ({ setActiveTab, onOpenOrder }) => {
  const {
    currentUser,
    userLocation,
    adminSettings,
    createJastipRequest,
    createOrder,
    stores,
    jastipTargetStore,
    setJastipTargetStore,
  } = useApp();

  // Form State
  const [name, setName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [targetStore, setTargetStore] = useState(jastipTargetStore?.storeName || '');
  const [pickupAddress, setPickupAddress] = useState(jastipTargetStore?.address || '');
  const [deliveryAddress, setDeliveryAddress] = useState(userLocation.address);
  const [estimatedBudget, setEstimatedBudget] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Available payment methods based on Admin Settings
  const availablePaymentMethods = useMemo(() => {
    const list: Array<{
      id: 'COD' | 'BANK' | 'VA' | 'DANA' | 'QRIS';
      name: string;
      category: string;
      instructions?: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [];

    // COD
    if (adminSettings.cod_active !== false) {
      list.push({
        id: 'COD',
        name: 'COD (Bayar di Tempat)',
        category: 'Tunai saat Barang Tiba',
        instructions: adminSettings.cod_instructions || 'Bayar tunai kepada driver saat pesanan tiba di alamat Anda.',
        icon: Banknote,
      });
    }

    // Bank
    if (adminSettings.bank_active && (adminSettings.bank_account_number || adminSettings.payment_account_number)) {
      list.push({
        id: 'BANK',
        name: adminSettings.bank_name || 'Transfer Bank',
        category: 'Transfer Bank Manual',
        instructions: adminSettings.bank_instructions || 'Transfer sesuai total tagihan lalu upload bukti transfer.',
        icon: Building2,
      });
    }

    // VA
    if (adminSettings.va_active && adminSettings.va_number) {
      list.push({
        id: 'VA',
        name: adminSettings.va_provider || 'Virtual Account',
        category: 'Virtual Account',
        instructions: adminSettings.va_instructions || 'Bayar via VA resmi.',
        icon: ShieldCheck,
      });
    }

    // DANA
    if (adminSettings.dana_active && adminSettings.dana_number) {
      list.push({
        id: 'DANA',
        name: 'DANA E-Wallet',
        category: 'Dompet Digital DANA',
        instructions: adminSettings.dana_instructions || 'Transfer ke nomor akun DANA resmi.',
        icon: Wallet,
      });
    }

    // QRIS
    if (adminSettings.qris_active && (adminSettings.qris_image_url || adminSettings.payment_qr_url)) {
      list.push({
        id: 'QRIS',
        name: adminSettings.qris_merchant_name || 'QRIS Resmi',
        category: 'Semua E-Wallet & M-Banking',
        instructions: adminSettings.qris_instructions || 'Scan QRIS via mobile banking atau e-wallet.',
        icon: QrCode,
      });
    }

    return list;
  }, [adminSettings]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'BANK' | 'VA' | 'DANA' | 'QRIS'>('COD');

  // Set default method if current not in available
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.some((m) => m.id === selectedPaymentMethod)) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods, selectedPaymentMethod]);

  // Page View Modes: 'form' | 'confirm' | 'success'
  const [viewMode, setViewMode] = useState<'form' | 'confirm' | 'success'>('form');

  // Success state result
  const [createdRequest, setCreatedRequest] = useState<JastipRequest | null>(null);
  const [createdOrderResult, setCreatedOrderResult] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if opened with a preset store from home / directory
  useEffect(() => {
    if (jastipTargetStore) {
      setTargetStore(jastipTargetStore.storeName);
      if (jastipTargetStore.address) {
        setPickupAddress(jastipTargetStore.address);
      }
    }
  }, [jastipTargetStore]);

  // Pricing breakdown
  const jastipFee = 15000; // Tarif jasa jastip Singkawang
  const serviceFee = adminSettings.service_fee || 2000;
  const budgetNum = typeof estimatedBudget === 'number' ? estimatedBudget : 0;
  const totalEstimation = budgetNum + jastipFee + serviceFee;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 1: User clicks "Jastip Sekarang" -> Validates and opens Confirmation View
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !targetStore.trim() || !deliveryAddress.trim() || !name.trim() || !phone.trim()) {
      alert('Mohon lengkapi Nama Barang, Toko Pembelian, Alamat Pengantaran, serta Nama dan No. WhatsApp Pemesan.');
      return;
    }
    // Switch to full checkout confirmation step
    setViewMode('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: User reviews and confirms -> Creates order & triggers auto-dispatch
  const handleConfirmAndOrder = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create JastipRequest entry
      const jastipRes = await createJastipRequest({
        customer_id: currentUser?.id || 'guest',
        customer_name: name,
        customer_phone: phone,
        item_name: itemName,
        quantity,
        target_store: targetStore,
        pickup_address: pickupAddress || targetStore,
        delivery_address: deliveryAddress,
        notes,
        photo_url: photoPreview || undefined,
        estimated_budget: budgetNum,
        service_fee: jastipFee,
        status: 'PENDING',
      });

      // Find store if matching
      const matchedStore = stores.find(
        (s) => s.id === selectedStoreId || s.name.toLowerCase() === targetStore.toLowerCase()
      );

      // 2. Create Order entry (triggers automatic driver assignment without waiting for admin)
      const orderRes = createOrder({
        customer_id: currentUser?.id || 'guest',
        customer_name: name,
        customer_phone: phone,
        store_id: matchedStore?.id || 'store-jastip-custom',
        store_name: targetStore,
        store_phone: matchedStore?.whatsapp || adminSettings.whatsapp_admin,
        store_address: pickupAddress || targetStore,
        delivery_address: deliveryAddress,
        order_type: 'delivery',
        items: [
          {
            id: `item-jst-${Date.now()}`,
            product_id: `prod-jst-${Date.now()}`,
            product_name: `[JASTIP] ${itemName}`,
            price: budgetNum > 0 ? budgetNum : jastipFee,
            quantity: quantity,
            subtotal: budgetNum > 0 ? budgetNum : jastipFee,
            notes: notes || undefined,
          },
        ],
        subtotal: budgetNum,
        delivery_fee: jastipFee,
        service_fee: serviceFee,
        total_amount: totalEstimation,
        payment_method: selectedPaymentMethod,
        notes: `Jastip: ${itemName} (${quantity} pcs). Catatan: ${notes || '-'}. Beli di: ${targetStore}`,
      });

      setCreatedRequest(jastipRes);
      setCreatedOrderResult(orderRes);
      setViewMode('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Gagal membuat pesanan jastip: ${err?.message || 'Silakan coba lagi'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWaConfirmationUrl = (req: JastipRequest, ord?: Order | null) => {
    const text =
      `*KONFIRMASI JASTIP PAYKAJASTIP*\n` +
      `No. Request: #${req.request_number}\n` +
      (ord ? `No. Order: #${ord.order_number}\n` : '') +
      `Nama Pemesan: ${req.customer_name}\n` +
      `No. WA: ${req.customer_phone}\n` +
      `Barang Titip: ${req.item_name} (${req.quantity} pcs)\n` +
      `Tempat Beli: ${req.target_store}\n` +
      `Antar ke: ${req.delivery_address}\n` +
      `Perkiraan Belanja: ${formatRupiah(req.estimated_budget || 0)}\n` +
      `Tarif Jastip: ${formatRupiah(req.service_fee)}\n` +
      `Metode Bayar: ${selectedPaymentMethod === 'COD' ? 'COD (Bayar di Tempat)' : selectedPaymentMethod}\n` +
      (req.notes ? `Catatan: ${req.notes}\n` : '') +
      (ord?.driver_name ? `Driver Otomatis: ${ord.driver_name}\n` : '') +
      `\nMohon konfirmasi pesanan jastip ini. Terima kasih!`;

    return createWhatsAppUrl(adminSettings.whatsapp_admin, text);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Layanan Jastip Singkawang</span>
        </div>
        <h1 className="text-lg font-black text-slate-900 tracking-tight">
          Jasa Titip (Jastip) Apa Saja
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ingin beli makanan di pasar, kuliner malam, toko oleh-oleh, atau belanjaan yang belum ada di menu?
          Tulis request Anda di sini, sistem langsung mencarikan driver terdekat untuk membelikan dan mengantar ke rumah Anda!
        </p>
      </div>

      {/* =========================================================================
          VIEW MODE 1: FORM INPUT PEMESANAN JASTIP
      ========================================================================= */}
      {viewMode === 'form' && (
        <form onSubmit={handleProceedToConfirmation} className="space-y-4">
          {/* Preset store notification if selected from directory */}
          {jastipTargetStore && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  🛍️
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 tracking-wide">
                    Toko Terpilih
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                    {jastipTargetStore.storeName}
                  </h4>
                  {jastipTargetStore.address && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {jastipTargetStore.address}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setJastipTargetStore(null);
                  setTargetStore('');
                  setPickupAddress('');
                  setSelectedStoreId('');
                }}
                className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-[11px] font-bold text-amber-900 shrink-0 transition"
              >
                Ganti Toko
              </button>
            </div>
          )}

          {/* Quick Store Selector from Registered Stores */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilih Toko Terdaftar Singkawang (Opsional):</span>
              </label>
              <span className="text-[10px] text-slate-400">Atau ketik bebas di bawah</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedStoreId('');
                  setTargetStore('');
                  setPickupAddress('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  !selectedStoreId
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ketik Sendiri
              </button>

              {stores
                .filter((s) => s.is_active !== false)
                .slice(0, 10)
                .map((st) => {
                  const isSelected = selectedStoreId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStoreId(st.id);
                        setTargetStore(st.name);
                        setPickupAddress(st.address);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span>{st.name}</span>
                      <span className="text-[9px] opacity-75">({st.district})</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Item & Target Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Barang yang Ingin Dititip</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Barang / Menu yang Dititip *
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Contoh: Choipan Panas Pasar Beringin, Kopi Bubuk Cap Obor, Kue Keranjang..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jumlah / Kuantitas *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Perkiraan Budget Belanja (Rp)
                </label>
                <input
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) =>
                    setEstimatedBudget(e.target.value ? parseInt(e.target.value) : '')
                  }
                  placeholder="Misal: 50000"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Toko / Lokasi Tempat Pembelian *
              </label>
              <input
                type="text"
                required
                value={targetStore}
                onChange={(e) => setTargetStore(e.target.value)}
                placeholder="Contoh: Warung Kopi Sejahtera, Pasar Hongkong, Toko Oleh-oleh Jl. Diponegoro"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alamat Pickup / Patokan Toko (Opsional)
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Contoh: Dekat Vihara Tri Dharma Bumi Raya, Singkawang Barat"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alamat Pengantaran (Tujuan Anda di Singkawang) *
              </label>
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Alamat rumah, kelurahan, nomor WA penerima..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Khusus / Permintaan Rasa
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: sambal dipisah, pilih buah yang matang, goreng garing"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Foto Contoh Barang (Opsional)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-3 text-center hover:border-amber-400 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {photoPreview ? (
                  <div className="space-y-1">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-24 mx-auto rounded-xl object-contain border border-slate-200"
                    />
                    <span className="text-[10px] text-amber-600 font-bold underline">
                      Klik untuk ganti foto
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>Upload foto produk/menu yang dimaksud</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Data */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
              <span>Data Kontak Pemesan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Pemesan *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector (Perintah 4 - Termasuk COD) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>Pilih Metode Pembayaran Jastip</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Tersedia COD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availablePaymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedPaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/50 shadow-2xs ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs font-bold text-slate-900 truncate">
                          {m.name}
                        </strong>
                        {m.id === 'COD' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                            TUNAI
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPaymentMethod === 'COD' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Pembayaran COD (Bayar di Tempat):</strong>
                  <p className="mt-0.5">
                    Anda cukup membayar uang belanja + ongkir tunai kepada kurir saat pesanan tiba di alamat Anda. Tidak perlu upload bukti transfer.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-[11px] text-sky-900 leading-relaxed flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Pembayaran Transfer ({selectedPaymentMethod}):</strong>
                  <p className="mt-0.5">
                    Silakan transfer ke rekening resmi PAYKAJASTIP dan upload bukti bayar pada halaman order setelah konfirmasi.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-2 shadow-lg">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Estimasi Belanja Barang:</span>
              <span>{budgetNum > 0 ? formatRupiah(budgetNum) : 'Disesuaikan di nota belanja'}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Tarif Jasa Jastip:</span>
              <span>{formatRupiah(jastipFee)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Biaya Layanan Sistem:</span>
              <span>{formatRupiah(serviceFee)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold text-amber-400">
              <span>Total Estimasi:</span>
              <span>{formatRupiah(totalEstimation)}</span>
            </div>
          </div>

          {/* Tombol Jastip Sekarang (Membuka Konfirmasi Checkout) */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>JASTIP SEKARANG &amp; PERIKSA DETAIL</span>
          </button>
        </form>
      )}

      {/* =========================================================================
          VIEW MODE 2: HALAMAN KONFIRMASI CHECKOUT JASTIP (PERINTAH 2)
      ========================================================================= */}
      {viewMode === 'confirm' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-slate-950 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full">
                Langkah Terakhir
              </span>
              <h2 className="text-lg font-black mt-1">Konfirmasi Pesanan Jastip</h2>
              <p className="text-xs text-slate-900 opacity-90 mt-0.5">
                Periksa seluruh rincian pesanan Anda sebelum sistem mencari driver terdekat secara otomatis.
              </p>
            </div>
          </div>

          {/* Card: Review Data Pemesan & Barang */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Detail Barang &amp; Pemesan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Barang Titipan:</span>
                <strong className="text-slate-900 text-sm block">{itemName}</strong>
                <span className="text-slate-600 font-bold block">Jumlah: {quantity} pcs</span>
                {notes && <p className="text-slate-500 italic mt-1">"{notes}"</p>}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Data Kontak:</span>
                <strong className="text-slate-900 text-sm block">{name}</strong>
                <span className="text-slate-600 font-mono block">WhatsApp: {phone}</span>
              </div>
            </div>

            {photoPreview && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <img
                  src={photoPreview}
                  alt="Contoh"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Foto Referensi Terlampir</span>
                  <span className="text-slate-500 text-[11px]">Kurir akan mencari barang sesuai foto ini</span>
                </div>
              </div>
            )}
          </div>

          {/* Card: Lokasi Belanja & Pengantaran */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>Rute Belanja &amp; Pengantaran</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lokasi Toko Pembelian:</span>
                  <strong className="text-slate-900 text-sm">{targetStore}</strong>
                  {pickupAddress && <p className="text-slate-500 mt-0.5">{pickupAddress}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Alamat Tujuan Pengantaran:</span>
                  <strong className="text-slate-900 text-sm">{deliveryAddress}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Metode Pembayaran & Rincian Tagihan */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-xs text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Metode Pembayaran &amp; Biaya</span>
              </span>
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
              >
                Ubah Metode
              </button>
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  {selectedPaymentMethod === 'COD' ? <Banknote className="w-5 h-5 text-emerald-400" /> : <CreditCard className="w-5 h-5 text-sky-400" />}
                </div>
                <div>
                  <strong className="text-slate-900 block">
                    {selectedPaymentMethod === 'COD' ? 'COD (Cash On Delivery)' : `Transfer ${selectedPaymentMethod}`}
                  </strong>
                  <span className="text-slate-500 text-[11px]">
                    {selectedPaymentMethod === 'COD' ? 'Bayar tunai kepada kurir saat tiba' : 'Transfer rekening / scan QRIS'}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${selectedPaymentMethod === 'COD' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                {selectedPaymentMethod === 'COD' ? 'BAYAR DI TEMPAT' : 'NON-TUNAI'}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Perkiraan Belanja:</span>
                <span className="font-semibold">{budgetNum > 0 ? formatRupiah(budgetNum) : 'Sesuai nota beli'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tarif Jasa Jastip:</span>
                <span className="font-semibold">{formatRupiah(jastipFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Layanan:</span>
                <span className="font-semibold">{formatRupiah(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-slate-900 text-sm font-extrabold pt-2 border-t border-slate-200">
                <span>Total Estimasi Tagihan:</span>
                <span className="text-amber-600">{formatRupiah(totalEstimation)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Kembali atau Konfirmasi & Pesan */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className="flex-1 py-3.5 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali &amp; Ubah Data</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmAndOrder}
              className="flex-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses Pesanan & Mencari Driver...' : 'KONFIRMASI & PESAN SEKARANG'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: SUCCESS STATE & AUTO DRIVER DISPATCH CONFIRMATION
      ========================================================================= */}
      {viewMode === 'success' && createdRequest && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              PESANAN JASTIP BERHASIL DIBUAT
            </span>
            <h2 className="text-xl font-mono font-black text-sky-600 mt-0.5">
              #{createdRequest.request_number}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Sistem telah menerima pesanan Anda dan menjalankan pencarian driver terdekat di Singkawang.
            </p>
          </div>

          {/* Auto-Assigned Driver Information Badge */}
          {createdOrderResult?.driver_name ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Driver Otomatis Ditugaskan 🚀</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  Driver Aktif
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block">{createdOrderResult.driver_name}</strong>
                  <span className="text-slate-500 text-[11px] font-mono">{createdOrderResult.driver_phone}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Sedang menuju lokasi toko</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs space-y-1">
              <strong className="text-amber-900 block">Sedang Menghubungkan ke Driver Terdekat...</strong>
              <p className="text-amber-700 text-[11px]">
                Sistem sedang memanggil kurir online terdekat di area Singkawang untuk menjemput barang titipan Anda.
              </p>
            </div>
          )}

          {/* Order Summary breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Barang:</span>
              <span className="font-bold text-slate-800">
                {createdRequest.item_name} ({createdRequest.quantity} pcs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tempat Beli:</span>
              <span className="font-bold text-slate-800">{createdRequest.target_store}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode Bayar:</span>
              <span className="font-bold text-slate-800">
                {selectedPaymentMethod === 'COD' ? 'COD (Bayar Tunai di Tempat)' : `Transfer ${selectedPaymentMethod}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Estimasi:</span>
              <span className="font-bold text-amber-600">{formatRupiah(totalEstimation)}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 space-y-2">
            {createdOrderResult && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenOrder) {
                    onOpenOrder(createdOrderResult);
                  } else {
                    setActiveTab('orders');
                  }
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
              >
                <Bike className="w-4 h-4" />
                <span>PANTAU PESANAN &amp; LACAK DRIVER</span>
              </button>
            )}

            <a
              href={getWaConfirmationUrl(createdRequest, createdOrderResult)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <Phone className="w-4 h-4" />
              <span>HUBUNGI VIA WHATSAPP ADMIN</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setViewMode('form');
                setCreatedRequest(null);
                setCreatedOrderResult(null);
                setJastipTargetStore(null);
                setItemName('');
                setTargetStore('');
                setPickupAddress('');
                setNotes('');
                setPhotoPreview(null);
              }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Buat Pesanan Jastip Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
