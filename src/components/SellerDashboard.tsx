import React, { useState } from 'react';
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
  Percent
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
  
  // Handover OTP Modal state
  const [selectedOrderForHandover, setSelectedOrderForHandover] = useState<Order | null>(null);
  const [submittedOtp, setSubmittedOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  // Verification request state
  const [matricNumber, setMatricNumber] = useState('2022/ENG/04912');
  const [facultyDepartment, setFacultyDepartment] = useState('Faculty of Engineering / Mechanical');
  const [level, setLevel] = useState('300 Level');
  const [hostelShopLocation, setHostelShopLocation] = useState('Campus Commercial Hostel Block');
  const [idDocumentType, setIdDocumentType] = useState('University Student Identity Card');
  const [bankName, setBankName] = useState('Access Bank Nigeria');
  const [accountNumber, setAccountNumber] = useState('0248192034');
  const [accountName, setAccountName] = useState('');
  const [verifSubmitted, setVerifSubmitted] = useState(false);

  const currentUser = store.getCurrentUser();
  const allOrders = store.getOrders(currentUser.id, 'seller');
  const pendingHandoverOrders = allOrders.filter((o) => o.status === 'paid_awaiting_delivery');
  const completedOrders = allOrders.filter((o) => o.status === 'delivered');
  const sellerProducts = store.getSellerProducts(currentUser.id);
  const payouts = store.getPayouts().filter((p) => p.sellerId === currentUser.id);
  const sellerReviews = store.getSellerReviews(currentUser.id);
  const ratingSummary = store.getSellerRatingSummary(currentUser.id);
  const isVerified = store.canUserSell(currentUser.id);

  if (!isOpen) return null;

  // Wallet metrics
  const availableBalance = completedOrders.reduce((sum, o) => sum + o.sellerPayoutAmount, 0);
  const pendingEscrow = pendingHandoverOrders.reduce((sum, o) => sum + o.sellerPayoutAmount, 0);
  const totalCommissionPaid = completedOrders.reduce((sum, o) => sum + o.platformCommission, 0);

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForHandover || !submittedOtp.trim()) return;

    setIsSubmittingOtp(true);
    setOtpError(null);
    setOtpSuccessMessage(null);

    const result = await store.verifyDeliveryOtp(
      selectedOrderForHandover.id,
      submittedOtp.trim(),
      currentUser.id
    );

    setIsSubmittingOtp(false);

    if (result.success) {
      setOtpSuccessMessage(
        `Delivery confirmed! ${formatNaira(result.order!.sellerPayoutAmount)} credited to your wallet (3% platform fee capped at ₦2,000 deducted).`
      );
      setTimeout(() => {
        setSelectedOrderForHandover(null);
        setSubmittedOtp('');
        setOtpSuccessMessage(null);
      }, 2500);
    } else {
      setOtpError(result.error || 'Failed to verify delivery code.');
    }
  };

  const handleVerificationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    store.submitSellerVerification({
      matricNumber,
      facultyDepartment,
      level,
      hostelShopLocation,
      idDocumentType,
      idCardPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      bankName,
      accountNumber,
      accountName: accountName || currentUser.name
    });
    setVerifSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl rounded-3xl bg-[#0F172A] border border-purple-900/70 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-[#f3c84b] shadow">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-serif">
                  {currentUser.storeName || `${currentUser.name}'s Seller Hub`}
                </h2>
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Vendor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300 font-bold text-[10px]">
                    Verification Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {currentUser.campusName} · ⭐ {ratingSummary.average} ({ratingSummary.count} reviews)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVerified && (
              <button
                onClick={onOpenNewListing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Post New Listing</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unverified Warning Gate if not verified */}
        {!isVerified && (
          <div className="m-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/60 border border-purple-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-[#f3c84b] shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Campus Seller Verification Required</p>
                <p className="text-slate-300 text-xs">
                  Only verified university students can list products on Abbason Hub to prevent scams and counterfeit goods.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('verification');
                if (onOpenVerificationModal) onOpenVerificationModal();
              }}
              className="px-4 py-2 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow"
            >
              Apply for Verification
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-purple-950 bg-[#0B1120] px-4 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Handover</span>
            {pendingHandoverOrders.length > 0 && (
              <span className="bg-[#f3c84b] text-slate-950 text-[10px] font-black px-1.5 rounded-full">
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
          {/* TAB 1: ORDERS & HANDOVER OTP INPUT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                  Pending Handover Orders (Buyer OTP Required)
                </span>
                <span>{pendingHandoverOrders.length} order(s) awaiting delivery</span>
              </div>

              {pendingHandoverOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-white font-medium">No pending delivery handovers</p>
                  <p className="mt-1">When buyers purchase your items, their orders appear here for in-person OTP confirmation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHandoverOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-[#131b2e] border-2 border-purple-800/80 shadow-md text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-mono">#{order.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold text-[10px]">
                            Escrow Held
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Payout: <strong className="text-emerald-400 font-bold tabular-nums">{formatNaira(order.sellerPayoutAmount)}</strong>
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-slate-300">
                        <div className="text-white font-medium">Buyer: {order.buyerName} ({order.buyerPhone})</div>
                        <div className="text-slate-400 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#f3c84b]" />
                          <span>Delivery to: {order.deliveryInstructions}</span>
                        </div>
                        <div className="pt-1 text-slate-200">
                          {order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-purple-300">
                          Fee capped: {formatNaira(order.platformCommission)} (3%)
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOrderForHandover(order);
                            setSubmittedOtp('');
                            setOtpError(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Enter Buyer Handshake Code</span>
                        </button>
                      </div>
                    </div>
                  ))}
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
                        <p className="text-[10px] text-purple-300 mt-1">Delivery: {p.deliveryOption.replace('_', ' ')}</p>
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
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-[#f3c84b] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-[#f3c84b] flex items-center gap-1.5">
                    <span>Live Earnings Calculations & Settlement Ledger</span>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      Non-Custodial
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    This dashboard displays automated calculations of your sales and platform commissions. <strong>Abbason Hub does not hold your funds.</strong> Payments are secured in Payluk Escrow and dispatched directly into your selected Nigerian bank account upon buyer OTP delivery verification.
                  </p>
                </div>
              </div>

              {/* 4 Metric Calculation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Pending Balance */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-500/40">
                  <div className="text-[10px] uppercase font-bold text-[#f3c84b] tracking-wider flex items-center justify-between">
                    <span>Pending in Escrow</span>
                    <Clock className="w-3.5 h-3.5 text-[#f3c84b]" />
                  </div>
                  <div className="text-2xl font-black text-[#f3c84b] mt-1 tabular-nums">{formatNaira(pendingEscrow)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {pendingHandoverOrders.length} order(s) awaiting buyer OTP code
                  </div>
                </div>

                {/* 2. Commissions Deducted */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#181a2e] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Commissions (3%)</span>
                    <Percent className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-200 mt-1 tabular-nums">{formatNaira(totalCommissionPaid)}</div>
                  <div className="text-[10px] text-purple-300 mt-1">
                    Capped at ₦2,000 max per order
                  </div>
                </div>

                {/* 3. Available Paid Out */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/40">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center justify-between">
                    <span>Net Paid To Bank</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">{formatNaira(availableBalance)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Transferred to your bank account
                  </div>
                </div>

                {/* 4. Gross Sales */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#131b2e] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Gross Sales Volume</span>
                    <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-300 mt-1 tabular-nums">
                    {formatNaira(allOrders.reduce((sum, o) => sum + o.subtotal, 0))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {allOrders.length} total transaction(s)
                  </div>
                </div>
              </div>

              {/* Settlement Bank Details Card with Instant Switcher */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#f3c84b]" />
                      <span>Settlement Payout Destination</span>
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span>{currentUser.bankDetails?.bankName || 'PalmPay'}</span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Verified Payout Account
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Account: <strong className="text-slate-200">{currentUser.bankDetails?.accountNumberMasked || '******4819'}</strong> · Name: <strong className="text-slate-200">{currentUser.bankDetails?.accountName || currentUser.name}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBankSwitcherOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95 shrink-0"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Change Bank Account</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#f3c84b] font-semibold">Supported:</span>
                    <span>PalmPay, OPay, Moniepoint, Kuda, Access Bank, Zenith, GTBank, First Bank, UBA & all Nigerian banks.</span>
                  </div>
                  <span className="text-slate-500">Instant change anytime</span>
                </div>
              </div>

              {/* 3% Platform Commission Calculation Formula Guide */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-[#f3c84b] shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="font-bold text-white">How 3% Commission is Calculated:</span>
                    <span className="text-slate-300 ml-1">
                      For verified campus sellers, platform takes exactly 3% of item subtotal, strictly capped at ₦2,000 maximum. Sellers keep 97%+ of their earnings.
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Order Calculations Ledger */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Itemized Order Earnings Ledger
                  </div>
                  <span className="text-[10px] text-slate-400">{allOrders.length} recorded orders</span>
                </div>

                {allOrders.length === 0 ? (
                  <div className="p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    No order transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allOrders.map((order) => {
                      const isDelivered = order.status === 'delivered';
                      return (
                        <div
                          key={order.id}
                          className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">Order #{order.orderNumber}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isDelivered
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isDelivered ? 'Settled into Bank' : 'Pending Buyer OTP Handshake'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Buyer: {order.buyerName} ({order.campusName}) · {order.items.map((i) => i.title).join(', ')}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right shrink-0">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase">Gross Sales</div>
                              <div className="font-medium text-slate-300 tabular-nums">{formatNaira(order.subtotal)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-purple-300 uppercase">3% Fee</div>
                              <div className="font-medium text-purple-300 tabular-nums">-{formatNaira(order.platformCommission)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Net Payout</div>
                              <div className="font-bold text-emerald-400 tabular-nums text-sm">{formatNaira(order.sellerPayoutAmount)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Payout Confirmations */}
              <div className="space-y-2 pt-2">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Recent Bank Settlement Confirmations
                </div>
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white">Order #{p.orderNumber} Payout to {p.bankName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Ref: {p.reference} · Account: {p.accountNumberMasked}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400 tabular-nums">+{formatNaira(p.amount)}</div>
                      <div className="text-[10px] text-purple-300">Fee (3%): {formatNaira(p.commissionDeducted)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REPUTATION & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5 text-xs">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-[#121a2c] border border-purple-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center p-3 rounded-2xl bg-slate-950 border border-purple-900">
                    <div className="text-3xl sm:text-4xl font-black text-[#f3c84b]">{ratingSummary.average}</div>
                    <div className="flex items-center justify-center gap-0.5 text-[#f3c84b] mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{ratingSummary.count} reviews</div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white font-serif">Campus Seller Reputation</h4>
                    <p className="text-slate-300 text-xs mt-1 max-w-md">
                      Student reviews are gathered only from verified order completions. Maintain high ratings by delivering on time and allowing students to inspect items before collecting the delivery code.
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
            <div className="p-5 rounded-2xl bg-[#121a2c] border border-purple-950 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white font-serif">
                  Campus Verified Vendor Status
                </h3>
                <p className="text-slate-400 text-[11px] mt-1">
                  Upload your University ID or matriculation proof. Once verified by administrators, your listings receive a green trust shield and rank higher in campus search.
                </p>
              </div>

              {currentUser.isVerifiedSeller ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-sm">Approved Verified Campus Seller</div>
                    <div className="text-xs text-emerald-300 mt-0.5">
                      Your identity and university student standing are officially confirmed across Nigerian campuses.
                    </div>
                  </div>
                </div>
              ) : verifSubmitted ? (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200">
                  <div className="font-bold text-white text-sm">Verification Submitted & Under Review</div>
                  <div className="text-xs text-amber-300 mt-1">
                    An Abbason administrator will inspect your student credentials shortly.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVerificationRequest} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 text-purple-200 text-xs">
                    <p className="font-semibold text-white mb-1">Requirements for Verification:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
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

        {/* Handover OTP Input Modal */}
        {selectedOrderForHandover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border-2 border-[#f3c84b] p-6 text-center space-y-4">
              <button
                onClick={() => setSelectedOrderForHandover(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#f3c84b] mx-auto flex items-center justify-center border border-amber-500/40">
                <KeyRound className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-serif">Enter Buyer Delivery Code</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Ask <strong>{selectedOrderForHandover.buyerName}</strong> for their 6-digit confirmation code after they inspect the item.
                </p>
              </div>

              {otpError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{otpSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={submittedOtp}
                  onChange={(e) => setSubmittedOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center font-mono text-3xl font-black tracking-[0.3em] bg-slate-950 border border-purple-800 rounded-2xl py-3 text-white focus:outline-none focus:border-[#f3c84b]"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={isSubmittingOtp || submittedOtp.length < 6}
                  className="w-full py-3 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingOtp ? 'Verifying with Vault...' : 'Validate Code & Release Payout'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bank Switcher Modal */}
        <BankSwitcherModal
          isOpen={isBankSwitcherOpen}
          onClose={() => setIsBankSwitcherOpen(false)}
          currentBankName={currentUser.bankDetails?.bankName || 'PalmPay'}
          currentAccountNumber={currentUser.bankDetails?.accountNumberMasked || '08066950607'}
          currentAccountName={currentUser.bankDetails?.accountName || currentUser.name}
          onSave={(details) => {
            store.updateSellerBankDetails(currentUser.id, details);
          }}
        />
      </div>
    </div>
  );
};
