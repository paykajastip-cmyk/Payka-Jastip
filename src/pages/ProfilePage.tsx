import React from 'react';
import {
  User,
  Shield,
  Store,
  Bike,
  Phone,
  Mail,
  MapPin,
  Download,
  Info,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { createWhatsAppUrl } from '../utils/helpers';

interface ProfilePageProps {
  setActiveTab: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ setActiveTab }) => {
  const { currentUser, setUserRole, adminSettings, userLocation } = useApp();

  return (
    <div className="space-y-4 pb-28">
      {/* User Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {currentUser.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-extrabold text-slate-900 truncate">
                {currentUser.full_name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{currentUser.phone}</span>
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="truncate">{userLocation.address}</span>
        </div>
      </div>

      {/* Role Switcher Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Ganti Mode Peran / Role</span>
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Pilih salah satu peran di bawah ini untuk berpindah ke tampilan antarmuka yang sesuai:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setUserRole('customer')}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
              currentUser.role === 'customer'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="block font-bold">Customer</span>
              <span className="text-[10px] text-slate-400">Belanja &amp; Jastip</span>
            </div>
          </button>

          <button
            onClick={() => {
              setUserRole('merchant');
              setActiveTab('merchant');
            }}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
              currentUser.role === 'merchant'
                ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="block font-bold">Merchant</span>
              <span className="text-[10px] text-slate-400">Kelola Toko</span>
            </div>
          </button>

          <button
            onClick={() => {
              setUserRole('driver');
              setActiveTab('driver');
            }}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
              currentUser.role === 'driver'
                ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Bike className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="block font-bold">Driver</span>
              <span className="text-[10px] text-slate-400">Kurir Pengantar</span>
            </div>
          </button>

          <button
            onClick={() => {
              setUserRole('admin');
              setActiveTab('admin');
            }}
            className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 ${
              currentUser.role === 'admin'
                ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Shield className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="block font-bold">Admin</span>
              <span className="text-[10px] text-slate-400">Super Control</span>
            </div>
          </button>
        </div>
      </div>

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

      {/* About Brand */}
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
            Versi 2.0.0 (Singkawang Local Express) • Didukung OpenStreetMap &amp; Leaflet
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
    </div>
  );
};
