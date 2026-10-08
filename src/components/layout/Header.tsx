import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  Shield,
  ShoppingBag,
  Bike,
  Store,
  X,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { formatIndoDate } from '../../utils/helpers';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab: _activeTab, setActiveTab }) => {
  const {
    currentUser,
    logout,
    canAccessMerchant,
    canAccessDriver,
    canAccessAdmin,
    userLocation,
    notifications,
    markNotificationRead,
  } = useApp();

  const [showNotifModal, setShowNotifModal] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.is_read);

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

            {/* User Navigation Section based on Role / Guest */}
            {!currentUser ? (
              /* GUEST: Show Daftar Merchant, Daftar Driver, Masuk */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('merchant')}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Daftar Merchant</span>
                </button>
                <button
                  onClick={() => setActiveTab('driver')}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Daftar Driver</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </button>
              </div>
            ) : currentUser.role === 'customer' ? (
              /* CUSTOMER: Profil & Logout (NO switch account, NO admin/merchant/driver dashboard) */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                  title="Buka Profil"
                >
                  <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">
                    {currentUser.full_name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <span className="hidden sm:inline truncate max-w-[100px]">{currentUser.full_name}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser.role === 'merchant' && canAccessMerchant ? (
              /* APPROVED MERCHANT: Dashboard & Logout */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('merchant')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Panel Merchant</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser.role === 'driver' && canAccessDriver ? (
              /* APPROVED DRIVER: Dashboard & Logout */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('driver')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Panel Driver</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentUser.role === 'admin' && canAccessAdmin ? (
              /* ADMIN: Dashboard & Logout */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Suite</span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Pending / other status */
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-lg">
                  Menunggu Verifikasi
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
