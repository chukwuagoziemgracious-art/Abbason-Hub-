import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  PlusCircle, 
  Package, 
  Truck, 
  Wallet, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Upload,
  ArrowRight,
  Phone,
  AlertTriangle,
  Star,
  MessageSquare,
  Landmark,
  Building2,
  Info,
  Calculator,
  Percent,
  Sparkles,
  Lock
} from 'lucide-react';
import { store } from '../services/store';
import { formatNaira, calculatePlatformCommission } from '../utils/currency';
import { Product, Order, DeliveryOption } from '../types';
import { BankSwitcherModal } from './BankSwitcherModal';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewListing: () => void;
  onOpenVerificationModal?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  isOpen,
  onClose,
  onOpenNewListing,
  onOpenVerificationModal,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'listings' | 'earnings' | 'reviews' | 'verification'>('orders');
  const [isBankSwitcherOpen, setIsBankSwitcherOpen] = useState(false);

  // Verification request state
  const [matricNumber, setMatricNumber] = useState('2022/ENG/04912');
  const [facultyDepartment, setFacultyDepartment] = useState('Faculty of Engineering / Mechanical');
  const [level, setLevel] = useState('300 Level');
  const [hostelShopLocation, setHostelShopLocation] = useState('Campus Commercial Hostel Block');
  const [idDocumentType, setIdDocumentType] = useState('University Student Identity Card');
  const [bankName, setBankName] = useState('Access Bank Nigeria');
  const [bankCode, setBankCode] = useState('044');
  const [bankList, setBankList] = useState<Array<{ name: string; code: string }>>([]);
  const [accountNumber, setAccountNumber] = useState('0248192034');
  const [accountName, setAccountName] = useState('');
  const [verifSubmitted, setVerifSubmitted] = useState(false);

  React.useEffect(() => {
    store.fetchBanks().then((banks) => {
      if (banks && banks.length > 0) {
        setBankList(banks);
        if (!bankCode && banks[0]) {
          setBankCode(banks[0].code);
          setBankName(banks[0].name);
        }
      }
    });
  }, []);

  const currentUser = store.getCurrentUser();

  // Vendor Fee Status & Payment
  const [vendorFeeStatus, setVendorFeeStatus] = useState<{
    paidCount: number;
    earlyLimit: number;
    fee: number;
    gatewayFee: number;
    totalWithGateway: number;
    isEarlyBird: boolean;
  } | null>(null);
  const [isPayingFee, setIsPayingFee] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/vendor-fee/status')
        .then((res) => res.json())
        .then((data) => setVendorFeeStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  const [refusalOrderId, setRefusalOrderId] = useState<string | null>(null);
  const [refusalType, setRefusalType] = useState<'refused_pay' | 'buyer_did_not_show_up'>('refused_pay');
  const [refusalReason, setRefusalReason] = useState('Buyer refused payment after inspecting problem-free item');
  const [isSubmittingRefusal, setIsSubmittingRefusal] = useState(false);
  const [sellerActionFeedback, setSellerActionFeedback] = useState<string | null>(null);

  // Private Seller Phone State
  const [sellerPhoneVal, setSellerPhoneVal] = useState(currentUser?.phone || '');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Agreed Delivery Time State
  const [editingAgreedOrderId, setEditingAgreedOrderId] = useState<string | null>(null);
  const [agreedTimeInput, setAgreedTimeInput] = useState('');
  const [isSavingAgreedTime, setIsSavingAgreedTime] = useState(false);

  const allOrders = currentUser ? store.getOrders(currentUser.id, 'seller') : [];
  const pendingHandoverOrders = allOrders.filter(
    (o) =>
      o.status === 'delivery_fee_paid' ||
      o.status === 'in_transit' ||
      o.status === 'delivered_pending_inspection' ||
      o.status === 'partially_paid' ||
      o.status === 'paid_awaiting_delivery'
  );
  const completedOrders = allOrders.filter((o) => o.status === 'paid_completed' || o.status === 'delivered');
  const sellerProducts = currentUser ? store.getSellerProducts(currentUser.id) : [];
  const payouts = currentUser ? store.getPayouts().filter((p) => p.sellerId === currentUser.id) : [];
  const sellerReviews = currentUser ? store.getSellerReviews(currentUser.id) : [];
  const ratingSummary = currentUser ? store.getSellerRatingSummary(currentUser.id) : { average: 5.0, count: 0 };
  const isVerified = currentUser ? store.canUserSell(currentUser.id) : false;
  const sellerStrikes = currentUser ? store.getSellerStrikes(currentUser.id) : 0;

  const handleUpdateOrderStatus = async (orderId: string, status: any) => {
    await store.updateOrderStatus(orderId, status);
  };

  const handlePayVendorFee = async () => {
    if (!currentUser) return;
    setIsPayingFee(true);
    try {
      await store.payVendorFee(currentUser.id);
    } catch (err: any) {
      console.error('Vendor fee payment error:', err);
    } finally {
      setIsPayingFee(false);
    }
  };

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-[20px] overflow-y-auto">
        <div 
          className="relative w-full max-w-md rounded-[6px] bg-[#020406]/95 backdrop-blur-[24px] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden my-auto p-6 text-center space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-[4px] bg-[#C8A96A]/10 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-light text-[#E9E6DF] font-serif">
            Seller Dashboard
          </h2>
          <p className="text-xs text-[#8C9399] font-light leading-relaxed">
            Please sign in with your campus student account to manage your listings, incoming orders, and Paystack payouts.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-[4px] bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] font-semibold text-xs uppercase tracking-[0.2em] shadow transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPhone(true);
    try {
      const res = await store.saveSellerPhone(sellerPhoneVal);
      if (res.success) {
        setSellerActionFeedback('Private phone number updated successfully.');
        setIsEditingPhone(false);
      } else {
        setSellerActionFeedback(res.error || 'Failed to update phone number.');
      }
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleSetAgreedTime = async (orderId: string) => {
    if (!agreedTimeInput.trim()) return;
    setIsSavingAgreedTime(true);
    try {
      const res = await store.setOrderAgreedTime(orderId, agreedTimeInput.trim());
      if (res.success) {
        setSellerActionFeedback('Agreed delivery time saved and shared with buyer.');
        setEditingAgreedOrderId(null);
        setAgreedTimeInput('');
      } else {
        setSellerActionFeedback(res.error || 'Failed to save agreed delivery time.');
      }
    } finally {
      setIsSavingAgreedTime(false);
    }
  };

  const handleSellerCancelOrder = async (orderId: string) => {
    if (!window.confirm('Cancel this order? If an upfront delivery fee was paid, you will owe a 1x refund by bank transfer outside the app.')) return;
    const res = await store.cancelOrder(orderId, 'seller_cancelled');
    if (res.success) {
      setSellerActionFeedback('Order cancelled. Refund obligation recorded.');
    } else {
      setSellerActionFeedback(res.error || 'Failed to cancel order.');
    }
  };

  const handleMarkRefundSent = async (orderId: string) => {
    const res = await store.markRefundSent(orderId);
    if (res.success) {
      setSellerActionFeedback('Refund marked as sent. Buyer will be asked to confirm receipt.');
    } else {
      setSellerActionFeedback(res.error || 'Failed to update refund.');
    }
  };

  const handleConfirmBuyerRefusal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refusalOrderId) return;
    setIsSubmittingRefusal(true);
    try {
      const res = await store.reportBuyerRefusal(refusalOrderId, refusalReason, refusalType);
      if (res.success) {
        setSellerActionFeedback('Report submitted. Administrator will review for 30-day buyer suspension.');
        setRefusalOrderId(null);
      } else {
        setSellerActionFeedback(res.error || 'Failed to submit report.');
      }
    } finally {
      setIsSubmittingRefusal(false);
    }
  };

  // Confirmed Paid Items (Only server-confirmed payments)
  const paidItemsList: Array<{
    orderId: string;
    orderNumber: string;
    buyerName: string;
    campusName: string;
    item: any;
    grossPrice: number;
    commission: number;
    netPayout: number;
    paidAt?: string;
  }> = [];

  allOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (item.status === 'paid') {
        const grossPrice = item.price * item.quantity;
        const commission = Math.round(grossPrice * 0.03);
        const netPayout = grossPrice - commission;
        paidItemsList.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          buyerName: o.buyerName,
          campusName: o.campusName,
          item,
          grossPrice,
          commission,
          netPayout,
          paidAt: item.paidAt
        });
      }
    });
  });

  const totalConfirmedGoodsNet = paidItemsList.reduce((sum, i) => sum + i.netPayout, 0);
  const totalConfirmedCommission = paidItemsList.reduce((sum, i) => sum + i.commission, 0);
  const deliveryFeesReceived = allOrders
    .filter((o) => o.deliveryFeePaid && (o.deliveryFee || 0) > 0)
    .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const totalConfirmedEarnings = totalConfirmedGoodsNet + deliveryFeesReceived;
  const availableBalance = totalConfirmedEarnings;
  const pendingInspection = pendingHandoverOrders.reduce((sum, o) => sum + (o.goodsDue || 0), 0);
  const totalCommissionPaid = totalConfirmedCommission;



  const handleVerificationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    store.submitSellerVerification({
      matricNumber,
      facultyDepartment,
      level,
      hostelShopLocation,
      idDocumentType,
      idCardPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      bankName: bankName || 'Access Bank',
      bankCode: bankCode || '044',
      accountNumber,
      accountName: accountName || currentUser.name
    });
    setVerifSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-[20px] overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl rounded-[6px] bg-[#020406]/95 backdrop-blur-[24px] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[4px] bg-[#C8A96A]/10 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] shadow">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-light text-[#E9E6DF] font-serif">
                  {currentUser.storeName || `${currentUser.name}'s Seller Hub`}
                </h2>
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-[4px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Vendor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#0e0c08] border border-[#C8A96A]/40 text-[#C8A96A] font-medium text-[9px] uppercase tracking-wider">
                    Verification Required
                  </span>
                )}
                {sellerStrikes > 0 && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-rose-950/80 border border-rose-500/50 text-rose-300 font-medium text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{sellerStrikes} {sellerStrikes === 1 ? 'Strike' : 'Strikes'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8C9399] font-light">
                {currentUser.campusName} · ⭐ {ratingSummary.average} ({ratingSummary.count} reviews)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isVerified && (
              <button
                onClick={onOpenNewListing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] font-semibold text-xs uppercase tracking-[0.2em] shadow-md transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Post New Listing</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[4px] bg-white/[0.03] hover:bg-white/[0.08] text-[#8C9399] hover:text-[#E9E6DF] flex items-center justify-center border border-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {currentUser.sellerVerificationStatus === 'approved_pending_fee' ? (
          <div className="m-4 p-4 rounded-[6px] bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-medium text-white text-sm font-serif">Bank Account Verified · Pay Your Vendor Fee to Start Selling</p>
                <p className="text-emerald-200/80 text-xs font-light">
                  Your student credentials and Paystack subaccount are configured. Pay the registration fee ({vendorFeeStatus?.isEarlyBird ? '₦2,000 Early Bird' : '₦5,000 Standard'}) to activate your storefront.
                </p>
              </div>
            </div>
            <button
              onClick={handlePayVendorFee}
              disabled={isPayingFee}
              className="px-4 py-2.5 rounded-[4px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs uppercase tracking-[0.15em] shrink-0 cursor-pointer shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-black" />
              <span>{isPayingFee ? 'Opening Paystack...' : `Pay ${vendorFeeStatus ? formatNaira(vendorFeeStatus.totalWithGateway) : '₦2,030'} via Paystack`}</span>
            </button>
          </div>
        ) : currentUser.sellerVerificationStatus === 'pending' ? (
          <div className="m-4 p-4 rounded-[6px] bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <p className="font-medium text-white text-sm font-serif">Verification Application Under Review</p>
                <p className="text-amber-200/80 text-xs font-light">
                  Your student credentials and payout account details are being reviewed by the Abbason moderation team. Once approved, you can post campus listings.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onOpenVerificationModal) onOpenVerificationModal();
              }}
              className="px-4 py-2 rounded-[4px] bg-white/[0.06] hover:bg-white/[0.1] text-amber-300 border border-amber-500/40 font-semibold text-xs uppercase tracking-[0.15em] shrink-0 cursor-pointer shadow transition-colors"
            >
              View Application
            </button>
          </div>
        ) : !isVerified ? (
          <div className="m-4 p-4 rounded-[6px] bg-[#0e0c08]/80 border border-[#C8A96A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#C8A96A] shrink-0" />
              <div>
                <p className="font-normal text-[#E9E6DF] text-sm font-serif">Campus Seller Verification Required</p>
                <p className="text-[#8C9399] text-xs font-light">
                  Only verified university students can list products on Abbason Hub to prevent scams and counterfeit goods.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('verification');
                if (onOpenVerificationModal) onOpenVerificationModal();
              }}
              className="px-4 py-2 rounded-[4px] bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] font-semibold text-xs uppercase tracking-[0.2em] shrink-0 cursor-pointer shadow transition-colors"
            >
              Apply for Verification
            </button>
          </div>
        ) : null}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.01] px-4 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-[0.15em] text-[10px] ${
              activeTab === 'orders'
                ? 'border-[#C8A96A] text-[#C8A96A]'
                : 'border-transparent text-[#8C9399] hover:text-[#E9E6DF]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Handover</span>
            {pendingHandoverOrders.length > 0 && (
              <span className="bg-[#C8A96A] text-[#020406] text-[9px] font-bold px-1.5 rounded-full">
                {pendingHandoverOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'listings'
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>My Listings ({sellerProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'earnings'
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>My Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4 fill-current text-[#f3c84b]" />
            <span>Reviews ({ratingSummary.count})</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'verification'
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Vendor Badge</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {sellerActionFeedback && (
            <div className="p-3 rounded-xl bg-blue-950/70 border border-blue-500/50 text-blue-200 text-xs flex items-center justify-between">
              <span>{sellerActionFeedback}</span>
              <button
                onClick={() => setSellerActionFeedback(null)}
                className="text-blue-300 hover:text-white font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: ORDERS & HANDOVER */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Private Seller Mobile Phone Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">Private Seller Contact:</span>
                      <span className="font-mono text-[#C8A96A] font-semibold">
                        {currentUser.phone || 'No phone saved'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8C9399]">
                      Kept private and only revealed to student buyers after an order is placed.
                    </p>
                  </div>
                </div>

                {isEditingPhone ? (
                  <form onSubmit={handleSavePhone} className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="tel"
                      value={sellerPhoneVal}
                      onChange={(e) => setSellerPhoneVal(e.target.value)}
                      placeholder="080... or +234..."
                      className="bg-[#020406] border border-white/[0.12] rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingPhone}
                      className="px-2.5 py-1 rounded-xl bg-[#C8A96A] text-black font-semibold text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingPhone ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(false)}
                      className="px-2 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer shrink-0"
                  >
                    Change Number
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Pending Deliveries & Inspection
                </span>
                <span>{pendingHandoverOrders.length} order(s) awaiting delivery</span>
              </div>

              {pendingHandoverOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-white font-medium">No pending delivery handovers</p>
                  <p className="mt-1">When buyers purchase your items, their orders appear here for delivery and inspection payment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHandoverOrders.map((order) => {
                    const isPodOrder = order.paymentMode === 'inspect_and_pay' || order.status === 'delivery_fee_paid' || order.status === 'in_transit' || order.status === 'delivered_pending_inspection' || order.status === 'partially_paid';
                    const hasPayments = (order.itemsTotalPaid || 0) > 0;

                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-2xl border text-xs space-y-3 ${
                          store.isOrderOverdue(order)
                            ? 'bg-rose-950/20 border-rose-500/50 shadow-md'
                            : 'bg-white/[0.03] border-[#C8A96A]/40 shadow-md'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-sm font-mono">#{order.orderNumber}</span>

                            {store.isOrderOverdue(order) && (
                              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold text-[10px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>Overdue</span>
                              </span>
                            )}

                            {order.status === 'cancelled' ? (
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-medium text-[10px]">
                                Cancelled ({order.cancelReason === 'seller_cancelled' ? 'by you' : 'by buyer'})
                              </span>
                            ) : order.status === 'delivery_fee_paid' ? (
                              <span className="px-2 py-0.5 rounded bg-[#C8A96A]/20 border border-[#C8A96A]/50 text-[#C8A96A] font-bold text-[10px]">
                                Transport Secured · Ready to Dispatch
                              </span>
                            ) : order.status === 'in_transit' ? (
                              <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/50 text-blue-300 font-bold text-[10px]">
                                In-Transit to Hostel
                              </span>
                            ) : order.status === 'delivered_pending_inspection' ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 font-bold text-[10px]">
                                Arrived · Buyer Inspecting Goods
                              </span>
                            ) : order.status === 'partially_paid' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-[10px]">
                                Partially Paid (Handover in Progress)
                              </span>
                            ) : order.status === 'paid_completed' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold text-[10px]">
                                Paid & Completed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold text-[10px]">
                                Pending Inspection
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            Items Total: <strong className="text-emerald-400 font-bold tabular-nums">{formatNaira(order.subtotal)}</strong>
                          </span>
                        </div>

                        {/* LIVE PAYMENT CONFIRMATION BANNER FOR SELLER */}
                        {hasPayments && (
                          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-medium text-[11px]">
                                Payment for order #{order.orderNumber} confirmed · {formatNaira(order.itemsTotalPaid || 0)} received via Paystack.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Refund Card if refund active */}
                        {order.refund && (
                          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-amber-200 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Delivery Fee Refund {((order.refund.multiplier || 1) > 1) ? `(${order.refund.multiplier}x Penalty)` : '(1x Refund)'}</span>
                              </div>
                              <span className="font-mono font-bold text-amber-400">{formatNaira(order.refund.owedAmount || order.refund.amountOwed || 0)}</span>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Destination:{' '}
                              {order.refundAccount ? (
                                <strong className="text-white">
                                  {order.refundAccount.bankName} - {order.refundAccount.accountNumber} ({order.refundAccount.accountName})
                                </strong>
                              ) : (
                                <span className="text-amber-300 italic">Awaiting buyer to enter refund bank account</span>
                              )}
                            </div>
                            {order.refund.status === 'owed' && order.refundAccount && (
                              <button
                                type="button"
                                onClick={() => handleMarkRefundSent(order.id)}
                                className="w-full py-2 rounded-lg bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-xs cursor-pointer shadow"
                              >
                                I Have Sent The Refund (Outside App)
                              </button>
                            )}
                            {order.refund.status === 'paid_claimed' && (
                              <div className="text-[11px] text-emerald-300 font-medium">
                                Marked as sent. Awaiting buyer confirmation.
                              </div>
                            )}
                            {order.refund.status === 'confirmed' && (
                              <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Buyer confirmed refund receipt.</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-[#0B1120] border border-white/[0.08] space-y-2 text-slate-300">
                          <div className="text-white font-medium flex flex-wrap items-center justify-between gap-1">
                            <span>Buyer: {order.buyerName}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {order.buyerPhone ? (
                                <a
                                  href={`tel:${order.buyerPhone}`}
                                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call {order.buyerPhone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-500 italic">Phone shared once delivery fee is paid</span>
                              )}
                            </span>
                          </div>
                          <div className="text-slate-400 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                            <span>Destination: {order.deliveryInstructions || order.buyerHostel}</span>
                          </div>

                          {/* Agreed delivery time row */}
                          <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#C8A96A]" />
                              <span>
                                {order.agreedTime ? (
                                  <>
                                    <strong className="text-white">Agreed Time:</strong>{' '}
                                    <span className="text-[#C8A96A] font-medium">{order.agreedTime}</span>
                                  </>
                                ) : (
                                  <span className="text-amber-300/80 italic">
                                    No agreed time set yet · Buyer can cancel until you set an agreed time
                                  </span>
                                )}
                              </span>
                            </div>

                            {order.status !== 'paid_completed' && order.status !== 'cancelled' && (
                              editingAgreedOrderId === order.id ? (
                                <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                                  <input
                                    type="text"
                                    maxLength={60}
                                    value={agreedTimeInput}
                                    onChange={(e) => setAgreedTimeInput(e.target.value)}
                                    placeholder="e.g. Today 4:30 PM at Hall 3"
                                    className="bg-[#020406] border border-white/[0.12] rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSetAgreedTime(order.id)}
                                    disabled={isSavingAgreedTime}
                                    className="px-2 py-1 rounded-lg bg-[#C8A96A] text-black font-semibold text-xs cursor-pointer disabled:opacity-50"
                                  >
                                    {isSavingAgreedTime ? '...' : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAgreedOrderId(null);
                                      setAgreedTimeInput('');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAgreedOrderId(order.id);
                                    setAgreedTimeInput(order.agreedTime || '');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#C8A96A] text-[10px] font-medium transition-colors cursor-pointer"
                                >
                                  {order.agreedTime ? 'Edit Agreed Time' : 'Set Agreed Time'}
                                </button>
                              )
                            )}
                          </div>
                          
                          {/* Itemized tracking codes */}
                          <div className="pt-1 space-y-1">
                            {order.items.map((i) => (
                              <div key={i.id} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-200 truncate max-w-[220px]">
                                  {i.title} (x{i.quantity})
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[#C8A96A] bg-[#020406] px-1.5 py-0.5 rounded border border-[#C8A96A]/30 text-[10px]">
                                    {i.itemCode}
                                  </span>
                                  <span className={`text-[10px] font-medium ${
                                    i.status === 'paid' ? 'text-emerald-400' : i.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                                  }`}>
                                    {i.status === 'paid' ? '✓ Paid' : i.status === 'rejected' ? '✗ Rejected' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="text-[11px] text-[#8C9399]">
                            Transport: {formatNaira(order.upfrontTotalPaid || order.deliveryFee)} (Paid upfront)
                          </div>

                          <div className="flex flex-wrap items-center gap-2">

                            {(order.status === 'delivered_pending_inspection' || order.status === 'partially_paid') && !order.buyerReportedRefusal && (
                              <button
                                onClick={() => setRefusalOrderId(order.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] text-rose-300 hover:bg-rose-950/60 border border-white/[0.08] text-[11px] cursor-pointer transition-colors"
                              >
                                Report Buyer Refused Payment
                              </button>
                            )}

                            {order.status !== 'paid_completed' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => handleSellerCancelOrder(order.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-white/[0.08] text-[11px] cursor-pointer transition-colors"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Your Campus Catalog Listings
                </span>
                {isVerified && (
                  <button
                    onClick={onOpenNewListing}
                    className="text-[#f3c84b] hover:underline cursor-pointer"
                  >
                    + Add New Product
                  </button>
                )}
              </div>

              {sellerProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  <Store className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-white font-medium">You haven't listed any items yet</p>
                  <p className="mt-1">Verified sellers can post gadgets, books, clothes, food, and student services.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sellerProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex gap-3 text-xs"
                    >
                      <img src={p.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover bg-slate-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            p.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : p.status === 'pending_review'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}>
                            {p.status === 'approved' ? 'Active' : p.status === 'pending_review' ? 'Pending Admin Approval' : 'Rejected'}
                          </span>
                          <span className="font-bold text-[#f3c84b] tabular-nums">{formatNaira(p.price)}</span>
                        </div>
                        <h4 className="text-white font-medium truncate">{p.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">Stock: {p.stock} units</p>
                        <p className="text-[10px] text-[#C8A96A] mt-1">Delivery: {p.deliveryOption.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY EARNINGS & SETTLEMENT */}
          {activeTab === 'earnings' && (
            <div className="space-y-5 text-xs">
              {/* Accounting & Non-Custodial Notice */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30 text-amber-200 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-[#C8A96A] flex items-center gap-1.5 font-serif">
                    <span>Live Earnings Calculations & Settlement Ledger</span>
                    <span className="text-[10px] text-emerald-400 font-sans font-medium bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      Non-Custodial
                    </span>
                  </div>
                  <p className="text-[#8C9399] text-[11px] leading-relaxed font-light">
                    This dashboard displays automated calculations of your sales and platform commissions. <strong>Abbason Hub does not hold your funds.</strong> Payments are settled directly via Paystack subaccount splits into your selected Nigerian bank account once the student inspects and completes payment in the app.
                  </p>
                </div>
              </div>

              {/* 4 Metric Calculation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Pending Balance */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30">
                  <div className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-wider flex items-center justify-between">
                    <span>Pending Delivery & Inspection</span>
                    <Clock className="w-3.5 h-3.5 text-[#C8A96A]" />
                  </div>
                  <div className="text-2xl font-bold text-[#C8A96A] mt-1 tabular-nums font-serif">{formatNaira(pendingInspection)}</div>
                  <div className="text-[10px] text-[#8C9399] mt-1 font-light">
                    {pendingHandoverOrders.length} order(s) awaiting hostel delivery & inspection
                  </div>
                </div>

                {/* 2. Commissions Deducted */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <div className="text-[10px] uppercase font-bold text-[#8C9399] tracking-wider flex items-center justify-between">
                    <span>Commissions (3%)</span>
                    <Percent className="w-3.5 h-3.5 text-[#C8A96A]" />
                  </div>
                  <div className="text-2xl font-bold text-[#E9E6DF] mt-1 tabular-nums font-serif">{formatNaira(totalCommissionPaid)}</div>
                  <div className="text-[10px] text-[#8C9399] mt-1 font-light">
                    3% platform commission (no cap)
                  </div>
                </div>

                {/* 3. Available Paid Out */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/40">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center justify-between">
                    <span>Net Confirmed Earnings</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">{formatNaira(availableBalance)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Settled directly via Paystack split
                  </div>
                </div>

                {/* 4. Delivery Fees Received */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#131b2e] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Delivery Fees Received</span>
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-300 mt-1 tabular-nums">
                    {formatNaira(deliveryFeesReceived)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    100% paid to you (0% platform cut)
                  </div>
                </div>
              </div>

              {/* Settlement Bank Details Card with Request Switcher */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#C8A96A]" />
                      <span>Settlement Payout Destination</span>
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{currentUser.bankDetails?.bankName || 'Verified Nigerian Bank'}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Paystack Subaccount Linked
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Account: <strong className="text-slate-200">{currentUser.bankDetails?.accountNumberMasked || '******'}</strong> · Name: <strong className="text-slate-200">{currentUser.bankDetails?.accountName || currentUser.name}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBankSwitcherOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Request Bank Change</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#C8A96A] font-semibold">Supported:</span>
                    <span>PalmPay, OPay, Moniepoint, Kuda, Access Bank, Zenith, GTBank, First Bank, UBA & all CBN-licensed banks.</span>
                  </div>
                  <span className="text-amber-400 font-medium">Bank changes require admin approval</span>
                </div>
              </div>

              {/* 3% Platform Commission Calculation Formula Guide */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="font-medium text-white">How Commission is Calculated:</span>
                    <span className="text-[#8C9399] ml-1 font-light">
                      Platform takes exactly 3% of goods value (no cap). Platform takes 0% on delivery fees. The buyer pays Paystack processing fees on top. Sellers receive 97% of goods price plus 100% of delivery fees directly via Paystack split.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION A: Itemized Confirmed Paid Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Itemized Paid Items ({paidItemsList.length})</span>
                  </div>
                  <span className="text-[10px] text-[#8C9399]">Only server-confirmed payments</span>
                </div>

                {paidItemsList.length === 0 ? (
                  <div className="p-6 text-center bg-white/[0.03] rounded-2xl border border-white/[0.08] text-slate-400 text-xs">
                    No items paid yet. Once students inspect items and pay on delivery, each confirmed item appears here with its 3% commission deduction and net payout.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paidItemsList.map((pi, idx) => (
                      <div
                        key={`${pi.orderId}_${pi.item.id || idx}`}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{pi.item.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                              {pi.item.itemCode || 'ITM'} · Paid
                            </span>
                            <span className="text-[10px] text-slate-400">Order #{pi.orderNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Buyer: {pi.buyerName} ({pi.campusName}) · Qty: {pi.item.quantity || 1}
                            {pi.paidAt && <span className="ml-2 text-slate-500">· {new Date(pi.paidAt).toLocaleDateString()}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase">Gross Price</div>
                            <div className="font-medium text-slate-300 tabular-nums">{formatNaira(pi.grossPrice)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#8C9399] uppercase">3% Platform</div>
                            <div className="font-medium text-amber-400 tabular-nums">-{formatNaira(pi.commission)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-emerald-400 uppercase font-semibold">Net Payout</div>
                            <div className="font-bold text-emerald-400 tabular-nums text-sm">{formatNaira(pi.netPayout)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION B: Delivery Fees Received */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                    <span>Delivery Transport Fees Received</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">0% Platform Cut</span>
                </div>

                {allOrders.filter((o) => o.deliveryFeePaid && (o.deliveryFee || 0) > 0).length === 0 ? (
                  <div className="p-4 text-center bg-white/[0.02] rounded-2xl border border-white/[0.06] text-slate-400 text-xs">
                    No delivery transport fees received yet. Upfront delivery fees paid by buyers at checkout are routed to your subaccount.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allOrders
                      .filter((o) => o.deliveryFeePaid && (o.deliveryFee || 0) > 0)
                      .map((order) => (
                        <div
                          key={`df_${order.id}`}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              <span>Order #{order.orderNumber}</span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                Upfront Delivery Paid
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Buyer: {order.buyerName} · {order.meetingPoint?.label || order.campusName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase">Transport Amount</div>
                            <div className="font-bold text-emerald-400 tabular-nums">+{formatNaira(order.deliveryFee || 0)}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* SECTION C: Orders Pending Inspection & Handover */}
              {pendingHandoverOrders.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pending Handover & Inspection ({pendingHandoverOrders.length})</span>
                    </div>
                    <span className="text-[10px] text-amber-300">Paid upon physical handover</span>
                  </div>

                  <div className="space-y-2">
                    {pendingHandoverOrders.map((order) => (
                      <div
                        key={`pending_${order.id}`}
                        className="p-3.5 rounded-2xl bg-white/[0.02] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">Order #{order.orderNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30">
                              Awaiting Handover Inspection
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Buyer: {order.buyerName} ({order.campusName}) · Items: {order.items.map((i) => i.title).join(', ')}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-500 uppercase">Goods Due At Inspection</div>
                          <div className="font-medium text-[#C8A96A] tabular-nums">{formatNaira(order.goodsDue || order.subtotal)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPUTATION & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5 text-xs">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center p-3 rounded-2xl bg-[#0B1120] border border-white/[0.08]">
                    <div className="text-3xl sm:text-4xl font-light text-[#C8A96A] font-serif">{ratingSummary.average}</div>
                    <div className="flex items-center justify-center gap-0.5 text-[#C8A96A] mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <div className="text-[10px] text-[#8C9399] mt-1 font-light">{ratingSummary.count} reviews</div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white font-serif">Campus Seller Reputation</h4>
                    <p className="text-[#8C9399] text-xs mt-1 max-w-md font-light">
                      Student reviews are gathered only from verified order completions. Maintain high ratings by delivering on time and allowing students to inspect items before completing payment on delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Student Feedback ({sellerReviews.length})
                </div>

                {sellerReviews.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
                    <p>No student reviews yet. Complete your first delivery to earn verified reviews.</p>
                  </div>
                ) : (
                  sellerReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{rev.buyerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({rev.campusName})</span>
                          {rev.verifiedPurchase && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              Verified Purchase
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 text-[#f3c84b]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed bg-[#0B1120] p-2.5 rounded-xl border border-slate-800/60">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: VENDOR BADGE & VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-medium text-white font-serif">
                  Campus Verified Vendor Status
                </h3>
                <p className="text-[#8C9399] text-[11px] mt-1 font-light">
                  Upload your University ID or matriculation proof. Once verified by administrators, your listings receive a green trust shield and rank higher in campus search.
                </p>
              </div>

              {currentUser.isVerifiedSeller ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-medium text-white text-sm">Approved Verified Campus Seller</div>
                    <div className="text-xs text-emerald-300 mt-0.5">
                      Your identity and university student standing are officially confirmed across Nigerian campuses.
                    </div>
                  </div>
                </div>
              ) : verifSubmitted ? (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200">
                  <div className="font-medium text-white text-sm">Verification Submitted & Under Review</div>
                  <div className="text-xs text-amber-300 mt-1 font-light">
                    An Abbason administrator will inspect your student credentials shortly.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerificationRequest} className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[#8C9399] text-xs">
                    <p className="font-medium text-white mb-1">Requirements for Verification:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#8C9399] font-light">
                      <li>Valid University Student ID Card or Portal Course Registration Slip</li>
                      <li>Current campus hostel/room or certified lodge location</li>
                      <li>Settlement bank account in your legal student name (for fraud protection)</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        1. Matriculation / Student ID No. *
                      </label>
                      <input
                        type="text"
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        required
                        placeholder="e.g. 2022/ENG/10291"
                        className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        2. Faculty & Department *
                      </label>
                      <input
                        type="text"
                        value={facultyDepartment}
                        onChange={(e) => setFacultyDepartment(e.target.value)}
                        required
                        placeholder="e.g. Engineering / Mechanical"
                        className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        3. Level *
                      </label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="100 Level">100 Level</option>
                        <option value="200 Level">200 Level</option>
                        <option value="300 Level">300 Level</option>
                        <option value="400 Level">400 Level</option>
                        <option value="500 Level">500 Level</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        4. Document Type *
                      </label>
                      <select
                        value={idDocumentType}
                        onChange={(e) => setIdDocumentType(e.target.value)}
                        className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="University Student Identity Card">University Student Identity Card</option>
                        <option value="School Portal Slip">School Portal Course Slip</option>
                        <option value="Jamb Letter">Jamb Admission Letter</option>
                      </select>
                    </div>
                  </div>

                  {/* Settlement Bank Selection */}
                  <div className="p-3.5 rounded-xl bg-[#0B1120] border border-slate-800 space-y-3">
                    <div className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-wider">
                      5. Settlement Bank Account (Must match your registered name) *
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Select Bank *</label>
                      <select
                        value={bankCode}
                        onChange={(e) => {
                          setBankCode(e.target.value);
                          const found = bankList.find(b => b.code === e.target.value);
                          if (found) setBankName(found.name);
                        }}
                        className="w-full bg-[#020406] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#C8A96A] cursor-pointer"
                      >
                        {bankList.length > 0 ? (
                          bankList.map((b) => (
                            <option key={b.code} value={b.code} className="bg-[#090D14]">
                              {b.name}
                            </option>
                          ))
                        ) : (
                          <option value="044">Access Bank</option>
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Account Number (10 Digits) *</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 0123456789"
                          required
                          className="w-full bg-[#020406] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#C8A96A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Account Holder Legal Name *</label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder={currentUser.name}
                          className="w-full bg-[#020406] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#C8A96A]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs cursor-pointer shadow"
                  >
                    Submit for Admin Approval
                  </button>
                </form>
              )}
            </div>
          )}
        </div>



        {/* Buyer Refusal Report Modal */}
        {refusalOrderId && (
          <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0B1120] border border-rose-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-white text-sm">Report Buyer Refused Payment</h3>
                </div>
                <button
                  onClick={() => setRefusalOrderId(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Report a buyer default on this order. The administrator will review your report, verify delivery records, and apply rule P4 (30-day suspension) if confirmed.
              </p>

              <form onSubmit={handleConfirmBuyerRefusal} className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Violation Type *
                  </label>
                  <div className="space-y-1.5">
                    <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-colors ${
                      refusalType === 'refused_pay'
                        ? 'bg-rose-950/40 border-rose-500/60 text-white'
                        : 'bg-[#020406] border-white/[0.08] text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="refusalType"
                        value="refused_pay"
                        checked={refusalType === 'refused_pay'}
                        onChange={() => {
                          setRefusalType('refused_pay');
                          setRefusalReason('Buyer inspected the problem-free item and refused to make payment.');
                        }}
                        className="mt-0.5 accent-rose-500"
                      />
                      <div>
                        <div className="font-medium text-xs text-white">Buyer refused payment for problem-free item</div>
                        <div className="text-[10px] text-slate-400">Buyer inspected the item in good condition and refused to pay.</div>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-colors ${
                      refusalType === 'buyer_did_not_show_up'
                        ? 'bg-rose-950/40 border-rose-500/60 text-white'
                        : 'bg-[#020406] border-white/[0.08] text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="refusalType"
                        value="buyer_did_not_show_up"
                        checked={refusalType === 'buyer_did_not_show_up'}
                        onChange={() => {
                          setRefusalType('buyer_did_not_show_up');
                          setRefusalReason('Buyer did not show up or answer calls at the agreed meeting point.');
                        }}
                        className="mt-0.5 accent-rose-500"
                      />
                      <div>
                        <div className="font-medium text-xs text-white">Buyer did not show up</div>
                        <div className="text-[10px] text-slate-400">Buyer failed to appear or answer calls at the designated meeting point.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Details / What Occurred *
                  </label>
                  <textarea
                    value={refusalReason}
                    onChange={(e) => setRefusalReason(e.target.value)}
                    rows={3}
                    required
                    className="w-full bg-[#020406] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                    placeholder="Describe what occurred at the meeting point..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRefusalOrderId(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRefusal}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50 transition-colors shadow"
                  >
                    {isSubmittingRefusal ? 'Submitting...' : 'Submit Report to Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bank Switcher Modal */}
        <BankSwitcherModal
          isOpen={isBankSwitcherOpen}
          onClose={() => setIsBankSwitcherOpen(false)}
          currentBankName={currentUser.bankDetails?.bankName || 'PalmPay'}
          currentAccountNumber={currentUser.bankDetails?.accountNumberMasked || ''}
          currentAccountName={currentUser.bankDetails?.accountName || currentUser.name}
          onSave={async (details) => {
            return await store.requestBankChange(details);
          }}
        />
      </div>
    </div>
  );
};
