import React, { useState } from 'react';
import {
  Bike,
  Power,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Store,
  User,
  ShieldCheck,
  Star,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import {
  formatRupiah,
  createWhatsAppUrl,
  getGoogleMapsNavUrl,
  formatIndoDate,
} from '../utils/helpers';

export const DriverPortalPage: React.FC = () => {
  const {
    currentDriver,
    toggleDriverOnline,
    orders,
    assignDriverToOrder,
    updateOrderStatus,
  } = useApp();

  const [activeDriverTab, setActiveDriverTab] = useState<'available' | 'active' | 'history'>(
    'available'
  );
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  if (!currentDriver) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        Data profil driver belum aktif.
      </div>
    );
  }

  // Available orders waiting for driver
  const availableOrders = orders.filter(
    (o) =>
      (o.status === 'MENUNGGU DRIVER' ||
        (o.status === 'TOKO MENERIMA' && !o.driver_id)) &&
      !o.driver_id &&
      o.order_type === 'delivery'
  );

  // Orders currently assigned to this driver
  const myActiveOrders = orders.filter(
    (o) =>
      o.driver_id === currentDriver.id &&
      o.status !== 'SELESAI' &&
      o.status !== 'DIBATALKAN'
  );

  // Orders completed by this driver
  const myCompletedOrders = orders.filter(
    (o) => o.driver_id === currentDriver.id && o.status === 'SELESAI'
  );

  const handleTakeOrder = (orderId: string) => {
    if (!currentDriver.is_online) {
      setActionMessage({
        text: 'Aktifkan status ONLINE terlebih dahulu untuk mengambil order!',
        type: 'error',
      });
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }

    const res = assignDriverToOrder(orderId, currentDriver.id);
    if (res.success) {
      setActionMessage({ text: res.message, type: 'success' });
      setActiveDriverTab('active');
    } else {
      setActionMessage({ text: res.message, type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'DRIVER MENUJU LOKASI';
    if (currentStatus === 'DRIVER MENUJU LOKASI') nextStatus = 'BARANG DIAMBIL';
    else if (currentStatus === 'BARANG DIAMBIL') nextStatus = 'DRIVER MENUJU CUSTOMER';
    else if (currentStatus === 'DRIVER MENUJU CUSTOMER') nextStatus = 'SELESAI';

    updateOrderStatus(orderId, nextStatus);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Driver Header & Online/Offline Toggle */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-slate-900">{currentDriver.name}</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  {currentDriver.vehicle_plate}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span className="font-bold text-slate-700">{currentDriver.rating}</span>
                <span>• {currentDriver.total_deliveries} Pengantaran</span>
              </p>
            </div>
          </div>

          {/* Toggle Online Button */}
          <button
            onClick={() => toggleDriverOnline(currentDriver.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition shadow-xs active:scale-95 ${
              currentDriver.is_online
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{currentDriver.is_online ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveDriverTab('available')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeDriverTab === 'available'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Siap Diambil</span>
          {availableOrders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {availableOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDriverTab('active')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeDriverTab === 'active'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Aktif Saya</span>
          {myActiveOrders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
              {myActiveOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDriverTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeDriverTab === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Riwayat ({myCompletedOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Available Orders Ready To Be Picked Up */}
      {activeDriverTab === 'available' && (
        <div className="space-y-3">
          {availableOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Belum Ada Pesanan Menunggu</h4>
              <p className="text-xs text-slate-400">
                Pesanan dari toko di Singkawang yang siap diantar akan muncul di sini.
              </p>
            </div>
          ) : (
            availableOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    #{order.order_number}
                  </span>
                  <span className="text-xs font-extrabold text-sky-600">
                    Ongkir: {formatRupiah(order.delivery_fee)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Store Pickup */}
                  <div className="flex items-start gap-2.5">
                    <Store className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Jemput di Toko:</span>
                      <strong className="text-slate-900">{order.store_name}</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">{order.store_address}</p>
                    </div>
                  </div>

                  {/* Destination Customer */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Antar ke Customer:</span>
                      <strong className="text-slate-900">{order.customer_name}</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {order.delivery_address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {order.items.length} jenis produk
                  </span>

                  <button
                    onClick={() => handleTakeOrder(order.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition"
                  >
                    Ambil Pesanan Ini
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Driver's Active Orders */}
      {activeDriverTab === 'active' && (
        <div className="space-y-3">
          {myActiveOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bike className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Tidak Ada Pesanan Aktif</h4>
              <p className="text-xs text-slate-400">
                Ambil order di tab &quot;Siap Diambil&quot; untuk mulai mengantar.
              </p>
            </div>
          ) : (
            myActiveOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-sky-300 p-5 space-y-4 shadow-md shadow-sky-600/5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-ping"></span>
                    <span className="text-xs font-bold text-slate-900">
                      Pesanan Dalam Perjalanan
                    </span>
                  </div>
                  <span className="text-xs font-bold text-sky-600">
                    {formatRupiah(order.delivery_fee)}
                  </span>
                </div>

                {/* Current Stage */}
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200">
                  <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block">
                    STATUS PENGANTARAN:
                  </span>
                  <div className="text-sm font-extrabold text-sky-950 mt-0.5">{order.status}</div>
                </div>

                {/* Pickup & Dropoff Detail */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Store className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block">{order.store_name}</strong>
                        <span className="text-[11px] text-slate-500">{order.store_address}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {order.store_phone && (
                        <a
                          href={createWhatsAppUrl(
                            order.store_phone,
                            `Halo ${order.store_name}, saya kurir Payka yang mengambil order #${order.order_number}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800"
                          title="WA Toko"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block">{order.customer_name}</strong>
                        <span className="text-[11px] text-slate-500">
                          {order.delivery_address}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={createWhatsAppUrl(
                          order.customer_phone,
                          `Halo Kak ${order.customer_name}, saya kurir Payka yang mengantar pesanan Anda #${order.order_number}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800"
                        title="WA Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Navigation Deep Link */}
                <a
                  href={getGoogleMapsNavUrl(
                    order.delivery_lat || 0.9056,
                    order.delivery_lng || 108.9868,
                    order.delivery_address
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Buka Rute di Google Maps</span>
                </a>

                {/* Progression Button */}
                <button
                  onClick={() => handleAdvanceStatus(order.id, order.status)}
                  className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/25 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {order.status === 'DRIVER MENUJU LOKASI'
                      ? 'Konfirmasi: BARANG DIAMBIL DARI TOKO'
                      : order.status === 'BARANG DIAMBIL'
                      ? 'Konfirmasi: MENUJU RUMAH CUSTOMER'
                      : 'Konfirmasi: PESANAN SELESAI DIANTAR'}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Completed History */}
      {activeDriverTab === 'history' && (
        <div className="space-y-3">
          {myCompletedOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Belum ada riwayat pesanan selesai.
            </div>
          ) : (
            myCompletedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400 text-[10px]">
                    #{order.order_number}
                  </span>
                  <span className="font-bold text-emerald-600">SELESAI</span>
                </div>
                <div className="font-bold text-slate-800">
                  {order.store_name} → {order.customer_name}
                </div>
                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                  <span>Ongkir Diterima:</span>
                  <strong className="text-slate-900">{formatRupiah(order.delivery_fee)}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
