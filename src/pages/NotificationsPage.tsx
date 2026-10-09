import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  ShoppingBag,
  Bike,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Tag,
  ArrowLeft,
  LogIn,
  ExternalLink,
  Store,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Notification, NotificationType, Order } from '../types';
import { formatIndoDate } from '../utils/helpers';

interface NotificationsPageProps {
  setActiveTab: (tab: string) => void;
  onSelectOrder?: (order: Order) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  setActiveTab,
  onSelectOrder,
}) => {
  const {
    currentUser,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    orders,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'order' | 'system'>('all');

  // Filter user notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.is_read;
    if (activeFilter === 'order') {
      return (
        notif.type.startsWith('order_') ||
        notif.type.startsWith('driver_')
      );
    }
    if (activeFilter === 'system') {
      return (
        notif.type.startsWith('merchant_') ||
        notif.type.startsWith('payment_') ||
        notif.type === 'system' ||
        notif.type === 'promo'
      );
    }
    return true;
  });

  const getNotifIcon = (type: NotificationType | string) => {
    switch (type) {
      case 'order_created':
      case 'order_processing':
      case 'order_ready':
      case 'order':
        return {
          icon: ShoppingBag,
          color: 'text-amber-600 bg-amber-100',
          badge: 'Pesanan',
        };
      case 'order_confirmed':
      case 'order_completed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-100',
          badge: 'Konfirmasi',
        };
      case 'driver_assigned':
      case 'driver_on_the_way':
      case 'delivery':
        return {
          icon: Bike,
          color: 'text-indigo-600 bg-indigo-100',
          badge: 'Kurir / Driver',
        };
      case 'payment_success':
        return {
          icon: CreditCard,
          color: 'text-emerald-600 bg-emerald-100',
          badge: 'Pembayaran',
        };
      case 'payment_failed':
        return {
          icon: AlertCircle,
          color: 'text-rose-600 bg-rose-100',
          badge: 'Pembayaran Gagal',
        };
      case 'merchant_approved':
      case 'driver_approved':
        return {
          icon: ShieldCheck,
          color: 'text-sky-600 bg-sky-100',
          badge: 'Mitra Disetujui',
        };
      case 'merchant_rejected':
      case 'driver_rejected':
        return {
          icon: AlertCircle,
          color: 'text-rose-600 bg-rose-100',
          badge: 'Mitra Ditolak',
        };
      case 'promo':
        return {
          icon: Tag,
          color: 'text-purple-600 bg-purple-100',
          badge: 'Promo',
        };
      case 'system':
      default:
        return {
          icon: Bell,
          color: 'text-slate-600 bg-slate-100',
          badge: 'Sistem',
        };
    }
  };

  const handleOpenOrder = (refId?: string) => {
    if (!refId) return;
    const targetOrder = orders.find((o) => o.id === refId || o.order_number === refId);
    if (targetOrder && onSelectOrder) {
      onSelectOrder(targetOrder);
      setActiveTab('order-detail');
    } else {
      setActiveTab('orders');
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-3xl mx-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('home')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Notifikasi Saya</span>
              </h1>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-2xs">
                  {unreadNotificationsCount} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Pemberitahuan resmi pesanan, kurir, dan akun Payka-Jastip Anda.
            </p>
          </div>
        </div>

        {currentUser && notifications.length > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            title="Tandai semua notifikasi akun Anda sebagai sudah dibaca"
          >
            <CheckCheck className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {/* Guest Mode Screen */}
      {!currentUser ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-black">
            🔔
          </div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
              Mode Tamu (Guest)
            </span>
            <h2 className="text-base font-black text-slate-900">
              Notifikasi Akun Memerlukan Login
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Anda sedang menjelajah sebagai Tamu. Sistem notifikasi Payka-Jastip diisolasi khusus per akun pengguna (Customer, Merchant, Driver, dan Admin) untuk menjamin privasi data Anda.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk / Daftar Akun</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
            >
              <span>Lacak Pesanan Tamu</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: `Semua (${notifications.length})` },
              { id: 'unread', label: `Belum Dibaca (${unreadNotificationsCount})` },
              { id: 'order', label: 'Pesanan & Kurir' },
              { id: 'system', label: 'Sistem & Mitra' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  activeFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {activeFilter === 'unread' ? 'Tidak Ada Notifikasi Baru' : 'Belum Ada Notifikasi'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeFilter === 'unread'
                  ? 'Semua notifikasi akun Anda sudah dibaca.'
                  : 'Pemberitahuan pesanan dan info status akun akan muncul di sini secara real-time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((n) => {
                const config = getNotifIcon(n.type);
                const IconComponent = config.icon;
                const hasRef = Boolean(n.reference_id || n.order_id);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) {
                        markNotificationRead(n.id);
                      }
                    }}
                    className={`group relative p-3.5 sm:p-4 rounded-2xl border transition shadow-2xs hover:shadow-xs cursor-pointer ${
                      n.is_read
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {config.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatIndoDate(n.created_at)}</span>
                          </span>
                          {!n.is_read && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded-full">
                              Baru
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                          {n.title}
                        </h3>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {n.message}
                        </p>

                        {/* Action buttons if reference exists */}
                        {hasRef && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!n.is_read) markNotificationRead(n.id);
                                handleOpenOrder(n.reference_id || n.order_id);
                              }}
                              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs active:scale-95 transition"
                            >
                              <span>Lihat Detail Pesanan</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete notification icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="opacity-60 hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-90"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
