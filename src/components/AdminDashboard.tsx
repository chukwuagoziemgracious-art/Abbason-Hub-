import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Package, 
  UserCheck, 
  AlertTriangle, 
  Check, 
  Ban, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Lock,
  Flag,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  UserX
} from 'lucide-react';
import { store } from '../services/store';
import { formatNaira, formatDate } from '../utils/currency';
import { Product, Complaint, User } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'sellers' | 'disputes' | 'orders'>('moderation');
  const [disputeSubTab, setDisputeSubTab] = useState<'complaints' | 'overdue' | 'buyer_reports' | 'refunds' | 'ban_reviews'>('complaints');
  const [rejectionModalProduct, setRejectionModalProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Missing clear photos / price verification required');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Phase 4 Queues & Strikes
  const [adminQueues, setAdminQueues] = useState<{
    overdueOrders: any[];
    buyerNonPaymentReports: any[];
    unconfirmedRefunds: any[];
    openComplaints: any[];
    strikesBySeller: Record<string, number>;
  } | null>(null);
  const [banReviews, setBanReviews] = useState<any[]>([]);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);

  const [collectionStats, setCollectionStats] = useState<any>(null);
  const [removingSeller, setRemovingSeller] = useState<{ id: string; storeName: string } | null>(null);
  const [confirmStoreNameInput, setConfirmStoreNameInput] = useState('');
  const [isRemovingSeller, setIsRemovingSeller] = useState(false);
  const [approvingSellerId, setApprovingSellerId] = useState<string | null>(null);
  const [mismatchErrors, setMismatchErrors] = useState<Record<string, {
    message: string;
    sellerName: string;
    resolvedAccountName: string;
  }>>({});
  const [verifyingSubaccountId, setVerifyingSubaccountId] = useState<string | null>(null);

  const loadQueues = async () => {
    setIsLoadingQueues(true);
    try {
      const [data, reviews, stats] = await Promise.all([
        store.fetchAdminQueues(),
        store.fetchAdminBanReviews(),
        store.getCollectionStats()
      ]);
      if (data) setAdminQueues(data);
      if (reviews) setBanReviews(reviews);
      if (stats) setCollectionStats(stats);
    } finally {
      setIsLoadingQueues(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueues();
    }
  }, [isOpen]);

  const pendingProducts = store.getPendingProducts();
  const allProducts = store.getApprovedProducts();
  const verifications = store.getSellerVerificationRequests().filter((v) => v.status === 'pending');
  const complaints = store.getComplaints().filter((c) => c.status === 'open');
  const allOrders = store.getOrders();
  const allUsers = store.getUsers();
  const metrics = store.getPlatformMetrics();

  // Sellers list
  const registeredSellers = allUsers.filter(
    (u) => u.role === 'seller' || u.isVerifiedSeller || u.sellerVerificationStatus === 'verified' || u.sellerVerificationStatus === 'approved_pending_fee'
  );

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleApproveProduct = (productId: string) => {
    store.approveProduct(productId);
    showNotice('Listing approved and published to campus feed!');
  };

  const handleRejectProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalProduct) return;
    store.rejectProduct(rejectionModalProduct.id, rejectionReason);
    setRejectionModalProduct(null);
    showNotice('Listing rejected and vendor notified.');
  };

  const handleApproveSeller = async (v: any) => {
    setApprovingSellerId(v.userId);
    setMismatchErrors((prev) => {
      const next = { ...prev };
      delete next[v.userId];
      return next;
    });

    try {
      const res = await store.approveSellerVerification(v.id, v.userId);
      if (res.success) {
        showNotice('Seller approved! Subaccount created & pending vendor fee payment.');
      } else if (res.mismatch) {
        setMismatchErrors((prev) => ({
          ...prev,
          [v.userId]: {
            message: res.message || 'Bank account holder name mismatch with student records.',
            sellerName: res.sellerName || v.userName,
            resolvedAccountName: res.resolvedAccountName || 'Unknown'
          }
        }));
        showNotice('Approval blocked: Name mismatch with bank account records.');
      } else {
        showNotice(res.error || 'Approval failed');
      }
    } catch (err: any) {
      showNotice(err.message || 'Approval error');
    } finally {
      setApprovingSellerId(null);
    }
  };

  const handleVerifySubaccount = async (sellerId: string) => {
    setVerifyingSubaccountId(sellerId);
    try {
      const res = await store.verifySellerSubaccount(sellerId);
      if (res.success) {
        showNotice('Subaccount confirmed verified on Paystack.');
      } else {
        showNotice(res.error || 'Failed to verify subaccount');
      }
    } finally {
      setVerifyingSubaccountId(null);
    }
  };

  const handleResolveDispute = (complaintId: string, resolution: 'refund_buyer' | 'release_seller') => {
    store.resolveDispute(
      complaintId,
      resolution,
      resolution === 'refund_buyer' ? 'Approved full refund to student buyer' : 'Approved release to seller after investigation'
    );
    showNotice(resolution === 'refund_buyer' ? '100% Refund issued to buyer' : 'Payout released to seller');
  };

  const handleBanBuyer = async (buyerId: string) => {
    if (!window.confirm('Suspend this student buyer account for 30 days due to inspection/payment violation?')) return;
    const res = await store.banUser(buyerId);
    if (res.success) {
      showNotice('Buyer account suspended for 30 days.');
      loadQueues();
    } else {
      showNotice(res.error || 'Failed to ban buyer');
    }
  };

  const handleSuspendSeller = async (sellerId: string) => {
    if (!window.confirm('Close this seller account for 30 days? Their listings will be paused.')) return;
    const ok = await store.suspendSeller(sellerId, 30);
    if (ok) {
      showNotice('Seller account closed for 30 days.');
      loadQueues();
    } else {
      showNotice('Failed to suspend seller.');
    }
  };

  const handleUnsuspendSeller = async (sellerId: string) => {
    const ok = await store.unsuspendSeller(sellerId);
    if (ok) {
      showNotice('Seller account reopened successfully.');
      loadQueues();
    } else {
      showNotice('Failed to reopen seller account.');
    }
  };

  const handleResolveAdminDisputeAction = async (disputeId: string, note: string, type?: 'refund_buyer' | 'release_seller') => {
    const res = await store.resolveAdminDispute(disputeId, note, type);
    if (res.success) {
      showNotice(res.message || 'Dispute resolved successfully.');
      loadQueues();
    } else {
      showNotice(res.error || 'Failed to resolve dispute.');
    }
  };

  const handleLiftBan = async (userId: string) => {
    const res = await store.adminLiftBan(userId);
    if (res.success) {
      showNotice('Buyer suspension lifted successfully.');
      loadQueues();
    } else {
      showNotice(res.error || 'Failed to lift suspension');
    }
  };

  const handleKeepBan = async (userId: string) => {
    const res = await store.adminKeepBan(userId);
    if (res.success) {
      showNotice('Suspension retained on buyer account.');
      loadQueues();
    } else {
      showNotice(res.error || 'Failed to retain suspension');
    }
  };

  const handleConfirmPermanentRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingSeller) return;
    if (confirmStoreNameInput.trim().toLowerCase() !== removingSeller.storeName.trim().toLowerCase()) {
      showNotice(`Please type "${removingSeller.storeName}" exactly to confirm.`);
      return;
    }
    setIsRemovingSeller(true);
    try {
      const res = await store.removeSellerPermanently(removingSeller.id, confirmStoreNameInput.trim());
      if (res.success) {
        showNotice(res.message || `Seller "${removingSeller.storeName}" removed permanently.`);
        setRemovingSeller(null);
        setConfirmStoreNameInput('');
        loadQueues();
      } else {
        showNotice(res.error || 'Failed to remove seller');
      }
    } finally {
      setIsRemovingSeller(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl rounded-3xl bg-[#0B1120] border border-white/[0.1] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-medium text-white font-serif">
                  Abbason Platform Administration
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#C8A96A] text-[10px] font-medium tracking-wider uppercase">
                  Restricted Access
                </span>
              </div>
              <p className="text-[11px] text-[#8C9399] font-light">
                Moderation Queue · Transaction Ledger · Commission Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                store.logoutAdmin();
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Lock Admin Console and return to student view"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Admin Mode</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collection Limit Warnings */}
        {collectionStats?.level === 'red' && (
          <div className="bg-rose-950/90 border-b border-rose-500/60 p-3 px-4 flex items-center gap-2.5 text-xs text-rose-100 font-semibold animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <div>
              <strong className="text-white">CRITICAL WARNING:</strong> Total collections have reached{' '}
              <span className="font-mono text-rose-300">₦{(collectionStats.totalCollectedNaira || 0).toLocaleString()}</span> of{' '}
              <span className="font-mono">₦8,000,000</span> lifetime limit ({collectionStats.percentUsed?.toFixed(1) || 0}%).
              Upgrade to a registered Paystack business account immediately to avoid payment disruptions.
            </div>
          </div>
        )}
        {collectionStats?.level === 'warn' && (
          <div className="bg-amber-950/80 border-b border-amber-500/50 p-3 px-4 flex items-center gap-2.5 text-xs text-amber-100 font-semibold animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="text-amber-300">COLLECTION WARNING:</strong> Total collections have reached{' '}
              <span className="font-mono text-white">₦{(collectionStats.totalCollectedNaira || 0).toLocaleString()}</span> of{' '}
              <span className="font-mono">₦8,000,000</span> lifetime limit ({collectionStats.percentUsed?.toFixed(1) || 0}%).
              Prepare business documents to upgrade your Paystack account.
            </div>
          </div>
        )}

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-emerald-950 border-b border-emerald-500/50 px-4 py-2 text-xs font-semibold text-emerald-200 text-center animate-fade-in">
            {actionNotice}
          </div>
        )}

        {/* Platform Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-[#0B1120] border-b border-white/[0.08] text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] uppercase font-bold text-[#8C9399]">Total Collected</div>
            <div className="text-base sm:text-lg font-bold text-sky-300 mt-0.5 tabular-nums font-serif">
              {formatNaira(collectionStats?.totalCollectedNaira || 0)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              of ₦8M cap ({collectionStats?.percentUsed?.toFixed(1) || '0.0'}%)
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] uppercase font-bold text-[#8C9399]">Marketplace GMV</div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5 tabular-nums font-serif">
              {formatNaira(metrics.totalGmv)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] uppercase font-bold text-[#C8A96A]">Commission (3%)</div>
            <div className="text-base sm:text-lg font-bold text-[#C8A96A] mt-0.5 tabular-nums font-serif">
              {formatNaira(metrics.platformCommissionCollected)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Awaiting payment at handover</div>
            <div className="text-base sm:text-lg font-bold text-emerald-300 mt-0.5 tabular-nums font-serif">
              {formatNaira(metrics.pendingEscrowAmount)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-[10px] uppercase font-bold text-amber-400">Pending Reviews</div>
            <div className="text-base sm:text-lg font-bold text-amber-300 mt-0.5 font-serif">
              {metrics.pendingListingsCount} listings
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-[#0B1120] px-4 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'moderation'
                ? 'border-[#C8A96A] text-[#C8A96A] font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Listing Approvals</span>
            {pendingProducts.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 rounded-full">
                {pendingProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sellers')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sellers'
                ? 'border-[#f3c84b] text-[#f3c84b] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Seller Verifications</span>
            {verifications.length > 0 && (
              <span className="bg-[#f3c84b] text-slate-950 font-bold text-[10px] px-1.5 rounded-full">
                {verifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'disputes'
                ? 'border-[#f3c84b] text-[#f3c84b] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Complaints & Disputes</span>
            {complaints.length > 0 && (
              <span className="bg-rose-500 text-white font-bold text-[10px] px-1.5 rounded-full">
                {complaints.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'border-[#f3c84b] text-[#f3c84b] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order & Payment Audit ({allOrders.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4">
          {/* TAB 1: PRODUCT LISTING MODERATION QUEUE */}
          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>
                  All submitted listings must be reviewed before appearing on the public campus homepage.
                </span>
                <span className="font-bold text-white">{pendingProducts.length} pending review</span>
              </div>

              {pendingProducts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p>Listing moderation queue is clean! No unreviewed items.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                    >
                      <div className="flex gap-3">
                        <img src={prod.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover bg-slate-900 shrink-0" />
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">{prod.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#C8A96A] text-[10px] uppercase font-medium">
                              {prod.category}
                            </span>
                          </div>
                          <div className="text-[#8C9399] font-light">
                            Seller: <strong className="text-slate-200">{prod.sellerName}</strong>
                          </div>
                          <div className="text-[#8C9399] font-light">
                            Campus: {prod.campusName} · Fulfillment: {prod.deliveryOption}
                          </div>
                          <div className="text-[#C8A96A] font-medium text-sm tabular-nums font-serif">
                            {formatNaira(prod.price)}
                          </div>
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.08]">
                        <button
                          onClick={() => setRejectionModalProduct(prod)}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleApproveProduct(prod.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SELLER VERIFICATION & STRIKES */}
          {activeTab === 'sellers' && (
            <div className="space-y-6">
              <div className="text-xs text-slate-400">
                Verify student vendors by checking their matriculation and campus credentials, manage strikes, and enforce 30-day account rules.
              </div>

              {/* Pending Verifications */}
              <div>
                <h3 className="font-semibold text-white text-sm mb-3">Pending Verification Requests ({verifications.length})</h3>
                {verifications.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                    <p>All seller verification requests are processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifications.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                          <div className="flex gap-3 items-center">
                            <img src={v.idCardPhotoUrl} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-white/[0.08]" />
                            <div>
                              <div className="font-medium text-white text-base">{v.userName}</div>
                              <div className="text-[#8C9399] font-light">{v.userEmail} · {v.phone}</div>
                              <div className="text-[#C8A96A] mt-0.5 font-medium">Campus: {v.campusName}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => {
                                store.rejectSellerVerification(v.id, 'Information or document could not be verified with school records', v.userId);
                                showNotice('Seller verification rejected');
                              }}
                              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-rose-300 font-medium text-xs cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveSeller(v)}
                              disabled={approvingSellerId === v.userId}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black font-medium text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>{approvingSellerId === v.userId ? 'Resolving NUBAN...' : 'Verify Bank & Create Subaccount'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Name Mismatch Warning Banner */}
                        {mismatchErrors[v.userId] && (
                          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-rose-400">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Account Name Mismatch Detected</span>
                            </div>
                            <p className="text-[11px] font-light">
                              Bank resolved account name <strong className="text-white">"{mismatchErrors[v.userId].resolvedAccountName}"</strong> does not match student legal registered name <strong className="text-white">"{mismatchErrors[v.userId].sellerName}"</strong>. At least two name parts must match. Subaccount creation was blocked.
                            </p>
                          </div>
                        )}

                        {/* Verification Dossier Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-[#0B1120] border border-white/[0.08]">
                            <span className="text-[10px] uppercase font-bold text-[#8C9399] block">Matric & Academic Record</span>
                            <span className="font-mono text-white font-medium">{v.matricNumber}</span>
                            <div className="text-[11px] text-[#8C9399] mt-0.5 font-light">{v.facultyDepartment || 'Faculty of Engineering'} ({v.level || '300L'})</div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#0B1120] border border-white/[0.08]">
                            <span className="text-[10px] uppercase font-bold text-[#8C9399] block">Physical Campus Location</span>
                            <span className="text-white font-medium">{v.hostelShopLocation || 'Ifite First Gate'}</span>
                            <div className="text-[11px] text-[#8C9399] mt-0.5 font-light">Doc: {v.idDocumentType || 'Student ID Card'}</div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#0B1120] border border-white/[0.08]">
                            <span className="text-[10px] uppercase font-bold text-[#8C9399] block">Payout Bank Match</span>
                            <span className="text-white font-medium">{v.bankName || 'Access Bank'} · {v.accountNumber ? `******${v.accountNumber.slice(-4)}` : '******4819'}</span>
                            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Matches student legal name</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registered Student Sellers & Strike Management */}
              <div className="pt-6 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Registered Campus Sellers & Strikes</h3>
                    <p className="text-[11px] text-slate-400">One strike per default. Sellers with active strikes or violations can be closed for 30 days.</p>
                  </div>
                  <span className="text-xs text-slate-400">{registeredSellers.length} seller(s)</span>
                </div>

                <div className="space-y-2">
                  {registeredSellers.map((seller) => {
                    const strikes = (adminQueues?.strikesBySeller && adminQueues.strikesBySeller[seller.id]) ?? store.getSellerStrikes(seller.id);
                    const isSuspended = !!(seller.suspendedUntilMs && seller.suspendedUntilMs > Date.now());

                    return (
                      <div
                        key={seller.id}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">{seller.storeName || seller.name}</span>
                            <span className="text-[#8C9399]">({seller.name})</span>
                            {isSuspended ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold text-[10px]">
                                Suspended (30 Days)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-[10px]">
                                Active
                              </span>
                            )}
                            {!seller.subaccountVerified && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-semibold text-[10px]">
                                Payout delayed until verified
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {seller.campusName} · {seller.email} · {seller.phone}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Strikes Indicator */}
                          <div className="text-center sm:text-right">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Strikes</div>
                            <span className={`px-2 py-0.5 rounded font-bold text-xs inline-block ${
                              strikes > 0 ? 'bg-rose-950 text-rose-300 border border-rose-500/50' : 'bg-slate-900 text-slate-400'
                            }`}>
                              {strikes} {strikes === 1 ? 'Strike' : 'Strikes'}
                            </span>
                          </div>

                          {!seller.subaccountVerified && (
                            <button
                              onClick={() => handleVerifySubaccount(seller.id)}
                              disabled={verifyingSubaccountId === seller.id}
                              className="px-2.5 py-1.5 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-[11px] cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {verifyingSubaccountId === seller.id ? 'Verifying...' : 'I verified this subaccount on Paystack'}
                            </button>
                          )}

                          {/* Action Buttons */}
                          {isSuspended ? (
                            <button
                              onClick={() => handleUnsuspendSeller(seller.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs cursor-pointer transition-colors"
                            >
                              Reopen Account
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendSeller(seller.id)}
                              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-950/60 text-rose-300 border border-white/[0.08] font-medium text-xs cursor-pointer transition-colors"
                            >
                              Close account for 30 days
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setRemovingSeller({ id: seller.id, storeName: seller.storeName || seller.name || 'Store' });
                              setConfirmStoreNameInput('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-semibold text-xs cursor-pointer transition-colors"
                          >
                            Remove seller permanently
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPUTES & 4 OPERATIONS QUEUES */}
          {activeTab === 'disputes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setDisputeSubTab('complaints')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      disputeSubTab === 'complaints'
                        ? 'bg-[#C8A96A] text-[#020406] border-[#C8A96A]'
                        : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Open Complaints ({complaints.length})
                  </button>

                  <button
                    onClick={() => setDisputeSubTab('overdue')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      disputeSubTab === 'overdue'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Overdue & Defaulted Sellers ({adminQueues?.overdueOrders?.length || 0})
                  </button>

                  <button
                    onClick={() => setDisputeSubTab('buyer_reports')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      disputeSubTab === 'buyer_reports'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                        : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Buyer Non-Payment Reports ({adminQueues?.buyerNonPaymentReports?.length || 0})
                  </button>

                  <button
                    onClick={() => setDisputeSubTab('refunds')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      disputeSubTab === 'refunds'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Disputed Refunds ({adminQueues?.unconfirmedRefunds?.length || 0})
                  </button>

                  <button
                    onClick={() => setDisputeSubTab('ban_reviews')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      disputeSubTab === 'ban_reviews'
                        ? 'bg-purple-600 text-white border-purple-600 font-bold'
                        : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    Ban Appeals ({banReviews.length})
                  </button>
                </div>

                <button
                  onClick={loadQueues}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueues ? 'animate-spin' : ''}`} />
                  <span>Refresh Queues</span>
                </button>
              </div>

              {/* Sub-Queue 1: Open Complaints */}
              {disputeSubTab === 'complaints' && (
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p>No open student complaints or transaction disputes.</p>
                    </div>
                  ) : (
                    complaints.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-4 rounded-2xl bg-[#121a2c] border border-rose-950/80 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">
                            Dispute on #{comp.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold text-[10px]">
                            Under Review
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Reason: <strong className="text-white">{comp.reason}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                          {comp.description}
                        </div>

                        <div className="flex items-center justify-between text-slate-400 pt-1">
                          <span>Buyer: {comp.buyerName}</span>
                          <span>Seller: {comp.sellerName}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.08]">
                          <button
                            onClick={() => handleResolveDispute(comp.id, 'refund_buyer')}
                            className="flex-1 py-2 rounded-xl bg-rose-900/70 hover:bg-rose-900 text-rose-100 font-medium text-xs cursor-pointer"
                          >
                            Authorize 100% Refund to Buyer
                          </button>
                          <button
                            onClick={() => handleResolveDispute(comp.id, 'release_seller')}
                            className="flex-1 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-900 text-emerald-100 font-medium text-xs cursor-pointer"
                          >
                            Release Payout to Seller
                          </button>
                          {comp.sellerId && (
                            <button
                              onClick={() => {
                                setRemovingSeller({ id: comp.sellerId, storeName: comp.sellerName || 'Seller' });
                                setConfirmStoreNameInput('');
                              }}
                              className="w-full py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 font-semibold text-xs cursor-pointer transition-colors"
                            >
                              Remove seller permanently
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sub-Queue 2: Overdue & Defaulted Sellers */}
              {disputeSubTab === 'overdue' && (
                <div className="space-y-3">
                  {(!adminQueues?.overdueOrders || adminQueues.overdueOrders.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p>No overdue orders. All deliveries are on schedule within their campus deadlines.</p>
                    </div>
                  ) : (
                    adminQueues.overdueOrders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">#{ord.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold text-[10px]">
                            {ord.sellerDefault ? 'Seller Defaulted (24h Grace Expired)' : 'Overdue Deadline'}
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Seller: <strong className="text-white">{ord.sellerName}</strong>
                        </div>
                        <div className="text-slate-300">
                          Buyer: <strong className="text-white">{ord.buyerName}</strong> ({ord.buyerPhone})
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Delivery Deadline: {new Date(ord.deliveryDeadlineMs).toLocaleString('en-NG')}
                        </div>

                        {ord.sellerDefault && (
                          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-[11px] space-y-2">
                            <div>
                              Penalty rule triggered: Seller defaulted. 1 strike recorded. Seller owes 2x delivery fee ({formatNaira((ord.deliveryFee || 0) * 2)}) directly by bank transfer outside the app. Administrator decides account action.
                            </div>
                            <button
                              onClick={() => {
                                setRemovingSeller({ id: ord.sellerId, storeName: ord.sellerName || 'Seller' });
                                setConfirmStoreNameInput('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-semibold text-[11px] cursor-pointer transition-colors"
                            >
                              Remove seller permanently
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sub-Queue 3: Buyer Non-Payment Reports */}
              {disputeSubTab === 'buyer_reports' && (
                <div className="space-y-3">
                  {(!adminQueues?.buyerNonPaymentReports || adminQueues.buyerNonPaymentReports.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p>No reports of buyer refusal or non-payment.</p>
                    </div>
                  ) : (
                    adminQueues.buyerNonPaymentReports.map((report: any) => (
                      <div
                        key={report.id}
                        className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">Order #{report.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px]">
                            Buyer Payment Refusal
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Reporting Vendor: <strong className="text-white">{report.sellerName}</strong>
                        </div>
                        <div className="text-slate-300">
                          Accused Buyer: <strong className="text-white">{report.buyerName}</strong> (ID: {report.buyerId})
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                          Reason: {report.description || report.reason}
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                          <button
                            onClick={() => handleBanBuyer(report.buyerId)}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Ban Buyer for 30 Days</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sub-Queue 4: Disputed / Unconfirmed Refunds */}
              {disputeSubTab === 'refunds' && (
                <div className="space-y-3">
                  {(!adminQueues?.unconfirmedRefunds || adminQueues.unconfirmedRefunds.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                      <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p>No disputed or unconfirmed refunds. All bank transfers settled outside the app.</p>
                    </div>
                  ) : (
                    adminQueues.unconfirmedRefunds.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/40 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">#{ord.orderNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold text-[10px]">
                            Refund Status: {ord.refund?.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Amount Owed: <strong className="text-[#C8A96A] tabular-nums font-bold">{formatNaira(ord.refund?.amountOwed || 0)}</strong> ({ord.refund?.multiplier || 1}x delivery fee)
                        </div>

                        {ord.refund?.bankAccount && (
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Buyer Refund Account:</span>
                            <div>{ord.refund.bankAccount.bankName} · {ord.refund.bankAccount.accountNumber}</div>
                            <div className="text-white font-medium">{ord.refund.bankAccount.accountName}</div>
                          </div>
                        )}

                        {ord.refund?.disputeReason && (
                          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
                            Dispute Note: {ord.refund.disputeReason}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                          <button
                            onClick={() => handleResolveAdminDisputeAction(ord.id, 'Admin arbitrated and confirmed bank transfer settlement.')}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow"
                          >
                            Mark Refund Resolved
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sub-Queue 5: Ban Appeals & Explanations */}
              {disputeSubTab === 'ban_reviews' && (
                <div className="space-y-3">
                  {banReviews.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p>No pending ban appeals or buyer explanations.</p>
                    </div>
                  ) : (
                    banReviews.map((rev) => (
                      <div
                        key={rev.userId}
                        className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/40 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{rev.name}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold text-[10px]">
                            30-Day Suspension Active
                          </span>
                        </div>

                        <div className="text-slate-300">
                          Account: <strong className="text-white">{rev.email}</strong> · {rev.phone} · Campus: {rev.campusName}
                        </div>

                        <div className="text-slate-300">
                          Suspension Reason: <span className="text-rose-400 font-medium">{rev.banReason || 'Refused payment or missed meetup without cause (Rule P4)'}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#C8A96A] block">
                            Student Explanation:
                          </span>
                          <p className="text-slate-200 leading-relaxed italic">
                            "{rev.explanation}"
                          </p>
                          <div className="text-[10px] text-slate-400 pt-1">
                            Submitted: {new Date(rev.submittedAt).toLocaleString('en-NG')}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                          <button
                            onClick={() => handleLiftBan(rev.userId)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Lift Ban & Reopen Account</span>
                          </button>
                          <button
                            onClick={() => handleKeepBan(rev.userId)}
                            className="flex-1 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Keep Ban Active</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDER & PAYMENT AUDIT */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="text-xs text-[#8C9399] font-light">
                Complete platform transaction ledger with 3% commission tracking (capped at ₦2,000).
              </div>

              <div className="space-y-2">
                {allOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-white">#{order.orderNumber}</span>
                        <span className="text-[#8C9399]">({order.buyerName} → {order.sellerName})</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#C8A96A] text-[10px] font-medium uppercase tracking-wider">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Subtotal: {formatNaira(order.subtotal)} · Delivery: {formatNaira(order.deliveryFee)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-bold tabular-nums">
                        Commission: {formatNaira(order.platformCommission || 0)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Seller Net: {formatNaira(order.sellerPayoutAmount || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rejection Modal Dialog */}
        {rejectionModalProduct && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-rose-900/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Reject Listing</h3>
                <button
                  onClick={() => setRejectionModalProduct(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Specify feedback for <strong>{rejectionModalProduct.title}</strong> so the seller can correct and re-submit:
              </p>

              <form onSubmit={handleRejectProductSubmit} className="space-y-4">
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl p-3 text-xs text-white"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectionModalProduct(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Permanent Seller Removal Confirmation Modal */}
        {removingSeller && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-rose-500/60 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                  <UserX className="w-5 h-5 shrink-0" />
                  <h3>Remove Seller Permanently</h3>
                </div>
                <button
                  onClick={() => setRemovingSeller(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <p>
                  You are about to permanently remove seller <strong className="text-white">{removingSeller.storeName}</strong>.
                </p>
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[11px] space-y-1">
                  <p>• All published product listings will be deleted.</p>
                  <p>• All open orders will be cancelled and stock restored.</p>
                  <p>• If delivery fees were paid, 1x refunds will be queued for buyers.</p>
                  <p>• Paystack subaccount will be deactivated.</p>
                  <p>• This account is permanently blocked from applying as a seller.</p>
                </div>
                <p className="text-slate-400">
                  Type the exact store name <strong className="text-[#C8A96A] font-mono select-all">{removingSeller.storeName}</strong> to confirm:
                </p>
              </div>

              <form onSubmit={handleConfirmPermanentRemoval} className="space-y-4">
                <input
                  type="text"
                  required
                  value={confirmStoreNameInput}
                  onChange={(e) => setConfirmStoreNameInput(e.target.value)}
                  placeholder={removingSeller.storeName}
                  className="w-full bg-[#0B1120] border border-rose-500/50 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRemovingSeller(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRemovingSeller || confirmStoreNameInput.trim().toLowerCase() !== removingSeller.storeName.trim().toLowerCase()}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    {isRemovingSeller ? 'Removing...' : 'Confirm Permanent Removal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
