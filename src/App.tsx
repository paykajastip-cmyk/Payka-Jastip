import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { HomePage } from './pages/HomePage';
import { StoreDirectoryPage } from './pages/StoreDirectoryPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { JastipPage } from './pages/JastipPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { DriverPortalPage } from './pages/DriverPortalPage';
import { MerchantPortalPage } from './pages/MerchantPortalPage';
import { AdminSuitePage } from './pages/AdminSuitePage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SingkawangMap } from './components/Map/SingkawangMap';
import { Store, Product, Order } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, canAccessMerchant, canAccessDriver, canAccessAdmin } = useApp();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activePaymentOrderId, setActivePaymentOrderId] = useState<string | null>(null);

  // Navigation handlers
  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setActiveTab('store-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab('order-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPayment = (orderId: string) => {
    setActivePaymentOrderId(orderId);
    setActiveTab('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Top Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-4">
        {/* 1. HOME */}
        {activeTab === 'home' && (
          <HomePage
            onSelectStore={handleSelectStore}
            onSelectProduct={handleSelectProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 2. STORES DIRECTORY */}
        {activeTab === 'stores' && (
          <StoreDirectoryPage
            onSelectStore={handleSelectStore}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 3. STORE DETAIL */}
        {activeTab === 'store-detail' && selectedStore && (
          <StoreDetailPage
            store={selectedStore}
            onBack={() => setActiveTab('stores')}
            onSelectProduct={handleSelectProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 4. PRODUCT DETAIL */}
        {activeTab === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            onBack={() => {
              if (selectedStore) setActiveTab('store-detail');
              else setActiveTab('home');
            }}
            onSelectStore={handleSelectStore}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 5. CART */}
        {activeTab === 'cart' && <CartPage setActiveTab={setActiveTab} />}

        {/* 6. CHECKOUT */}
        {activeTab === 'checkout' && (
          <CheckoutPage
            onBack={() => setActiveTab('cart')}
            onOrderCreated={(orderId) => {
              handleOpenPayment(orderId);
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 7. PAYMENT PORTAL */}
        {activeTab === 'payment' && activePaymentOrderId && (
          <PaymentPage
            orderId={activePaymentOrderId}
            onBack={() => setActiveTab('orders')}
            onPaymentSuccess={() => setActiveTab('orders')}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 8. JASTIP */}
        {activeTab === 'jastip' && <JastipPage setActiveTab={setActiveTab} />}

        {/* 9. ANTAR BARANG / DELIVERY */}
        {activeTab === 'delivery' && <DeliveryPage setActiveTab={setActiveTab} />}

        {/* 10. MAPS VIEW */}
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-130px)] rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <SingkawangMap
              onSelectStore={(st) => {
                handleSelectStore(st);
              }}
              onNavigateToJastip={() => setActiveTab('jastip')}
            />
          </div>
        )}

        {/* 11. ORDERS HISTORY */}
        {activeTab === 'orders' && (
          <OrdersPage
            onSelectOrder={handleSelectOrder}
            onOpenPayment={handleOpenPayment}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 12. ORDER DETAIL TIMELINE */}
        {activeTab === 'order-detail' && selectedOrder && (
          <OrderDetailPage
            order={selectedOrder}
            onBack={() => setActiveTab('orders')}
            onOpenPayment={handleOpenPayment}
          />
        )}

        {/* 13. DRIVER PORTAL - STRICT ACCESS CONTROL */}
        {activeTab === 'driver' && (
          canAccessDriver ? (
            <DriverPortalPage />
          ) : currentUser?.role === 'driver' && currentUser.approval_status === 'pending' ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                ⏳
              </div>
              <h2 className="text-lg font-black text-slate-900">Menunggu Persetujuan Admin</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Pendaftaran Driver berhasil. Akun Anda sedang menunggu persetujuan Admin sebelum dapat mengakses dashboard tugas.
              </p>
              <button
                onClick={() => setActiveTab('home')}
                className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : currentUser?.role === 'driver' && currentUser.approval_status === 'rejected' ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
                ❌
              </div>
              <h2 className="text-lg font-black text-slate-900">Pendaftaran Driver Ditolak</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {currentUser.rejection_reason || 'Pendaftaran driver belum memenuhi persyaratan berkas.'}
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Buka Profil
              </button>
            </div>
          ) : (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl">
                🛵
              </div>
              <h2 className="text-lg font-black text-slate-900">Portal Mitra Driver</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Anda perlu mendaftar atau masuk sebagai Driver resmi untuk mengakses tugas pengantaran.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  Daftar sebagai Driver
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Ke Beranda
                </button>
              </div>
            </div>
          )
        )}

        {/* 14. MERCHANT PORTAL - STRICT ACCESS CONTROL */}
        {activeTab === 'merchant' && (
          canAccessMerchant ? (
            <MerchantPortalPage />
          ) : currentUser?.role === 'merchant' && currentUser.approval_status === 'pending' ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                ⏳
              </div>
              <h2 className="text-lg font-black text-slate-900">Menunggu Persetujuan Admin</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Pendaftaran Merchant berhasil. Akun Anda sedang menunggu persetujuan Admin sebelum dapat mengakses dashboard toko.
              </p>
              <button
                onClick={() => setActiveTab('home')}
                className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : currentUser?.role === 'merchant' && currentUser.approval_status === 'rejected' ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
                ❌
              </div>
              <h2 className="text-lg font-black text-slate-900">Pendaftaran Merchant Ditolak</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {currentUser.rejection_reason || 'Pendaftaran toko belum disetujui oleh admin.'}
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Buka Profil / Ajukan Ulang
              </button>
            </div>
          ) : (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-2xl">
                🏪
              </div>
              <h2 className="text-lg font-black text-slate-900">Portal Mitra Merchant</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Anda perlu mendaftar atau masuk sebagai Merchant resmi untuk mengakses dashboard toko.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Daftar sebagai Merchant
                </button>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Ke Beranda
                </button>
              </div>
            </div>
          )
        )}

        {/* 15. ADMIN SUITE - STRICT ACCESS CONTROL */}
        {activeTab === 'admin' && (
          canAccessAdmin ? (
            <AdminSuitePage />
          ) : (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
                🛡️
              </div>
              <h2 className="text-lg font-black text-slate-900">Akses Admin Ditolak</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Halaman ini dilindungi dan hanya dapat diakses oleh akun resmi paykajastip@gmail.com.
              </p>
              <button
                onClick={() => setActiveTab('home')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Kembali ke Beranda
              </button>
            </div>
          )
        )}

        {/* 16. PROFILE & ACCOUNT */}
        {activeTab === 'profile' && <ProfilePage setActiveTab={setActiveTab} />}

        {/* 17. NOTIFICATIONS - ISOLATED PER USER ACCOUNT */}
        {activeTab === 'notifications' && (
          <NotificationsPage
            setActiveTab={setActiveTab}
            onSelectOrder={handleSelectOrder}
          />
        )}
      </main>

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
