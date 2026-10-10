import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Bike,
  Store,
  CreditCard,
  Star,
  FileText,
  AlertCircle,
  X,
  Navigation,
  Banknote,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import {
  formatRupiah,
  formatIndoDate,
  createWhatsAppUrl,
  getGoogleMapsNavUrl,
  calculateDistanceKm,
} from '../utils/helpers';

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  onOpenPayment: (orderId: string) => void;
}

const STATUS_STEPS: OrderStatus[] = [
  'MENUNGGU KONFIRMASI',
  'TOKO MENERIMA',
  'MENUNGGU DRIVER',
  'DRIVER MENUJU LOKASI',
  'BARANG DIAMBIL',
  'DRIVER MENUJU CUSTOMER',
  'SELESAI',
];

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  order,
  onBack,
  onOpenPayment,
}) => {
  const { addReview, currentUser, stores, drivers } = useApp();

  // If order is unexpectedly null or undefined
  if (!order) {
    return (
      <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
          📦
        </div>
        <h2 className="text-base font-bold text-slate-800">Data Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">Silakan kembali ke daftar riwayat pesanan.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
        >
          Kembali ke Pesanan
        </button>
      </div>
    );
  }

  const orderItems = Array.isArray(order.items) ? order.items : [];

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [storeRating, setStoreRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Map Tracking States
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Dynamic coordinates for store, delivery, and driver
  const targetStore = stores.find((s) => s.id === order.store_id);
  const storeLat = targetStore?.latitude || 0.9056;
  const storeLng = targetStore?.longitude || 108.9868;

  const destLat = order.delivery_lat || 0.9085;
  const destLng = order.delivery_lng || 108.9840;

  // Driver dynamic coordinates (starts at driver_lat or driver's current position)
  const assignedDriver = drivers.find((d) => d.id === order.driver_id);
  const [currentDriverLat, setCurrentDriverLat] = useState<number>(
    order.driver_lat || assignedDriver?.current_lat || storeLat - 0.003
  );
  const [currentDriverLng, setCurrentDriverLng] = useState<number>(
    order.driver_lng || assignedDriver?.current_lng || storeLng - 0.002
  );

  // Distance & ETA
  const distanceToDestKm = calculateDistanceKm(
    currentDriverLat,
    currentDriverLng,
    destLat,
    destLng
  );
  const etaMinutes = Math.max(3, Math.round(distanceToDestKm * 3.5));

  // Initialize and update live tracking map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [(storeLat + destLat) / 2, (storeLng + destLng) / 2],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Store Marker (Blue)
      const storeIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md border-2 border-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <span class="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow mt-0.5 truncate max-w-[100px]">${order.store_name}</span>
          </div>
        `,
        className: 'custom-store-pin',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);

      // Destination Marker (Green)
      const destIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <span class="bg-emerald-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow mt-0.5 truncate max-w-[100px]">Tujuan</span>
          </div>
        `,
        className: 'custom-dest-pin',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });
      L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

      // Polyline route
      const polyline = L.polyline(
        [
          [currentDriverLat, currentDriverLng],
          [storeLat, storeLng],
          [destLat, destLng],
        ],
        { color: '#0284c7', weight: 4, dashArray: '6, 8', opacity: 0.8 }
      ).addTo(map);
      routeLineRef.current = polyline;

      // Fit Bounds
      map.fitBounds([
        [storeLat, storeLng],
        [destLat, destLng],
        [currentDriverLat, currentDriverLng],
      ], { padding: [40, 40] });

      mapInstanceRef.current = map;
    }

    // Update driver marker
    if (mapInstanceRef.current) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
      }

      const driverIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="relative">
              <div class="absolute -inset-1 bg-amber-400 rounded-full animate-ping opacity-75"></div>
              <div class="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-300 relative z-10 font-bold">
                🛵
              </div>
            </div>
            <span class="bg-amber-950 text-amber-200 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow mt-0.5 truncate max-w-[110px]">
              ${order.driver_name || 'Driver Payka'}
            </span>
          </div>
        `,
        className: 'custom-driver-pin',
        iconSize: [36, 48],
        iconAnchor: [18, 48],
      });

      const marker = L.marker([currentDriverLat, currentDriverLng], {
        icon: driverIcon,
        zIndexOffset: 3000,
      }).addTo(mapInstanceRef.current);
      driverMarkerRef.current = marker;
    }
  }, [storeLat, storeLng, destLat, destLng, currentDriverLat, currentDriverLng, order.driver_name]);

  // Live simulation ticker: moves the driver smoothly if order is active
  useEffect(() => {
    const isOngoing =
      order.status === 'DRIVER MENUJU LOKASI' ||
      order.status === 'BARANG DIAMBIL' ||
      order.status === 'DRIVER MENUJU CUSTOMER';

    if (!isOngoing) return;

    const interval = setInterval(() => {
      // Step slightly towards the destination
      setCurrentDriverLat((prevLat) => {
        const delta = (destLat - prevLat) * 0.08;
        return prevLat + delta;
      });
      setCurrentDriverLng((prevLng) => {
        const delta = (destLng - prevLng) * 0.08;
        return prevLng + delta;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [order.status, destLat, destLng]);

  // Status index for timeline
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'DIBATALKAN';

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReview({
      order_id: order.id,
      customer_id: currentUser?.id || order.customer_id,
      customer_name: currentUser?.full_name || order.customer_name,
      store_id: order.store_id,
      driver_id: order.driver_id,
      store_rating: storeRating,
      driver_rating: driverRating,
      comment: reviewComment,
    });
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowRatingModal(false);
      setReviewSubmitted(false);
    }, 1500);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pesanan</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-600">
          #{order.order_number}
        </span>
      </div>

      {/* COD Payment Highlight Card (Perintah 4) */}
      {order.payment_method === 'COD' && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-3xl shadow-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-emerald-950 uppercase">
                  Metode Pembayaran: COD (Bayar di Tempat)
                </h4>
                <span className="text-[10px] text-emerald-700 font-medium">
                  Tidak perlu transfer bank. Pembayaran diserahkan langsung ke kurir.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              TUNAI
            </span>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-semibold">Siapkan Uang Pas Tunai:</span>
            <span className="text-base font-black text-emerald-700">
              {formatRupiah(order.total_amount)}
            </span>
          </div>
        </div>
      )}

      {/* Status Timeline Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              STATUS TERKINI
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{order.status}</h2>
          </div>
          <span className="text-xs text-slate-400">{formatIndoDate(order.updated_at)}</span>
        </div>

        {/* Progress Stepper */}
        {!isCancelled ? (
          <div className="space-y-3 pt-1">
            {STATUS_STEPS.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="flex items-start gap-3 relative">
                  {/* Vertical line indicator */}
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                        currentStepIndex > idx ? 'bg-sky-600' : 'bg-slate-200'
                      }`}
                      style={{ height: '24px' }}
                    />
                  )}

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition ${
                      isPassed
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    } ${isCurrent ? 'ring-4 ring-sky-100 scale-105' : ''}`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4
                      className={`text-xs ${
                        isCurrent
                          ? 'font-extrabold text-sky-950'
                          : isPassed
                          ? 'font-bold text-slate-800'
                          : 'font-medium text-slate-400'
                      }`}
                    >
                      {step}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Pesanan ini telah dibatalkan.</span>
          </div>
        )}

        {/* Non-COD Payment CTA Banners */}
        {order.payment_method !== 'COD' && order.payment_status === 'waiting_payment' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-900">Menunggu Pembayaran</h4>
              <p className="text-[11px] text-amber-700">
                Silakan transfer ke rekening resmi atau scan QRIS sebelum pesanan diproses.
              </p>
            </div>
            <button
              onClick={() => onOpenPayment(order.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition cursor-pointer"
            >
              Bayar Sekarang
            </button>
          </div>
        )}

        {order.payment_method !== 'COD' && order.payment_status === 'waiting_confirmation' && (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 animate-spin" />
              <div>
                <h4 className="text-xs font-bold text-sky-900">Menunggu Verifikasi Admin</h4>
                <p className="text-[11px] text-sky-700 leading-relaxed">
                  Bukti pembayaran sudah terkirim. Admin sedang memeriksa mutasi pembayaran Anda.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenPayment(order.id)}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition cursor-pointer"
            >
              Lihat Bukti
            </button>
          </div>
        )}

        {order.payment_method !== 'COD' && order.payment_status === 'paid' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Pembayaran Berhasil (PAID)</h4>
              <p className="text-[11px] text-emerald-700">
                Pembayaran telah resmi diverifikasi oleh Admin. Toko sedang menyiapkan pesanan Anda.
              </p>
            </div>
          </div>
        )}

        {order.payment_method !== 'COD' && order.payment_status === 'failed' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">Pembayaran Ditolak</h4>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Bukti transfer tidak sesuai atau tidak terbaca. Silakan kirim ulang bukti yang valid.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenPayment(order.id)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition cursor-pointer"
            >
              Unggah Ulang
            </button>
          </div>
        )}

        {/* Review CTA if order completed */}
        {order.status === 'SELESAI' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Pesanan Telah Selesai!</h4>
              <p className="text-[11px] text-emerald-700">
                Beri ulasan dan rating untuk toko dan kurir pengantar.
              </p>
            </div>
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition cursor-pointer"
            >
              Beri Ulasan
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          LIVE TRACKING PETA DRIVER SECARA LANGSUNG (PERINTAH 5)
      ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Pelacakan Posisi Driver Langsung (Live Map)
              </h3>
              <p className="text-[11px] text-slate-500">
                Peta rute penjemputan dari {order.store_name} ke {order.delivery_address}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>LIVE GPS</span>
          </span>
        </div>

        {/* Live Metrics: ETA & Distance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimasi Tiba (ETA):</span>
            <strong className="text-slate-900 text-sm">{etaMinutes} Menit</strong>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Jarak Tempuh:</span>
            <strong className="text-sky-600 text-sm">{distanceToDestKm.toFixed(1)} KM</strong>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Driver Penjemput:</span>
            <strong className="text-slate-900 text-xs truncate block">{order.driver_name || 'Driver Terdekat'}</strong>
          </div>
        </div>

        {/* Leaflet Live Map Canvas */}
        <div className="h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Driver Card & Actions */}
        {order.driver_id ? (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                🛵
              </div>
              <div>
                <strong className="text-slate-900 text-sm block">{order.driver_name}</strong>
                <span className="text-slate-500 text-[11px]">Kurir Resmi Payka Singkawang • {order.driver_phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {order.driver_phone && (
                <a
                  href={createWhatsAppUrl(
                    order.driver_phone,
                    `Halo ${order.driver_name}, saya pemesan order #${order.order_number}. Posisi sedang di mana ya?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Chat WhatsApp Driver</span>
                </a>
              )}

              <a
                href={getGoogleMapsNavUrl(storeLat, storeLng, destLat, destLng)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-spin" />
            <span>Sistem sedang menugaskan driver terdekat ke lokasi toko {order.store_name}...</span>
          </div>
        )}
      </div>

      {/* Store & Destination Addresses */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs text-xs">
        <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
          Rute Lokasi
        </h3>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <span className="text-slate-400 text-[10px] block">Alamat Toko:</span>
            <strong className="text-slate-800">{order.store_name}</strong>
            <p className="text-slate-500 text-[11px] mt-0.5">{order.store_address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <span className="text-slate-400 text-[10px] block">Alamat Tujuan:</span>
            <strong className="text-slate-800">{order.customer_name}</strong>
            <p className="text-slate-500 text-[11px] mt-0.5">{order.delivery_address}</p>
          </div>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs text-xs">
        <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
          Rincian Produk
        </h3>

        <div className="divide-y divide-slate-100">
          {orderItems.map((it) => (
            <div key={it.id} className="py-2.5 flex justify-between items-start">
              <div>
                <span className="font-bold text-slate-800">
                  {it.quantity}x {it.product_name}
                </span>
                {it.notes && (
                  <p className="text-[10px] text-slate-400 italic">Catatan: {it.notes}</p>
                )}
              </div>
              <span className="font-extrabold text-slate-900">{formatRupiah(it.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal Produk</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Biaya Pengantaran</span>
            <span>{formatRupiah(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Biaya Layanan</span>
            <span>{formatRupiah(order.service_fee)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Diskon Voucher</span>
              <span>- {formatRupiah(order.discount_amount)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
            <span>Total Tagihan:</span>
            <span className="text-base text-sky-600">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Beri Ulasan Pesanan</h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Terima Kasih!</h4>
                <p className="text-xs text-slate-500">Ulasan Anda sangat berarti bagi kami.</p>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="mt-3 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Rating untuk Toko ({order.store_name})
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setStoreRating(star)}
                        className="text-amber-400 p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= storeRating ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Rating untuk Kurir Pengantar
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setDriverRating(star)}
                        className="text-amber-400 p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= driverRating ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ulasan / Komentar (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Makanannya enak, kurir sopan dan cepat..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20"
                >
                  Kirim Ulasan
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
