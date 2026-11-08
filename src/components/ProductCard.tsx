import React from 'react';
import { ShieldCheck, MapPin, Truck, Plus, Star } from 'lucide-react';
import { Product } from '../types';
import { formatNaira } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'Brand New';
      case 'used_like_new':
        return 'Like New';
      case 'used_good':
      default:
        return 'Pre-loved';
    }
  };

  const getDeliveryTag = (option: string) => {
    switch (option) {
      case 'seller_delivers':
        return { label: 'Hostel Delivery', icon: Truck };
      case 'buyer_pickup':
        return { label: 'Campus Pickup', icon: MapPin };
      case 'both':
      default:
        return { label: 'Deliver / Pickup', icon: Truck };
    }
  };

  const deliveryInfo = getDeliveryTag(product.deliveryOption);
  const DeliveryIcon = deliveryInfo.icon;
  const ratingValue = product.sellerRating || 4.9;
  const reviewsCount = product.sellerReviewCount || 24;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] backdrop-blur-[18px] border border-white/[0.08] hover:border-[#C8A96A]/50 transition-all duration-500 overflow-hidden flex flex-col cursor-pointer active:scale-[0.99] shadow-[0_30px_80px_rgba(0,0,0,0.6)] hover:shadow-[0_40px_90px_rgba(0,0,0,0.8)]"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-[#06090e] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          loading="lazy"
          decoding="async"
        />

        {/* Soft luxury vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020406]/70 via-transparent to-[#020406]/30 pointer-events-none" />

        {/* Condition tag */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#020406]/85 backdrop-blur-md border border-white/[0.1] text-[9px] font-medium tracking-wider uppercase text-[#E9E6DF]">
          {getConditionLabel(product.condition)}
        </div>

        {/* Campus indicator tag */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#020406]/85 backdrop-blur-md border border-[#C8A96A]/40 text-[9px] font-medium text-[#C8A96A] flex items-center gap-1 uppercase tracking-wider">
          <MapPin className="w-2.5 h-2.5 text-[#C8A96A]" />
          <span>{product.campusName.split('(')[1] ? product.campusName.split('(')[1].replace(')', '') : product.campusName.slice(0, 10)}</span>
        </div>

        {/* Quick Add Button - 1px Gold Outline */}
        <button
          onClick={(e) => onAddToCart(e, product)}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl border border-[#C8A96A] bg-[#020406]/85 hover:bg-[#C8A96A] text-[#C8A96A] hover:text-[#020406] flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 cursor-pointer"
          title="Add to basket"
          aria-label="Add to basket"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-grow justify-between bg-white/[0.01]">
        <div>
          {/* Category & Pickup landmark */}
          <div className="flex items-center justify-between text-[11px] text-[#8C9399] mb-1.5">
            <span className="uppercase tracking-[0.25em] font-medium text-[#C8A96A] text-[9px]">
              {product.category}
            </span>
            <span className="truncate max-w-[120px] text-[#8C9399] text-[10px] font-light">
              {product.pickupLandmark.split(',')[0]}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-light text-[#E9E6DF] line-clamp-2 leading-snug group-hover:text-white transition-colors duration-300 font-sans">
            {product.title}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.08]">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-normal text-[#C8A96A] tabular-nums font-serif tracking-wide">
              {formatNaira(product.price)}
            </span>
          </div>

          {/* Seller, Verification & Rating */}
          <div className="flex items-center justify-between text-[11px] text-[#8C9399] mt-2 font-light">
            <div className="flex items-center gap-1.5 truncate max-w-[140px]">
              <span className="truncate text-[#E9E6DF]/80 font-light">{product.sellerName}</span>
              {product.sellerVerified && (
                <span title="Verified Campus Seller">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
            </div>

            {/* Seller Star Rating Badge */}
            <div className="flex items-center gap-1 text-[11px] text-[#C8A96A] font-medium shrink-0">
              <Star className="w-3 h-3 fill-[#C8A96A]" />
              <span>{ratingValue}</span>
              <span className="text-[#8C9399] text-[10px]">({reviewsCount})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
