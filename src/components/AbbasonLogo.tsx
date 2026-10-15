import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { store } from '../services/store';

interface AbbasonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  allowUpload?: boolean;
  className?: string;
}

export const AbbasonLogo: React.FC<AbbasonLogoProps> = ({
  size = 'md',
  showText = false,
  allowUpload = false,
  className = '',
}) => {
  const [brandImage, setBrandImage] = useState<string | null>(store.getBrandLogoImage());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setBrandImage(store.getBrandLogoImage());
    });
    return unsub;
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      store.setBrandLogoImage(result);
    };
    reader.readAsDataURL(file);
  };

  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10', text: 'text-xl', sub: 'text-[11px]' },
    lg: { box: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo container with custom brand image or handcrafted vector icon */}
      <div className="relative group">
        <div
          className={`${currentSize.box} rounded-2xl bg-gradient-to-br from-[#3b0764] via-[#1e1b4b] to-[#0f172a] p-1 shadow-lg shadow-purple-950/70 border border-purple-500/30 flex items-center justify-center shrink-0 relative overflow-hidden`}
        >
          {brandImage ? (
            <img
              src={brandImage}
              alt="Abbason Hub Brand"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <>
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent pointer-events-none" />

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
                  rx="14"
                  fill="#1e1035"
                  stroke="#9333ea"
                  strokeWidth="3.5"
                />
                <rect
                  x="20"
                  y="18"
                  width="60"
                  height="64"
                  rx="9"
                  fill="url(#screenGrad)"
                />
                <rect x="42" y="15" width="16" height="2" rx="1" fill="#c084fc" opacity="0.8" />

                {/* Golden Sparkles */}
                <path d="M74 20 L76 24 L80 26 L76 28 L74 32 L72 28 L68 26 L72 24 Z" fill="#f3c84b" />
                <path d="M24 64 L25.5 67 L28.5 68.5 L25.5 70 L24 73 L22.5 70 L19.5 68.5 L22.5 67 Z" fill="#f3c84b" opacity="0.9" />
                <circle cx="28" cy="28" r="2.5" fill="#fde047" />
                <circle cx="72" cy="70" r="2" fill="#fde047" />

                {/* Cute Shopping Bag */}
                <path d="M38 34 C38 22, 62 22, 62 34" fill="none" stroke="#581c87" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M26 34 L74 34 L68 82 L32 82 Z" fill="url(#bagGrad)" stroke="#3b0764" strokeWidth="3" strokeLinejoin="round" />
                <path d="M25 34 Q50 37 75 34 L73 40 Q50 43 27 40 Z" fill="#eab308" opacity="0.6" />

                {/* Kawaii Face */}
                <ellipse cx="42" cy="49" rx="3.5" ry="4.5" fill="#1e1035" />
                <circle cx="43.5" cy="47.5" r="1.5" fill="#ffffff" />
                <ellipse cx="58" cy="49" rx="3.5" ry="4.5" fill="#1e1035" />
                <circle cx="59.5" cy="47.5" r="1.5" fill="#ffffff" />
                <path d="M45 58 Q50 64 55 58" fill="none" stroke="#1e1035" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="37" cy="54" rx="3" ry="1.8" fill="#f43f5e" opacity="0.65" />
                <ellipse cx="63" cy="54" rx="3" ry="1.8" fill="#f43f5e" opacity="0.65" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="screenGrad" x1="20" y1="18" x2="80" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4c1d95" />
                    <stop offset="60%" stopColor="#2e1065" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>
                  <linearGradient id="bagGrad" x1="26" y1="34" x2="74" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="50%" stopColor="#f3c84b" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                </defs>
              </svg>
            </>
          )}
        </div>

        {/* Quick Image Upload Trigger when allowUpload is true */}
        {allowUpload && (
          <label
            htmlFor="brand-image-upload"
            className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-purple-500 text-purple-300 hover:text-white hover:bg-purple-900 transition-colors cursor-pointer shadow-md"
            title="Upload your brand picture file"
          >
            <Camera className="w-2.5 h-2.5" />
            <input
              id="brand-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
          </label>
        )}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 leading-tight">
            <span className={`${currentSize.text} font-extrabold tracking-tight text-white font-sans`}>
              Abbason
            </span>
            <span className={`${currentSize.text} font-extrabold tracking-tight text-[#f3c84b] font-sans`}>
              Hub
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f3c84b] ml-0.5" />
          </div>
          <span className={`${currentSize.sub} text-slate-400 font-medium tracking-normal`}>
            Everything you imagined.
          </span>
        </div>
      )}
    </div>
  );
};
