import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  ShoppingBag, 
  Phone, 
  Star,
  CheckCircle2,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Product } from '../types';
import { formatNaira } from '../utils/currency';
import { store } from '../services/store';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  if (!product) return null;

  const sellerReviews = store.getSellerReviews(product.sellerId);
  const ratingSummary = store.getSellerRatingSummary(product.sellerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-[20px] overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#020406]/95 backdrop-blur-[24px] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#020406]/85 hover:bg-white/[0.08] text-[#8C9399] hover:text-[#E9E6DF] flex items-center justify-center border border-white/[0.1] transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl bg-[#06090e] overflow-hidden border border-white/[0.08] relative">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020406]/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Thumbnail selector if multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#C8A96A] scale-105'
                        : 'border-white/[0.1] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title, Category & Price */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-[#C8A96A]/40 text-[9px] font-medium text-[#C8A96A] uppercase tracking-[0.25em]">
                {product.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[9px] font-light text-[#8C9399] uppercase tracking-wider">
                Condition: {product.condition.replace(/_/g, ' ')}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[9px] font-light text-[#8C9399] flex items-center gap-1 uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-[#C8A96A]" />
                {product.campusName}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-[#E9E6DF] font-serif leading-tight">
              {product.title}
            </h2>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-normal text-[#C8A96A] tabular-nums font-serif tracking-wide">
                {formatNaira(product.price)}
              </span>
              <span className="text-xs text-[#8C9399] font-light">Fixed campus price in Naira</span>
            </div>
          </div>

          {/* Seller Profile & Rating Header Card */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.08] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#C8A96A] text-[#020406] flex items-center justify-center text-lg font-bold font-serif shadow-md">
                  {product.sellerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-normal text-[#E9E6DF] text-sm">
                    <span>{product.sellerName}</span>
                    {product.sellerVerified && (
                      <span title="Verified Campus Seller" className="inline-flex items-center gap-1 text-emerald-400 text-[9px] bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {/* Rating Stars & Count */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-[#C8A96A] font-medium">
                      <Star className="w-3.5 h-3.5 fill-[#C8A96A]" />
                      <span>{ratingSummary.average}</span>
                    </div>
                    <span className="text-white/[0.2] text-xs">·</span>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs text-[#8C9399] hover:text-[#C8A96A] underline underline-offset-4 cursor-pointer font-light transition-colors"
                    >
                      {ratingSummary.count} verified student review{ratingSummary.count !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-[#8C9399] block text-[9px] uppercase tracking-[0.2em] font-medium">Campus Location</span>
                <span className="text-[#E9E6DF] font-sans font-medium text-xs">{product.campusName}</span>
              </div>
            </div>
          </div>

          {/* Tab Selector: Item Details vs Seller Reviews */}
          <div className="flex border-b border-white/[0.08] bg-[#0B1120] rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#C8A96A]/20 text-[#C8A96A]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Item Description & Delivery
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#C8A96A]/20 text-[#C8A96A]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Seller Reviews ({sellerReviews.length})</span>
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Fulfillment Specifications */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-2.5 text-xs">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#C8A96A]" />
                  <span>Fulfillment & Meeting on Campus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div className="p-3 rounded-xl bg-[#0B1120] border border-white/[0.08]">
                    <div className="font-medium text-white flex items-center gap-1.5 text-xs">
                      <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Hostel Delivery</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {(!product.fulfillmentOptions || product.fulfillmentOptions.includes('delivery')) && product.deliveryOption !== 'buyer_pickup' ? (
                        <span>Available ({formatNaira(product.deliveryFee)} transport fee)</span>
                      ) : (
                        <span className="text-slate-500">Not available for this item</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0B1120] border border-white/[0.08]">
                    <div className="font-medium text-white flex items-center gap-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Campus Pickup</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                      {(product.fulfillmentOptions?.includes('pickup') || product.deliveryOption === 'buyer_pickup' || product.deliveryOption === 'both') ? (
                        <>
                          <div className="text-emerald-400 font-medium">Free collection</div>
                          <div className="text-slate-400">
                            {product.pickup?.locationKind === 'custom' ? (
                              <span className="italic text-slate-400">Exact location shown after you order</span>
                            ) : (
                              <span>At: {product.pickup?.locationLabel || product.pickupLandmark || 'Campus Safe Checkpoint'}</span>
                            )}
                          </div>
                          {product.pickup?.days && product.pickup.days.length > 0 && (
                            <div className="text-[10px] text-slate-400">
                              Days: {product.pickup.days.map((d: any) => {
                                if (typeof d === 'number') {
                                  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d] || String(d);
                                }
                                return String(d).slice(0, 3).toUpperCase();
                              }).join(', ')}
                              {product.pickup.timeSlot && product.pickup.timeSlot !== 'any' && ` · ${product.pickup.timeSlot} slot`}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500">Hostel delivery only</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery / Dispatch Schedule badge */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                  <span className="text-[11px]">
                    {product.deliverySchedule?.type === 'within_3_days' && 'Dispatches within 3 days'}
                    {(!product.deliverySchedule || product.deliverySchedule.type === 'within_7_days') && 'Dispatches within 7 days'}
                    {product.deliverySchedule?.type === 'specific_days' && product.deliverySchedule.specificDays && (
                      <span>Dispatches {product.deliverySchedule.specificDays.map((d: string) => d.slice(0, 3).toUpperCase()).join(', ')}</span>
                    )}
                    {product.deliverySchedule?.timeSlot && product.deliverySchedule.timeSlot !== 'any' && (
                      <span className="text-slate-400"> ({product.deliverySchedule.timeSlot} slot)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Inspect on Delivery Guarantee */}
              <div className="rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30 p-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center shrink-0 text-[#C8A96A]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#E9E6DF]">Inspect-on-Delivery Guarantee</div>
                    <p className="text-[#8C9399] text-[11px] mt-0.5 leading-relaxed font-light">
                      Pay only the small transport fee upfront to dispatch the seller. When the item arrives at your hostel, inspect it thoroughly in person before paying via Paystack.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-[#8C9399] mb-2">
                  Item Details & Description
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08]">
                  {product.description}
                </p>
              </div>
            </div>
          ) : (
            /* SELLER REVIEWS TAB */
            <div className="space-y-3">
              {sellerReviews.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-white/[0.03] rounded-2xl border border-white/[0.08]">
                  <p>No student reviews for this seller yet. Be the first to buy and leave feedback!</p>
                </div>
              ) : (
                sellerReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] text-[11px] font-bold">
                          {rev.buyerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{rev.buyerName}</span>
                            {rev.verifiedPurchase && (
                              <span className="text-[9px] bg-emerald-950/70 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{rev.campusName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-[#f3c84b]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? 'fill-[#f3c84b] text-[#f3c84b]'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed bg-[#0B1120]/60 p-2.5 rounded-xl border border-slate-800/60">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#020406]/95 backdrop-blur-md flex items-center gap-3">
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-[#C8A96A] text-[#C8A96A] hover:bg-[#C8A96A] hover:text-[#020406] font-medium text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Basket</span>
          </button>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
              onBuyNow(product);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] font-semibold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 shadow-xl cursor-pointer"
          >
            <span>Buy Now (Inspect on Delivery)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
