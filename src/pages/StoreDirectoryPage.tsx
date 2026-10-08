import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Star,
  Phone,
  Clock,
  Filter,
  ChevronRight,
  Store as StoreIcon,
  CheckCircle,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Store } from '../types';
import { calculateDistanceKm, createWhatsAppUrl } from '../utils/helpers';

interface StoreDirectoryPageProps {
  onSelectStore: (store: Store) => void;
  setActiveTab: (tab: string) => void;
}

export const StoreDirectoryPage: React.FC<StoreDirectoryPageProps> = ({
  onSelectStore,
  setActiveTab,
}) => {
  const { stores, categories, userLocation, products, setJastipTargetStore } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedDistrict, setSelectedDistrict] = useState('Semua');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const districts = [
    'Semua',
    'Singkawang Barat',
    'Singkawang Tengah',
    'Singkawang Timur',
    'Singkawang Utara',
    'Singkawang Selatan',
    'Bengkayang',
  ];

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchCat =
        selectedCategory === 'Semua' ||
        store.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchDist =
        selectedDistrict === 'Semua' ||
        store.district.toLowerCase() === selectedDistrict.toLowerCase();

      const matchOpen = !onlyOpen || store.is_open;

      const matchQuery =
        !searchQuery ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchDist && matchOpen && store.is_active;
    });
  }, [stores, selectedCategory, selectedDistrict, onlyOpen, searchQuery]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Daftar Toko &amp; Merchant Singkawang
          </h1>
          <p className="text-xs text-slate-500">
            Temukan kuliner legendaris, sembako, dan toko UMKM lokal terpercaya.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('map')}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 p-2 rounded-xl bg-sky-50"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Lihat di Peta</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama toko, jalan, atau menu..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-sky-500 shadow-2xs"
        />
      </div>

      {/* Filter Strips */}
      <div className="space-y-2">
        {/* District Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 px-1">
            Wilayah:
          </span>
          {districts.map((dist) => (
            <button
              key={dist}
              onClick={() => setSelectedDistrict(dist)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedDistrict === dist
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>

        {/* Category Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 px-1">
            Kategori:
          </span>
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === 'Semua'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.name
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count & Status Toggle */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Menampilkan {filteredStores.length} toko</span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
            className="rounded text-sky-600 focus:ring-sky-500"
          />
          <span className="font-medium text-slate-700">Hanya yang buka</span>
        </label>
      </div>

      {/* Stores Grid List / Empty State */}
      {filteredStores.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-amber-50/90 via-orange-50 to-amber-100/60 border-2 border-dashed border-amber-300 text-center shadow-xs flex flex-col items-center justify-center my-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md mb-3 text-2xl font-black">
            🛍️
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Toko Tidak Ditemukan di Katalog
          </h3>
          <p className="text-xs text-slate-600 max-w-md mt-1.5 mb-5 leading-relaxed">
            Tidak menemukan warung, toko, atau merchant yang Anda cari? Tenang! Kamu bisa memesan barang apa saja dari toko mana pun di Singkawang & Bengkayang via layanan Jastip kami.
          </p>
          <button
            onClick={() => {
              if (searchQuery.trim()) {
                setJastipTargetStore({ storeName: searchQuery.trim() });
              }
              setActiveTab('jastip');
            }}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Jastip Sekarang!</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredStores.map((store) => {
            const storeProductCount = products.filter((p) => p.store_id === store.id).length;

            return (
              <div
                key={store.id}
                onClick={() => onSelectStore(store)}
                className="group p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100 group-hover:scale-105 transition"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                          {store.category}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            store.is_open
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {store.is_open ? 'Buka' : 'Tutup'}
                        </span>
                        {storeProductCount === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Menu via Jastip
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {store.district}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1 truncate group-hover:text-sky-600 transition">
                        {store.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{store.address}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {store.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{store.rating}</span>
                      <span className="text-slate-400 font-normal">({store.review_count})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{store.opening_hours.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {storeProductCount === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJastipTargetStore({ storeName: store.name, address: store.address });
                          setActiveTab('jastip');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-2xs transition"
                        title="Toko ini belum ada menu, klik untuk request jastip langsung"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Jastip Sekarang!</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-sky-600 font-bold">
                        <span>
                          {calculateDistanceKm(
                            userLocation.lat,
                            userLocation.lng,
                            store.latitude,
                            store.longitude
                          )}{' '}
                          km
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
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
