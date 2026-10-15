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

  // Mobile Bottom Nav active view
  const [activeMobileScreen, setActiveMobileScreen] = useState<'explore' | 'search' | 'orders' | 'account' | 'admin'>('explore');

  // Quick toast banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col pb-16 sm:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-purple-950 border border-[#f3c84b] text-[#f3c84b] text-xs font-semibold shadow-2xl animate-bounce">
          {toastMessage}
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
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-slate-400 border-t border-slate-900/60">
          <p className="flex flex-wrap items-center justify-center gap-1.5">
            <span>Have questions or need help with delivery OTP or Payluk Escrow?</span>
            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Chat directly on WhatsApp: 08066950607</span>
            </button>
          </p>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-purple-950/80 bg-[#080d19] py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AbbasonLogo size="sm" showText={false} />
            <span className="font-extrabold text-base text-white tracking-tight">
              Abbason <span className="text-[#f3c84b]">Hub</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Everything you imagined.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => setWhatsAppModalOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-300"
            >
              <svg className="w-3.5 h-3.5 fill-emerald-400 shrink-0" viewBox="0 0 24 24">
                <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.461 3.493 1.336 5.013L2 22l5.127-1.344a9.98 9.98 0 0 0 4.904 1.282h.005c5.532 0 10.028-4.494 10.028-10.029A10.01 10.01 0 0 0 12.031 2zm5.871 14.167c-.244.686-1.42 1.31-1.956 1.378-.49.062-1.127.088-3.642-.952-3.219-1.331-5.289-4.577-5.45-4.792-.158-.215-1.306-1.737-1.306-3.314 0-1.577.828-2.353 1.12-2.67.294-.318.641-.397.855-.397.215 0 .43.003.619.012.2.01.468-.076.732.558.27.65.922 2.25.998 2.413.078.163.13.353.023.568-.108.215-.162.35-.323.543-.162.193-.342.431-.489.578-.162.163-.331.341-.142.666.19.324.843 1.391 1.808 2.252 1.243 1.108 2.292 1.452 2.617 1.614.324.162.513.136.702-.081.189-.217.81-.945 1.026-1.27.216-.324.432-.27.728-.162.296.108 1.889.89 2.213 1.052.324.162.54.243.621.378.08.135.08.784-.164 1.47z" />
              </svg>
              <span>WhatsApp: 08066950607</span>
            </button>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span>Escrow Partner: <strong className="text-amber-300 font-semibold">Payluk</strong> (Ready for integration)</span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <button
              onClick={handleOpenAdminPortal}
              className="text-[10px] text-slate-600 hover:text-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Owner & Admin</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setWhatsAppModalOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-950/80 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
          title="Reach us on WhatsApp"
        >
          <svg className="w-5 h-5 fill-slate-950" viewBox="0 0 24 24">
            <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.461 3.493 1.336 5.013L2 22l5.127-1.344a9.98 9.98 0 0 0 4.904 1.282h.005c5.532 0 10.028-4.494 10.028-10.029A10.01 10.01 0 0 0 12.031 2zm5.871 14.167c-.244.686-1.42 1.31-1.956 1.378-.49.062-1.127.088-3.642-.952-3.219-1.331-5.289-4.577-5.45-4.792-.158-.215-1.306-1.737-1.306-3.314 0-1.577.828-2.353 1.12-2.67.294-.318.641-.397.855-.397.215 0 .43.003.619.012.2.01.468-.076.732.558.27.65.922 2.25.998 2.413.078.163.13.353.023.568-.108.215-.162.35-.323.543-.162.193-.342.431-.489.578-.162.163-.331.341-.142.666.19.324.843 1.391 1.808 2.252 1.243 1.108 2.292 1.452 2.617 1.614.324.162.513.136.702-.081.189-.217.81-.945 1.026-1.27.216-.324.432-.27.728-.162.296.108 1.889.89 2.213 1.052.324.162.54.243.621.378.08.135.08.784-.164 1.47z" />
          </svg>
          <span className="hidden sm:inline">WhatsApp Us</span>
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

      {/* 3. Checkout Modal (Secured with Payluk Escrow) */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        deliveryConfig={deliveryConfig}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 4. Order Receipt Modal (With Secret 6-Digit Delivery Code & Payluk Escrow) */}
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
    </div>
  );
}
