import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Truck, 
  MapPin, 
  Clock, 
  AlertCircle,
  Image as ImageIcon,
  Check,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { store } from '../services/store';
import { DeliveryOption, ProductCondition } from '../types';

interface NewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  onOpenVerification?: () => void;
}

const PRESET_IMAGES = [
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80' },
  { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80' },
  { label: 'Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dorm Fan', url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80' },
  { label: 'Campus Meals', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80' },
];

export const NewListingModal: React.FC<NewListingModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  onOpenVerification,
}) => {
  const categories = store.getCategories();
  const activeCampus = store.getActiveCampus();
  const currentUser = store.getCurrentUser();
  const isVerifiedSeller = store.canUserSell(currentUser.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('electronics');
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [stock, setStock] = useState('1');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('both');
  const [deliveryFee, setDeliveryFee] = useState('500');
  const [pickupLandmark, setPickupLandmark] = useState(
    activeCampus.safeMeetupPoints[0] || 'Campus Main Gate / SUB'
  );
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [brand, setBrand] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isVerifiedSeller) {
      setFormError('Only verified campus vendors can list items. Please apply for verification first.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFormError('Please enter a valid price in Nigerian Naira (₦)');
      return;
    }

    try {
      store.createProduct({
        title,
        description,
        price: numericPrice,
        category,
        condition,
        images: [imageUrl],
        stock: parseInt(stock, 10) || 1,
        deliveryOption,
        deliveryFee: deliveryOption !== 'buyer_pickup' ? parseFloat(deliveryFee) || 0 : 0,
        pickupLandmark: deliveryOption !== 'seller_delivers' ? pickupLandmark : 'Hostel delivery',
        brand: brand.trim() || undefined
      });

      onProductCreated();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit listing');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-[#0F172A] border border-purple-900/70 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-[#f3c84b]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Submit Listing for Campus Approval
              </h3>
              <p className="text-[11px] text-slate-400">
                Target: {activeCampus.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Check Notice if not verified */}
        {!isVerifiedSeller && (
          <div className="p-4 bg-amber-950/80 border-b border-amber-500/50 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Verified Sellers Only:</strong> You must verify your student credentials before you can post listings for sale.
              </span>
            </div>
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerification();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#f3c84b] text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
              >
                Get Verified
              </button>
            )}
          </div>
        )}

        {formError && (
          <div className="p-3 bg-rose-950 border-b border-rose-500/50 text-rose-200 text-xs text-center font-semibold">
            {formError}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Product / Service Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean UK-used Dell XPS 13 or Fresh Student Bowl"
              className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="new">Brand New</option>
                <option value="used_like_new">Like New / Mint</option>
                <option value="used_good">Pre-loved (Good condition)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Price in Nigerian Naira (₦) *
              </label>
              <input
                type="number"
                required
                min="100"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25000"
                className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Available Stock Units *
              </label>
              <input
                type="number"
                required
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Delivery & Fulfillment specifications */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px] block">
              Fulfillment Method *
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryOption('both')}
                className={`py-2 px-1 rounded-xl text-center border transition-colors cursor-pointer ${
                  deliveryOption === 'both'
                    ? 'bg-purple-900/60 border-[#f3c84b] text-[#f3c84b] font-bold'
                    : 'bg-[#0B1120] border-slate-800 text-slate-400'
                }`}
              >
                Hostel + Pickup
              </button>
              <button
                type="button"
                onClick={() => setDeliveryOption('seller_delivers')}
                className={`py-2 px-1 rounded-xl text-center border transition-colors cursor-pointer ${
                  deliveryOption === 'seller_delivers'
                    ? 'bg-purple-900/60 border-[#f3c84b] text-[#f3c84b] font-bold'
                    : 'bg-[#0B1120] border-slate-800 text-slate-400'
                }`}
              >
                Hostel Delivery
              </button>
              <button
                type="button"
                onClick={() => setDeliveryOption('buyer_pickup')}
                className={`py-2 px-1 rounded-xl text-center border transition-colors cursor-pointer ${
                  deliveryOption === 'buyer_pickup'
                    ? 'bg-purple-900/60 border-[#f3c84b] text-[#f3c84b] font-bold'
                    : 'bg-[#0B1120] border-slate-800 text-slate-400'
                }`}
              >
                Campus Pickup
              </button>
            </div>

            {deliveryOption !== 'buyer_pickup' && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Delivery Fee to Campus Hostels (₦)
                </label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  placeholder="500"
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            )}

            {deliveryOption !== 'seller_delivers' && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Safe Campus Pickup Point / Landmark
                </label>
                <input
                  type="text"
                  value={pickupLandmark}
                  onChange={(e) => setPickupLandmark(e.target.value)}
                  placeholder="e.g. SUB Building or Faculty Pavilion"
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State full specifications, cosmetic condition, accessories included, and testing recommendations..."
              className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Sample Product Photo Selector */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              Select Product Photo
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-transform cursor-pointer ${
                    imageUrl === img.url ? 'border-[#f3c84b] scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-white py-0.5 text-center">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Moderation Notice */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 text-purple-200 text-[11px] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f3c84b] shrink-0" />
            <span>
              All listings remain unpublished until reviewed by Abbason Hub administration to ensure student safety.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isVerifiedSeller}
              className="w-full py-3 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-lg cursor-pointer"
            >
              <span>Submit for Admin Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
