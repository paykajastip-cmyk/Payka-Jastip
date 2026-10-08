import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Truck,
  MapPin,
  Flame,
  Star,
  ChevronRight,
  Clock,
  Sparkles,
  Ticket,
  Copy,
  Check,
  Building,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Store, Product } from '../types';
import { formatRupiah, calculateDistanceKm } from '../utils/helpers';

interface HomePageProps {
  onSelectStore: (store: Store) => void;
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectStore,
  onSelectProduct,
  setActiveTab,
}) => {
  const { stores, products, categories, promos, userLocation, addToCart, setJastipTargetStore } =
    useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const copyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered lists
  const openStores = stores.filter((s) => s.is_open && s.is_active);
  const popularStores = [...stores].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const promoProducts = products.filter((p) => p.promo_price && p.is_available).slice(0, 8);
  const umkmStores = stores.filter((s) => s.store_type === 'umkm' || s.category === 'UMKM');

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-sky-900 text-white p-5 sm:p-7 shadow-xl shadow-sky-900/10">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold tracking-wide uppercase text-sky-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Platform Lokal Singkawang</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Belanja Apa Saja, <br className="hidden sm:inline" />
            Kami Antar ke Depan Rumah!
          </h1>

          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
            Jastip kuliner pasar, belanja oleh-oleh khas, toko sembako, dan jasa antar barang kilat
            Singkawang hingga Bengkayang.
          </p>

          {/* Quick Action Primary Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('jastip')}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-amber-400/20 active:scale-95 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>JASTIP SEKARANG</span>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition"
            >
              <Truck className="w-4 h-4" />
              <span>ANTAR BARANG</span>
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 hidden sm:block pointer-events-none">
          <ShoppingBag className="w-48 h-48" />
        </div>
      </section>

      {/* Global Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm px-3.5 py-3 gap-2.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setActiveTab('stores');
              }
            }}
            placeholder="Cari toko, makanan, produk, atau layanan di Singkawang..."
            className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
          />
          <button
            onClick={() => setActiveTab('stores')}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition shrink-0"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Kategori Layanan</h2>
          <button
            onClick={() => setActiveTab('stores')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            <span>Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {categories.slice(0, 14).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.slug === 'jastip') setActiveTab('jastip');
                else if (cat.slug === 'antar-barang') setActiveTab('delivery');
                else setActiveTab('stores');
              }}
              className="flex flex-col items-center p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-sky-200 hover:shadow-xs active:scale-95 transition text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 truncate w-full">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Active Promos Banner */}
      {promos.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Promo &amp; Voucher Spesial</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {promos.map((promo) => (
              <div
                key={promo.id}
                className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 p-3.5 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-md">
                    KODE: {promo.code}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">{promo.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Min. Transaksi {formatRupiah(promo.min_order)}
                  </p>
                </div>
                <button
                  onClick={() => copyPromo(promo.code)}
                  className="p-2 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 shadow-2xs active:scale-95 transition"
                  title="Salin Kode Voucher"
                >
                  {copiedCode === promo.code ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toko Terpopuler & Terdekat Singkawang */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900">Toko &amp; Kuliner Terpopuler</h2>
          </div>
          <button
            onClick={() => setActiveTab('stores')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {popularStores.map((store) => {
            const storeProductCount = products.filter((p) => p.store_id === store.id).length;

            return (
              <div
                key={store.id}
                onClick={() => onSelectStore(store)}
                className="group flex gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md cursor-pointer transition"
              >
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-100 group-hover:scale-105 transition"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                        {store.category}
                      </span>
                      {storeProductCount === 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Jastip
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 truncate">{store.district}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 truncate mt-1">{store.name}</h3>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{store.rating}</span>
                      <span className="text-slate-400 font-normal">({store.review_count})</span>
                    </div>

                    {storeProductCount === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJastipTargetStore({ storeName: store.name, address: store.address });
                          setActiveTab('jastip');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-2xs active:scale-95 transition"
                      >
                        <ShoppingBag className="w-2.5 h-2.5" />
                        <span>Jastip</span>
                      </button>
                    ) : (
                      <span className="text-sky-600 font-semibold">
                        {calculateDistanceKm(
                          userLocation.lat,
                          userLocation.lng,
                          store.latitude,
                          store.longitude
                        )}{' '}
                        km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Produk Pilihan UMKM */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Produk UMKM Pilihan</h2>
          </div>
          <button
            onClick={() => setActiveTab('stores')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            <span>Lainnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {promoProducts.map((prod) => (
            <div
              key={prod.id}
              className="flex flex-col justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition"
            >
              <div
                onClick={() => onSelectProduct(prod)}
                className="cursor-pointer space-y-2"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                  {prod.promo_price && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                      PROMO
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {prod.store_name}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                    {prod.name}
                  </h4>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-sky-600">
                    {formatRupiah(prod.promo_price ?? prod.price)}
                  </div>
                  {prod.promo_price && (
                    <div className="text-[10px] text-slate-400 line-through">
                      {formatRupiah(prod.price)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => addToCart(prod, 1)}
                  className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white transition active:scale-95"
                  title="Tambah ke Keranjang"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rute Antar Kota Singkawang - Bengkayang Info */}
      <section className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Jadwal Reguler Antar Kota: Singkawang ⇄ Bengkayang
            </h3>
          </div>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
            Senin – Jumat
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Kirim dokumen, sampel dagangan, paket pakaian, atau barang belanja antar kabupaten dengan
          tarif terjangkau mulai dari Rp15.000.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Jalur Pagi</span>
              <strong className="text-white">Singkawang → Bengkayang</strong>
            </div>
            <span className="text-amber-400 font-bold">06.00 WIB</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Jalur Sore</span>
              <strong className="text-white">Bengkayang → Singkawang</strong>
            </div>
            <span className="text-amber-400 font-bold">16.00 WIB</span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('delivery')}
          className="w-full sm:w-auto mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
        >
          <span>Pesan Antar Barang Sekarang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>
    </div>
  );
};
