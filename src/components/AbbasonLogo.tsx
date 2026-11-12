import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { store } from '../services/store';

interface AbbasonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  allowUpload?: boolean;
}

export const AbbasonLogo: React.FC<AbbasonLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  allowUpload = true,
}) => {
  const [brandImage, setBrandImage] = useState<string | null>(store.getBrandLogoImage());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setBrandImage(store.getBrandLogoImage());
    });
    return unsub;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        store.setBrandLogoImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBoxClick = () => {
    if (allowUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const sizeMap = {
    sm: { box: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-base', sub: 'text-[9px] sm:text-[10px]' },
    md: { box: 'w-7 h-7 sm:w-9 sm:h-9', text: 'text-lg sm:text-xl', sub: 'text-[9px] sm:text-[10px]' },
    lg: { box: 'w-11 h-11 sm:w-14 sm:h-14', text: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16 sm:w-20 sm:h-20', text: 'text-2xl sm:text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Hidden file input for uploading brand logo */}
      {allowUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload brand logo"
        />
      )}

      {/* Brand Logo Container */}
      <div className="relative group">
        <div
          onClick={handleBoxClick}
          title={allowUpload ? 'Click to upload / change brand logo' : undefined}
          className={`${currentSize.box} rounded-lg sm:rounded-xl bg-white p-0.5 shadow-sm border border-[#C8A96A]/40 flex items-center justify-center shrink-0 relative overflow-hidden transition-all duration-300 ${
            allowUpload ? 'cursor-pointer hover:border-[#C8A96A] hover:shadow-[0_0_15px_rgba(200,169,106,0.3)]' : ''
          }`}
        >
          <img
            src={brandImage || '/logo.png'}
            alt="Abbason Hub Logo"
            className="w-full h-full object-contain rounded-lg"
          />

          {/* Hover Camera Overlay if allowUpload */}
          {allowUpload && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
              <Camera className="w-3.5 h-3.5 text-[#C8A96A]" />
            </div>
          )}
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`${currentSize.text} font-normal tracking-[0.04em] text-[#E9E6DF] font-serif`}>
              Abbason
            </span>
            <span className={`${currentSize.text} font-normal tracking-[0.04em] text-[#C8A96A] font-serif`}>
              Hub
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] ml-0.5 opacity-90 shadow-[0_0_6px_rgba(200,169,106,0.8)]" />
          </div>
          <span className={`${currentSize.sub} text-[#8C9399] font-light tracking-[0.2em] uppercase text-[9px] sm:text-[10px]`}>
            Everything you imagined.
          </span>
        </div>
      )}
    </div>
  );
};
