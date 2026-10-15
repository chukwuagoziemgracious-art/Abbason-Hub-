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
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-[#0B1120]/95 backdrop-blur-md border-t border-purple-950/80 px-2 py-1.5 pb-safe shadow-2xl">
      <div className="grid grid-cols-5 items-center h-14">
        {/* Tab 1: Explore */}
        <button
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeScreen === 'explore'
              ? 'text-[#f3c84b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Explore</span>
        </button>

        {/* Tab 2: Search */}
        <button
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeScreen === 'search'
              ? 'text-[#f3c84b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Search</span>
        </button>

        {/* Tab 3: Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center min-h-[44px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-[#f3c84b]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#f3c84b] text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-1">Basket</span>
        </button>

        {/* Tab 4: Orders & Delivery OTP */}
        <button
          onClick={() => onNavigate('orders')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeScreen === 'orders'
              ? 'text-[#f3c84b]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">My Orders</span>
        </button>

        {/* Tab 5: Account (Or Admin if owner is authenticated) */}
        {isAdmin ? (
          <button
            onClick={() => onNavigate('admin')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeScreen === 'admin'
                ? 'text-[#f3c84b]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Admin</span>
            {pendingProducts.length > 0 && (
              <span className="absolute top-1 right-2 bg-amber-500 text-slate-950 text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {pendingProducts.length}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('account')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeScreen === 'account'
                ? 'text-[#f3c84b]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Account</span>
          </button>
        )}
      </div>
    </nav>
  );
};
