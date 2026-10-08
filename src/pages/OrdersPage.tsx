import React, { useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  ChevronRight,
  Store,
  Star,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { formatRupiah, formatIndoDate, createWhatsAppUrl } from '../utils/helpers';

interface OrdersPageProps {
  onSelectOrder: (order: Order) => void;
  onOpenPayment: (orderId: string) => void;
  setActiveTab: (tab: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onSelectOrder,
  onOpenPayment,
  setActiveTab,
}) => {
  const { orders, currentUser, adminSettings, addReview } = useApp();
  const [filterTab, setFilterTab] = useState<string>('all');

  // Customer's orders
  const userOrders = orders.filter((o) => {
    if (currentUser.role === 'admin') return true;
    return o.customer_id === currentUser.id;
  });

  const filteredOrders = userOrders.filter((o) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'unpaid') return o.payment_status === 'waiting_payment';
    if (filterTab === 'process')
      return (
        o.status === 'MENUNGGU KONFIRMASI' ||
        o.status === 'TOKO MENERIMA' ||
        o.status === 'MENUNGGU DRIVER'
      );
    if (filterTab === 'delivering')
      return (
        o.status === 'DRIVER MENUJU LOKASI' ||
        o.status === 'BARANG DIAMBIL' ||
        o.status === 'DRIVER MENUJU CUSTOMER'
      );
    if (filterTab === 'done') return o.status === 'SELESAI';
    if (filterTab === 'cancelled') return o.status === 'DIBATALKAN';
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DIBATALKAN':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'DRIVER MENUJU CUSTOMER':
      case 'BARANG DIAMBIL':
      case 'DRIVER MENUJU LOKASI':
        return 'bg-sky-100 text-sky-800 border-sky-200 animate-pulse';
      case 'TOKO MENERIMA':
      case 'MENUNGGU DRIVER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            Pesanan Saya ({userOrders.length})
          </h1>
          <p className="text-xs text-slate-500">
            Lacak riwayat pesanan, status pembayaran, dan kurir.
          </p>
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'unpaid', label: 'Belum Bayar' },
          { id: 'process', label: 'Diproses' },
          { id: 'delivering', label: 'Dikirim' },
          { id: 'done', label: 'Selesai' },
          { id: 'cancelled', label: 'Batal' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              filterTab === tab.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Pesanan</h3>
          <p className="text-xs text-slate-400">
            Anda belum memiliki riwayat pesanan pada filter ini.
          </p>
          <button
            onClick={() => setActiveTab('stores')}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isUnpaid = order.payment_status === 'waiting_payment';
            const isWaitingConf = order.payment_status === 'waiting_confirmation';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:shadow-sm transition"
              >
                {/* Header row */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                      {order.store_name}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Items preview */}
                <div
                  onClick={() => onSelectOrder(order)}
                  className="cursor-pointer space-y-1.5"
                >
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{order.order_number} • {formatIndoDate(order.created_at)}
                  </span>

                  <div className="text-xs text-slate-700">
                    <span className="font-semibold">{order.items[0]?.product_name}</span>
                    {order.items.length > 1 && (
                      <span className="text-slate-400 font-normal">
                        {' '}
                        +{order.items.length - 1} produk lainnya
                      </span>
                    )}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-slate-500 italic truncate">
                      Catatan: {order.notes}
                    </p>
                  )}
                </div>

                {/* Price and Action Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total:</span>
                    <span className="text-sm font-extrabold text-sky-600">
                      {formatRupiah(order.total_amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Unpaid Button */}
                    {isUnpaid && (
                      <button
                        onClick={() => onOpenPayment(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang</span>
                      </button>
                    )}

                    {isWaitingConf && (
                      <button
                        onClick={() => onOpenPayment(order.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-amber-700 text-[11px] font-bold border border-amber-200"
                      >
                        Verifikasi Bukti
                      </button>
                    )}

                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
