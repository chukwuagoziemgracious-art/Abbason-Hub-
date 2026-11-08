import React from 'react';
import { Search, ArrowDown, Shield, CheckCircle2, Lock } from 'lucide-react';
import { store } from '../services/store';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onScrollToCatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onScrollToCatalog
}) => {
  const activeCampus = store.getActiveCampus();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScrollToCatalog();
  };

  const isAllCampuses = activeCampus.id === 'all';

  return (
    <div className="relative overflow-hidden px-4 pt-10 pb-12 sm:pt-16 sm:pb-20 max-w-[1200px] mx-auto">
      {/* Decorative concentric arcs and ambient background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden">
        <div className="w-[640px] h-[640px] rounded-full border border-white/[0.04] absolute -top-40 scale-125" />
        <div className="w-[500px] h-[500px] rounded-full border border-[#C8A96A]/10 absolute -top-24" />
        <div className="w-[360px] h-[360px] rounded-full border border-[#C8A96A]/15 absolute -top-12" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Hero Card Container - Luxury Glass */}
        <div className="relative rounded-3xl bg-white/[0.03] backdrop-blur-[18px] border border-white/[0.08] p-6 sm:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-luxury-rise">
          {/* Subtle concentric arc on card top-right */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/[0.05] pointer-events-none" />
          <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full border border-[#C8A96A]/15 pointer-events-none" />

          {/* Clean, Non-repetitive Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.02] border border-[#C8A96A]/40 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] shadow-[0_0_8px_#C8A96A]" />
            <span className="text-[10px] font-medium tracking-[0.25em] text-[#C8A96A] uppercase">
              {isAllCampuses ? 'Verified Student Exchange' : `Verified Marketplace · ${activeCampus.shortName}`}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-light tracking-[0.02em] text-[#E9E6DF] font-serif leading-[1.1] mb-5">
            Everything you <br className="hidden sm:inline" />
            imagined.
          </h1>

          {/* Clean, Non-repetitive Subtitle */}
          <p className="text-[#8C9399] text-sm sm:text-base leading-relaxed max-w-xl mb-8 font-light">
            Buy and sell laptops, textbooks, fashion, and hostel essentials with complete confidence. Inspect your items in person before paying seamlessly via{' '}
            <span className="text-[#C8A96A] font-medium">Paystack</span>.
          </p>

          {/* Search Input Box */}
          <form onSubmit={handleSearchSubmit} className="relative mb-6">
            <div className="relative flex items-center bg-[#020406]/75 backdrop-blur-md border border-white/[0.12] focus-within:border-[#C8A96A] rounded-2xl shadow-2xl p-1.5 transition-all duration-300">
              <Search className="w-5 h-5 text-[#8C9399] ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="What do you need today? (laptop, fan, shoes, books...)"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-[#E9E6DF] placeholder-[#8C9399]/70 focus:outline-none font-light"
              />
              <button
                type="submit"
                className="w-11 h-11 rounded-xl bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] flex items-center justify-center shrink-0 shadow-md transition-all duration-300 active:scale-95 cursor-pointer"
                title="Search campus finds"
              >
                <ArrowDown className="w-5 h-5 text-[#020406]" />
              </button>
            </div>
          </form>

          {/* Trust Value Props */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-[#8C9399] font-light">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
              <span className="font-light text-[#E9E6DF]">Fixed prices in Naira (₦)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspect First, Pay on Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#C8A96A]" />
              <span className="text-[#C8A96A] font-medium">Paystack Verified Settlement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
