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
  MessageSquare
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#0F172A] border border-purple-900/60 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700/60 transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Image Gallery */}
          <div className="space-y-2">
            <div className="aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl bg-slate-900 overflow-hidden border border-purple-950/80">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail selector if multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-[#f3c84b] scale-105'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-950 border border-purple-800/60 text-[11px] font-semibold text-[#f3c84b] uppercase tracking-wider">
                {product.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-[11px] font-medium text-slate-300 capitalize">
                Condition: {product.condition.replace(/_/g, ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-900/40 text-[11px] font-medium text-purple-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#f3c84b]" />
                {product.campusName}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif leading-tight">
              {product.title}
            </h2>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#f3c84b] tabular-nums">
                {formatNaira(product.price)}
              </span>
              <span className="text-xs text-slate-400">Fixed campus price in Naira</span>
            </div>
          </div>

          {/* Seller Profile & Rating Header Card */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-amber-600 flex items-center justify-center text-base font-bold text-white shadow-md">
                  {product.sellerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
                    <span>{product.sellerName}</span>
                    {product.sellerVerified && (
                      <span title="Verified Campus Seller" className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {/* Rating Stars & Count */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-[#f3c84b] font-bold">
                      <Star className="w-3.5 h-3.5 fill-[#f3c84b]" />
                      <span>{ratingSummary.average}</span>
                    </div>
                    <span className="text-slate-500 text-xs">·</span>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs text-purple-300 hover:text-[#f3c84b] underline underline-offset-2 cursor-pointer font-medium"
                    >
                      {ratingSummary.count} verified student review{ratingSummary.count !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Campus Contact</span>
                <span className="text-slate-200 font-mono font-medium">{product.sellerPhone}</span>
              </div>
            </div>
          </div>

          {/* Tab Selector: Item Details vs Seller Reviews */}
          <div className="flex border-b border-purple-950 bg-[#0B1120] rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-purple-900/60 text-[#f3c84b]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Item Description & Delivery
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-purple-900/60 text-[#f3c84b]'
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
              <div className="rounded-2xl bg-[#131b2e] border border-purple-950 p-4 space-y-2.5 text-xs">
                <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#f3c84b]" />
                  <span>Fulfillment & Meeting on Campus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="font-medium text-white flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hostel Delivery</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {product.deliveryOption !== 'buyer_pickup' ? (
                        <span>Available ({formatNaira(product.deliveryFee)} delivery fee)</span>
                      ) : (
                        <span className="text-slate-500">Not offered for this item</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="font-medium text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Safe Campus Pickup</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {product.deliveryOption !== 'seller_delivers' ? (
                        <span className="truncate block">Free at: {product.pickupLandmark}</span>
                      ) : (
                        <span className="text-slate-500">Hostel delivery only</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Protected Handshake Escrow */}
              <div className="rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/60 border border-purple-800/60 p-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#f3c84b]/20 border border-[#f3c84b]/40 flex items-center justify-center shrink-0 text-[#f3c84b]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Protected Payluk Escrow</div>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Your payment is held safely in Payluk Escrow. When you meet the seller, inspect your item first. Only share your secret 6-digit confirmation code once you are completely satisfied.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                  Item Details & Description
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800/80">
                  {product.description}
                </p>
              </div>
            </div>
          ) : (
            /* SELLER REVIEWS TAB */
            <div className="space-y-3">
              {sellerReviews.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                  <p>No student reviews for this seller yet. Be the first to buy and leave feedback!</p>
                </div>
              ) : (
                sellerReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-purple-950/70 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-white text-[11px] font-bold">
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
        <div className="p-4 border-t border-purple-950 bg-[#0F172A] flex items-center gap-3">
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#f3c84b]" />
            <span>Add to Basket</span>
          </button>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
              onBuyNow(product);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-[#f3c84b]/20 cursor-pointer"
          >
            <span>Buy Now (Payluk Escrow)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
