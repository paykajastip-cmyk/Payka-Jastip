import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Package,
  Phone,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeliveryRequest, DeliverySize } from '../types';
import { formatRupiah, createWhatsAppUrl } from '../utils/helpers';

interface DeliveryPageProps {
  setActiveTab: (tab: string) => void;
}

export const DeliveryPage: React.FC<DeliveryPageProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    userLocation,
    adminSettings,
    rates,
    schedules,
    createDeliveryRequest,
  } = useApp();

  const activeRate = rates[0] || {
    size_s_rate: 15000,
    size_m_rate: 20000,
    size_l_rate: 25000,
  };

  const [senderName, setSenderName] = useState(currentUser?.full_name || '');
  const [senderPhone, setSenderPhone] = useState(currentUser?.phone || '');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState(userLocation.address);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemType, setItemType] = useState('Paket Dokumen / Barang Ringan');
  const [packageSize, setPackageSize] = useState<DeliverySize>('S');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('lokal');
  const [createdDelivery, setCreatedDelivery] = useState<DeliveryRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fee calculation based on Admin configured rates
  const calculateFee = () => {
    let base = activeRate.size_s_rate;
    if (packageSize === 'M') base = activeRate.size_m_rate;
    if (packageSize === 'L') base = activeRate.size_l_rate;
    if (packageSize === 'CUSTOM') base = activeRate.size_l_rate + Math.max(0, weightKg - 5) * 5000;

    // Additional fee for intercity Bengkayang
    if (selectedScheduleId !== 'lokal') {
      base += 10000;
    }

    return base;
  };

  const finalFee = calculateFee();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !pickupAddress || !deliveryAddress) {
      alert('Mohon lengkapi seluruh data pengirim, penerima, dan alamat.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

      const res = await createDeliveryRequest({
        customer_id: currentUser?.id || 'guest',
        sender_name: senderName,
        sender_phone: senderPhone,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        item_type: itemType,
        package_size: packageSize,
        weight_kg: weightKg,
        notes,
        fee: finalFee,
        route_schedule_id: selectedScheduleId !== 'lokal' ? selectedScheduleId : undefined,
        route_name: selectedSchedule ? selectedSchedule.route_name : 'Pengantaran Lokal Singkawang',
        status: 'PENDING',
      });

      setCreatedDelivery(res);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
      alert('Gagal membuat request antar barang.');
    }
  };

  const getWaConfirmationUrl = (del: DeliveryRequest) => {
    const text =
      `*ORDER ANTAR BARANG PAYKAJASTIP*\n` +
      `No. Resi/Request: #${del.request_number}\n` +
      `Pengirim: ${del.sender_name} (${del.sender_phone})\n` +
      `Penerima: ${del.recipient_name} (${del.recipient_phone})\n` +
      `Alamat Pickup: ${del.pickup_address}\n` +
      `Alamat Tujuan: ${del.delivery_address}\n` +
      `Barang: ${del.item_type}\n` +
      `Ukuran: ${del.package_size} (~${del.weight_kg} kg)\n` +
      `Jalur: ${del.route_name || 'Lokal Singkawang'}\n` +
      `Total Biaya: ${formatRupiah(del.fee)}\n` +
      (del.notes ? `Catatan: ${del.notes}\n` : '') +
      `\nMohon konfirmasi kurir untuk jemput paket. Terima kasih!`;

    return createWhatsAppUrl(adminSettings.whatsapp_admin, text);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider mb-1">
          <Truck className="w-3.5 h-3.5" />
          <span>Kurir Kilat &amp; Logistik</span>
        </div>
        <h1 className="text-lg font-black text-slate-900 tracking-tight">
          Layanan Antar Barang &amp; Dokumen
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Kirim paket lokal seputar Kota Singkawang dan rute reguler antar kabupaten
          Singkawang ⇄ Bengkayang dengan aman dan cepat.
        </p>
      </div>

      {createdDelivery ? (
        /* Confirmation State */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              NOMOR PENGANTARAN:
            </span>
            <h2 className="text-xl font-mono font-black text-sky-600">
              #{createdDelivery.request_number}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Pesanan kurir Anda berhasil dibuat. Kurir Payka akan menjemput barang sesuai jadwal.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Pengirim:</span>
              <span className="font-bold text-slate-800">{createdDelivery.sender_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penerima:</span>
              <span className="font-bold text-slate-800">{createdDelivery.recipient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ukuran Paket:</span>
              <span className="font-bold text-slate-800">
                Size {createdDelivery.package_size} (~{createdDelivery.weight_kg} kg)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ongkos Kirim:</span>
              <span className="font-bold text-sky-600">{formatRupiah(createdDelivery.fee)}</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <a
              href={getWaConfirmationUrl(createdDelivery)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <Phone className="w-4 h-4" />
              <span>KONFIRMASI VIA WHATSAPP ADMIN</span>
            </a>

            <button
              onClick={() => {
                setCreatedDelivery(null);
                setRecipientName('');
                setRecipientPhone('');
                setDeliveryAddress('');
                setNotes('');
              }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Kirim Paket Lainnya
            </button>
          </div>
        </div>
      ) : (
        /* Form Delivery */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rute & Jadwal Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
              <span>Pilihan Rute &amp; Jadwal</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScheduleId('lokal')}
                className={`p-3 rounded-2xl border text-left transition ${
                  selectedScheduleId === 'lokal'
                    ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold block">Dalam Kota Singkawang</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Langsung dijemput &amp; antar hari ini
                </span>
              </button>

              {schedules.map((sch) => (
                <button
                  key={sch.id}
                  type="button"
                  onClick={() => setSelectedScheduleId(sch.id)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    selectedScheduleId === sch.id
                      ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">{sch.route_name}</span>
                  <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                    {sch.departure_time} ({sch.days})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Package Size Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-600" />
              <span>Ukuran Paket &amp; Tarif Awal</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Size S */}
              <button
                type="button"
                onClick={() => setPackageSize('S')}
                className={`p-3 rounded-2xl border text-center transition ${
                  packageSize === 'S'
                    ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-black block">SIZE S</span>
                <span className="text-[10px] text-slate-500 block">Dokumen / s.d 1 kg</span>
                <span className="text-xs font-bold text-sky-600 mt-1 block">
                  {formatRupiah(activeRate.size_s_rate)}
                </span>
              </button>

              {/* Size M */}
              <button
                type="button"
                onClick={() => setPackageSize('M')}
                className={`p-3 rounded-2xl border text-center transition ${
                  packageSize === 'M'
                    ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-black block">SIZE M</span>
                <span className="text-[10px] text-slate-500 block">Kardus Sedang / s.d 3 kg</span>
                <span className="text-xs font-bold text-sky-600 mt-1 block">
                  {formatRupiah(activeRate.size_m_rate)}
                </span>
              </button>

              {/* Size L */}
              <button
                type="button"
                onClick={() => setPackageSize('L')}
                className={`p-3 rounded-2xl border text-center transition ${
                  packageSize === 'L'
                    ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-black block">SIZE L</span>
                <span className="text-[10px] text-slate-500 block">Kardus Besar / s.d 5 kg</span>
                <span className="text-xs font-bold text-sky-600 mt-1 block">
                  {formatRupiah(activeRate.size_l_rate)}
                </span>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={() => setPackageSize('CUSTOM')}
                className={`p-3 rounded-2xl border text-center transition ${
                  packageSize === 'CUSTOM'
                    ? 'border-sky-600 bg-sky-50 text-sky-950 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-black block">CUSTOM</span>
                <span className="text-[10px] text-slate-500 block">&gt; 5 kg / Barang Khusus</span>
                <span className="text-xs font-bold text-sky-600 mt-1 block">
                  {formatRupiah(activeRate.size_l_rate)}+
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deskripsi / Jenis Barang
                </label>
                <input
                  type="text"
                  required
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  placeholder="Contoh: Berkas Akta, Kue Kotak, Baju, Kosmetik"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Perkiraan Berat (kg)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Pengirim & Penerima Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Data Pengirim &amp; Penerima</span>
            </h3>

            {/* Sender */}
            <div className="space-y-2.5 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">1. Info Pengirim (Pickup)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama Pengirim"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="Nomor WA Pengirim"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
              <textarea
                required
                rows={2}
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Alamat penjemputan paket..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
              />
            </div>

            {/* Recipient */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">
                2. Info Penerima (Tujuan)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama Penerima"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Nomor WA Penerima"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Alamat lengkap penerima / patokan..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Catatan Khusus Pengantaran
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: jangan dibanting / telepon penerima sebelum sampai"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium"
              />
            </div>

            {/* Fee summary */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Ongkos Kirim:</span>
              <span className="text-base font-extrabold text-sky-600">
                {formatRupiah(finalFee)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-xl shadow-sky-600/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Memproses Request...'
                : `PESAN KURIR SEKARANG • ${formatRupiah(finalFee)}`}
            </span>
          </button>
        </form>
      )}
    </div>
  );
};
