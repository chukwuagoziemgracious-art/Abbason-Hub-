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
  const isVerifiedSeller = currentUser ? store.canUserSell(currentUser.id) : false;
  const isAdmin = store.isAdminAuthenticated();

  const [campusDropdownOpen, setCampusDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectCampus = (campusId: string) => {
    store.setActiveCampus(campusId);
    setCampusDropdownOpen(false);
  };

  const handleSellClick = () => {
    if (!store.isSignedIn()) {
      onOpenAuth();
      return;
    }
    if (isVerifiedSeller) {
      onOpenSellerDashboard();
    } else {
      onOpenSellerVerification();
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-500 ${
      isScrolled 
        ? 'bg-[#020406]/85 backdrop-blur-[18px] border-b border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.7)] py-0.5' 
        : 'bg-[#020406]/40 backdrop-blur-sm border-b border-white/[0.04] py-1'
    }`}>
      {/* If Admin is logged in, show discreet Admin status banner with quick Exit */}
      {isAdmin && (
        <div className="bg-[#0e0c08]/90 px-4 py-1.5 text-xs border-b border-[#C8A96A]/25 text-[#E9E6DF]">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-[11px] tracking-wide">
              <Shield className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
              <span>Owner & Admin Console Active</span>
              {pendingProducts.length > 0 && (
                <span className="bg-[#C8A96A] text-[#020406] text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  {pendingProducts.length} pending review
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenAdminDashboard}
                className="px-2.5 py-1 rounded-xl bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Open Admin Hub
              </button>
              <button
                onClick={() => store.logoutAdmin()}
                className="text-[#8C9399] hover:text-[#E9E6DF] text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
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
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-1.5 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AbbasonLogo size="md" showText={true} />
        </div>

        {/* Campus Switcher Dropdown (Supports All Nigerian Campuses) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setCampusDropdownOpen(!campusDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] text-xs text-[#E9E6DF] hover:border-[#C8A96A]/60 transition-all duration-300 shadow-sm cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" />
            <span className="font-light tracking-wide truncate max-w-[200px]">
              {activeCampus.id === 'all' ? 'All Nigerian Campuses' : activeCampus.shortName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8C9399]" />
          </button>

          {campusDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-[#06090e]/95 backdrop-blur-[24px] border border-white/[0.12] shadow-[0_30px_80px_rgba(0,0,0,0.85)] p-2 z-50 max-h-96 overflow-y-auto">
              <div className="text-[9px] font-semibold text-[#8C9399] px-3 py-1.5 uppercase tracking-[0.25em]">
                Select Your Campus
              </div>
              {campuses.map((campus) => (
                <button
                  key={campus.id}
                  onClick={() => handleSelectCampus(campus.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activeCampus.id === campus.id
                      ? 'bg-[#C8A96A]/15 text-[#C8A96A] font-medium'
                      : 'text-[#E9E6DF]/80 hover:bg-white/[0.05] hover:text-[#E9E6DF]'
                  }`}
                >
                  <div>
                    <div className="font-normal">{campus.name}</div>
                    <div className="text-[10px] text-[#8C9399]">{campus.state}</div>
                  </div>
                  {activeCampus.id === campus.id && (
                    <span className="text-[10px] text-[#C8A96A] font-medium uppercase tracking-wider">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Sell on Abbason CTA - Luxury Gold Outline with slide-in fill */}
          <button
            onClick={handleSellClick}
            className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-[#C8A96A] text-[#C8A96A] hover:bg-[#C8A96A] hover:text-[#020406] text-[10px] sm:text-[11px] font-medium tracking-[0.12em] sm:tracking-[0.2em] uppercase transition-all duration-300 shadow-sm cursor-pointer shrink-0"
          >
            {isVerifiedSeller ? (
              <>
                <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Seller Hub</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Sell on Abbason</span>
              </>
            )}
          </button>

          {/* Admin Dashboard shortcut ONLY if authenticated as Admin */}
          {isAdmin && (
            <button
              onClick={onOpenAdminDashboard}
              className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/[0.03] hover:bg-[#C8A96A]/15 text-[#C8A96A] border border-[#C8A96A]/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline text-xs font-medium tracking-wider uppercase">Admin</span>
              {pendingProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C8A96A] text-[#020406] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingProducts.length}
                </span>
              )}
            </button>
          )}

          {/* Shopping Basket Button */}
          <button
            onClick={onOpenCart}
            className="relative p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-[#E9E6DF] border border-white/[0.08] hover:border-[#C8A96A]/50 transition-all duration-300 flex items-center justify-center cursor-pointer"
            title="Shopping Basket"
            aria-label="View basket"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C8A96A]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C8A96A] text-[#020406] font-bold text-[8px] sm:text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Profile or Sign In CTA */}
          {store.isSignedIn() && currentUser ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 p-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#C8A96A]/50 text-xs text-[#E9E6DF] transition-all duration-300 cursor-pointer"
              title={currentUser.name}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#C8A96A] text-[#020406] flex items-center justify-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden lg:inline text-xs font-light text-[#E9E6DF] tracking-wide truncate max-w-[100px]">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-[#C8A96A] hover:bg-[#D4B779] text-[#020406] text-[11px] sm:text-xs font-semibold tracking-wide shadow-sm transition-all duration-300 cursor-pointer shrink-0"
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
