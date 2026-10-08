import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JastipRequest } from '../types';
import { formatRupiah, createWhatsAppUrl } from '../utils/helpers';

interface JastipPageProps {
  setActiveTab: (tab: string) => void;
}

export const JastipPage: React.FC<JastipPageProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    userLocation,
    adminSettings,
    createJastipRequest,
    jastipRequests,
    jastipTargetStore,
    setJastipTargetStore,
  } = useApp();

  const [name, setName] = useState(currentUser.full_name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [targetStore, setTargetStore] = useState(jastipTargetStore?.storeName || '');
  const [pickupAddress, setPickupAddress] = useState(jastipTargetStore?.address || '');
  const [deliveryAddress, setDeliveryAddress] = useState(userLocation.address);
  const [estimatedBudget, setEstimatedBudget] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<JastipRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (jastipTargetStore) {
      setTargetStore(jastipTargetStore.storeName);
      if (jastipTargetStore.address) {
        setPickupAddress(jastipTargetStore.address);
      }
    }
  }, [jastipTargetStore]);

  const jastipFee = 15000; // Flat initial service fee for Jastip in Singkawang

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !targetStore || !deliveryAddress) {
      alert('Mohon lengkapi barang, toko tujuan, dan alamat pengantaran.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createJastipRequest({
        customer_id: currentUser.id,
        customer_name: name,
        customer_phone: phone,
        item_name: itemName,
        quantity,
        target_store: targetStore,
        pickup_address: pickupAddress || targetStore,
        delivery_address: deliveryAddress,
        notes,
        photo_url: photoPreview || undefined,
        estimated_budget: typeof estimatedBudget === 'number' ? estimatedBudget : 0,
        service_fee: jastipFee,
        status: 'PENDING',
      });

      setCreatedRequest(res);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
      alert('Gagal membuat request jastip. Silakan coba kembali.');
    }
  };

  const getWaConfirmationUrl = (req: JastipRequest) => {
    const text =
      `*KONFIRMASI JASTIP PAYKAJASTIP*\n` +
      `No. Request: #${req.request_number}\n` +
      `Nama: ${req.customer_name}\n` +
      `No. WA: ${req.customer_phone}\n` +
      `Barang: ${req.item_name} (${req.quantity} pcs)\n` +
      `Beli di: ${req.target_store}\n` +
      `Antar ke: ${req.delivery_address}\n` +
      `Perkiraan Budget: ${formatRupiah(req.estimated_budget || 0)}\n` +
      `Jasa Jastip: ${formatRupiah(req.service_fee)}\n` +
      (req.notes ? `Catatan: ${req.notes}\n` : '') +
      `\nMohon konfirmasi ketersediaan kurir untuk membelikan barang ini. Terima kasih!`;

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
          Ingin beli makanan di pasar, toko oleh-oleh, atau barang belanjaan yang belum ada di menu?
          Tulis request Anda di sini, kami yang belikan dan antar ke rumah Anda!
        </p>
      </div>

      {createdRequest ? (
        /* Confirmation State */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              NOMOR PERMINTAAN JASTIP:
            </span>
            <h2 className="text-xl font-mono font-black text-sky-600">
              #{createdRequest.request_number}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Permintaan jastip Anda telah tercatat di sistem kami.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Barang:</span>
              <span className="font-bold text-slate-800">
                {createdRequest.item_name} ({createdRequest.quantity} pcs)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Toko / Tempat Beli:</span>
              <span className="font-bold text-slate-800">{createdRequest.target_store}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Biaya Jasa:</span>
              <span className="font-bold text-sky-600">
                {formatRupiah(createdRequest.service_fee)}
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <a
              href={getWaConfirmationUrl(createdRequest)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <Phone className="w-4 h-4" />
              <span>KONFIRMASI VIA WHATSAPP ADMIN</span>
            </a>

            <button
              onClick={() => {
                setCreatedRequest(null);
                setJastipTargetStore(null);
                setItemName('');
                setTargetStore('');
                setPickupAddress('');
                setNotes('');
                setPhotoPreview(null);
              }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Buat Request Jastip Lainnya
            </button>
          </div>
        </div>
      ) : (
        /* Form Request */
        <form onSubmit={handleSubmit} className="space-y-4">
          {jastipTargetStore && (
            <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  🛍️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 tracking-wide">
                      Jastip Toko Khusus
                    </span>
                  </div>
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
                }}
                className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-[11px] font-bold text-amber-900 shrink-0 transition"
              >
                Ganti Toko
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Barang yang Ingin Dibeli</span>
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
                placeholder="Contoh: Choipan Panas Pasar Beringin, Kopi Bubuk Cap Obor, dll."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Perkiraan Budget Barang (Rp)
                </label>
                <input
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) =>
                    setEstimatedBudget(e.target.value ? parseInt(e.target.value) : '')
                  }
                  placeholder="Opsional (misal: 50000)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
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
                placeholder="Contoh: Warung Kopi Sejahtera, Toko Oleh-oleh Jl. Diponegoro"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
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
                placeholder="Contoh: Dekat Vihara Tri Dharma Bumi Raya"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
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
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
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
                placeholder="Contoh: minta sambal dipisah, pilih buah yang matang"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            {/* Optional Photo Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Foto Contoh Barang (Opsional)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-3 text-center hover:border-sky-400 transition cursor-pointer">
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
                    <span className="text-[10px] text-sky-600 font-bold underline">
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

          {/* Contact Details Card */}
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Estimasi Jasa Jastip:</span>
              <span className="font-extrabold text-sky-600">{formatRupiah(jastipFee)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Mengirim Permintaan...' : 'AJUKAN JASTIP & KONFIRMASI WA'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
