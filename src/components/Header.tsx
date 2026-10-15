import React, { useState } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  ChevronDown, 
  User, 
  Store, 
  Shield, 
  PlusCircle, 
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { store } from '../services/store';
import { AbbasonLogo } from './AbbasonLogo';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenSellerDashboard: () => void;
  onOpenSellerVerification: () => void;
  onOpenAdminDashboard: () => void;
  onOpenAuth: () => void;
  onOpenNewListing: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenSellerDashboard,
  onOpenSellerVerification,
  onOpenAdminDashboard,
  onOpenAuth,
  onOpenNewListing,
}) => {
  const currentUser = store.getCurrentUser();
  const campuses = store.getCampuses();
  const activeCampus = store.getActiveCampus();
  const cart = store.getCart();
  const pendingProducts = store.getPendingProducts();
  const isVerifiedSeller = store.canUserSell(currentUser.id);
  const isAdmin = store.isAdminAuthenticated();

  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectCampus = (campusId: string) => {
    store.setActiveCampus(campusId);
    setCampusDropdownOpen(false);
  };

  const handleSellClick = () => {
    if (isVerifiedSeller) {
      onOpenSellerDashboard();
    } else {
      onOpenSellerVerification();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-950/60 bg-[#0B1120]/95 backdrop-blur-md">
      {/* If Admin is logged in, show discreet Admin status banner with quick Exit */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950/80 px-4 py-1 text-xs border-b border-amber-500/30 text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Owner & Admin Console Active</span>
              {pendingProducts.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {pendingProducts.length} pending review
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdminDashboard}
                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold cursor-pointer"
              >
                Open Admin Hub
              </button>
              <button
                onClick={() => store.logoutAdmin()}
                className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
                title="Lock Admin Mode"
              >
                <LogOut className="w-3 h-3" />
                <span>Exit Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Top Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Logo & Brand Identity (Supports custom brand image file upload) */}
        <div className="flex items-center gap-3">
          <AbbasonLogo size="md" showText={true} allowUpload={true} />
        </div>

        {/* Campus Switcher Dropdown (Supports All Nigerian Campuses) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-900/50 text-xs text-slate-200 hover:border-[#f3c84b]/60 transition-colors shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-[#f3c84b]" />
            <span className="font-medium truncate max-w-[190px]">
              {activeCampus.id === 'all' ? 'All Nigerian Campuses' : activeCampus.shortName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {campusDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 rounded-2xl bg-[#0F172A] border border-purple-800/60 shadow-2xl p-2 z-50 max-h-96 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                Select Your Campus
              </div>
              {campuses.map((campus) => (
                <button
                  key={campus.id}
                  onClick={() => handleSelectCampus(campus.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    activeCampus.id === campus.id
                      ? 'bg-purple-900/60 text-[#f3c84b] font-medium'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="font-medium">{campus.name}</div>
                    <div className="text-[10px] text-slate-400">{campus.state}</div>
                  </div>
                  {activeCampus.id === campus.id && (
                    <span className="text-[11px] text-[#f3c84b] font-bold">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Sell on Abbason CTA */}
          <button
            onClick={handleSellClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-xs font-semibold text-[#f3c84b] transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
          >
            {isVerifiedSeller ? (
              <>
                <Store className="w-3.5 h-3.5" />
                <span>Seller Hub</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Sell on Abbason</span>
              </>
            )}
          </button>

          {/* Admin Dashboard shortcut ONLY if authenticated as Admin */}
          {isAdmin && (
            <button
              onClick={onOpenAdminDashboard}
              className="relative p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#f3c84b] border border-[#f3c84b]/30 text-xs font-medium flex items-center gap-1"
              title="Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-bold">Admin</span>
              {pendingProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingProducts.length}
                </span>
              )}
            </button>
          )}

          {/* Shopping Basket Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-purple-950 transition-colors flex items-center justify-center cursor-pointer"
            title="Shopping Basket"
            aria-label="View basket"
          >
            <ShoppingBag className="w-4 h-4 text-[#f3c84b]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#f3c84b] text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Profile */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-950 text-xs text-slate-300 transition-colors cursor-pointer"
            title={currentUser.name}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-700 to-amber-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden lg:inline text-xs font-medium truncate max-w-[90px]">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
