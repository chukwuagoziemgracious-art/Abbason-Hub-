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
      className="group rounded-2xl bg-[#121a2c]/90 hover:bg-[#162138] border border-purple-950/70 hover:border-purple-800/80 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer active:scale-[0.99] shadow-md hover:shadow-xl"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Condition tag */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-[10px] font-semibold text-slate-200">
          {getConditionLabel(product.condition)}
        </div>

        {/* Campus indicator tag */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-950/90 backdrop-blur-md border border-purple-700/50 text-[10px] font-bold text-[#f3c84b] flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          <span>{product.campusName.split('(')[1] ? product.campusName.split('(')[1].replace(')', '') : product.campusName.slice(0, 10)}</span>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={(e) => onAddToCart(e, product)}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 flex items-center justify-center shadow-lg transition-transform active:scale-90"
          title="Add to basket"
          aria-label="Add to basket"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Category & Pickup landmark */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold text-purple-300/90 text-[10px]">
              {product.category}
            </span>
            <span className="truncate max-w-[120px] text-slate-400 text-[10px]">
              {product.pickupLandmark.split(',')[0]}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-purple-200 transition-colors">
            {product.title}
          </h3>
        </div>

        <div className="mt-3 pt-2.5 border-t border-purple-950/60">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <span className="text-base sm:text-lg font-bold text-[#f3c84b] tabular-nums">
              {formatNaira(product.price)}
            </span>
          </div>

          {/* Seller, Verification & Rating */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <div className="flex items-center gap-1.5 truncate max-w-[140px]">
              <span className="truncate text-slate-300 font-medium">{product.sellerName}</span>
              {product.sellerVerified && (
                <span title="Verified Campus Seller">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </span>
              )}
            </div>

            {/* Seller Star Rating Badge */}
            <div className="flex items-center gap-1 text-[11px] text-[#f3c84b] font-semibold shrink-0">
              <Star className="w-3 h-3 fill-[#f3c84b]" />
              <span>{ratingValue}</span>
              <span className="text-slate-500 text-[10px]">({reviewsCount})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
