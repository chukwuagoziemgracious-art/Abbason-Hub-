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
    currentUser?.hostel ? `${currentUser.hostel}, Room 12` : (activeCampus.safeMeetupPoints[0] || 'Campus Student Hostel Block')
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-md h-full bg-[#020406]/95 backdrop-blur-[24px] border-l border-white/[0.12] shadow-[0_0_80px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-light text-[#E9E6DF] font-serif">
                Your basket
              </h2>
              <p className="text-[10px] text-[#8C9399] tracking-wider uppercase font-light">
                {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-[#8C9399] hover:text-[#E9E6DF] flex items-center justify-center border border-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Items or Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center mx-auto text-[#C8A96A]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white font-serif">
                  Your basket is ready
                </h3>
                <p className="text-xs text-[#8C9399] mt-1 max-w-xs mx-auto font-light">
                  Add a few campus finds to get started.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/40 text-xs font-medium text-[#C8A96A] transition-colors cursor-pointer"
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
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex gap-3 items-center"
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
                      <div className="text-[11px] text-[#8C9399] mt-0.5 font-light">
                        Seller: {item.product.sellerName}
                      </div>
                      <div className="text-sm font-medium text-[#C8A96A] mt-1 tabular-nums font-serif">
                        {formatNaira(item.product.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 bg-[#0B1120] rounded-xl p-1 border border-white/[0.08]">
                        <button
                          onClick={() => store.updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => store.updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => store.removeFromCart(item.product.id)}
                        className="text-[#8C9399] hover:text-rose-400 text-[10px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Option Selector */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>Choose Delivery Method</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('seller_delivers')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      fulfillmentType === 'seller_delivers'
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-white'
                        : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-medium flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                      <span>Hostel Delivery</span>
                    </div>
                    <div className="text-[10px] text-[#8C9399] mt-1 font-light">
                      +{formatNaira(deliveryFee)} fee
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType('buyer_pickup')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      fulfillmentType === 'buyer_pickup'
                        ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-white'
                        : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" />
                      <span>Campus Pickup</span>
                    </div>
                    <div className="text-[10px] text-[#8C9399] mt-1 font-light">
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
                    className="w-full bg-[#0B1120] border border-[#C8A96A]/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
              </div>

              {/* Inspect on Delivery Guarantee Card */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-snug">
                  <strong className="text-[#C8A96A]">Inspect on Delivery:</strong> Pay only the delivery transport fee now. Inspect your package thoroughly at your hostel before paying the seller in the app.
                </div>
              </div>
            </>
          )}

          {/* Banner matching bottom */}
          <div className="p-4 rounded-2xl bg-[#0B1120] border border-white/[0.08] text-xs space-y-1.5">
            <h4 className="font-medium text-[#E9E6DF] text-xs">
              Buy from your campus community
            </h4>
            <p className="text-[11px] text-[#8C9399] leading-relaxed font-light">
              Prices are set by verified student sellers. Pay effortlessly upon delivery via Paystack.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenSellerDashboard();
              }}
              className="text-[#C8A96A] hover:underline font-medium text-xs flex items-center gap-1 pt-1 cursor-pointer"
            >
              <span>Have something to sell?</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Drawer Footer with Itemized Calculations */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-white/[0.02] space-y-3.5">
          {/* Price breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#8C9399] font-light">
              <span>Basket subtotal</span>
              <span className="text-[#E9E6DF] tabular-nums font-mono">{formatNaira(subtotal)}</span>
            </div>

            {deliveryFee > 0 && (
              <div className="flex justify-between text-[#8C9399] font-light">
                <span>Delivery fee</span>
                <span className="text-[#E9E6DF] tabular-nums font-mono">{formatNaira(deliveryFee)}</span>
              </div>
            )}

            {cart.length > 0 && (
              <div className="flex justify-between text-[#8C9399] font-light">
                <span className="flex items-center gap-1.5">
                  <span>Payment processing fee</span>
                  <span className="text-[10px] text-[#C8A96A] font-light">(Gateway fee)</span>
                </span>
                <span className="text-[#E9E6DF] tabular-nums font-mono">{formatNaira(gatewayFee)}</span>
              </div>
            )}

            <div className="border-t border-white/[0.08] pt-2.5 flex justify-between items-baseline">
              <span className="text-sm font-normal text-[#E9E6DF] font-serif">Basket total</span>
              <span className="text-xl font-normal text-[#C8A96A] tabular-nums font-serif tracking-wide">
                {formatNaira(totalAmount)}
              </span>
            </div>

            {cart.length > 0 && (
              <div className="text-[10px] text-[#8C9399] italic font-light">
                * Platform commission (3%, max ₦2,000) is deducted from seller earnings upon delivery confirmation.
              </div>
            )}
          </div>

          {/* Action CTA */}
          {cart.length > 0 ? (
            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 px-4 rounded-xl bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] font-semibold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 shadow-xl cursor-pointer"
            >
              <span>Proceed to Secure Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-white/[0.04] text-[#8C9399] text-xs font-light uppercase tracking-wider cursor-not-allowed"
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
