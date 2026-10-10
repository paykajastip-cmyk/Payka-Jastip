import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  QrCode,
  ShieldCheck,
  MessageCircle,
  Wallet,
  Building2,
  Trash2,
} from 'lucide-react';
import { Order, Payment } from '../types';
import { useApp } from '../context/AppContext';
import { formatRupiah, formatIndoDate, createWhatsAppUrl } from '../utils/helpers';

interface PaymentMethodItem {
  id: 'QRIS' | 'BANK' | 'VA' | 'DANA';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PaymentPageProps {
  orderId: string;
  onBack: () => void;
  onPaymentSuccess: () => void;
  setActiveTab: (tab: string) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  orderId,
  onBack,
  onPaymentSuccess,
  setActiveTab,
}) => {
  const { orders, payments, adminSettings, submitPaymentProof } = useApp();

  const order = orders.find((o) => o.id === orderId);
  const payment = payments.find((p) => p.order_id === orderId);

  const activePaymentMethods = useMemo<PaymentMethodItem[]>(() => {
    const methods: PaymentMethodItem[] = [];

    // Bank Transfer
    if (adminSettings.bank_active && (adminSettings.bank_account_number || adminSettings.payment_account_number)) {
      methods.push({ id: 'BANK', label: adminSettings.bank_name || 'Bank', icon: CreditCard });
    }

    // Virtual Account
    if (adminSettings.va_active && adminSettings.va_number) {
      methods.push({ id: 'VA', label: adminSettings.va_provider || 'VA', icon: ShieldCheck });
    }

    // DANA
    if (adminSettings.dana_active && adminSettings.dana_number) {
      methods.push({ id: 'DANA', label: 'DANA', icon: Wallet });
    }

    // QRIS
    if (adminSettings.qris_active && (adminSettings.qris_image_url || adminSettings.payment_qr_url)) {
      methods.push({ id: 'QRIS', label: 'QRIS', icon: QrCode });
    }

    return methods;
  }, [adminSettings]);

  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'QRIS' | 'BANK' | 'VA' | 'DANA'>('BANK');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-select preferred method from order or first active method
  useEffect(() => {
    if (activePaymentMethods.length > 0) {
      const orderPref = order?.payment_method as 'QRIS' | 'BANK' | 'VA' | 'DANA' | undefined;
      if (orderPref && activePaymentMethods.some((m) => m.id === orderPref)) {
        setSelectedMethod(orderPref);
      } else if (!activePaymentMethods.some((m) => m.id === selectedMethod)) {
        setSelectedMethod(activePaymentMethods[0].id);
      }
    }
  }, [activePaymentMethods, order?.payment_method]);

  const [proofFilePreview, setProofFilePreview] = useState<string | null>(
    payment?.proof_url || null
  );
  const [proofFileName, setProofFileName] = useState<string>(
    payment?.proof_name || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Pesanan Tidak Ditemukan</h3>
        <button
          onClick={() => setActiveTab('orders')}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Lihat Riwayat Pesanan
        </button>
      </div>
    );
  }

  // Handle Copy Text (Bank / VA / DANA)
  const handleCopyText = (text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Mohon pilih file gambar bukti transfer (JPG / JPEG / PNG).');
      return;
    }

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Proof Action
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!proofFilePreview) {
      setUploadError('Mohon lampirkan foto bukti pembayaran transfer atau QRIS.');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      submitPaymentProof(
        order.id,
        selectedMethod,
        proofFilePreview,
        proofFileName || 'bukti-transfer.jpg'
      );
      setIsUploading(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onPaymentSuccess();
      }, 1500);
    }, 800);
  };

  const paymentStatus = payment?.payment_status || order.payment_status || 'waiting_payment';

  return (
    <div className="space-y-4 pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-white border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-500">
          #{order.order_number}
        </span>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-3xl border flex items-start gap-3 ${
          paymentStatus === 'paid'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : paymentStatus === 'waiting_confirmation'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : paymentStatus === 'failed'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}
      >
        {paymentStatus === 'paid' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        ) : paymentStatus === 'waiting_confirmation' ? (
          <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-spin" />
        ) : paymentStatus === 'failed' ? (
          <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <CreditCard className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
        )}

        <div>
          <h3 className="text-sm font-bold">
            {paymentStatus === 'paid'
              ? 'Pembayaran Terverifikasi (PAID)'
              : paymentStatus === 'waiting_confirmation'
              ? 'Menunggu Konfirmasi Admin'
              : paymentStatus === 'failed'
              ? 'Pembayaran Ditolak'
              : 'Menunggu Pembayaran Manual'}
          </h3>
          <p className="text-xs mt-0.5 leading-relaxed opacity-90">
            {paymentStatus === 'paid'
              ? `Pembayaran telah diverifikasi oleh Admin (${payment?.verified_by || 'Admin'}). Pesanan diproses ke toko.`
              : paymentStatus === 'waiting_confirmation'
              ? 'Bukti transfer sudah dikirim. Admin PAYKAJASTIP sedang memeriksa mutasi rekening.'
              : paymentStatus === 'failed'
              ? `Alasan penolakan: ${payment?.rejection_reason || 'Bukti transfer tidak terbaca / tidak cocok.'}`
              : 'Silakan transfer ke nomor pembayaran / QR resmi di bawah lalu kirim bukti transfer.'}
          </p>
        </div>
      </div>

      {/* Bill Amount Spotlight */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center space-y-1 shadow-sm">
        <span className="text-xs text-slate-500 font-medium">Total Tagihan Yang Harus Dibayar</span>
        <div className="text-2xl sm:text-3xl font-black text-sky-600 tracking-tight">
          {formatRupiah(order.total_amount)}
        </div>
        <p className="text-[11px] text-slate-400">
          Pesanan dari: <strong>{order.store_name}</strong>
        </p>
      </div>

      {/* Check if Admin configured payment */}
      {activePaymentMethods.length === 0 ? (
        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Metode Pembayaran Belum Diaktifkan oleh Admin
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              Silakan hubungi WhatsApp Admin untuk instruksi nomor rekening atau pembayaran manual.
            </p>
          </div>
          <a
            href={createWhatsAppUrl(
              adminSettings.whatsapp_admin,
              `Halo Admin PAYKAJASTIP, saya ingin membayar pesanan #${order.order_number} sebesar ${formatRupiah(order.total_amount)}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hubungi WhatsApp Admin</span>
          </a>
        </div>
      ) : (
        <>
          {/* Payment Method Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {activePaymentMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Payment Details Container */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
            {selectedMethod === 'QRIS' && (
              <div className="text-center space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Scan QR Pembayaran PAYKAJASTIP
                </span>

                {adminSettings.qris_image_url || adminSettings.payment_qr_url ? (
                  <div className="w-56 h-56 mx-auto rounded-2xl overflow-hidden border-2 border-slate-200 p-2 bg-white shadow-xs">
                    <img
                      src={adminSettings.qris_image_url || adminSettings.payment_qr_url}
                      alt="QRIS Resmi Payka-Jastip"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                    Gambar QRIS belum diunggah oleh admin.
                  </div>
                )}

                <div className="text-xs text-slate-500">
                  Nama Penerima: <strong>{adminSettings.qris_merchant_name || adminSettings.payment_recipient_name || 'PAYKAJASTIP'}</strong>
                </div>

                {adminSettings.qris_instructions && (
                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-xs text-sky-900 text-left leading-relaxed">
                    <p className="font-bold text-[11px] uppercase tracking-wide text-sky-700 mb-0.5">
                      Instruksi QRIS:
                    </p>
                    <p>{adminSettings.qris_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'BANK' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Bank Tujuan Transfer
                  </span>
                  <div className="text-xs font-extrabold text-slate-800">
                    {adminSettings.bank_name || 'Bank Transfer'}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Nomor Rekening
                      </span>
                      <span className="text-sm font-mono font-black text-slate-900 tracking-wide">
                        {adminSettings.bank_account_number || adminSettings.payment_account_number || 'Belum diatur'}
                      </span>
                    </div>

                    {(adminSettings.bank_account_number || adminSettings.payment_account_number) && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(adminSettings.bank_account_number || adminSettings.payment_account_number)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 pt-1">
                    Atas Nama: <strong>{adminSettings.bank_recipient_name || adminSettings.payment_recipient_name || 'PAYKAJASTIP'}</strong>
                  </div>
                </div>

                {adminSettings.bank_instructions && (
                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-xs text-sky-900 leading-relaxed">
                    <p className="font-bold text-[11px] uppercase tracking-wide text-sky-700 mb-0.5">
                      Instruksi Transfer Bank:
                    </p>
                    <p>{adminSettings.bank_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'VA' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Penyedia Virtual Account
                  </span>
                  <div className="text-xs font-extrabold text-slate-800">
                    {adminSettings.va_provider || 'Virtual Account'}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Nomor Virtual Account
                      </span>
                      <span className="text-sm font-mono font-black text-slate-900 tracking-wide">
                        {adminSettings.va_number || 'Belum diatur'}
                      </span>
                    </div>

                    {adminSettings.va_number && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(adminSettings.va_number)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 pt-1">
                    Atas Nama: <strong>{adminSettings.va_recipient_name || 'PAYKAJASTIP'}</strong>
                  </div>
                </div>

                {adminSettings.va_instructions && (
                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-xs text-sky-900 leading-relaxed">
                    <p className="font-bold text-[11px] uppercase tracking-wide text-sky-700 mb-0.5">
                      Instruksi Virtual Account:
                    </p>
                    <p>{adminSettings.va_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'DANA' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Nomor Akun Dompet Digital DANA
                  </span>
                  <div className="text-xs font-extrabold text-slate-800">
                    DANA Payka Official
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Nomor Akun DANA
                      </span>
                      <span className="text-sm font-mono font-black text-slate-900 tracking-wide">
                        {adminSettings.dana_number || 'Belum diatur'}
                      </span>
                    </div>

                    {adminSettings.dana_number && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(adminSettings.dana_number)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 pt-1">
                    Atas Nama Akun: <strong>{adminSettings.dana_recipient_name || 'PAYKA JASTIP'}</strong>
                  </div>
                </div>

                {adminSettings.dana_instructions && (
                  <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-xs text-sky-900 leading-relaxed">
                    <p className="font-bold text-[11px] uppercase tracking-wide text-sky-700 mb-0.5">
                      Instruksi Transfer DANA:
                    </p>
                    <p>{adminSettings.dana_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Proof Form */}
          <form
            onSubmit={handleSubmitProof}
            className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs"
          >
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-sky-600" />
              <span>Unggah Bukti Transfer / Pembayaran</span>
            </h3>

            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-4 text-center cursor-pointer transition relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {proofFilePreview ? (
                <div className="space-y-2">
                  <img
                    src={proofFilePreview}
                    alt="Bukti Transfer"
                    className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                  />
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {proofFileName || 'Foto bukti siap dikirim'}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <span className="text-[11px] text-sky-600 font-bold underline">
                      Klik untuk ganti foto
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFilePreview(null);
                        setProofFileName('');
                      }}
                      className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Klik untuk memilih foto screenshot transfer
                  </p>
                  <p className="text-[11px] text-slate-400">Format JPG, JPEG, atau PNG (Maks 5MB)</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <p className="font-bold">Ketentuan Konfirmasi:</p>
              <p>
                Mengunggah bukti pembayaran <strong>TIDAK OTOMATIS</strong> mengubah status menjadi
                PAID. Verifikasi mutasi pembayaran dilakukan secara manual oleh Tim Admin PAYKAJASTIP.
              </p>
            </div>

            <button
              type="submit"
              disabled={isUploading || paymentStatus === 'paid'}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-sky-600/25 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                {paymentStatus === 'paid'
                  ? 'PEMBAYARAN SUDAH PAID'
                  : isUploading
                  ? 'Mengirim Bukti...'
                  : 'SUDAH BAYAR (KIRIM BUKTI KE ADMIN)'}
              </span>
            </button>
          </form>
        </>
      )}

      {/* Success Notification */}
      {submitSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold animate-in fade-in zoom-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Bukti berhasil dikirim! Menunggu verifikasi Admin.</span>
        </div>
      )}
    </div>
  );
};
