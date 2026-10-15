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
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const currentUser = store.getCurrentUser();
  const orders = store.getOrders(currentUser.id, 'student');

  if (!isOpen) return null;

  const handleCopyCode = (order: Order) => {
    if (order.deliveryOtpForBuyer) {
      navigator.clipboard.writeText(order.deliveryOtpForBuyer);
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
  };

  const handleDownloadReceipt = (order: Order) => {
    const receiptContent = `===========================================
ABBASON HUB — OFFICIAL CAMPUS RECEIPT
"Everything you imagined."
===========================================
ORDER NUMBER: ${order.orderNumber}
TRANSACTION DATE: ${new Date(order.createdAt).toLocaleString('en-NG')}
CAMPUS: ${order.campusName}
PAYMENT STATUS: CONFIRMED & SECURED IN PAYLUK ESCROW

-------------------------------------------
YOUR SECRET DELIVERY CONFIRMATION CODE:
>>>  ${order.deliveryOtpForBuyer || '••••••'}  <<<
-------------------------------------------
SECURITY INSTRUCTION:
Do NOT share this code with the seller beforehand!
Only provide this code in person after you physically 
receive, inspect, and confirm your order is in good condition.

BUYER DETAILS:
Name: ${order.buyerName}
Phone: ${order.buyerPhone}
Delivery Destination: ${order.deliveryInstructions}

SELLER DETAILS:
Vendor / Store: ${order.sellerName}
Contact Phone: +234 803 412 9081

PURCHASED ITEMS:
${order.items.map((i) => `• ${i.title} (x${i.quantity}) — ₦${(i.price * i.quantity).toLocaleString()}`).join('\n')}

FINANCIAL BREAKDOWN:
Subtotal: ₦${order.subtotal.toLocaleString()}
Delivery Fee: ₦${order.deliveryFee.toLocaleString()}
Payment Processing Fee: ₦${order.gatewayFee.toLocaleString()}
TOTAL PAID: ₦${order.totalAmount.toLocaleString()}
Payment Method: ${order.paymentMethod.toUpperCase()} (Online Web Payment)
Platform Escrow: Secured by Payluk Escrow Vault

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
        className="relative w-full max-w-2xl rounded-3xl bg-[#0F172A] border border-purple-900/70 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-[#f3c84b]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                My Purchases & Delivery Codes
              </h3>
              <p className="text-[11px] text-slate-400">
                Logged in as: {currentUser.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {orders.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">No orders yet</p>
              <p className="mt-1">Add finds from your campus feed to place an order!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isAwaitingDelivery = order.status === 'paid_awaiting_delivery';
                const isDelivered = order.status === 'delivered';
                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAwaitingDelivery
                        ? 'bg-[#121a2c] border-[#f3c84b]/60 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-white text-sm">
                          #{order.orderNumber}
                        </span>
                        {isAwaitingDelivery ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold text-[10px]">
                            Awaiting In-Person Delivery
                          </span>
                        ) : isDelivered ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold text-[10px]">
                            Delivered & Handshake Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold text-[10px]">
                            Disputed
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    {/* Prominent Delivery Code Box if Awaiting Delivery */}
                    {isAwaitingDelivery && (
                      <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-[#1e1035] border border-purple-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#f3c84b] font-bold text-xs uppercase tracking-wider">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Your Handshake Delivery Code</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Show this code to <strong>{order.sellerName}</strong> only after inspecting the item.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-2xl font-black text-white tracking-widest bg-slate-950 px-3.5 py-1.5 rounded-xl border border-purple-800 shadow">
                            {order.deliveryOtpForBuyer || '••••••'}
                          </span>
                          <button
                            onClick={() => handleCopyCode(order)}
                            className="p-2 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs cursor-pointer"
                            title="Copy code"
                          >
                            {copiedOrderId === order.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Items and Seller Info */}
                    <div className="text-xs text-slate-300 space-y-1 my-2">
                      <div className="text-slate-400">
                        Seller: <strong className="text-white">{order.sellerName}</strong> ({order.campusName.split('(')[0]})
                      </div>
                      <div className="text-slate-400 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-[#f3c84b]" />
                        <span>Fulfillment: {order.deliveryInstructions}</span>
                      </div>
                      <div className="pt-1 text-slate-300 font-medium">
                        {order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-2 border-t border-purple-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-white">
                        Total: <span className="text-[#f3c84b] tabular-nums">{formatNaira(order.totalAmount)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAwaitingDelivery && (
                          <button
                            onClick={() => onOpenDispute(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-rose-300 hover:bg-slate-700 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Report Issue</span>
                          </button>
                        )}

                        {isDelivered && onRateSeller && (
                          <button
                            onClick={() => onRateSeller(order)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              order.hasBuyerReviewed
                                ? 'bg-purple-950 border border-purple-800 text-[#f3c84b]'
                                : 'bg-[#f3c84b] hover:bg-[#eab308] text-slate-950'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{order.hasBuyerReviewed ? 'Reviewed' : 'Rate Seller'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Download Receipt Summary for offline"
                        >
                          <Download className="w-3 h-3 text-[#f3c84b]" />
                          <span className="hidden sm:inline">Slip</span>
                        </button>

                        <button
                          onClick={() => onViewOrderReceipt(order)}
                          className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/60 text-[#f3c84b] text-[11px] font-semibold cursor-pointer"
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
