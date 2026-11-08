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
  Sparkles,
  Phone
} from 'lucide-react';
import { store } from '../services/store';
import { DeliveryOption, ProductCondition, DeliveryScheduleType, DeliveryDayOfWeek, DeliveryTimeSlot, FulfillmentOption, PickupConfig } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface NewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  onOpenVerification?: () => void;
}

const PRESET_IMAGES = [
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=65' },
  { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=600&q=65' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=65' },
  { label: 'Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=65' },
  { label: 'Dorm Fan', url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=600&q=65' },
  { label: 'Campus Meals', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=65' },
];

const ALL_DAYS: Array<{ id: DeliveryDayOfWeek; label: string }> = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
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
  
  // Phase B Fulfillment & Pickup options
  const [allowDelivery, setAllowDelivery] = useState(true);
  const [allowPickup, setAllowPickup] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('500');
  const [pickupLandmark, setPickupLandmark] = useState(
    activeCampus.safeMeetupPoints[0] || 'Campus Main Gate / SUB'
  );
  const [pickupLocationKind, setPickupLocationKind] = useState<'safe_checkpoint' | 'custom'>('safe_checkpoint');
  const [pickupLocationLabel, setPickupLocationLabel] = useState('');
  const [pickupDays, setPickupDays] = useState<DeliveryDayOfWeek[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
  const [pickupTimeSlot, setPickupTimeSlot] = useState('10:00 AM - 5:00 PM');
  const [pickupTimeNote, setPickupTimeNote] = useState('');

  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [scheduleType, setScheduleType] = useState<DeliveryScheduleType>('within_7_days');
  const [specificDays, setSpecificDays] = useState<DeliveryDayOfWeek[]>(['monday', 'wednesday', 'friday']);
  const [timeSlot, setTimeSlot] = useState<DeliveryTimeSlot>('any');
  const [brand, setBrand] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Seller Phone Check
  const [sellerPhoneSaved, setSellerPhoneSaved] = useState<boolean>(!!currentUser.phone);
  const [sellerPhoneInput, setSellerPhoneInput] = useState(currentUser.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      store.fetchSellerPhoneStatus().then((res) => {
        if (res.hasPhone) {
          setSellerPhoneSaved(true);
        } else if (currentUser.phone) {
          setSellerPhoneSaved(true);
        } else {
          setSellerPhoneSaved(false);
        }
      });
    }
  }, [isOpen, currentUser.phone]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneMessage(null);
    setSavingPhone(true);
    try {
      const res = await store.saveSellerPhone(sellerPhoneInput);
      if (res.success) {
        setSellerPhoneSaved(true);
        setPhoneMessage('Mobile number saved securely.');
      } else {
        setPhoneMessage(res.error || 'Failed to save phone number');
      }
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isVerifiedSeller) {
      setFormError('Only verified campus vendors can list items. Please apply for verification first.');
      return;
    }

    if (!sellerPhoneSaved) {
      setFormError('You must save your Nigerian mobile phone number before submitting a listing.');
      return;
    }

    if (!allowDelivery && !allowPickup) {
      setFormError('Please select at least one fulfillment option (Delivery or Pickup).');
      return;
    }

    if (allowPickup && pickupLocationKind === 'custom' && !pickupLocationLabel.trim()) {
      setFormError('Please specify the custom store or pickup address.');
      return;
    }

    if (allowPickup && pickupDays.length === 0) {
      setFormError('Please select at least one pickup day.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setFormError('Please enter a valid price in Nigerian Naira (₦)');
      return;
    }

    const fulfillmentOptions: FulfillmentOption[] = [];
    if (allowDelivery) fulfillmentOptions.push('delivery');
    if (allowPickup) fulfillmentOptions.push('pickup');

    const mappedDeliveryOption: DeliveryOption = 
      allowDelivery && allowPickup ? 'both' : allowDelivery ? 'seller_delivers' : 'buyer_pickup';

    const pickupConfig: PickupConfig | undefined = allowPickup ? {
      locationKind: pickupLocationKind,
      locationLabel: pickupLocationKind === 'custom' 
        ? pickupLocationLabel.trim() 
        : (pickupLandmark || activeCampus.safeMeetupPoints[0] || 'Campus Safe Checkpoint'),
      days: pickupDays,
      timeSlot: pickupTimeSlot.trim() || '10:00 AM - 5:00 PM',
      timeNote: pickupTimeNote.trim() || undefined
    } : undefined;

    try {
      store.createProduct({
        title,
        description,
        price: numericPrice,
        category,
        condition,
        images: [imageUrl],
        stock: parseInt(stock, 10) || 1,
        deliveryOption: mappedDeliveryOption,
        fulfillmentOptions,
        pickup: pickupConfig,
        deliveryFee: allowDelivery ? (parseFloat(deliveryFee) || 0) : 0,
        pickupLandmark: pickupConfig?.locationLabel || 'Safe Checkpoint',
        deliverySchedule: {
          type: scheduleType,
          specificDays: scheduleType === 'specific_days' ? specificDays : undefined,
          timeSlot
        },
        brand: brand.trim() || undefined
      });

      onProductCreated();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit listing');
    }
  };

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.65 });
      setImageUrl(compressed);
    } catch {
      setFormError('Failed to process image. Please try a different photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-[#0B1120] border border-white/[0.1] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white font-serif">
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

        {/* Seller Phone Setup Banner (Required for V3) */}
        {!sellerPhoneSaved && (
          <div className="p-4 bg-indigo-950/80 border-b border-indigo-500/50 text-indigo-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-white">
              <Phone className="w-4 h-4 text-[#C8A96A]" />
              <span>Seller Mobile Number Required</span>
            </div>
            <p className="text-[11px] text-indigo-300">
              Abbason Hub requires a Nigerian mobile number on file before posting. Your phone number is kept strictly private and only shared with buyers after an order is confirmed.
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={sellerPhoneInput}
                onChange={(e) => setSellerPhoneInput(e.target.value)}
                placeholder="e.g. 08012345678 or +234..."
                className="flex-1 bg-[#020406] border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={savingPhone}
                className="px-3 py-1.5 rounded-xl bg-[#C8A96A] text-black font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                {savingPhone ? 'Saving...' : 'Save Phone'}
              </button>
            </div>
            {phoneMessage && (
              <p className="text-[10px] text-emerald-400 font-medium">{phoneMessage}</p>
            )}
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

          {/* Phase B Fulfillment Options (Checkboxes: Delivery & Pickup) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
            <div>
              <span className="font-semibold text-[#C8A96A] uppercase tracking-wider text-[10px] block">
                Fulfillment Options Offered to Buyers *
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Select at least one fulfillment method for this item.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                allowDelivery ? 'bg-[#C8A96A]/15 border-[#C8A96A] text-white' : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={allowDelivery}
                  onChange={(e) => setAllowDelivery(e.target.checked)}
                  className="mt-0.5 accent-[#C8A96A]"
                />
                <div>
                  <div className="font-medium flex items-center gap-1.5 text-xs text-white">
                    <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                    <span>Hostel Delivery</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dispatched to buyer's hostel</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                allowPickup ? 'bg-[#C8A96A]/15 border-[#C8A96A] text-white' : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={allowPickup}
                  onChange={(e) => setAllowPickup(e.target.checked)}
                  className="mt-0.5 accent-[#C8A96A]"
                />
                <div>
                  <div className="font-medium flex items-center gap-1.5 text-xs text-white">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Campus / Store Pickup</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Buyer meets you at checkpoint or shop</span>
                </div>
              </label>
            </div>

            {/* Delivery Details (if enabled) */}
            {allowDelivery && (
              <div className="pt-3 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px]">Hostel Delivery Settings</span>
                  <span className="text-[10px] text-[#C8A96A]">Transport Fee</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Delivery Fee to Campus Hostels (₦) - Enter 0 for Free Delivery
                  </label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="500"
                    min="0"
                    className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Delivery Window
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType('within_3_days')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] text-center border transition-colors cursor-pointer ${
                        scheduleType === 'within_3_days'
                          ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] font-medium'
                          : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Within 3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('within_7_days')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] text-center border transition-colors cursor-pointer ${
                        scheduleType === 'within_7_days'
                          ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] font-medium'
                          : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Within 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('specific_days')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] text-center border transition-colors cursor-pointer ${
                        scheduleType === 'specific_days'
                          ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] font-medium'
                          : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Specific Days
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Details (if enabled) */}
            {allowPickup && (
              <div className="pt-3 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-[11px]">Campus Pickup Settings</span>
                  <span className="text-[10px] text-emerald-400">Zero Transport Fee</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Pickup Location Kind
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupLocationKind('safe_checkpoint')}
                      className={`py-1.5 px-2 rounded-xl text-center border transition-colors cursor-pointer text-xs ${
                        pickupLocationKind === 'safe_checkpoint'
                          ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] font-medium'
                          : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Campus Safe Checkpoint
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupLocationKind('custom')}
                      className={`py-1.5 px-2 rounded-xl text-center border transition-colors cursor-pointer text-xs ${
                        pickupLocationKind === 'custom'
                          ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A] font-medium'
                          : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
                      }`}
                    >
                      My Shop / Custom Spot
                    </button>
                  </div>
                </div>

                {pickupLocationKind === 'safe_checkpoint' ? (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Campus Safe Checkpoint Landmark
                    </label>
                    <input
                      type="text"
                      value={pickupLandmark}
                      onChange={(e) => setPickupLandmark(e.target.value)}
                      placeholder="e.g. SUB Building or Faculty Pavilion"
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Shop / Custom Pickup Address *
                    </label>
                    <input
                      type="text"
                      value={pickupLocationLabel}
                      onChange={(e) => setPickupLocationLabel(e.target.value)}
                      placeholder="e.g. Shop 12, SUB Commercial Plaza, Block B"
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      required={allowPickup && pickupLocationKind === 'custom'}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Exact location shown after buyer places order.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Pickup Days Available
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {ALL_DAYS.map((d) => {
                      const isSel = pickupDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              if (pickupDays.length > 1) {
                                setPickupDays(pickupDays.filter((x: DeliveryDayOfWeek) => x !== d.id));
                              }
                            } else {
                              setPickupDays([...pickupDays, d.id]);
                            }
                          }}
                          className={`py-1 text-[10px] uppercase font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-[#C8A96A] border-[#C8A96A] text-[#0B1120]'
                              : 'bg-[#0B1120] border-white/[0.08] text-slate-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Pickup Hours
                    </label>
                    <input
                      type="text"
                      value={pickupTimeSlot}
                      onChange={(e) => setPickupTimeSlot(e.target.value)}
                      placeholder="e.g. 10:00 AM - 5:00 PM"
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Pickup Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={pickupTimeNote}
                      onChange={(e) => setPickupTimeNote(e.target.value)}
                      placeholder="e.g. Call when you reach the pavilion"
                      className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
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

          {/* Product Photo Selector with Custom Upload & Auto-Compress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Product Photo
              </label>
              <label
                htmlFor="custom-product-photo"
                className="text-[10px] text-[#C8A96A] hover:underline cursor-pointer flex items-center gap-1 font-medium"
              >
                <ImageIcon className="w-3 h-3" />
                <span>{isCompressing ? 'Compressing photo...' : 'Upload own photo (Auto-compressed)'}</span>
                <input
                  id="custom-product-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomFileUpload}
                />
              </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-transform cursor-pointer ${
                    imageUrl === img.url ? 'border-[#C8A96A] scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-white py-0.5 text-center">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>

            {imageUrl && !PRESET_IMAGES.some(p => p.url === imageUrl) && (
              <div className="mt-2 p-2 rounded-xl bg-white/[0.04] border border-[#C8A96A]/40 flex items-center gap-3">
                <img src={imageUrl} alt="Custom uploaded preview" className="w-12 h-12 rounded-lg object-cover border border-[#C8A96A]/40" />
                <div>
                  <div className="text-[11px] text-[#E9E6DF] font-medium">Custom Photo Active</div>
                  <div className="text-[10px] text-emerald-400">Optimized at 65% quality (~50KB) for fast 3G loading</div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Moderation Notice */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-[#C8A96A]/30 text-[#8C9399] text-[11px] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C8A96A] shrink-0" />
            <span className="font-light">
              All listings remain unpublished until reviewed by Abbason Hub administration to ensure student safety.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isVerifiedSeller}
              className="w-full py-3 rounded-2xl bg-[#C8A96A] hover:bg-[#b89858] disabled:opacity-40 text-black font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-lg cursor-pointer"
            >
              <span>Submit for Admin Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
