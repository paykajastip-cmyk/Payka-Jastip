import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Phone,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Navigation,
  X,
} from 'lucide-react';
import { Store, Product } from '../types';
import { useApp } from '../context/AppContext';
import {
  formatRupiah,
  createWhatsAppUrl,
  getGoogleMapsNavUrl,
  calculateDistanceKm,
} from '../utils/helpers';

interface StoreDetailPageProps {
  store: Store;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({
  store,
  onBack,
  onSelectProduct,
  setActiveTab,
}) => {
  const { products, addToCart, userLocation, cartCount, setJastipTargetStore } = useApp();
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cartNotes, setCartNotes] = useState('');
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [addedToast, setAddedToast] = useState(false);

  const storeProducts = products.filter((p) => p.store_id === store.id);

  const filteredProducts = storeProducts.filter((p) => {
    return (
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearch.toLowerCase())
    );
  });

  const handleOpenCartModal = (prod: Product) => {
    setSelectedProductForCart(prod);
    setCartQuantity(1);
    setCartNotes('');

    // Pre-select first variation option if exists
    if (prod.variations && prod.variations.length > 0) {
      const initial: Record<string, string> = {};
      prod.variations.forEach((v) => {
        if (v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
      setSelectedVariations(initial);
    } else {
      setSelectedVariations({});
    }
  };

  const handleAddToCartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForCart) return;

    addToCart(selectedProductForCart, cartQuantity, selectedVariations, cartNotes);
    setSelectedProductForCart(null);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-white border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Toko</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Jastip Sekarang Button */}
          {storeProducts.length === 0 && (
            <button
              onClick={() => {
                setJastipTargetStore({ storeName: store.name, address: store.address });
                setActiveTab('jastip');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-xs active:scale-95 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Jastip Sekarang!</span>
            </button>
          )}

          {/* WhatsApp Direct Chat */}
          <a
            href={createWhatsAppUrl(
              store.whatsapp,
              `Halo ${store.name}, saya ingin tanya pesanan produk dari PAYKAJASTIP.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Chat WhatsApp</span>
          </a>

          {/* Navigation link */}
          <a
            href={getGoogleMapsNavUrl(store.latitude, store.longitude, store.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navigasi</span>
          </a>
        </div>
      </div>

      {/* Store Banner & Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-slate-100">
          <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="p-4 sm:p-5 relative -mt-10 sm:-mt-12 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <img
            src={store.logo_url}
            alt={store.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md shrink-0 bg-white"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                {store.category}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Terverifikasi</span>
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  store.is_open ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {store.is_open ? 'Buka Sekarang' : 'Toko Tutup'}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 truncate">
              {store.name}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {store.address} ({store.district})
              </span>
            </p>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="grid grid-cols-3 border-t border-slate-100 p-3 bg-slate-50/70 text-center text-xs divide-x divide-slate-200">
          <div>
            <span className="text-slate-400 text-[10px] block">Rating Toko</span>
            <span className="font-extrabold text-amber-500">
              ★ {store.rating} ({store.review_count} ulasan)
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Jam Buka</span>
            <span className="font-bold text-slate-700">{store.opening_hours}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Jarak Pengantaran</span>
            <span className="font-extrabold text-sky-600">
              {calculateDistanceKm(
                userLocation.lat,
                userLocation.lng,
                store.latitude,
                store.longitude
              )}{' '}
              km
            </span>
          </div>
        </div>

        <div className="p-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
          <p>{store.description}</p>
        </div>
      </div>

      {/* Catalog Search */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight shrink-0">
          Daftar Menu &amp; Produk ({filteredProducts.length})
        </h2>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Cari menu di toko ini..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      {/* Products List Grid / Empty State */}
      {storeProducts.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-br from-amber-50/90 via-orange-50 to-amber-100/60 border-2 border-dashed border-amber-300 text-center shadow-xs flex flex-col items-center justify-center my-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md mb-3 text-2xl font-black">
            🛍️
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider mb-2">
            Belum Ada Produk Terdaftar
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Toko ini belum menambahkan katalog produk
          </h3>
          <p className="text-xs text-slate-600 max-w-md mt-1.5 mb-5 leading-relaxed">
            Ingin memesan makanan atau barang dari <strong>{store.name}</strong>? Jangan khawatir! Kurir PaykaJastip siap membelikan dan mengantar pesananmu langsung ke alamatmu.
          </p>
          <button
            onClick={() => {
              setJastipTargetStore({ storeName: store.name, address: store.address });
              setActiveTab('jastip');
            }}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-sm flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Jastip Sekarang!</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center my-3">
          <p className="text-xs text-slate-600 mb-3">
            Menu tidak ditemukan untuk pencarian &quot;<strong>{productSearch}</strong>&quot;. Ingin pesan menu khusus yang tidak tercantum?
          </p>
          <button
            onClick={() => {
              setJastipTargetStore({ storeName: store.name, address: store.address });
              setActiveTab('jastip');
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs active:scale-95 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Jastip Sekarang! (Pesan Khusus dari {store.name})</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md flex gap-3 justify-between transition"
            >
              <div
                onClick={() => onSelectProduct(prod)}
                className="flex-1 min-w-0 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    {prod.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                    {prod.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                <div className="mt-2">
                  <div className="text-xs font-extrabold text-sky-600">
                    {formatRupiah(prod.promo_price ?? prod.price)}
                  </div>
                  {prod.promo_price && (
                    <div className="text-[10px] text-slate-400 line-through">
                      {formatRupiah(prod.price)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between shrink-0">
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  onClick={() => onSelectProduct(prod)}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100 cursor-pointer"
                />

                <button
                  onClick={() => handleOpenCartModal(prod)}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pesan</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add To Cart Slideout Modal */}
      {selectedProductForCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tambah ke Keranjang</h3>
              <button
                onClick={() => setSelectedProductForCart(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddToCartSubmit} className="mt-3 space-y-3.5">
              <div className="flex gap-3 items-center">
                <img
                  src={selectedProductForCart.image_url}
                  alt={selectedProductForCart.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {selectedProductForCart.name}
                  </h4>
                  <div className="text-xs font-extrabold text-sky-600 mt-1">
                    {formatRupiah(
                      selectedProductForCart.promo_price ?? selectedProductForCart.price
                    )}
                  </div>
                </div>
              </div>

              {/* Variations */}
              {selectedProductForCart.variations &&
                selectedProductForCart.variations.map((v) => (
                  <div key={v.name} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Pilihan {v.name}:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {v.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSelectedVariations((prev) => ({ ...prev, [v.name]: opt }))
                          }
                          className={`px-3 py-1 rounded-xl text-xs font-medium border transition ${
                            selectedVariations[v.name] === opt
                              ? 'bg-sky-600 text-white border-sky-600 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={cartNotes}
                  onChange={(e) => setCartNotes(e.target.value)}
                  placeholder="Contoh: jangan terlalu pedas, bungkus terpisah"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Quantity Adjuster */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-700">Jumlah Pesanan:</span>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setCartQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100 disabled:opacity-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold w-6 text-center">{cartQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setCartQuantity((q) => q + 1)}
                    className="p-1 rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-98 transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    Tambah ke Keranjang •{' '}
                    {formatRupiah(
                      (selectedProductForCart.promo_price ?? selectedProductForCart.price) *
                        cartQuantity
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4" />
          <span>Produk berhasil ditambahkan ke keranjang!</span>
        </div>
      )}

      {/* Floating Checkout Button if cart has items */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('cart')}
            className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xl shadow-sky-600/30 flex items-center justify-between active:scale-98 transition"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{cartCount} item di keranjang</span>
            </div>
            <span>Lanjut ke Checkout →</span>
          </button>
        </div>
      )}
    </div>
  );
};
