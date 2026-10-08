import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  User,
  Shield,
  ShoppingBag,
  Bike,
  Store,
  ChevronDown,
  X,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { formatIndoDate } from '../../utils/helpers';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    setUserRole,
    userLocation,
    setUserLocation,
    notifications,
    markNotificationRead,
  } = useApp();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.is_read);

  const roleLabels: Record<UserRole, { label: string; icon: any; color: string }> = {
    customer: { label: 'Customer', icon: User, color: 'bg-emerald-600 text-white' },
    merchant: { label: 'Merchant', icon: Store, color: 'bg-blue-600 text-white' },
    driver: { label: 'Driver', icon: Bike, color: 'bg-amber-600 text-white' },
    admin: { label: 'Admin', icon: Shield, color: 'bg-rose-600 text-white' },
  };

  const RoleIcon = roleLabels[currentUser.role]?.icon || User;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Tagline */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-600/30 shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  PAYKA<span className="text-sky-600">JASTIP</span>
                </span>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                  Singkawang
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block truncate">
                Jastip, Belanja &amp; Antar Barang
              </p>
            </div>
          </div>

          {/* Location Indicator Button */}
          <button
            onClick={() => setActiveTab('map')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium max-w-[220px] transition"
            title="Pilih Lokasi di Peta Singkawang"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">{userLocation.address}</span>
          </button>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* PWA Install Button Header */}
            <PWAInstallButton compact={true} />

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifModal(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Role Switcher Pill */}
            <button
              onClick={() => setShowRoleModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 ${
                roleLabels[currentUser.role]?.color || 'bg-slate-800 text-white'
              }`}
              title="Ganti Mode Role (Customer, Merchant, Driver, Admin)"
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{roleLabels[currentUser.role]?.label}</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>
          </div>
        </div>
      </div>

      {/* Role / Switch Account Modal */}
      {showRoleModal && (
        <div
          className="fixed top-0 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 min-h-[100dvh] w-full bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowRoleModal(false)}
        >
          <div
            className="relative my-auto w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(80dvh,540px)] border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (fixed at top of modal) */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Switch Account
                  </h3>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                    Pilih Role
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ganti akun &amp; peran untuk menguji seluruh fitur sistem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-90 shrink-0"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable List Container inside modal (smooth internal scroll, keeps modal vertically centered) */}
            <div className="mt-3.5 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 -mr-1 space-y-2.5">
              {/* 1. Customer */}
              <button
                onClick={() => {
                  setUserRole('customer');
                  setShowRoleModal(false);
                  setActiveTab('home');
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser.role === 'customer'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      1. Customer (Pembeli/Pelanggan)
                    </h4>
                    {currentUser.role === 'customer' && (
                      <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Cari toko di peta, pesan produk, buat request jastip &amp; bayar.
                  </p>
                </div>
              </button>

              {/* 2. Merchant */}
              <button
                onClick={() => {
                  setUserRole('merchant');
                  setShowRoleModal(false);
                  setActiveTab('merchant');
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser.role === 'merchant'
                    ? 'border-blue-500 bg-blue-50/70 shadow-2xs ring-1 ring-blue-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      2. Merchant (Pemilik Toko/UMKM)
                    </h4>
                    {currentUser.role === 'merchant' && (
                      <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Kelola profil toko, tambah produk, atur stok &amp; terima order.
                  </p>
                </div>
              </button>

              {/* 3. Driver */}
              <button
                onClick={() => {
                  setUserRole('driver');
                  setShowRoleModal(false);
                  setActiveTab('driver');
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser.role === 'driver'
                    ? 'border-amber-500 bg-amber-50/70 shadow-2xs ring-1 ring-amber-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      3. Driver (Kurir Singkawang)
                    </h4>
                    {currentUser.role === 'driver' && (
                      <span className="text-[9px] font-extrabold bg-amber-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Mode online/offline, ambil order, navigasi rute &amp; antar barang.
                  </p>
                </div>
              </button>

              {/* 4. Super Admin */}
              <button
                onClick={() => {
                  setUserRole('admin');
                  setShowRoleModal(false);
                  setActiveTab('admin');
                }}
                className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 ${
                  currentUser.role === 'admin'
                    ? 'border-rose-500 bg-rose-50/70 shadow-2xs ring-1 ring-rose-400'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      4. Super Admin PAYKAJASTIP
                    </h4>
                    {currentUser.role === 'admin' && (
                      <span className="text-[9px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Verifikasi pembayaran manual, kelola toko, tarif, peta &amp; setting.
                  </p>
                </div>
              </button>
            </div>

            {/* Bottom Close Button */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-98"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 py-8 sm:py-12 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowNotifModal(false)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[min(82vh,580px)] my-auto animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Notifikasi Sistem</h3>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3.5 flex-1 overflow-y-auto overscroll-contain space-y-2 pr-1 -mr-1 max-h-[calc(min(82vh,580px)-135px)]">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada notifikasi.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                      n.is_read
                        ? 'bg-slate-50 border-slate-100 text-slate-600'
                        : 'bg-sky-50/70 border-sky-200 text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatIndoDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-98"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
