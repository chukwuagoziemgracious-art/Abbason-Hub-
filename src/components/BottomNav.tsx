import React from 'react';
import { Compass, Search, ShoppingBag, Package, User, Shield } from 'lucide-react';
import { store } from '../services/store';

interface BottomNavProps {
  activeScreen: 'explore' | 'search' | 'orders' | 'account' | 'admin';
  onNavigate: (screen: 'explore' | 'search' | 'orders' | 'account' | 'admin') => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onNavigate,
  onOpenCart,
}) => {
  const cart = store.getCart();
  const isAdmin = store.isAdminAuthenticated();
  const pendingProducts = store.getPendingProducts();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-[#020406]/90 backdrop-blur-[20px] border-t border-white/[0.08] px-2 py-1 pb-safe shadow-[0_-15px_30px_rgba(0,0,0,0.7)]">
      <div className="grid grid-cols-5 items-center h-12">
        {/* Tab 1: Explore */}
        <button
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center justify-center min-h-[38px] transition-colors cursor-pointer ${
            activeScreen === 'explore'
              ? 'text-[#C8A96A]'
              : 'text-[#8C9399] hover:text-[#E9E6DF]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase mt-0.5">Explore</span>
        </button>

        {/* Tab 2: Search */}
        <button
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center justify-center min-h-[38px] transition-colors cursor-pointer ${
            activeScreen === 'search'
              ? 'text-[#C8A96A]'
              : 'text-[#8C9399] hover:text-[#E9E6DF]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase mt-0.5">Search</span>
        </button>

        {/* Tab 3: Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center min-h-[38px] text-[#8C9399] hover:text-[#E9E6DF] transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 text-[#C8A96A]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#C8A96A] text-[#020406] font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase mt-0.5">Basket</span>
        </button>

        {/* Tab 4: Orders */}
        <button
          onClick={() => onNavigate('orders')}
          className={`flex flex-col items-center justify-center min-h-[38px] transition-colors cursor-pointer ${
            activeScreen === 'orders'
              ? 'text-[#C8A96A]'
              : 'text-[#8C9399] hover:text-[#E9E6DF]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[9px] font-medium tracking-[0.1em] uppercase mt-0.5">My Orders</span>
        </button>

        {/* Tab 5: Account (Or Admin if owner is authenticated) */}
        {isAdmin ? (
          <button
            onClick={() => onNavigate('admin')}
            className={`relative flex flex-col items-center justify-center min-h-[38px] transition-colors cursor-pointer ${
              activeScreen === 'admin'
                ? 'text-[#C8A96A]'
                : 'text-[#8C9399] hover:text-[#E9E6DF]'
            }`}
          >
            <Shield className="w-4 h-4 text-[#C8A96A]" />
            <span className="text-[9px] font-medium tracking-[0.1em] uppercase mt-0.5">Admin</span>
            {pendingProducts.length > 0 && (
              <span className="absolute top-0.5 right-2 bg-[#C8A96A] text-[#020406] text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center">
                {pendingProducts.length}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('account')}
            className={`flex flex-col items-center justify-center min-h-[38px] transition-colors cursor-pointer ${
              activeScreen === 'account'
                ? 'text-[#C8A96A]'
                : 'text-[#8C9399] hover:text-[#E9E6DF]'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[9px] font-medium tracking-[0.1em] uppercase mt-0.5">Account</span>
          </button>
        )}
      </div>
    </nav>
  );
};
