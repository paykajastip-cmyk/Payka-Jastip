import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  User,
  Store,
  Bike,
  Shield,
  Download,
  Info,
  LogOut,
  LogIn,
  UserPlus,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { createWhatsAppUrl } from '../utils/helpers';
import { AuthModal, AuthModalMode } from '../components/auth/AuthModal';

interface ProfilePageProps {
  setActiveTab: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    logout,
    adminSettings,
    userLocation,
    canAccessMerchant,
    canAccessDriver,
    canAccessAdmin,
    orders,
    unreadNotificationsCount,
  } = useApp();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  const openAuth = (mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const userOrdersCount = orders.filter((o) =>
    currentUser ? o.customer_id === currentUser.id : false
  ).length;

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Logged-in User Profile OR Guest Greeting */}
      {currentUser ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
              {currentUser.full_name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-extrabold text-slate-900 truncate">
                  {currentUser.full_name}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-100 text-rose-800'
                      : currentUser.role === 'merchant'
                      ? 'bg-blue-100 text-blue-800'
                      : currentUser.role === 'driver'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentUser.role}
                </span>

                {currentUser.role !== 'customer' && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentUser.approval_status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentUser.approval_status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentUser.approval_status === 'approved'
                      ? 'Disetujui'
                      : currentUser.approval_status === 'rejected'
                      ? 'Ditolak'
                      : 'Menunggu Persetujuan'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{currentUser.email}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.phone}</span>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="truncate">{userLocation.address}</span>
          </div>

          {/* Dedicated Notifikasi Menu Button */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 transition active:scale-98 text-left shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🔔 Notifikasi</span>
                </p>
                <p className="text-[11px] text-slate-500">Pemberitahuan & update pesanan Anda</p>
              </div>
            </div>
            {unreadNotificationsCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-2xs">
                {unreadNotificationsCount} Baru
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Role specific quick action */}
          {currentUser.role === 'customer' && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveTab('orders')}
                className="flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-800"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Lihat Riwayat Pesanan ({userOrdersCount})</span>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          {currentUser.role === 'merchant' && canAccessMerchant && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveTab('merchant')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Store className="w-4 h-4" />
                <span>Buka Dashboard Merchant</span>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          {currentUser.role === 'driver' && canAccessDriver && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveTab('driver')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Bike className="w-4 h-4" />
                <span>Buka Dashboard Driver</span>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          {currentUser.role === 'admin' && canAccessAdmin && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveTab('admin')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Shield className="w-4 h-4" />
                <span>Buka Dashboard Admin</span>
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          {currentUser.role !== 'customer' && !canAccessMerchant && !canAccessDriver && !canAccessAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {currentUser.approval_status === 'rejected'
                      ? 'Pendaftaran Anda Ditolak'
                      : 'Pendaftaran Menunggu Persetujuan Admin'}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {currentUser.approval_status === 'rejected'
                      ? currentUser.rejection_reason || 'Mohon hubungi admin untuk verifikasi berkas.'
                      : 'Admin PaykaJastip sedang meninjau pendaftaran Anda. Dashboard akan otomatis aktif setelah disetujui.'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* GUEST / BELUM LOGIN */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-sky-500 to-sky-600 text-white flex items-center justify-center mx-auto shadow-md">
            <User className="w-8 h-8" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
              Mode Tamu (Guest)
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-2">
              Selamat Datang di PaykaJastip Singkawang
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
              Anda tidak wajib membuat akun untuk memesan makanan, belanja toko, atau jastip! Namun Anda dapat masuk atau mendaftar untuk menyimpan alamat dan riwayat pesanan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto pt-2">
            <button
              onClick={() => openAuth('login')}
              className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk sebagai Customer</span>
            </button>
            <button
              onClick={() => openAuth('register_customer')}
              className="py-3 px-4 rounded-2xl border-2 border-sky-600 text-sky-700 hover:bg-sky-50 active:scale-95 font-extrabold text-xs flex items-center justify-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Customer Baru</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 max-w-md mx-auto">
            <p className="text-[11px] text-slate-400 mb-2 font-medium">Ingin bermitra dengan Payka?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openAuth('register_merchant')}
                className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Daftar sebagai Merchant</span>
              </button>
              <button
                onClick={() => openAuth('register_driver')}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Daftar sebagai Driver</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA In-App Install Prompt Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Download className="w-4 h-4 text-sky-600" />
          <span>Pasang Aplikasi (PWA)</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pasang PAYKAJASTIP langsung di layar utama smartphone Anda untuk kemudahan akses cepat
          tanpa download Play Store / App Store.
        </p>

        <PWAInstallButton compact={false} />
      </div>

      {/* About Brand & Help */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs text-xs">
        <h3 className="font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Tentang PAYKAJASTIP</span>
        </h3>

        <div className="space-y-1 text-slate-600 leading-relaxed">
          <p>
            <strong>PAYKAJASTIP</strong> adalah platform lokal Singkawang untuk jastip, belanja
            toko/kuliner offline &amp; online, produk UMKM, dan layanan kurir logistik antar kota
            Singkawang ⇄ Bengkayang.
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Singkawang Local Express • Didukung OpenStreetMap &amp; Leaflet
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <a
            href={createWhatsAppUrl(
              adminSettings.whatsapp_admin,
              'Halo Admin PAYKAJASTIP, saya butuh bantuan seputar aplikasi.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Hubungi Layanan Bantuan (WhatsApp)</span>
          </a>
        </div>
      </div>

      {/* Auth Modal for Login / Registration */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
