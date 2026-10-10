import React, { useState } from 'react';
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
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import {
  formatRupiah,
  formatIndoDate,
  createWhatsAppUrl,
  getGoogleMapsNavUrl,
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
  const { addReview, currentUser, updateOrderStatus } = useApp();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [storeRating, setStoreRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-white border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pesanan</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-600">
          #{order.order_number}
        </span>
      </div>

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

        {/* Payment CTA Banner for all 4 payment statuses */}
        {order.payment_status === 'waiting_payment' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-900">Menunggu Pembayaran</h4>
              <p className="text-[11px] text-amber-700">
                Silakan transfer ke rekening resmi atau scan QRIS sebelum pesanan diproses.
              </p>
            </div>
            <button
              onClick={() => onOpenPayment(order.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition"
            >
              Bayar Sekarang
            </button>
          </div>
        )}

        {order.payment_status === 'waiting_confirmation' && (
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
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition"
            >
              Lihat Bukti
            </button>
          </div>
        )}

        {order.payment_status === 'paid' && (
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

        {order.payment_status === 'failed' && (
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
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition"
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
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shrink-0 active:scale-95 transition"
            >
              Beri Ulasan
            </button>
          </div>
        )}
      </div>

      {/* Driver Info Card */}
      {order.driver_id && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-sky-600" />
              <span>Kurir Pengantar</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Driver Payka</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800">{order.driver_name}</h4>
              <p className="text-[11px] text-slate-500">{order.driver_phone}</p>
            </div>

            {order.driver_phone && (
              <a
                href={createWhatsAppUrl(
                  order.driver_phone,
                  `Halo ${order.driver_name}, saya pemesan order #${order.order_number}. Posisi di mana ya?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-emerald-700 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>
            )}
          </div>
        </div>
      )}

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
          {order.items.map((it) => (
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
                {/* Store rating */}
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

                {/* Driver rating */}
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
