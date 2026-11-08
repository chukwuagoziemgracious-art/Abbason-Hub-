import React, { useState, useEffect } from 'react';
import { store } from '../services/store';

interface AbbasonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AbbasonLogo: React.FC<AbbasonLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const [brandImage, setBrandImage] = useState<string | null>(store.getBrandLogoImage());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setBrandImage(store.getBrandLogoImage());
    });
    return unsub;
  }, []);

  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10', text: 'text-xl', sub: 'text-[11px]' },
    lg: { box: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Static Logo container displaying uploaded brand logo */}
      <div className="relative">
        <div
          className={`${currentSize.box} rounded-xl bg-[#020406]/90 p-1 shadow-xl border border-[#C8A96A]/40 flex items-center justify-center shrink-0 relative overflow-hidden`}
        >
          {brandImage ? (
            <img
              src={brandImage}
              alt="Abbason Hub Brand"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <>
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-radial from-[#C8A96A]/15 to-transparent pointer-events-none" />

              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-md select-none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Smartphone Frame */}
                <rect
                  x="14"
                  y="12"
                  width="72"
                  height="76"
                  rx="6"
                  fill="#06090f"
                  stroke="#C8A96A"
                  strokeWidth="2.5"
                />
                <rect
                  x="20"
                  y="18"
                  width="60"
                  height="64"
                  rx="4"
                  fill="url(#screenGrad)"
                />
                <rect x="42" y="15" width="16" height="2" rx="1" fill="#C8A96A" opacity="0.8" />

                {/* Golden Sparkles */}
                <path d="M74 20 L76 24 L80 26 L76 28 L74 32 L72 28 L68 26 L72 24 Z" fill="#C8A96A" />
                <path d="M24 64 L25.5 67 L28.5 68.5 L25.5 70 L24 73 L22.5 70 L19.5 68.5 L22.5 67 Z" fill="#C8A96A" opacity="0.9" />
                <circle cx="28" cy="28" r="2.5" fill="#E9E6DF" />
                <circle cx="72" cy="70" r="2" fill="#E9E6DF" />

                {/* Cute Shopping Bag */}
                <path d="M38 34 C38 22, 62 22, 62 34" fill="none" stroke="#C8A96A" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M26 34 L74 34 L68 82 L32 82 Z" fill="url(#bagGrad)" stroke="#C8A96A" strokeWidth="2" strokeLinejoin="round" />
                <path d="M25 34 Q50 37 75 34 L73 40 Q50 43 27 40 Z" fill="#C8A96A" opacity="0.4" />

                {/* Kawaii Face */}
                <ellipse cx="42" cy="49" rx="3.5" ry="4.5" fill="#020406" />
                <circle cx="43.5" cy="47.5" r="1.5" fill="#E9E6DF" />
                <ellipse cx="58" cy="49" rx="3.5" ry="4.5" fill="#020406" />
                <circle cx="59.5" cy="47.5" r="1.5" fill="#E9E6DF" />
                <path d="M45 58 Q50 64 55 58" fill="none" stroke="#020406" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="37" cy="54" rx="3" ry="1.8" fill="#C8A96A" opacity="0.5" />
                <ellipse cx="63" cy="54" rx="3" ry="1.8" fill="#C8A96A" opacity="0.5" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="screenGrad" x1="20" y1="18" x2="80" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0B1120" />
                    <stop offset="60%" stopColor="#06090e" />
                    <stop offset="100%" stopColor="#020406" />
                  </linearGradient>
                  <linearGradient id="bagGrad" x1="26" y1="34" x2="74" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#E9E6DF" />
                    <stop offset="50%" stopColor="#C8A96A" />
                    <stop offset="100%" stopColor="#9C7B38" />
                  </linearGradient>
                </defs>
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`${currentSize.text} font-normal tracking-[0.04em] text-[#E9E6DF] font-serif`}>
              Abbason
            </span>
            <span className={`${currentSize.text} font-normal tracking-[0.04em] text-[#C8A96A] font-serif`}>
              Hub
            </span>
            <span className="w-1 h-1 rounded-full bg-[#C8A96A] ml-0.5 opacity-80" />
          </div>
          <span className={`${currentSize.sub} text-[#8C9399] font-light tracking-[0.2em] uppercase text-[9px] sm:text-[10px]`}>
            Everything you imagined.
          </span>
        </div>
      )}
    </div>
  );
};
