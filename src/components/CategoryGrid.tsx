import React from 'react';
import { 
  Laptop, 
  Shirt, 
  ShoppingBasket, 
  Sparkles, 
  BookOpen, 
  Bed, 
  Wrench, 
  Briefcase 
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

  const getIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-6 h-6 transition-colors ${
      isSelected ? 'text-[#f3c84b]' : 'text-purple-300'
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
    <section className="max-w-7xl mx-auto px-4 py-6">
      {/* Section Header */}
      <div className="mb-4">
        <span className="text-[11px] font-bold tracking-widest text-[#f3c84b] uppercase">
          BROWSE BY CATEGORY
        </span>
        <h2 className="text-2xl sm:text-3xl font-normal text-white font-serif mt-1">
          Popular Departments
        </h2>
      </div>

      {/* 2-column mobile, 4-column desktop grid matching screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.slug)}
              className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-950/90 to-slate-900 border-[#f3c84b] shadow-lg shadow-purple-950/40 ring-1 ring-[#f3c84b]/50'
                  : 'bg-[#121a2c]/80 hover:bg-[#18233c] border-purple-950/80 hover:border-purple-800/60'
              }`}
            >
              <div className="mb-3 p-2 w-fit rounded-xl bg-purple-950/60 border border-purple-800/40">
                {getIcon(cat.icon, isSelected)}
              </div>
              <div className="font-semibold text-white text-sm sm:text-base leading-tight">
                {cat.name}
              </div>
              <p className="text-slate-400 text-xs mt-1 leading-snug line-clamp-1">
                {cat.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
