import React, { useState } from 'react';
import { SlidersHorizontal, Search, RotateCcw, PackageSearch } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { store } from '../services/store';

interface ProductFeedProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedCampusId: string;
  onSelectCampus: (campusId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}

export const ProductFeed: React.FC<ProductFeedProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  selectedCampusId,
  onSelectCampus,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onAddToCart
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedFulfillment, setSelectedFulfillment] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const campuses = store.getCampuses();
  const categories = store.getCategories();

  // Filter products based on selected parameters
  const filteredProducts = products.filter((p) => {
    // Category
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    // Campus
    if (selectedCampusId !== 'all' && p.campusId !== selectedCampusId) return false;
    // Condition
    if (selectedCondition !== 'all' && p.condition !== selectedCondition) return false;
    // Fulfillment
    if (selectedFulfillment !== 'all') {
      if (selectedFulfillment === 'seller_delivers' && p.deliveryOption === 'buyer_pickup') return false;
      if (selectedFulfillment === 'buyer_pickup' && p.deliveryOption === 'seller_delivers') return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    onSelectCategory('all');
    setSelectedCondition('all');
    setSelectedFulfillment('all');
    onSearchChange('');
  };

  return (
    <section id="campus-catalog" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-16">
      {/* Section Title */}
      <div className="mb-6 sm:mb-8">
        <span className="text-[10px] font-medium tracking-[0.25em] text-[#C8A96A] uppercase block mb-1">
          FEATURED INVENTORY
        </span>
        <h2 className="text-3xl sm:text-4xl font-light text-[#E9E6DF] font-serif">
          Verified Listings
        </h2>
      </div>

      {/* Refine Search Container - Luxury Glass */}
      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-[18px] border border-white/[0.08] p-5 sm:p-6 mb-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#E9E6DF] uppercase tracking-[0.2em]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C8A96A]" />
            <span>Refine your search</span>
          </div>

          {(selectedCategory !== 'all' || selectedCondition !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] uppercase tracking-wider text-[#8C9399] hover:text-[#C8A96A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[9px] uppercase font-medium text-[#8C9399] tracking-[0.25em] mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full bg-[#020406]/90 border border-white/[0.1] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-[#E9E6DF] focus:outline-none transition-colors font-light text-xs"
            >
              <option value="all">All category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug} className="bg-[#020406] text-[#E9E6DF]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* University Dropdown */}
          <div>
            <label className="block text-[9px] uppercase font-medium text-[#8C9399] tracking-[0.25em] mb-1.5">
              University
            </label>
            <select
              value={selectedCampusId}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="w-full bg-[#020406]/90 border border-white/[0.1] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-[#E9E6DF] focus:outline-none transition-colors font-light text-xs"
            >
              <option value="all">All universities</option>
              {campuses.map((camp) => (
                <option key={camp.id} value={camp.id} className="bg-[#020406] text-[#E9E6DF]">
                  {camp.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Dropdown */}
          <div>
            <label className="block text-[9px] uppercase font-medium text-[#8C9399] tracking-[0.25em] mb-1.5">
              Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-[#020406]/90 border border-white/[0.1] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-[#E9E6DF] focus:outline-none transition-colors font-light text-xs"
            >
              <option value="all">All conditions</option>
              <option value="new">Brand New</option>
              <option value="used_like_new">Like New</option>
              <option value="used_good">Pre-loved (Good)</option>
            </select>
          </div>

          {/* Fulfillment Dropdown */}
          <div>
            <label className="block text-[9px] uppercase font-medium text-[#8C9399] tracking-[0.25em] mb-1.5">
              Delivery
            </label>
            <select
              value={selectedFulfillment}
              onChange={(e) => setSelectedFulfillment(e.target.value)}
              className="w-full bg-[#020406]/90 border border-white/[0.1] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-[#E9E6DF] focus:outline-none transition-colors font-light text-xs"
            >
              <option value="all">All delivery options</option>
              <option value="seller_delivers">Seller Delivers</option>
              <option value="buyer_pickup">Campus Pickup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#8C9399] mb-5 font-light tracking-wide">
        <span>{filteredProducts.length} find{filteredProducts.length === 1 ? '' : 's'} to explore</span>
        {selectedCategory !== 'all' && (
          <span className="text-[#8C9399]">
            Filtered by: <strong className="text-[#E9E6DF] capitalize font-medium">{selectedCategory}</strong>
          </span>
        )}
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl bg-white/[0.03] backdrop-blur-[18px] border border-white/[0.08] p-8 sm:p-14 text-center max-w-lg mx-auto my-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-[#8C9399]">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-light text-[#E9E6DF] font-serif mb-2">
            The shelves are getting ready.
          </h3>
          <p className="text-[#8C9399] text-xs sm:text-sm max-w-xs mx-auto mb-6 leading-relaxed font-light">
            New local products and services will show up here once they are approved by campus moderators.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl border border-[#C8A96A] text-[#C8A96A] hover:bg-[#C8A96A] hover:text-[#020406] text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
};
