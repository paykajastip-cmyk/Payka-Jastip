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
import { SingkawangMap } from './components/Map/SingkawangMap';
import { Store, Product, Order } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser } = useApp();

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

        {/* 13. DRIVER PORTAL */}
        {activeTab === 'driver' && <DriverPortalPage />}

        {/* 14. MERCHANT PORTAL */}
        {activeTab === 'merchant' && <MerchantPortalPage />}

        {/* 15. ADMIN SUITE */}
        {activeTab === 'admin' && <AdminSuitePage />}

        {/* 16. PROFILE & ROLE SWITCHER */}
        {activeTab === 'profile' && <ProfilePage setActiveTab={setActiveTab} />}
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
