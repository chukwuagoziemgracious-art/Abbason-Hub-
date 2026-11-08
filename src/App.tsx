import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductFeed } from './components/ProductFeed';
import { ProductDetailModal } from './components/ProductDetailModal';
import { BasketDrawer } from './components/BasketDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { SellerDashboard } from './components/SellerDashboard';
import { NewListingModal } from './components/NewListingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SellerVerificationModal } from './components/SellerVerificationModal';
import { RateSellerModal } from './components/RateSellerModal';
import { WhatsAppContactModal } from './components/WhatsAppContactModal';
import { AuthModal } from './components/AuthModal';
import { DisputeModal } from './components/DisputeModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { BottomNav } from './components/BottomNav';
import { AbbasonLogo } from './components/AbbasonLogo';
import { store } from './services/store';
import { Product, Order } from './types';
import { formatNaira } from './utils/currency';
import { Lock, MessageSquare } from 'lucide-react';
import { WaterBackground } from './components/WaterBackground';

export default function App() {
  // Store reactive trigger
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modals & Drawers state
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState<{
    fulfillmentType: 'seller_delivers' | 'buyer_pickup';
    deliveryInstructions: string;
  }>({
    fulfillmentType: 'seller_delivers',
    deliveryInstructions: 'Campus Student Hostel Block'
  });

  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [sellerDashboardOpen, setSellerDashboardOpen] = useState(false);
  const [sellerVerificationOpen, setSellerVerificationOpen] = useState(false);
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [rateSellerOrder, setRateSellerOrder] = useState<Order | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [disputeModalOrder, setDisputeModalOrder] = useState<Order | null>(null);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [paymentsMode, setPaymentsMode] = useState<'demo' | 'test' | 'live' | null>(null);

  // Suspended Buyer State (Rule P4 & Appeals)
  const [banStatus, setBanStatus] = useState<{
    isBanned: boolean;
    bannedUntilMs?: number;
    banReason?: string;
    buyerExplanation?: string;
  } | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banExplanationInput, setBanExplanationInput] = useState('');
  const [isSubmittingBanExplanation, setIsSubmittingBanExplanation] = useState(false);
  const [banExplanationSent, setBanExplanationSent] = useState(false);

  // Mobile Bottom Nav active view
  const [activeMobileScreen, setActiveMobileScreen] = useState<'explore' | 'search' | 'orders' | 'account' | 'admin'>('explore');

  // Quick toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.paymentsMode) setPaymentsMode(data.paymentsMode);
      })
      .catch(() => {});

    store.fetchBanStatus().then((status) => {
      setBanStatus(status);
      if (status.buyerExplanation) {
        setBanExplanationSent(true);
        setBanExplanationInput(status.buyerExplanation);
      }
    });

    // Check payment callback URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_status') === 'success') {
      const orderId = params.get('orderId');
      showToast('Payment confirmed received via Paystack');
      if (orderId) {
        const order = store.getOrders().find((o) => o.id === orderId);
        if (order) setActiveReceiptOrder(order);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('payment_error')) {
      showToast('Payment was not completed: ' + params.get('payment_error'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmitExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banExplanationInput.trim()) return;
    setIsSubmittingBanExplanation(true);
    try {
      const res = await store.submitBanExplanation(banExplanationInput.trim());
      if (res.success) {
        setBanExplanationSent(true);
        showToast('Explanation submitted to administrator.');
      } else {
        showToast(res.error || 'Failed to submit explanation');
      }
    } finally {
      setIsSubmittingBanExplanation(false);
    }
  };

  const currentUser = store.getCurrentUser();
  const activeCampus = store.getActiveCampus();
  const approvedProducts = store.getApprovedProducts();
  const isVerifiedSeller = store.canUserSell(currentUser.id);
  const isAdmin = store.isAdminAuthenticated();

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    store.addToCart(product, 1);
    showToast(`Added ${product.title} to your basket`);
  };

  const handleBuyNow = (product: Product) => {
    setCartOpen(true);
  };

  const handleProceedToCheckout = (config: {
    fulfillmentType: 'seller_delivers' | 'buyer_pickup';
    deliveryInstructions: string;
  }) => {
    setDeliveryConfig(config);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = (newOrder: Order) => {
    setCheckoutOpen(false);
    setActiveReceiptOrder(newOrder);
  };

  const handleScrollToCatalog = () => {
    const el = document.getElementById('campus-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenSellerFlow = () => {
    if (isVerifiedSeller) {
      setSellerDashboardOpen(true);
    } else {
      setSellerVerificationOpen(true);
    }
  };

  const handleOpenAdminPortal = () => {
    if (store.isAdminAuthenticated()) {
      setAdminDashboardOpen(true);
    } else {
      setAdminLoginOpen(true);
    }
  };

  const handleMobileNav = (screen: 'explore' | 'search' | 'orders' | 'account' | 'admin') => {
    setActiveMobileScreen(screen);
    if (screen === 'explore') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (screen === 'search') {
      handleScrollToCatalog();
    } else if (screen === 'orders') {
      setMyOrdersOpen(true);
    } else if (screen === 'account') {
      setAuthOpen(true);
    } else if (screen === 'admin') {
      handleOpenAdminPortal();
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#E9E6DF] flex flex-col pb-16 sm:pb-0 relative">
      {/* Living black-water background with Nigerian flag subsurface reflection */}
      <WaterBackground />

      {/* Toast Notification - Luxury Edition */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-[#020406]/95 backdrop-blur-xl border border-[#C8A96A] text-[#C8A96A] text-xs font-medium tracking-[0.2em] uppercase shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Payments Mode Banner */}
      {paymentsMode === 'demo' && (
        <div className="w-full bg-[#C8A96A]/10 border-b border-[#C8A96A]/30 py-1.5 px-4 text-center text-[10px] font-medium text-[#C8A96A] tracking-wider uppercase flex items-center justify-center gap-2 relative z-30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] animate-pulse" />
          <span>Demo mode: no real money</span>
        </div>
      )}
      {paymentsMode === 'test' && (
        <div className="w-full bg-blue-500/10 border-b border-blue-500/30 py-1.5 px-4 text-center text-[10px] font-medium text-blue-400 tracking-wider uppercase flex items-center justify-center gap-2 relative z-30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>Test mode</span>
        </div>
      )}

      {/* Account Suspended Notice Banner (Rule P4) */}
      {(banStatus?.isBanned || (currentUser.suspendedUntilMs && currentUser.suspendedUntilMs > Date.now())) && (
        <div className="w-full bg-rose-950/90 border-b border-rose-500/50 py-2 px-4 text-center text-xs text-rose-200 flex items-center justify-center gap-2 relative z-30">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span>
            <strong>Account Suspended (30-day penalty):</strong> You cannot place new orders until{' '}
            {banStatus?.bannedUntilMs ? new Date(banStatus.bannedUntilMs).toLocaleDateString() : 'suspension period ends'}.
          </span>
          <button
            onClick={() => setBanModalOpen(true)}
            className="ml-2 underline text-white font-semibold cursor-pointer"
          >
            {banExplanationSent ? 'View Explanation' : 'Submit Explanation'}
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenSellerDashboard={handleOpenSellerFlow}
        onOpenSellerVerification={() => setSellerVerificationOpen(true)}
        onOpenAdminDashboard={handleOpenAdminPortal}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenNewListing={() => {
          if (isVerifiedSeller) {
            setNewListingOpen(true);
          } else {
            setSellerVerificationOpen(true);
          }
        }}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onScrollToCatalog={handleScrollToCatalog}
        />

        {/* 8 Categories Grid */}
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            handleScrollToCatalog();
          }}
        />

        {/* Catalog & Refine Search */}
        <ProductFeed
          products={approvedProducts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedCampusId={activeCampus.id}
          onSelectCampus={(campId) => store.setActiveCampus(campId)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onAddToCart={handleAddToCart}
        />

        {/* Subtle quick contact note at foot of homepage */}
        <div className="max-w-[1200px] mx-auto px-4 py-8 text-center text-xs text-[#8C9399] border-t border-white/[0.08]">
          <p className="flex flex-wrap items-center justify-center gap-1.5 font-light">
            <span>Have questions or need help with campus delivery?</span>
            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="text-[#C8A96A] hover:underline inline-flex items-center gap-1 cursor-pointer font-medium tracking-wide"
            >
              <span>Chat directly on WhatsApp: 08066950607</span>
            </button>
          </p>
        </div>
      </main>

      {/* Clean Luxury Footer */}
      <footer className="border-t border-white/[0.08] bg-[#020406]/90 backdrop-blur-md py-10 px-4 text-xs text-[#8C9399]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <AbbasonLogo size="sm" showText={false} />
            <span className="font-normal text-base text-[#E9E6DF] tracking-wide font-serif">
              Abbason <span className="text-[#C8A96A]">Hub</span>
            </span>
            <span className="text-white/[0.2]">·</span>
            <span className="text-[#8C9399] font-light">Everything you imagined.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 text-[11px] text-[#8C9399] font-light">
            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="hover:text-[#C8A96A] transition-colors flex items-center gap-1.5 cursor-pointer text-[#E9E6DF]/80"
            >
              <svg className="w-3.5 h-3.5 fill-[#C8A96A] shrink-0" viewBox="0 0 24 24">
                <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.461 3.493 1.336 5.013L2 22l5.127-1.344a9.98 9.98 0 0 0 4.904 1.282h.005c5.532 0 10.028-4.494 10.028-10.029A10.01 10.01 0 0 0 12.031 2zm5.871 14.167c-.244.686-1.42 1.31-1.956 1.378-.49.062-1.127.088-3.642-.952-3.219-1.331-5.289-4.577-5.45-4.792-.158-.215-1.306-1.737-1.306-3.314 0-1.577.828-2.353 1.12-2.67.294-.318.641-.397.855-.397.215 0 .43.003.619.012.2.01.468-.076.732.558.27.65.922 2.25.998 2.413.078.163.13.353.023.568-.108.215-.162.35-.323.543-.162.193-.342.431-.489.578-.162.163-.331.341-.142.666.19.324.843 1.391 1.808 2.252 1.243 1.108 2.292 1.452 2.617 1.614.324.162.513.136.702-.081.189-.217.81-.945 1.026-1.27.216-.324.432-.27.728-.162.296.108 1.889.89 2.213 1.052.324.162.54.243.621.378.08.135.08.784-.164 1.47z" />
              </svg>
              <span>WhatsApp: 08066950607</span>
            </button>
            <span className="hidden sm:inline text-white/[0.15]">·</span>
            <span>Payment: <strong className="text-[#C8A96A] font-medium">Paystack</strong> (Inspect & Pay on Delivery)</span>
            <span className="hidden sm:inline text-white/[0.15]">·</span>
            <button
              onClick={handleOpenAdminPortal}
              className="text-[10px] text-[#8C9399] hover:text-[#C8A96A] transition-colors inline-flex items-center gap-1 cursor-pointer tracking-wider uppercase"
            >
              <Lock className="w-2.5 h-2.5 text-[#C8A96A]" />
              <span>Owner & Admin</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Button - Subtle Luxury Pill */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setWhatsAppModalOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#020406]/90 hover:bg-[#25D366] text-[#E9E6DF] hover:text-[#020406] font-medium text-xs shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-[#25D366]/40 hover:border-[#25D366]"
          title="Reach us on WhatsApp"
        >
          <svg className="w-4 h-4 fill-[#25D366] group-hover:fill-[#020406] transition-colors" viewBox="0 0 24 24">
            <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.461 3.493 1.336 5.013L2 22l5.127-1.344a9.98 9.98 0 0 0 4.904 1.282h.005c5.532 0 10.028-4.494 10.028-10.029A10.01 10.01 0 0 0 12.031 2zm5.871 14.167c-.244.686-1.42 1.31-1.956 1.378-.49.062-1.127.088-3.642-.952-3.219-1.331-5.289-4.577-5.45-4.792-.158-.215-1.306-1.737-1.306-3.314 0-1.577.828-2.353 1.12-2.67.294-.318.641-.397.855-.397.215 0 .43.003.619.012.2.01.468-.076.732.558.27.65.922 2.25.998 2.413.078.163.13.353.023.568-.108.215-.162.35-.323.543-.162.193-.342.431-.489.578-.162.163-.331.341-.142.666.19.324.843 1.391 1.808 2.252 1.243 1.108 2.292 1.452 2.617 1.614.324.162.513.136.702-.081.189-.217.81-.945 1.026-1.27.216-.324.432-.27.728-.162.296.108 1.889.89 2.213 1.052.324.162.54.243.621.378.08.135.08.784-.164 1.47z" />
          </svg>
          <span className="hidden sm:inline font-light tracking-wider uppercase text-[10px]">WhatsApp Us</span>
        </button>
      </div>

      {/* Mobile Persistent Bottom Navigation */}
      <BottomNav
        activeScreen={activeMobileScreen}
        onNavigate={handleMobileNav}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* --- Modals & Drawers --- */}

      {/* 1. Product Detail Modal (With Seller Ratings & Reviews) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p) => {
          store.addToCart(p, 1);
          showToast(`Added ${p.title} to your basket`);
        }}
        onBuyNow={handleBuyNow}
      />

      {/* 2. Basket Drawer */}
      <BasketDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onProceedToCheckout={handleProceedToCheckout}
        onOpenSellerDashboard={handleOpenSellerFlow}
      />

      {/* 3. Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        deliveryConfig={deliveryConfig}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 4. Order Receipt Modal */}
      <OrderReceiptModal
        order={activeReceiptOrder}
        onClose={() => setActiveReceiptOrder(null)}
        onOpenDispute={(order) => setDisputeModalOrder(order)}
        onRateSeller={(order) => setRateSellerOrder(order)}
      />

      {/* 5. Seller Dashboard (Accessible only by Verified Sellers) */}
      <SellerDashboard
        isOpen={sellerDashboardOpen}
        onClose={() => setSellerDashboardOpen(false)}
        onOpenNewListing={() => setNewListingOpen(true)}
        onOpenVerificationModal={() => setSellerVerificationOpen(true)}
      />

      {/* 6. Seller Verification Modal (Required for any student before they can sell) */}
      <SellerVerificationModal
        isOpen={sellerVerificationOpen}
        onClose={() => setSellerVerificationOpen(false)}
        onSuccess={() => {
          showToast('Verification request submitted for admin review!');
        }}
      />

      {/* 7. New Listing Submission Modal */}
      <NewListingModal
        isOpen={newListingOpen}
        onClose={() => setNewListingOpen(false)}
        onProductCreated={() => {
          showToast('Listing submitted! Waiting for admin approval.');
        }}
        onOpenVerification={() => setSellerVerificationOpen(true)}
      />

      {/* 8. Admin Moderation Dashboard (Gated for Owner) */}
      <AdminDashboard
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
      />

      {/* 9. Admin Passcode Login Modal */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={() => {
          setAdminDashboardOpen(true);
        }}
      />

      {/* 10. Rate Seller Modal */}
      <RateSellerModal
        order={rateSellerOrder}
        isOpen={!!rateSellerOrder}
        onClose={() => setRateSellerOrder(null)}
        onSubmitted={() => {
          showToast('Thank you! Your seller rating and review have been published.');
        }}
      />

      {/* 11. WhatsApp Contact Modal */}
      <WhatsAppContactModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />

      {/* 12. Student Account & Switcher */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
        onOpenSellerVerification={() => setSellerVerificationOpen(true)}
      />

      {/* 13. Dispute / Complaint Modal */}
      <DisputeModal
        order={disputeModalOrder}
        onClose={() => setDisputeModalOrder(null)}
        onDisputeFiled={() => {
          if (activeReceiptOrder) {
            setActiveReceiptOrder(store.getOrderById(activeReceiptOrder.id) || null);
          }
        }}
      />

      {/* 14. Student My Orders & Handshake Codes Modal */}
      <MyOrdersModal
        isOpen={myOrdersOpen}
        onClose={() => setMyOrdersOpen(false)}
        onViewOrderReceipt={(order) => {
          setMyOrdersOpen(false);
          setActiveReceiptOrder(order);
        }}
        onOpenDispute={(order) => setDisputeModalOrder(order)}
        onRateSeller={(order) => setRateSellerOrder(order)}
      />

      {/* 15. Suspended Account & Explanation Modal (Rule P4 Appeal) */}
      {banModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0B1120] border border-rose-500/40 p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span>Account Suspended (30 Days)</span>
              </div>
              <button
                onClick={() => setBanModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <p>
                Your account was suspended following a report of payment refusal or missed meeting on a confirmed order (Rule P4).
              </p>
              {banStatus?.banReason && (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-[11px]">
                  <strong>Reason:</strong> {banStatus.banReason}
                </div>
              )}
              {banStatus?.bannedUntilMs && (
                <div className="text-[11px] text-slate-400">
                  Suspension active until: <strong className="text-white">{new Date(banStatus.bannedUntilMs).toLocaleString('en-NG')}</strong>
                </div>
              )}
            </div>

            {banExplanationSent ? (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-emerald-500/30 text-emerald-300 space-y-1">
                <span className="font-semibold block">Explanation Submitted</span>
                <p className="text-[11px] text-slate-300 italic">"{banExplanationInput}"</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Your explanation is pending review by the platform administrator.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitExplanation} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Explain What Happened (Max 1,000 Characters) *
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    required
                    value={banExplanationInput}
                    onChange={(e) => setBanExplanationInput(e.target.value)}
                    placeholder="Provide context on why you were unable to complete payment or meet the seller..."
                    className="w-full bg-[#020406] border border-white/[0.12] rounded-xl p-2.5 text-xs text-white focus:border-[#C8A96A] outline-none"
                  />
                  <span className="text-[10px] text-slate-500 text-right block">
                    {1000 - banExplanationInput.length} chars remaining
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBanModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBanExplanation}
                    className="flex-1 py-2 rounded-xl bg-[#C8A96A] text-black font-semibold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingBanExplanation ? 'Submitting...' : 'Submit to Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
