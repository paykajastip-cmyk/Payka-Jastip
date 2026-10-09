import React from 'react';
import {
  MapPin,
  Bell,
  Shield,
  ShoppingBag,
  Bike,
  Store,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    logout,
    canAccessMerchant,
    canAccessDriver,
    canAccessAdmin,
    userLocation,
    unreadNotificationsCount,
  } = useApp();

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

            {/* Notifications Tab Button */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2 rounded-xl transition ${
                activeTab === 'notifications'
                  ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Notifikasi Saya"
            >
              <Bell className="w-5 h-5" />
              {currentUser && unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse shadow-xs">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
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
    </header>
  );
};
