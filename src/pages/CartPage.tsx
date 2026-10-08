import React, { useMemo } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Store,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CartItem } from '../types';
import { formatRupiah } from '../utils/helpers';

interface CartPageProps {
  setActiveTab: (tab: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ setActiveTab }) => {
  const { cart, updateCartQuantity, removeFromCart, clearCart, stores } = useApp();

  // Group cart items by store
  const storeGroups = useMemo(() => {
    const map = new Map<string, { storeName: string; items: CartItem[] }>();

    cart.forEach((item) => {
      const storeId = item.product.store_id;
      const storeName =
        item.product.store_name ||
        stores.find((s) => s.id === storeId)?.name ||
        'Toko Singkawang';

      if (!map.has(storeId)) {
        map.set(storeId, { storeName, items: [] });
      }
      map.get(storeId)!.items.push(item);
    });

    return Array.from(map.entries());
  }, [cart, stores]);

  const totalCartAmount = cart.reduce((sum, item) => {
    const price = item.product.promo_price ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Keranjang Belanja Masih Kosong</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Yuk jelajahi kuliner dan produk UMKM khas Singkawang untuk mulai berbelanja!
        </p>
        <button
          onClick={() => setActiveTab('stores')}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          Lihat Daftar Toko
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            Keranjang Belanja ({cart.length} Produk)
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 p-1.5"
        >
          Kosongkan
        </button>
      </div>

      {storeGroups.length > 1 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
          <p className="font-semibold">Info Multi-Toko:</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Produk berasal dari {storeGroups.length} toko berbeda. Order akan dipisah per toko saat
            checkout agar pengantaran lebih cepat dan rapi.
          </p>
        </div>
      )}

      {/* Grouped by Store */}
      {storeGroups.map(([storeId, group]) => {
        const storeSubtotal = group.items.reduce((sum, it) => {
          const p = it.product.promo_price ?? it.product.price;
          return sum + p * it.quantity;
        }, 0);

        return (
          <div
            key={storeId}
            className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Store className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 truncate">{group.storeName}</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {group.items.map((item, idx) => {
                const itemPrice = item.product.promo_price ?? item.product.price;
                return (
                  <div key={`${item.product.id}-${idx}`} className="py-3 flex gap-3 items-center">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      {item.selectedVariations &&
                        Object.keys(item.selectedVariations).length > 0 && (
                          <p className="text-[10px] text-slate-500">
                            {Object.entries(item.selectedVariations)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                          </p>
                        )}
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 italic truncate">
                          Catatan: {item.notes}
                        </p>
                      )}
                      <div className="text-xs font-bold text-sky-600 mt-1">
                        {formatRupiah(itemPrice)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity - 1)
                        }
                        className="p-1 rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity + 1)
                        }
                        className="p-1 rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Subtotal Toko ini:</span>
              <span className="font-extrabold text-slate-900">{formatRupiah(storeSubtotal)}</span>
            </div>
          </div>
        );
      })}

      {/* Fixed Bottom Checkout Trigger */}
      <div className="fixed bottom-16 left-4 right-4 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md p-3.5 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Total Pesanan:</span>
          <span className="text-base font-extrabold text-sky-600">
            {formatRupiah(totalCartAmount)}
          </span>
        </div>

        <button
          onClick={() => setActiveTab('checkout')}
          className="py-2.5 px-5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center gap-1.5 active:scale-95 transition"
        >
          <span>Lanjut Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
