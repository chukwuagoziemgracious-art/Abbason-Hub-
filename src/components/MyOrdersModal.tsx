import React, { useState } from 'react';
import { 
  X, 
  Package, 
  ShieldCheck, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Flag,
  Truck,
  MapPin,
  Copy,
  Download,
  Star
} from 'lucide-react';
import { store } from '../services/store';
import { formatNaira, formatDate } from '../utils/currency';
import { Order } from '../types';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrderReceipt: (order: Order) => void;
  onOpenDispute: (order: Order) => void;
  onRateSeller?: (order: Order) => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  onViewOrderReceipt,
  onOpenDispute,
  onRateSeller,
}) => {
  const currentUser = store.getCurrentUser();
  const orders = currentUser ? store.getOrders(currentUser.id, 'student') : [];

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? The upfront delivery fee is non-refundable upon buyer cancellation.')) return;
    setCancellingOrderId(orderId);
    setActionFeedback(null);
    try {
      const res = await store.cancelOrder(orderId);
      if (res.success) {
        setActionFeedback('Order cancelled successfully.');
      } else {
        setActionFeedback(res.error || 'Failed to cancel order.');
      }
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleDownloadReceipt = (order: Order) => {
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

PURCHASED ITEMS:
${order.items.map((i) => `• ${i.title} (x${i.quantity}) — ₦${(i.price * i.quantity).toLocaleString()} [Item Code: ${i.itemCode}]`).join('\n')}

FINANCIAL BREAKDOWN:
Upfront Transport Fee: ₦${(order.upfrontTotalPaid || order.deliveryFee).toLocaleString()}
Items Total Due Upon Delivery: ₦${order.subtotal.toLocaleString()}
Items Paid So Far: ₦${(order.itemsTotalPaid || 0).toLocaleString()}
Order Total: ₦${order.totalAmount.toLocaleString()}

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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#0B1120] border border-white/[0.1] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white font-serif">
                My Purchases & Parcels
              </h3>
              <p className="text-[11px] text-[#8C9399]">
                {currentUser ? `Logged in as: ${currentUser.name}` : 'Browsing as Guest'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center border border-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="bg-[#C8A96A]/20 border-b border-[#C8A96A]/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-[#C8A96A] text-[10px] cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {!currentUser ? (
            <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">Sign in to view your orders</p>
              <p className="mt-1">Please sign in with your campus account to view orders and track active deliveries.</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">No orders yet</p>
              <p className="mt-1">Add finds from your campus feed to place an order!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaidCompleted = order.status === 'paid_completed' || order.status === 'delivered';
                const isPartiallyPaid = order.status === 'partially_paid';
                const isPendingInspection = order.status === 'delivery_fee_paid' || order.status === 'in_transit' || order.status === 'delivered_pending_inspection';
                const isCancelled = order.status === 'cancelled';
                const isOverdue = store.isOrderOverdue(order);

                const cutoff = order.contactRevealAtMs || (order.deliveryDeadlineMs ? order.deliveryDeadlineMs - (48 * 3600 * 1000) : 0);
                const canCancel = !isPaidCompleted && !isCancelled && cutoff > 0 && Date.now() < cutoff;
                const isPastCutoff = !isPaidCompleted && !isCancelled && cutoff > 0 && Date.now() >= cutoff;

                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isOverdue
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-lg'
                        : isPendingInspection || isPartiallyPaid
                          ? 'bg-[#0f172a] border-[#C8A96A]/60 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold font-mono text-white text-sm">
                          #{order.orderNumber}
                        </span>

                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Overdue</span>
                          </span>
                        )}

                        {isPaidCompleted ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold text-[10px]">
                            Paid & Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-medium text-[10px]">
                            Cancelled ({order.cancelReason === 'buyer_cancelled' ? 'by you' : 'by seller'})
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold text-[10px]">
                            Partially Paid
                          </span>
                        ) : isPendingInspection ? (
                          <span className="px-2 py-0.5 rounded bg-[#C8A96A]/20 border border-[#C8A96A]/60 text-[#C8A96A] font-bold text-[10px]">
                            Inspect On Delivery (POD)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold text-[10px]">
                            Disputed
                          </span>
                        )}

                        {order.refund && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                            Refund {order.refund.status}: {formatNaira(order.refund.owedAmount || order.refund.amountOwed || 0)}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    {/* Inspect-on-Delivery Call to Action */}
                    {!isPaidCompleted && (
                      <div className="my-3 p-3.5 rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#C8A96A] font-medium text-xs uppercase tracking-wider">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Inspect & Pay At Hostel</span>
                          </div>
                          <p className="text-[11px] text-[#8C9399] mt-0.5 font-light">
                            Vendor is dispatched. Inspect items, then pay in 1 tap or per item.
                          </p>
                        </div>

                        <button
                          onClick={() => onViewOrderReceipt(order)}
                          className="px-4 py-2 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black font-semibold text-xs cursor-pointer shadow-md shrink-0"
                        >
                          Inspect & Pay Now
                        </button>
                      </div>
                    )}

                    {/* Items and Seller Info */}
                    <div className="text-xs text-slate-300 space-y-1 my-2">
                      <div className="text-slate-400">
                        Seller: <strong className="text-white">{order.sellerName}</strong> ({order.campusName.split('(')[0]})
                      </div>
                      <div className="text-slate-400 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                        <span>Fulfillment: {order.deliveryInstructions}</span>
                      </div>
                      <div className="pt-1 text-slate-300 font-medium">
                        {order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>Total: <span className="text-[#C8A96A] font-serif tabular-nums">{formatNaira(order.totalAmount)}</span></span>
                        {canCancel && (
                          <span className="text-[10px] text-slate-400">
                            (Can cancel until {new Date(cutoff).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                        {isPastCutoff && !isCancelled && !isPaidCompleted && (
                          <span className="text-[10px] text-slate-500 italic">
                            Cancellation closed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-white/[0.08] text-[11px] cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}

                        {isOverdue && !isPaidCompleted && !isCancelled && (
                          <button
                            onClick={() => onOpenDispute(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Report Late Delivery</span>
                          </button>
                        )}

                        {!isPaidCompleted && !isCancelled && !isOverdue && (
                          <button
                            onClick={() => onOpenDispute(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-rose-300 hover:bg-white/[0.08] border border-white/[0.08] text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Report Issue</span>
                          </button>
                        )}

                        {isPaidCompleted && onRateSeller && (
                          <button
                            onClick={() => onRateSeller(order)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                              order.hasBuyerReviewed
                                ? 'bg-[#C8A96A]/15 border border-[#C8A96A]/40 text-[#C8A96A]'
                                : 'bg-[#C8A96A] hover:bg-[#b89858] text-black'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{order.hasBuyerReviewed ? 'Reviewed' : 'Rate Seller'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Download Receipt Summary for offline"
                        >
                          <Download className="w-3 h-3 text-[#C8A96A]" />
                          <span className="hidden sm:inline">Slip</span>
                        </button>

                        <button
                          onClick={() => onViewOrderReceipt(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/40 text-[#C8A96A] text-[11px] font-medium cursor-pointer"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
