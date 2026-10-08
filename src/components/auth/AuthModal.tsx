import React, { useState } from 'react';
import {
  X,
  User,
  Store,
  Bike,
  Lock,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MerchantRegisterInput, DriverRegisterInput } from '../../types';

export type AuthModalMode =
  | 'login'
  | 'register_customer'
  | 'register_merchant'
  | 'register_driver';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const {
    login,
    registerCustomer,
    registerMerchant,
    registerDriver,
  } = useApp();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    title: string;
    message: string;
    role: 'merchant' | 'driver' | 'customer';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Customer register state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');

  // Merchant register state
  const [merchOwnerName, setMerchOwnerName] = useState('');
  const [merchStoreName, setMerchStoreName] = useState('');
  const [merchPhone, setMerchPhone] = useState('');
  const [merchEmail, setMerchEmail] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [merchAddress, setMerchAddress] = useState('');
  const [merchDistrict, setMerchDistrict] = useState('Singkawang Barat');
  const [merchCity, setMerchCity] = useState('Singkawang');
  const [merchHours, setMerchHours] = useState('08.00 - 21.00 WIB');
  const [merchDesc, setMerchDesc] = useState('');

  // Driver register state
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverDistrict, setDriverDistrict] = useState('Singkawang Tengah');
  const [driverCity, setDriverCity] = useState('Singkawang');
  const [driverVehicleType, setDriverVehicleType] = useState<'Motor' | 'Mobil' | 'Pickup'>('Motor');
  const [driverPlate, setDriverPlate] = useState('');

  if (!isOpen) return null;

  const resetAllForms = () => {
    setErrorMsg('');
    setSuccessInfo(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetAllForms();
    onClose();
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.message || 'Login gagal. Periksa kembali email dan password.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      handleClose();
    } catch {
      setErrorMsg('Terjadi kesalahan saat masuk. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  // 2. Submit Customer Register
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await registerCustomer({
        full_name: custName,
        phone: custPhone,
        email: custEmail,
        password: custPassword,
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Pendaftaran gagal. Silakan coba lagi.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      handleClose();
    } catch {
      setErrorMsg('Gagal mendaftar customer.');
      setIsSubmitting(false);
    }
  };

  // 3. Submit Merchant Register
  const handleMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const input: MerchantRegisterInput = {
      owner_name: merchOwnerName,
      store_name: merchStoreName,
      phone: merchPhone,
      email: merchEmail,
      password: merchPassword,
      store_address: merchAddress,
      district: merchDistrict,
      city: merchCity,
      opening_hours: merchHours,
      description: merchDesc,
    };

    try {
      const res = await registerMerchant(input);
      if (!res.success) {
        setErrorMsg(res.message || 'Pendaftaran merchant gagal.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSuccessInfo({
        title: 'Pendaftaran Merchant Berhasil',
        message: 'Pendaftaran Merchant berhasil. Akun Anda sedang menunggu persetujuan Admin.',
        role: 'merchant',
      });
    } catch {
      setErrorMsg('Terjadi kesalahan pada sistem pendaftaran.');
      setIsSubmitting(false);
    }
  };

  // 4. Submit Driver Register
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const input: DriverRegisterInput = {
      full_name: driverName,
      phone: driverPhone,
      email: driverEmail,
      password: driverPassword,
      address: driverAddress,
      district: driverDistrict,
      city: driverCity,
      vehicle_type: driverVehicleType,
      vehicle_plate: driverPlate,
    };

    try {
      const res = await registerDriver(input);
      if (!res.success) {
        setErrorMsg(res.message || 'Pendaftaran driver gagal.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSuccessInfo({
        title: 'Pendaftaran Driver Berhasil',
        message: 'Pendaftaran Driver berhasil. Akun Anda sedang menunggu persetujuan Admin.',
        role: 'driver',
      });
    } catch {
      setErrorMsg('Terjadi kesalahan pada sistem pendaftaran.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {successInfo
                ? successInfo.title
                : mode === 'login'
                ? 'Masuk ke Akun'
                : mode === 'register_customer'
                ? 'Daftar sebagai Customer'
                : mode === 'register_merchant'
                ? 'Daftar sebagai Merchant'
                : 'Daftar sebagai Driver'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {successInfo
                ? 'Informasi verifikasi status akun'
                : mode === 'login'
                ? 'Masuk untuk mengelola pesanan & profil Anda'
                : mode === 'register_customer'
                ? 'Nikmati riwayat pesanan & alamat tersimpan'
                : mode === 'register_merchant'
                ? 'Buka dan kelola tokomu di PaykaJastip'
                : 'Bergabung sebagai mitra pengantaran Singkawang'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Success Info View (for pending Merchant or Driver registration) */}
        {successInfo ? (
          <div className="py-6 flex-1 overflow-y-auto space-y-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
              {successInfo.role === 'merchant' ? (
                <Store className="w-8 h-8" />
              ) : (
                <Bike className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider">
                Status: Menunggu Persetujuan (PENDING)
              </span>
              <p className="text-xs text-slate-700 max-w-sm mx-auto pt-2 leading-relaxed font-medium">
                {successInfo.message}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Alur Verifikasi Admin:</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tim Admin PaykaJastip akan meninjau data Anda. Begitu akun disetujui (Approved), Anda dapat langsung login dan mengakses dashboard.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                Selesai &amp; Kembali ke Halaman Utama
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 text-xs">
            {/* 1. LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email Akun *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-98 transition cursor-pointer"
                  >
                    {isSubmitting ? 'Memproses...' : 'Masuk Sekarang'}
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-center text-slate-500 text-[11px]">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('register_customer');
                      }}
                      className="font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                    >
                      Daftar Customer
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('register_merchant');
                      }}
                      className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      <span>Daftar Merchant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('register_driver');
                      }}
                      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Bike className="w-3.5 h-3.5 text-amber-600" />
                      <span>Daftar Driver</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* 2. REGISTER CUSTOMER FORM */}
            {mode === 'register_customer' && (
              <form onSubmit={handleCustomerSubmit} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-98 transition cursor-pointer"
                  >
                    {isSubmitting ? 'Mendaftarkan...' : 'Daftar sebagai Customer'}
                  </button>
                </div>

                <div className="pt-2 text-center text-slate-500 text-[11px]">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('login');
                    }}
                    className="font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </div>
              </form>
            )}

            {/* 3. REGISTER MERCHANT FORM */}
            {mode === 'register_merchant' && (
              <form onSubmit={handleMerchantSubmit} className="space-y-3">
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                  Pendaftaran merchant akan ditinjau oleh Admin. Setelah disetujui (Approved), Anda dapat mulai mengelola produk dan menerima pesanan.
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Pemilik *
                    </label>
                    <input
                      type="text"
                      required
                      value={merchOwnerName}
                      onChange={(e) => setMerchOwnerName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Toko / Usaha *
                    </label>
                    <input
                      type="text"
                      required
                      value={merchStoreName}
                      onChange={(e) => setMerchStoreName(e.target.value)}
                      placeholder="Contoh: Bakmi Aman"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      WhatsApp Toko *
                    </label>
                    <input
                      type="tel"
                      required
                      value={merchPhone}
                      onChange={(e) => setMerchPhone(e.target.value)}
                      placeholder="0812..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Email Login *
                    </label>
                    <input
                      type="email"
                      required
                      value={merchEmail}
                      onChange={(e) => setMerchEmail(e.target.value)}
                      placeholder="toko@email.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={merchPassword}
                    onChange={(e) => setMerchPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Alamat Lengkap Toko *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchAddress}
                    onChange={(e) => setMerchAddress(e.target.value)}
                    placeholder="Jl. Merdeka No. 12, Kel. Pasiran"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kecamatan *
                    </label>
                    <select
                      value={merchDistrict}
                      onChange={(e) => setMerchDistrict(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    >
                      <option value="Singkawang Barat">Singkawang Barat</option>
                      <option value="Singkawang Tengah">Singkawang Tengah</option>
                      <option value="Singkawang Timur">Singkawang Timur</option>
                      <option value="Singkawang Utara">Singkawang Utara</option>
                      <option value="Singkawang Selatan">Singkawang Selatan</option>
                      <option value="Bengkayang">Bengkayang</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kota *
                    </label>
                    <input
                      type="text"
                      value={merchCity}
                      onChange={(e) => setMerchCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Jam Buka *
                    </label>
                    <input
                      type="text"
                      value={merchHours}
                      onChange={(e) => setMerchHours(e.target.value)}
                      placeholder="08.00 - 21.00 WIB"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Deskripsi Singkat
                    </label>
                    <input
                      type="text"
                      value={merchDesc}
                      onChange={(e) => setMerchDesc(e.target.value)}
                      placeholder="Kuliner khas Singkawang"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-98 transition cursor-pointer"
                  >
                    {isSubmitting ? 'Mengirim Pendaftaran...' : 'Daftar sebagai Merchant'}
                  </button>
                </div>

                <div className="pt-1 text-center text-slate-500 text-[11px]">
                  Sudah terdaftar?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('login');
                    }}
                    className="font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                  >
                    Masuk akun
                  </button>
                </div>
              </form>
            )}

            {/* 4. REGISTER DRIVER FORM */}
            {mode === 'register_driver' && (
              <form onSubmit={handleDriverSubmit} className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  Pendaftaran kurir / driver akan ditinjau oleh Admin. Setelah disetujui (Approved), Anda dapat login dan mulai mengambil tugas pengantaran.
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="0812..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Email Login *
                    </label>
                    <input
                      type="email"
                      required
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      placeholder="driver@email.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={driverPassword}
                      onChange={(e) => setDriverPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Alamat Domisili *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverAddress}
                    onChange={(e) => setDriverAddress(e.target.value)}
                    placeholder="Alamat tempat tinggal di Singkawang"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kecamatan *
                    </label>
                    <select
                      value={driverDistrict}
                      onChange={(e) => setDriverDistrict(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    >
                      <option value="Singkawang Barat">Singkawang Barat</option>
                      <option value="Singkawang Tengah">Singkawang Tengah</option>
                      <option value="Singkawang Timur">Singkawang Timur</option>
                      <option value="Singkawang Utara">Singkawang Utara</option>
                      <option value="Singkawang Selatan">Singkawang Selatan</option>
                      <option value="Bengkayang">Bengkayang</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Kota *
                    </label>
                    <input
                      type="text"
                      value={driverCity}
                      onChange={(e) => setDriverCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Jenis Kendaraan *
                    </label>
                    <select
                      value={driverVehicleType}
                      onChange={(e) => setDriverVehicleType(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    >
                      <option value="Motor">Sepeda Motor</option>
                      <option value="Mobil">Mobil</option>
                      <option value="Pickup">Pickup</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Plat Nomor *
                    </label>
                    <input
                      type="text"
                      required
                      value={driverPlate}
                      onChange={(e) => setDriverPlate(e.target.value)}
                      placeholder="KB 1234 SK"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden uppercase"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md active:scale-98 transition cursor-pointer"
                  >
                    {isSubmitting ? 'Mengirim Pendaftaran...' : 'Daftar sebagai Driver'}
                  </button>
                </div>

                <div className="pt-1 text-center text-slate-500 text-[11px]">
                  Sudah terdaftar?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('login');
                    }}
                    className="font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                  >
                    Masuk akun
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
