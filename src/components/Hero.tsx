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
    <div className="relative overflow-hidden px-4 pt-4 pb-8 sm:pt-6 sm:pb-12">
      {/* Decorative concentric arcs and ambient background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[600px] rounded-full border border-purple-800/15 absolute -top-40 scale-125" />
        <div className="w-[480px] h-[480px] rounded-full border border-purple-700/20 absolute -top-24" />
        <div className="w-[360px] h-[360px] rounded-full border border-[#f3c84b]/15 absolute -top-12" />
        <div className="w-96 h-96 bg-purple-900/25 rounded-full blur-3xl absolute -top-20" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Hero Card Container */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#131b2e] via-[#0F172A] to-[#0B1120] border border-purple-900/50 p-6 sm:p-10 shadow-2xl overflow-hidden">
          {/* Subtle concentric arc on card top-right */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-purple-700/30 pointer-events-none" />
          <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full border border-[#f3c84b]/20 pointer-events-none" />

          {/* Clean, Non-repetitive Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#f3c84b] shadow-[0_0_8px_#f3c84b]" />
            <span className="text-[11px] font-bold tracking-widest text-purple-200 uppercase">
              {isAllCampuses ? 'Verified Student Exchange' : `Verified Marketplace · ${activeCampus.shortName}`}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white font-serif leading-[1.15] mb-4">
            Everything you <br className="hidden sm:inline" />
            imagined.
          </h1>

          {/* Clean, Non-repetitive Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mb-6 font-normal">
            Buy and sell laptops, textbooks, fashion, and hostel essentials with complete confidence. Secured with{' '}
            <span className="text-[#f3c84b] font-medium">Payluk Escrow</span> and verified 6-digit delivery codes.
          </p>

          {/* Search Input Box */}
          <form onSubmit={handleSearchSubmit} className="relative mb-5">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-1.5 focus-within:ring-2 focus-within:ring-[#f3c84b]">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="What do you need today? (laptop, fan, shoes, books...)"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Search campus finds"
              >
                <ArrowDown className="w-5 h-5 text-slate-950" />
              </button>
            </div>
          </form>

          {/* Trust Value Props (Explicit Payluk Escrow Mention & Clean Phrasing) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f3c84b]" />
              <span className="font-medium text-slate-200">Fixed prices in Naira (₦)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe 6-digit delivery OTP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#f3c84b]" />
              <span className="text-amber-200 font-medium">Payluk Escrow Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
