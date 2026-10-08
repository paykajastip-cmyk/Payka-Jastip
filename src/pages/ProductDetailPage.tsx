import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Store,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Product, Store as StoreType } from '../types';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/helpers';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectStore: (store: StoreType) => void;
  setActiveTab: (tab: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectStore,
  setActiveTab,
}) => {
  const { stores, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [addedToast, setAddedToast] = useState(false);

  const parentStore = stores.find((s) => s.id === product.store_id);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariations, notes);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariations, notes);
    setActiveTab('checkout');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Bar */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-white border border-slate-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali</span>
      </button>

      {/* Product Image & Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="relative aspect-video sm:aspect-21/9 bg-slate-100 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.promo_price && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-rose-500 text-white text-xs font-extrabold shadow-sm">
              PROMO SPESIAL
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">
              {product.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              <span>{product.weight_gram} gr</span>
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xl font-extrabold text-sky-600">
              {formatRupiah(product.promo_price ?? product.price)}
            </span>
            {product.promo_price && (
              <span className="text-xs text-slate-400 line-through">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {product.description}
          </p>

          {/* Store Info Ribbon */}
          {parentStore && (
            <div
              onClick={() => onSelectStore(parentStore)}
              className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={parentStore.logo_url}
                  alt={parentStore.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{parentStore.name}</h4>
                  <span className="text-[11px] text-slate-500">
                    {parentStore.district} • {parentStore.is_open ? 'Buka' : 'Tutup'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-sky-600">Kunjungi Toko →</span>
            </div>
          )}

          {/* Variations Selection */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-3 pt-2">
              {product.variations.map((v) => (
                <div key={v.name} className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Pilihan {v.name}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() =>
                          setSelectedVariations((prev) => ({ ...prev, [v.name]: opt }))
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
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
            </div>
          )}

          {/* Notes Input */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan Pesanan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: jangan pakai micin / bungkus plastik dobel"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Quantity Counter */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700">Jumlah:</span>
            <div className="flex items-center gap-3 border border-slate-200 rounded-xl p-1 bg-slate-50">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action CTA */}
      <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto flex gap-2">
        <button
          onClick={handleAddToCart}
          className="flex-1 py-3 px-3 rounded-2xl bg-white border border-sky-600 text-sky-600 font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>+ Keranjang</span>
        </button>

        <button
          onClick={handleBuyNow}
          className="flex-1 py-3 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xl shadow-sky-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <span>Beli Sekarang • {formatRupiah((product.promo_price ?? product.price) * quantity)}</span>
        </button>
      </div>

      {addedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4" />
          <span>Produk berhasil ditambahkan ke keranjang!</span>
        </div>
      )}
    </div>
  );
};
