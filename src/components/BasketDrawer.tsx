import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';
import { store } from '../services/store';
import { formatNaira, calculatePlatformCommission, calculateGatewayFee } from '../utils/currency';

interface BasketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: (deliveryConfig: {
    fulfillmentType: 'seller_delivers' | 'buyer_pickup';
    deliveryInstructions: string;
  }) => void;
  onOpenSellerDashboard: () => void;
}

export const BasketDrawer: React.FC<BasketDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  onOpenSellerDashboard,
}) => {
  const cart = store.getCart();
  const currentUser = store.getCurrentUser();
  const activeCampus = store.getActiveCampus();

  const [fulfillmentType, setFulfillmentType] = useState<'seller_delivers' | 'buyer_pickup'>('seller_delivers');
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    currentUser.hostel ? `${currentUser.hostel}, Room 12` : (activeCampus.safeMeetupPoints[0] || 'Campus Student Hostel Block')
  );

  if (!isOpen) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Subtotal P
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Highest delivery fee among items if seller delivers
  const firstItem = cart[0];
  const deliveryFee = fulfillmentType === 'seller_delivers' && firstItem ? firstItem.product.deliveryFee : 0;

  // Transparent payment processing fee G (Paid by buyer, e.g. 1.5% + 100)
  const gatewayFee = calculateGatewayFee(subtotal + deliveryFee);

  // Platform Commission C = min(P * 0.03, 2000)
  const platformCommission = calculatePlatformCommission(subtotal);

  // Buyer Total Paid T = P + D + G
  const totalAmount = subtotal + deliveryFee + gatewayFee;

  const handleCheckoutClick = () => {
    onProceedToCheckout({
      fulfillmentType,
      deliveryInstructions: deliveryInstructions.trim() || 'Campus delivery'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <div 
        className="w-full max-w-md h-full bg-[#0F172A] border-l border-purple-900/60 shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 flex items-center justify-between bg-[#131b2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-[#f3c84b]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-serif">
                Your basket
              </h2>
              <p className="text-[11px] text-slate-400">
                {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
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

        {/* Scrollable Items or Empty State matching screenshot */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            /* Empty State matching Screenshot_20261013-145918.png */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-900/60 flex items-center justify-center mx-auto text-purple-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white font-serif">
                  Your basket is ready
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Add a few campus finds to get started.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/60 text-xs font-medium text-[#f3c84b]"
                >
                  Explore campus catalog
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl bg-[#121a2c] border border-purple-950/80 flex gap-3 items-center"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-900"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-white truncate">
                        {item.product.title}
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Seller: {item.product.sellerName}
                      </div>
                      <div className="text-sm font-bold text-[#f3c84b] mt-1 tabular-nums">
                        {formatNaira(item.product.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button
                          onClick={() => store.updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => store.updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => store.removeFromCart(item.product.id)}
                        className="text-slate-500 hover:text-rose-400 text-[10px] flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Option Selector */}
              <div className="p-4 rounded-2xl bg-[#121a2c] border border-purple-950/80 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#f3c84b]" />
                  <span>Choose Delivery Method</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('seller_delivers')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      fulfillmentType === 'seller_delivers'
                        ? 'bg-purple-950/80 border-[#f3c84b] text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#f3c84b]" />
                      <span>Hostel Delivery</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      +{formatNaira(deliveryFee)} fee
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType('buyer_pickup')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      fulfillmentType === 'buyer_pickup'
                        ? 'bg-purple-950/80 border-[#f3c84b] text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#f3c84b]" />
                      <span>Campus Pickup</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Free at landmark
                    </div>
                  </button>
                </div>

                {/* Delivery location address */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    {fulfillmentType === 'seller_delivers'
                      ? 'Your Hostel / Room Delivery Address'
                      : 'Preferred Campus Pickup Point'}
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Diamond Valley Hostel, Room 14, Ifite"
                    className="w-full bg-[#0B1120] border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c84b]"
                  />
                </div>
              </div>

              {/* Protected Delivery Code Guarantee Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-800/50 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#f3c84b] shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-snug">
                  <strong>Protected Handshake:</strong> Upon payment, you receive a secret 6-digit delivery confirmation code. Only share it after in-person inspection!
                </div>
              </div>
            </>
          )}

          {/* Banner matching bottom of Screenshot_20261013-145918.png */}
          <div className="p-4 rounded-2xl bg-[#131b2e] border border-purple-950 text-xs space-y-1.5">
            <h4 className="font-bold text-white text-xs">
              Buy from your campus community
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Prices are set by each verified seller. Payments are securely protected by Payluk Escrow until verified OTP delivery.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenSellerDashboard();
              }}
              className="text-[#f3c84b] hover:underline font-semibold text-xs flex items-center gap-1 pt-1"
            >
              <span>Have something to sell?</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Drawer Footer with Itemized Calculations */}
        <div className="p-4 sm:p-5 border-t border-purple-950 bg-[#131b2e] space-y-3">
          {/* Price breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Basket subtotal</span>
              <span className="text-slate-200 tabular-nums">{formatNaira(subtotal)}</span>
            </div>

            {deliveryFee > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Delivery fee</span>
                <span className="text-slate-200 tabular-nums">{formatNaira(deliveryFee)}</span>
              </div>
            )}

            {cart.length > 0 && (
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Payment processing fee</span>
                  <span className="text-[10px] text-purple-300">(Gateway fee)</span>
                </span>
                <span className="text-slate-200 tabular-nums">{formatNaira(gatewayFee)}</span>
              </div>
            )}

            <div className="border-t border-purple-950/80 pt-2 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Basket total</span>
              <span className="text-xl font-extrabold text-[#f3c84b] tabular-nums">
                {formatNaira(totalAmount)}
              </span>
            </div>

            {cart.length > 0 && (
              <div className="text-[10px] text-slate-400 italic">
                * Platform commission (3%, max ₦2,000) is deducted from seller earnings upon delivery confirmation.
              </div>
            )}
          </div>

          {/* Action CTA */}
          {cart.length > 0 ? (
            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-4 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg shadow-[#f3c84b]/20 cursor-pointer"
            >
              <span>Proceed to Secure Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed"
              disabled
            >
              Add something to begin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
