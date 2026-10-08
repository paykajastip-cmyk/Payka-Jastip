import React from 'react';
import { Home, Store, Map, ClipboardList, User, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { cartCount, orders, currentUser } = useApp();

  const userActiveOrders = orders.filter(
    (o) =>
      o.customer_id === currentUser.id &&
      o.status !== 'SELESAI' &&
      o.status !== 'DIBATALKAN'
  );

  const navItems = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'stores', label: 'TOKO', icon: Store },
    { id: 'map', label: 'MAP', icon: Map },
    {
      id: 'orders',
      label: 'PESANAN',
      icon: ClipboardList,
      badge: userActiveOrders.length > 0 ? userActiveOrders.length : null,
    },
    { id: 'profile', label: 'PROFIL', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg safe-bottom">
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition active:scale-90 ${
                isActive
                  ? 'text-sky-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
