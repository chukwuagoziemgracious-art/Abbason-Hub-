import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Building2, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  CheckCircle,
  Copy,
  Loader2
} from 'lucide-react';
import { store } from '../services/store';
import { formatNaira, calculateGatewayFee } from '../utils/currency';
import { Order } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryConfig: {
    fulfillmentType: 'seller_delivers' | 'buyer_pickup';
    deliveryInstructions: string;
  };
  onPaymentSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  deliveryConfig,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const cart = store.getCart();
  const currentUser = store.getCurrentUser();

  if (!isOpen || cart.length === 0) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryConfig.fulfillmentType === 'seller_delivers' ? (cart[0]?.product.deliveryFee || 0) : 0;
  const gatewayFee = calculateGatewayFee(subtotal + deliveryFee);
  const totalAmount = subtotal + deliveryFee + gatewayFee;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate network latency of payment processing
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const newOrder = await store.createOrder({
        fulfillmentType: deliveryConfig.fulfillmentType,
        deliveryInstructions: deliveryConfig.deliveryInstructions,
        paymentMethod
      });

      setIsProcessing(false);
      onPaymentSuccess(newOrder);
    } catch (err) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0248192034');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] border border-purple-900/60 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-[#f3c84b]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Abbason Secure Web Checkout
              </h3>
              <p className="text-[11px] text-slate-400">
                Official in-app campus payment gateway
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

        {/* Development & Payluk Escrow Notice Watermark */}
        <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-2.5 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong>PAYLUK ESCROW SIMULATION:</strong> This simulates payment processing via Payluk Escrow. Funds are safely held until you physically inspect your item and share your 6-digit delivery OTP.
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Order Summary & Fee Transparency */}
          <div className="p-3.5 rounded-2xl bg-[#121a2c] border border-purple-950 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Items subtotal ({cart.length} item{cart.length === 1 ? '' : 's'})</span>
              <span className="text-slate-200 tabular-nums">{formatNaira(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Campus delivery fee</span>
                <span className="text-slate-200 tabular-nums">{formatNaira(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span className="text-purple-300">Payment processing fee (Gateway)</span>
              <span className="text-slate-200 tabular-nums">{formatNaira(gatewayFee)}</span>
            </div>
            <div className="border-t border-purple-950/80 pt-1.5 flex justify-between items-baseline font-bold text-white">
              <span>Total to pay</span>
              <span className="text-lg text-[#f3c84b] tabular-nums font-extrabold">
                {formatNaira(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-purple-950/80 border-[#f3c84b] text-[#f3c84b]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="font-semibold text-[11px]">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-purple-950/80 border-[#f3c84b] text-[#f3c84b]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="font-semibold text-[11px]">Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ussd')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'ussd'
                    ? 'bg-purple-950/80 border-[#f3c84b] text-[#f3c84b]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="font-semibold text-[11px]">USSD</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Card Simulation */}
          {paymentMethod === 'card' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-950 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Card Number (Pre-filled Test Card)
                </label>
                <input
                  type="text"
                  readOnly
                  value="5399 •••• •••• 4242 (Mastercard)"
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Expiry
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="12/28"
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    readOnly
                    value="821"
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Bank Transfer Simulation */}
          {paymentMethod === 'bank_transfer' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-950 space-y-2.5 text-xs">
              <div className="text-slate-300 text-[11px]">
                Transfer exactly <strong className="text-[#f3c84b]">{formatNaira(totalAmount)}</strong> to the dynamic virtual account below:
              </div>

              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Bank Name</div>
                  <div className="text-sm font-bold text-white">Wema Bank / Payluk Escrow</div>
                  <div className="text-xs text-[#f3c84b] font-mono mt-0.5 font-bold">0248 1920 34</div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-950 border border-purple-800 text-[11px] text-purple-200 hover:text-[#f3c84b] flex items-center gap-1"
                >
                  {copiedAccount ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: USSD Simulation */}
          {paymentMethod === 'ussd' && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-950 space-y-2 text-xs">
              <div className="text-slate-300 text-[11px]">
                Dial this code on your registered bank phone:
              </div>
              <div className="p-3 rounded-xl bg-[#0B1120] border border-slate-800 font-mono text-center text-[#f3c84b] text-sm font-bold tracking-wider">
                *737*50*39170*0248#
              </div>
            </div>
          )}

          {/* Handshake OTP reminder banner */}
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-start gap-2.5 text-xs text-purple-200">
            <ShieldCheck className="w-4 h-4 text-[#f3c84b] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              Once payment confirms, your private <strong>6-digit delivery confirmation code</strong> will be generated. Do NOT reveal it until you meet the seller and inspect your items!
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-purple-950 bg-[#131b2e] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="flex-2 py-3 px-4 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-[#f3c84b]/20 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Simulating Payment & Generating Code...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay {formatNaira(totalAmount)} (Simulated)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
