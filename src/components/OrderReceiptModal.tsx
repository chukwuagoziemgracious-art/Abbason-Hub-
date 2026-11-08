import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  CheckCircle2, 
  Phone, 
  Truck, 
  Flag, 
  Download, 
  Check, 
  Star, 
  CreditCard, 
  Loader2,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { Order, OrderItem } from '../types';
import { formatNaira, formatDate } from '../utils/currency';
import { store } from '../services/store';

interface OrderReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenDispute: (order: Order) => void;
  onRateSeller?: (order: Order) => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order: initialOrder,
  onClose,
  onOpenDispute,
  onRateSeller,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isPayingVendor, setIsPayingVendor] = useState(false);
  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<OrderItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Item faulty / not as described');
  const [isRejecting, setIsRejecting] = useState(false);

  // Refund handshake state
  const [refundBank, setRefundBank] = useState('PalmPay');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundAccountName, setRefundAccountName] = useState(initialOrder?.buyerName || '');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundActionMessage, setRefundActionMessage] = useState<string | null>(null);

  // Phase B Contact & Cancellation State
  const [contactDetails, setContactDetails] = useState<{
    sellerContact?: any;
    buyerContact?: any;
    contactShared: boolean;
  } | null>(null);
  const [isReportingUnreachable, setIsReportingUnreachable] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  React.useEffect(() => {
    if (initialOrder?.id) {
      store.getOrderContact(initialOrder.id).then((res) => {
        setContactDetails(res);
      });
      if (initialOrder.buyerName) {
        setRefundAccountName(initialOrder.buyerName);
      }
    }
  }, [initialOrder?.id]);

  if (!initialOrder) return null;

  // Read latest state from store in case an item was just paid
  const order = store.getOrderById(initialOrder.id) || initialOrder;

  const isCompleted = order.status === 'paid_completed' || order.status === 'delivered';
  const isPartiallyPaid = order.status === 'partially_paid';

  // Calculate unpaid items
  const unpaidItems = order.items.filter((i) => i.status !== 'paid');
  const unpaidTotal = unpaidItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleReportUnreachable = async () => {
    if (!window.confirm('Report that seller did not answer or show up? Order will auto-cancel at deadline with no penalty to either party.')) return;
    setIsReportingUnreachable(true);
    try {
      const res = await store.reportSellerUnreachable(order.id);
      if (res.success) {
        setPaymentFeedback(res.message || 'Report submitted. Order will cancel cleanly at deadline if seller remains unreachable.');
      } else {
        setPaymentFeedback(res.error || 'Failed to submit report');
      }
    } finally {
      setIsReportingUnreachable(false);
    }
  };

  const handleBuyerCancel = async () => {
    if (!window.confirm('Cancel this order? If you paid an upfront delivery fee, you will receive a 1x refund by bank transfer.')) return;
    setIsCancellingOrder(true);
    try {
      const res = await store.cancelOrder(order.id, 'buyer_cancelled');
      if (res.success) {
        setPaymentFeedback('Order cancelled successfully.');
      } else {
        setPaymentFeedback(res.error || 'Failed to cancel order.');
      }
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handlePayIndividualItem = async (item: OrderItem) => {
    setPayingItemId(item.id);
    setPaymentFeedback(null);
    try {
      const init = await store.initializePayment({
        type: 'goods',
        orderId: order.id,
        itemIds: [item.id]
      });

      if (init.status && init.authorization_url) {
        window.location.href = init.authorization_url;
        return;
      }

      setPaymentFeedback(init.error || 'Payment initialization failed. Please try again.');
    } catch (err: any) {
      setPaymentFeedback(err.message || 'Payment processing error. Please try again.');
    } finally {
      setPayingItemId(null);
    }
  };

  const handlePayVendorTotal = async () => {
    setIsPayingVendor(true);
    setPaymentFeedback(null);
    try {
      const unpaidItemIds = unpaidItems.map((i) => i.id);
      const init = await store.initializePayment({
        type: 'goods',
        orderId: order.id,
        itemIds: unpaidItemIds
      });

      if (init.status && init.authorization_url) {
        window.location.href = init.authorization_url;
        return;
      }

      setPaymentFeedback('Payment initialization failed. Please try again.');
    } catch (err: any) {
      setPaymentFeedback('Payment processing error. Please try again.');
    } finally {
      setIsPayingVendor(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    setIsRejecting(true);
    try {
      const res = await store.rejectOrderItem(order.id, rejectingItem.id, rejectReason);
      if (res.success) {
        setPaymentFeedback(`Item "${rejectingItem.title}" marked as rejected. No goods payment required.`);
        setRejectingItem(null);
      } else {
        setPaymentFeedback(res.error || 'Failed to reject item');
      }
    } catch (err: any) {
      setPaymentFeedback(err.message || 'Error rejecting item');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRegisterRefundBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAccount || refundAccount.replace(/\D/g, '').length !== 10) {
      setRefundActionMessage('Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    setIsSubmittingRefund(true);
    try {
      const res = await store.submitRefundBankDetails(order.id, {
        bankName: refundBank,
        accountNumber: refundAccount.replace(/\D/g, ''),
        accountName: refundAccountName
      });
      if (res.success) {
        setRefundActionMessage('Refund bank account saved. The seller will dispatch the refund.');
      } else {
        setRefundActionMessage(res.error || 'Failed to save account');
      }
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleConfirmRefund = async () => {
    const res = await store.confirmRefundReceived(order.id);
    if (res.success) {
      setRefundActionMessage('Refund confirmed as received.');
    } else {
      setRefundActionMessage(res.error || 'Failed to confirm');
    }
  };

  const handleDisputeRefund = async () => {
    const res = await store.disputeRefund(order.id, 'Buyer did not receive bank transfer from seller.');
    if (res.success) {
      setRefundActionMessage('Refund disputed and forwarded to administrator review.');
    } else {
      setRefundActionMessage(res.error || 'Failed to dispute');
    }
  };

  const handleDownloadReceipt = () => {
    const receiptContent = `===========================================
ABBASON HUB — OFFICIAL CAMPUS RECEIPT
"Inspect First · Pay On Delivery"
===========================================
ORDER NUMBER: ${order.orderNumber}
TRANSACTION DATE: ${new Date(order.createdAt).toLocaleString('en-NG')}
CAMPUS: ${order.campusName}
PAYMENT STATUS: ${order.paymentStatus.toUpperCase()}

BUYER DETAILS:
Name: ${order.buyerName}
Phone: ${order.buyerPhone}
Delivery Destination: ${order.deliveryInstructions}

SELLER DETAILS:
Vendor / Store: ${order.sellerName}

ITEMIZED TRACKING CODES & STATUS:
${order.items.map((i) => `• [${i.itemCode}] ${i.title} (x${i.quantity}) — ₦${(i.price * i.quantity).toLocaleString()} [Status: ${i.status.toUpperCase()}]`).join('\n')}

FINANCIAL BREAKDOWN:
Upfront Transport Fee Paid: ₦${(order.upfrontTotalPaid || order.deliveryFee).toLocaleString()}
Items Total Due Upon Delivery: ₦${order.subtotal.toLocaleString()}
Items Paid So Far: ₦${(order.itemsTotalPaid || 0).toLocaleString()}
Floor Total: ₦${order.totalAmount.toLocaleString()}

Need help? Contact: support@abbasonhub.com
===========================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Abbason_Receipt_${order.orderNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#090D14] border border-white/[0.12] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-[#C8A96A] animate-pulse'}`} />
            <h3 className="text-sm font-medium text-white font-serif">
              Order #{order.orderNumber}
            </h3>
            <span className="text-[11px] text-[#8C9399]">· {order.sellerName}</span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#8C9399] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {paymentFeedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{paymentFeedback}</span>
            </div>
            <button 
              onClick={() => setPaymentFeedback(null)} 
              className="text-emerald-400 hover:text-white text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* Always pay inside app warning banner */}
          {!isCompleted && unpaidTotal > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2.5 text-amber-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Safety Policy:</strong> Always pay inside the app. Paying outside the app means no refund and can get your account closed.
              </span>
            </div>
          )}

          {/* Quick Pay Bar (if unpaid items remain) */}
          {!isCompleted && unpaidTotal > 0 && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pay on Inspection (All Items)</div>
                <div className="text-lg font-mono text-[#C8A96A] font-semibold">{formatNaira(unpaidTotal)}</div>
              </div>

              <button
                type="button"
                onClick={handlePayVendorTotal}
                disabled={isPayingVendor}
                className="px-4 py-2 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer disabled:opacity-60"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isPayingVendor ? 'Opening Paystack...' : `Pay ${formatNaira(unpaidTotal)} via Paystack`}</span>
              </button>
            </div>
          )}

          {/* Refund Handshake Section (if refund exists) */}
          {order.refund && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-amber-200 flex items-center gap-2">
                  <span>Delivery Fee Refund</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-500/40">
                    {(order.refund.multiplier || 1) > 1 ? `${order.refund.multiplier}x Penalty` : '1x Refund'}
                  </span>
                </div>
                <div className="text-base font-bold text-amber-400 font-mono">
                  {formatNaira(order.refund.owedAmount || order.refund.amountOwed || 0)}
                </div>
              </div>

              {refundActionMessage && (
                <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs">
                  {refundActionMessage}
                </div>
              )}

              {/* Status 1: Owed - prompt buyer for refund account */}
              {order.refund.status === 'owed' && (
                <div className="space-y-2">
                  <p className="text-slate-300 text-xs font-light">
                    {order.refundAccount
                      ? `Refund destination saved: ${order.refundAccount.bankName} (******${order.refundAccount.accountNumber.slice(-4)}). Seller has 24h to dispatch bank transfer.`
                      : 'Seller owes you a refund by direct bank transfer outside the app. Provide your Nigerian bank details below:'}
                  </p>
                  {!order.refundAccount && (
                    <form onSubmit={handleRegisterRefundBank} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={refundBank}
                          onChange={(e) => setRefundBank(e.target.value)}
                          placeholder="Bank / Wallet Name"
                          className="bg-black/50 border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-white"
                          required
                        />
                        <input
                          type="text"
                          maxLength={10}
                          value={refundAccount}
                          onChange={(e) => setRefundAccount(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit NUBAN"
                          className="bg-black/50 border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmittingRefund}
                        className="w-full py-2 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-xs cursor-pointer shadow"
                      >
                        {isSubmittingRefund ? 'Saving...' : 'Save Refund Bank Account'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Status 2: Paid Claimed - prompt buyer to confirm or dispute */}
              {order.refund.status === 'paid_claimed' && (
                <div className="space-y-2">
                  <p className="text-emerald-200 text-xs font-light">
                    The seller has marked this refund as dispatched via bank transfer. Please check your bank account.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmRefund}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer shadow"
                    >
                      I Received It
                    </button>
                    <button
                      type="button"
                      onClick={handleDisputeRefund}
                      className="flex-1 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold text-xs cursor-pointer"
                    >
                      I Did Not Receive It
                    </button>
                  </div>
                </div>
              )}

              {/* Status 3: Confirmed */}
              {order.refund.status === 'confirmed' && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Refund confirmed received into your bank account.</span>
                </div>
              )}

              {/* Status 4: Disputed */}
              {order.refund.status === 'disputed' && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span>Refund disputed. Under investigation by administrator.</span>
                </div>
              )}
            </div>
          )}

          {/* Simple Items List */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
              Items in Delivery
            </div>

            {order.items.map((item) => {
              const isItemPaid = item.status === 'paid';
              const isItemRejected = item.status === 'rejected';
              const isProcessingThis = payingItemId === item.id;
              const itemTotal = item.price * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={item.image} 
                      alt="" 
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate text-xs">{item.title}</div>
                      <div className="text-[11px] text-slate-400">
                        Qty: {item.quantity} · {formatNaira(itemTotal)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-[#020406] border border-[#C8A96A]/30 text-[#C8A96A] font-mono text-[10px]">
                          {item.itemCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.itemCode, item.id)}
                          className="text-[#8C9399] hover:text-[#C8A96A] text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          {copiedCodeId === item.id ? (
                            <span className="text-emerald-400">Copied</span>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isItemPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                        <Check className="w-3 h-3" />
                        <span>Paid</span>
                      </span>
                    ) : isItemRejected ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px]">
                        Rejected
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRejectingItem(item)}
                          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/[0.08] text-[10px] transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayIndividualItem(item)}
                          disabled={isProcessingThis}
                          className="px-2.5 py-1 rounded-lg bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-[10px] flex items-center gap-1 shadow transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {isProcessingThis ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CreditCard className="w-2.5 h-2.5" />}
                          <span>Pay {formatNaira(itemTotal)}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shared Contact & Agreed Delivery Details Card */}
          {(() => {
            const isContactShared = order.contactShared || contactDetails?.contactShared;
            const sellerPhone = contactDetails?.sellerContact?.phone || order.sellerPhone;
            const sellerLocation = contactDetails?.sellerContact?.location || order.pickupLandmark;
            const canCancel = order.status !== 'cancelled' && !isCompleted && !order.agreedTime && (!order.cancelCutoffMs || Date.now() < order.cancelCutoffMs);
            const isPickupOrFree = order.fulfillmentMethod === 'buyer_pickup' || (order.fulfillmentMethod === 'seller_delivers' && (order.deliveryFee || 0) === 0);

            return (
              <div className="space-y-3">
                {/* Contact & Meetup Card */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-wider">
                      Fulfillment & Contact
                    </span>
                    {store.isOrderOverdue(order) && (
                      <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold text-[10px]">
                        Overdue Delivery
                      </span>
                    )}
                  </div>

                  {isContactShared ? (
                    <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Vendor</span>
                          <span className="text-white font-medium text-xs">{order.sellerName}</span>
                        </div>
                        {sellerPhone && (
                          <a
                            href={`tel:${sellerPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Seller ({sellerPhone})</span>
                          </a>
                        )}
                      </div>

                      {sellerLocation && (
                        <div className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                          <span>Meeting / Pickup Spot: <strong className="text-white">{sellerLocation}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#8C9399] text-[11px] font-light">
                      Seller phone and pickup location will be unlocked immediately once your transport commitment is confirmed.
                    </div>
                  )}

                  {/* Agreed Delivery Time if set by seller */}
                  {order.agreedTime && (
                    <div className="p-2 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-xs flex items-center gap-2 text-white">
                      <Clock className="w-4 h-4 text-[#C8A96A] shrink-0" />
                      <span>
                        <strong>Agreed Delivery Time:</strong> {order.agreedTime}
                      </span>
                    </div>
                  )}

                  {/* Cancellation cutoff line */}
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      {order.status === 'cancelled' ? (
                        <span className="text-slate-400">Order cancelled ({order.cancelReason || 'no penalty'}).</span>
                      ) : isCompleted ? (
                        <span className="text-emerald-400">Order completed and inspected.</span>
                      ) : canCancel ? (
                        <span className="text-slate-300">
                          You can cancel until{' '}
                          <strong className="text-white">
                            {order.cancelCutoffMs 
                              ? `${new Date(order.cancelCutoffMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date(order.cancelCutoffMs).toLocaleDateString()}`
                              : 'the seller sets an agreed delivery time'}
                          </strong>.
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          You will not be able to cancel this order ({order.agreedTime ? 'seller has set agreed delivery time' : 'cancellation window closed'}).
                        </span>
                      )}
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={handleBuyerCancel}
                        disabled={isCancellingOrder}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/[0.08] text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isCancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>

                  {/* Rule P4b: Seller did not answer / show up button for pickup/free-delivery */}
                  {isPickupOrFree && order.status !== 'cancelled' && !isCompleted && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={handleReportUnreachable}
                        disabled={isReportingUnreachable || order.sellerUnreachableReported}
                        className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-white/[0.08] text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-[#C8A96A]" />
                        <span>
                          {order.sellerUnreachableReported 
                            ? 'Unreachable Seller Reported (Auto-cancels cleanly at deadline)' 
                            : 'Seller did not answer / did not show up'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Simple Totals */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Transport fee (Paid)</span>
              <span className="text-slate-200 font-mono">{formatNaira(order.upfrontTotalPaid || order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Goods settled so far</span>
              <span className="text-emerald-400 font-mono">{formatNaira(order.itemsTotalPaid || 0)}</span>
            </div>
            <div className="border-t border-white/[0.06] pt-1.5 flex justify-between text-white font-medium">
              <span>Order Total</span>
              <span className="text-[#C8A96A] font-mono">{formatNaira(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] flex items-center gap-2 bg-white/[0.01]">
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="py-2.5 px-3 rounded-xl border border-white/[0.12] hover:border-[#C8A96A] text-slate-300 hover:text-[#C8A96A] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {downloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>Receipt</span>
          </button>

          {!isCompleted && (
            <button
              onClick={() => {
                onClose();
                onOpenDispute(order);
              }}
              className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-rose-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
          )}

          {isCompleted && onRateSeller && (
            <button
              onClick={() => {
                onClose();
                onRateSeller(order);
              }}
              className="py-2.5 px-3 rounded-xl bg-[#C8A96A] text-[#020406] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{order.hasBuyerReviewed ? 'Review' : 'Rate Seller'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs text-center transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Item Rejection Dialog */}
        {rejectingItem && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-rose-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Reject Faulty Item</h3>
                <button
                  onClick={() => setRejectingItem(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Rejecting <strong>{rejectingItem.title}</strong> during physical handover inspection. No goods payment will be charged for this item.
              </p>

              <form onSubmit={handleConfirmReject} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Broken screen, wrong size, defective..."
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingItem(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRejecting}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
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
