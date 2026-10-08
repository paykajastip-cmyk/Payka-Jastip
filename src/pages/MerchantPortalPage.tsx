import React, { useState } from 'react';
import {
  Store,
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Phone,
  Power,
  Image,
  DollarSign,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Store as StoreType, Product } from '../types';
import { formatRupiah, createWhatsAppUrl } from '../utils/helpers';

export const MerchantPortalPage: React.FC = () => {
  const {
    currentUser,
    stores,
    updateStore,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    orders,
    updateOrderStatus,
    categories,
  } = useApp();

  // Find store belonging to current merchant or fallback to first store
  const merchantStore =
    stores.find((s) => currentUser && s.merchant_id === currentUser.id) || stores[0];

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'profile'>('orders');

  // Product modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodPromoPrice, setProdPromoPrice] = useState<number | ''>('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Makanan');
  const [prodStock, setProdStock] = useState<number>(50);
  const [prodWeight, setProdWeight] = useState<number>(400);
  const [prodImage, setProdImage] = useState('');

  // Store profile edit states
  const [storeOpen, setStoreOpen] = useState(merchantStore?.is_open ?? true);
  const [storeHours, setStoreHours] = useState(merchantStore?.opening_hours || '');
  const [storePhone, setStorePhone] = useState(merchantStore?.whatsapp || '');
  const [storeDesc, setStoreDesc] = useState(merchantStore?.description || '');

  if (!merchantStore) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        Toko merchant belum terdaftar.
      </div>
    );
  }

  // Filter products for this store
  const myProducts = products.filter((p) => p.store_id === merchantStore.id);

  // Filter orders for this store
  const myOrders = orders.filter((o) => o.store_id === merchantStore.id);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdPrice(25000);
    setProdPromoPrice('');
    setProdDesc('');
    setProdCategory(merchantStore.category || 'Makanan');
    setProdStock(50);
    setProdWeight(400);
    setProdImage(
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    );
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(prod.price);
    setProdPromoPrice(prod.promo_price ?? '');
    setProdDesc(prod.description);
    setProdCategory(prod.category);
    setProdStock(prod.stock);
    setProdWeight(prod.weight_gram);
    setProdImage(prod.image_url);
    setShowProductModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodName,
        price: prodPrice,
        promo_price: typeof prodPromoPrice === 'number' ? prodPromoPrice : undefined,
        description: prodDesc,
        category: prodCategory,
        stock: prodStock,
        weight_gram: prodWeight,
        image_url: prodImage,
      });
    } else {
      addProduct({
        store_id: merchantStore.id,
        store_name: merchantStore.name,
        name: prodName,
        price: prodPrice,
        promo_price: typeof prodPromoPrice === 'number' ? prodPromoPrice : undefined,
        description: prodDesc,
        category: prodCategory,
        stock: prodStock,
        weight_gram: prodWeight,
        is_available: true,
        image_url:
          prodImage ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      });
    }
    setShowProductModal(false);
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStore(merchantStore.id, {
      is_open: storeOpen,
      opening_hours: storeHours,
      whatsapp: storePhone,
      description: storeDesc,
    });
    alert('Profil toko berhasil diperbarui!');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Merchant Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={merchantStore.logo_url}
              alt={merchantStore.name}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm font-extrabold text-slate-900">{merchantStore.name}</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  {merchantStore.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{merchantStore.address}</p>
            </div>
          </div>

          <button
            onClick={() => {
              const next = !merchantStore.is_open;
              updateStore(merchantStore.id, { is_open: next });
              setStoreOpen(next);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition shadow-xs ${
              merchantStore.is_open
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{merchantStore.is_open ? 'BUKA' : 'TUTUP'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Pesanan Masuk ({myOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Kelola Menu ({myProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Profil Toko</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Belum ada pesanan masuk untuk toko ini.
            </div>
          ) : (
            myOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    #{ord.order_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {ord.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pemesan:</span>
                    <strong className="text-slate-800">{ord.customer_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Bayar:</span>
                    <span
                      className={`font-bold ${
                        ord.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {ord.payment_status.toUpperCase()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">
                      Menu yang dipesan:
                    </span>
                    {ord.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-[11px]">
                        <span>
                          {it.quantity}x {it.product_name}
                        </span>
                        <span>{formatRupiah(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={createWhatsAppUrl(
                      ord.customer_phone,
                      `Halo Kak ${ord.customer_name}, kami dari ${merchantStore.name} mengenai pesanan #${ord.order_number}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Phone className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>

                  {ord.status === 'MENUNGGU KONFIRMASI' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'TOKO MENERIMA')}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs"
                    >
                      Terima &amp; Siapkan
                    </button>
                  )}

                  {ord.status === 'TOKO MENERIMA' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'MENUNGGU DRIVER')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs"
                    >
                      Siap Diambil Driver
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Products Management */}
      {activeTab === 'products' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Daftar Menu &amp; Produk Toko</span>
            <button
              onClick={handleOpenAddProduct}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Menu</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-slate-200 p-3.5 flex gap-3 justify-between shadow-2xs"
              >
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                    <div className="text-xs font-extrabold text-sky-600 mt-0.5">
                      {formatRupiah(prod.promo_price ?? prod.price)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Stok: {prod.stock} • {prod.is_available ? 'Tersedia' : 'Kosong'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-2">
                    <button
                      onClick={() =>
                        updateProduct(prod.id, { is_available: !prod.is_available })
                      }
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        prod.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {prod.is_available ? 'Aktif' : 'Nonaktif'}
                    </button>

                    <button
                      onClick={() => handleOpenEditProduct(prod)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Hapus produk ini?')) deleteProduct(prod.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Store Profile Settings */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveStoreProfile}
          className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3.5 shadow-xs"
        >
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pengaturan Toko
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Jam Operasional Toko
            </label>
            <input
              type="text"
              value={storeHours}
              onChange={(e) => setStoreHours(e.target.value)}
              placeholder="Contoh: 07.00 - 21.00 WIB"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              WhatsApp Pemilik Toko
            </label>
            <input
              type="tel"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deskripsi Profil Toko
            </label>
            <textarea
              rows={3}
              value={storeDesc}
              onChange={(e) => setStoreDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20"
          >
            Simpan Perubahan Toko
          </button>
        </form>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'Edit Menu / Produk' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Menu *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Normal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Promo (Rp)
                  </label>
                  <input
                    type="number"
                    value={prodPromoPrice}
                    onChange={(e) =>
                      setProdPromoPrice(e.target.value ? parseInt(e.target.value) : '')
                    }
                    placeholder="Opsional"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  URL Foto Produk
                </label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deskripsi Menu
                </label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Berat (gram)
                  </label>
                  <input
                    type="number"
                    value={prodWeight}
                    onChange={(e) => setProdWeight(parseInt(e.target.value) || 500)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20"
              >
                {editingProduct ? 'Perbarui Menu' : 'Simpan Menu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
