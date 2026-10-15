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
    <section id="campus-catalog" className="max-w-7xl mx-auto px-4 py-6">
      {/* Section Title */}
      <div className="mb-4">
        <span className="text-[11px] font-bold tracking-widest text-[#f3c84b] uppercase">
          FEATURED INVENTORY
        </span>
        <h2 className="text-2xl sm:text-3xl font-normal text-white font-serif mt-1">
          Verified Listings
        </h2>
      </div>

      {/* Refine Search Container matching screenshot */}
      <div className="rounded-2xl bg-[#121a2c]/80 border border-purple-950/70 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#f3c84b]" />
            <span>Refine your search</span>
          </div>

          {(selectedCategory !== 'all' || selectedCondition !== 'all' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-[#f3c84b] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full bg-[#0B1120] border border-purple-900/60 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#f3c84b]"
            >
              <option value="all">All category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* University Dropdown */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              University
            </label>
            <select
              value={selectedCampusId}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="w-full bg-[#0B1120] border border-purple-900/60 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#f3c84b]"
            >
              <option value="all">All universities</option>
              {campuses.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Dropdown */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-[#0B1120] border border-purple-900/60 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#f3c84b]"
            >
              <option value="all">All conditions</option>
              <option value="new">Brand New</option>
              <option value="used_like_new">Like New</option>
              <option value="used_good">Pre-loved (Good)</option>
            </select>
          </div>

          {/* Fulfillment Dropdown */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Delivery
            </label>
            <select
              value={selectedFulfillment}
              onChange={(e) => setSelectedFulfillment(e.target.value)}
              className="w-full bg-[#0B1120] border border-purple-900/60 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#f3c84b]"
            >
              <option value="all">All delivery options</option>
              <option value="seller_delivers">Seller Delivers</option>
              <option value="buyer_pickup">Campus Pickup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count matching screenshot */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
        <span>{filteredProducts.length} find{filteredProducts.length === 1 ? '' : 's'} to explore</span>
        {selectedCategory !== 'all' && (
          <span className="text-purple-300">
            Filtered by: <strong className="text-white capitalize">{selectedCategory}</strong>
          </span>
        )}
      </div>

      {/* Product Grid or Empty State matching screenshot */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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
        /* Empty State exactly matching Screenshot_20261013-145911.png */
        <div className="rounded-3xl bg-[#121a2c]/60 border border-purple-950/70 p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-full bg-slate-900 border border-purple-900/50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-normal text-white font-serif mb-2">
            The shelves are getting ready.
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto mb-5 leading-relaxed">
            New local products and services will show up here once they are approved by campus moderators.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/60 border border-purple-700/50 text-xs text-[#f3c84b] font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
};
