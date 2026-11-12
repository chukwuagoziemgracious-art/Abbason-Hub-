import React, { useRef } from 'react';
import { 
  Laptop, 
  Shirt, 
  ShoppingBasket, 
  Sparkles, 
  BookOpen, 
  Bed, 
  Wrench, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import { store } from '../services/store';

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = store.getCategories();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const getIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-4 h-4 transition-colors duration-300 ${
      isSelected ? 'text-[#C8A96A]' : 'text-white/80 group-hover:text-[#C8A96A]'
    }`;

    switch (iconName) {
      case 'Laptop':
        return <Laptop className={iconClass} />;
      case 'Shirt':
        return <Shirt className={iconClass} />;
      case 'ShoppingBasket':
        return <ShoppingBasket className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Bed':
        return <Bed className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      case 'Briefcase':
      default:
        return <Briefcase className={iconClass} />;
    }
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Section Header with Book Navigation */}
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <span className="text-[10px] font-medium tracking-[0.25em] text-[#C8A96A] uppercase block mb-1">
            BROWSE BY CATEGORY
          </span>
          <h2 className="text-2xl sm:text-3xl font-light text-[#E9E6DF] font-serif">
            Popular Departments
          </h2>
        </div>

        {/* Carousel Prev / Next Controls */}
        <div className="flex items-center gap-2">
          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="text-[11px] text-[#C8A96A] hover:text-[#e0c482] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/30 transition-all cursor-pointer mr-2"
            >
              Show All
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            aria-label="Previous departments"
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-[#C8A96A]/20 border border-white/[0.1] hover:border-[#C8A96A]/50 flex items-center justify-center text-[#E9E6DF] hover:text-[#C8A96A] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next departments"
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-[#C8A96A]/20 border border-white/[0.1] hover:border-[#C8A96A]/50 flex items-center justify-center text-[#E9E6DF] hover:text-[#C8A96A] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Album / Photo Book Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.slug)}
              className={`group relative shrink-0 w-36 sm:w-52 h-48 sm:h-72 rounded-xl sm:rounded-3xl overflow-hidden snap-start text-left cursor-pointer transition-all duration-300 active:scale-[0.98] ${
                isSelected
                  ? 'border-2 border-[#C8A96A] shadow-[0_12px_36px_rgba(200,169,106,0.35)] ring-2 ring-[#C8A96A]/40'
                  : 'border border-white/[0.12] hover:border-[#C8A96A]/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              {/* Category Background Photo */}
              <div className="absolute inset-0 bg-[#0B1120]">
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>

              {/* Luxury Vignette & Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/15 group-hover:from-black/90 transition-colors" />

              {/* Book Spine Sheen on Left Edge */}
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />

              {/* Top Row: Icon Badge & Plate Number */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                <div
                  className={`p-2 rounded-xl backdrop-blur-md transition-colors duration-300 ${
                    isSelected
                      ? 'bg-[#C8A96A]/25 border border-[#C8A96A]'
                      : 'bg-black/50 border border-white/15 group-hover:border-[#C8A96A]/40'
                  }`}
                >
                  {getIcon(cat.icon, isSelected)}
                </div>

                <span className="text-[10px] font-mono tracking-widest text-white/50 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Bottom Card Content: Title, Subtitle & Active State Indicator */}
              <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 z-10 flex flex-col justify-end">
                {isSelected && (
                  <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] font-medium text-[#C8A96A] mb-1">
                    <Sparkle className="w-2.5 h-2.5 fill-[#C8A96A]" /> Active Department
                  </div>
                )}
                <h3 className="font-serif text-[#E9E6DF] text-base sm:text-lg font-normal tracking-wide leading-snug group-hover:text-[#C8A96A] transition-colors duration-300">
                  {cat.name}
                </h3>
                <p className="text-[#8C9399] text-[11px] sm:text-xs mt-1 leading-snug line-clamp-1 font-light group-hover:text-white/80 transition-colors">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
