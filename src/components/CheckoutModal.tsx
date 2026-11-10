import React, { useState, useMemo } from 'react';
import { 
  X, 
  Lock, 
  Loader2, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { store } from '../services/store';
import { formatNaira, calculateGatewayFee } from '../utils/currency';
import { Order, CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryConfig: {
    fulfillmentType: 'seller_delivers' | 'buyer_pickup';
    deliveryInstructions: string;
  };
  onPaymentSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  deliveryConfig,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cart = store.getCart();
  const activeCampus = store.getActiveCampus();
  const safePoints = activeCampus.safeMeetupPoints || ['Campus Main Gate', 'Student Union Building (SUB)', 'University Central Library'];

  // Group items by vendor
  const vendorGroups = useMemo(() => {
    const map = new Map<string, { sellerName: string; campusName: string; items: CartItem[] }>();
    cart.forEach((item) => {
      const sId = item.product.sellerId;
      if (!map.has(sId)) {
        map.set(sId, {
          sellerName: item.product.sellerName,
          campusName: item.product.campusName,
          items: []
        });
      }
      map.get(sId)!.items.push(item);
    });
    return map;
  }, [cart]);

  // Stable default date for scheduled deliveries (tomorrow)
  const defaultDateStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  // Per-seller checkout configuration state
  const [sellerConfigs, setSellerConfigs] = useState<Record<string, {
    fulfillmentType: 'seller_delivers' | 'buyer_pickup';
    meetingPointKind: 'safe_checkpoint' | 'custom';
    checkpointLabel: string;
    customLocation: string;
    scheduledDate: string;
    timeSlot: 'morning' | 'afternoon' | 'evening' | 'any';
  }>>({});
  const [buyerPhone, setBuyerPhone] = useState(store.getCurrentUser().phone || '');

  // Track whether we already initialized configs for this open session
  const prevIsOpenRef = React.useRef(false);

  // Initialize and synchronize seller configs whenever modal opens or vendors are present
  React.useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    setBuyerPhone(store.getCurrentUser().phone || '');

    setSellerConfigs((prev) => {
      let changed = false;
      const next = { ...prev };

      vendorGroups.forEach((group, sId) => {
        if (!next[sId] || !next[sId].scheduledDate) {
          changed = true;
          const allowsDelivery = group.items.every((it) => {
            if (it.product.fulfillmentOptions && it.product.fulfillmentOptions.length > 0) {
              return it.product.fulfillmentOptions.includes('delivery');
            }
            return it.product.deliveryOption === 'both' || it.product.deliveryOption === 'seller_delivers' || !it.product.deliveryOption;
          });

          const allowsPickup = group.items.every((it) => {
            if (it.product.fulfillmentOptions && it.product.fulfillmentOptions.length > 0) {
              return it.product.fulfillmentOptions.includes('pickup');
            }
            return it.product.deliveryOption === 'both' || it.product.deliveryOption === 'buyer_pickup' || !it.product.deliveryOption;
          });

          let initialFulfillment: 'seller_delivers' | 'buyer_pickup' = 'seller_delivers';
          if (allowsDelivery && allowsPickup) {
            initialFulfillment = deliveryConfig.fulfillmentType || 'seller_delivers';
          } else if (allowsDelivery) {
            initialFulfillment = 'seller_delivers';
          } else {
            initialFulfillment = 'buyer_pickup';
          }

          const pickupConfig = group.items.find(i => i.product.pickup)?.product.pickup;

          next[sId] = {
            fulfillmentType: next[sId]?.fulfillmentType || initialFulfillment,
            meetingPointKind: next[sId]?.meetingPointKind || ((pickupConfig?.locationKind === 'custom') ? 'custom' : 'safe_checkpoint'),
            checkpointLabel: next[sId]?.checkpointLabel || safePoints[0] || 'Campus Main Gate',
            customLocation: next[sId]?.customLocation || pickupConfig?.locationLabel || deliveryConfig.deliveryInstructions || '',
            scheduledDate: next[sId]?.scheduledDate || defaultDateStr,
            timeSlot: next[sId]?.timeSlot || 'afternoon'
          };
        }
      });

      return changed ? next : prev;
    });

    if (!prevIsOpenRef.current) {
      setErrorMessage(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, vendorGroups, deliveryConfig.fulfillmentType, deliveryConfig.deliveryInstructions, safePoints, defaultDateStr]);

  if (!isOpen || cart.length === 0) return null;

  // Compute financial totals per seller and consolidated
  let totalUpfrontDelivery = 0;
  let totalGoodsDue = 0;
  const vendorBreakdowns: Array<{
    sellerId: string;
    sellerName: string;
    deliveryFee: number;
    gatewayFee: number;
    upfrontTotal: number;
    goodsTotal: number;
  }> = [];

  vendorGroups.forEach((group, sId) => {
    const config = sellerConfigs[sId] || { fulfillmentType: deliveryConfig.fulfillmentType };
    const goodsTotal = group.items.reduce((sum, it) => sum + (it.product.price * it.quantity), 0);
    const deliveryFee = config.fulfillmentType === 'seller_delivers'
      ? Math.max(...group.items.map((i) => i.product.deliveryFee || 0))
      : 0;

    const gatewayFee = calculateGatewayFee(deliveryFee);
    const upfrontTotal = deliveryFee + gatewayFee;

    totalUpfrontDelivery += upfrontTotal;
    totalGoodsDue += goodsTotal;

    vendorBreakdowns.push({
      sellerId: sId,
      sellerName: group.sellerName,
      deliveryFee,
      gatewayFee,
      upfrontTotal,
      goodsTotal
    });
  });

  const grandTotal = totalUpfrontDelivery + totalGoodsDue;

  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Validate per-vendor fulfillment & meeting points
      for (const [sId, group] of vendorGroups.entries()) {
        const conf = sellerConfigs[sId] || {
          fulfillmentType: deliveryConfig.fulfillmentType || 'seller_delivers',
          meetingPointKind: 'safe_checkpoint',
          checkpointLabel: safePoints[0] || 'Campus Main Gate',
          customLocation: '',
          scheduledDate: defaultDateStr,
          timeSlot: 'afternoon'
        };

        if (conf.meetingPointKind === 'custom' && (!conf.customLocation || conf.customLocation.trim().length < 3)) {
          throw new Error(`Please specify a valid hostel/room location for ${group.sellerName || 'vendor'} (min 3 characters).`);
        }

        // Validate pickup days if self pickup chosen
        if (conf.fulfillmentType === 'buyer_pickup') {
          const pickupConfig = group.items.find(i => i.product.pickup)?.product.pickup;
          const targetDate = conf.scheduledDate || defaultDateStr;
          if (pickupConfig && pickupConfig.days && pickupConfig.days.length > 0 && targetDate) {
            const dateObj = new Date(targetDate);
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const chosenDay = dayNames[dateObj.getDay()];
            if (!pickupConfig.days.includes(chosenDay as any)) {
              const readableDays = pickupConfig.days.map((d: any) => String(d).slice(0, 3).toUpperCase()).join(', ');
              throw new Error(`${group.sellerName} only offers pickup on: ${readableDays}. Please select an available pickup date.`);
            }
          }
        }
      }

      // Format payload for server - guarantee EVERY vendor group has a valid config and scheduledDate
      const formattedConfigs: Record<string, any> = {};
      vendorGroups.forEach((group, sId) => {
        const conf = sellerConfigs[sId];
        const sDate = (conf?.scheduledDate && conf.scheduledDate.trim().length >= 8)
          ? conf.scheduledDate.trim()
          : defaultDateStr;

        formattedConfigs[sId] = {
          fulfillmentType: conf?.fulfillmentType || 'seller_delivers',
          meetingPoint: {
            kind: conf?.meetingPointKind || 'safe_checkpoint',
            label: conf?.meetingPointKind === 'custom'
              ? (conf.customLocation?.trim() || group.sellerName)
              : (conf?.checkpointLabel || safePoints[0] || 'Campus Main Gate')
          },
          scheduledDate: sDate,
          timeSlot: conf?.timeSlot || 'afternoon',
          deliveryInstructions: conf?.meetingPointKind === 'custom'
            ? (conf.customLocation?.trim() || group.sellerName)
            : (conf?.checkpointLabel || safePoints[0] || 'Campus Main Gate')
        };
      });

      // Validate buyer mobile number
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
      const cleanPhone = buyerPhone.trim().replace(/\s+/g, '');
      if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
        throw new Error('Please enter a valid Nigerian mobile phone number (+234... or 070/080/081/090/091...).');
      }

      // 1. Create order(s) authoritatively on server
      const createdOrders = await store.checkoutOrders({
        fulfillmentType: deliveryConfig.fulfillmentType,
        deliveryInstructions: deliveryConfig.deliveryInstructions,
        paymentMethod: 'card',
        phone: cleanPhone,
        sellerConfigs: formattedConfigs
      });

      if (!createdOrders || createdOrders.length === 0) {
        throw new Error('Failed to create orders.');
      }

      // 2. Identify orders requiring upfront transport fee
      const payableOrders = createdOrders.filter((o) => (o.deliveryFee || 0) > 0 && !o.deliveryFeePaid);

      if (payableOrders.length > 0) {
        // Initialize payment for first seller (one at a time as per prompt spec)
        const primaryOrder = payableOrders[0];
        const payInit = await store.initializePayment({
          type: 'delivery_fee',
          orderId: primaryOrder.id
        });

        if (payInit.status && payInit.authorization_url) {
          // Redirect to Paystack or Sandbox simulator
          window.location.href = payInit.authorization_url;
          return;
        } else if (payInit.error) {
          throw new Error(payInit.error);
        }
      }

      // If no delivery fee (buyer pickup), order is immediately confirmed
      setIsProcessing(false);
      onPaymentSuccess(createdOrders[0]);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#090D14] border border-white/[0.12] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.06] bg-[#020406]/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-white font-serif">Campus Checkout</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C8A96A]/10 text-[#C8A96A] border border-[#C8A96A]/30">
                Inspect First · Pay On Delivery
              </span>
            </div>
            <p className="text-[11px] text-[#8C9399] mt-0.5">Pay transport now via Paystack. Pay goods only at safe meetup.</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#8C9399] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
          {/* Per-Seller Parcel Configurations */}
          <div className="space-y-4">
            {Array.from(vendorGroups.entries()).map(([sellerId, group], idx) => {
              const conf = sellerConfigs[sellerId] || {
                fulfillmentType: deliveryConfig.fulfillmentType || 'seller_delivers',
                meetingPointKind: 'safe_checkpoint',
                checkpointLabel: safePoints[0] || 'Campus Main Gate',
                customLocation: '',
                scheduledDate: defaultDateStr,
                timeSlot: 'afternoon'
              };

              const vendorDeliveryFee = conf.fulfillmentType === 'seller_delivers'
                ? Math.max(...group.items.map((i) => i.product.deliveryFee || 0))
                : 0;

              const allowsDelivery = group.items.every((it) => {
                if (it.product.fulfillmentOptions && it.product.fulfillmentOptions.length > 0) {
                  return it.product.fulfillmentOptions.includes('delivery');
                }
                return it.product.deliveryOption === 'both' || it.product.deliveryOption === 'seller_delivers' || !it.product.deliveryOption;
              });

              const allowsPickup = group.items.every((it) => {
                if (it.product.fulfillmentOptions && it.product.fulfillmentOptions.length > 0) {
                  return it.product.fulfillmentOptions.includes('pickup');
                }
                return it.product.deliveryOption === 'both' || it.product.deliveryOption === 'buyer_pickup' || !it.product.deliveryOption;
              });

              const pickupConfig = group.items.find(i => i.product.pickup)?.product.pickup;
              const availablePickupDays = pickupConfig?.days || [];

              return (
                <div key={sellerId} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3.5">
                  {/* Vendor Title */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C8A96A]/20 text-[#C8A96A] text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <strong className="text-white font-medium text-xs">{group.sellerName}</strong>
                    </div>
                    <span className="text-[10px] text-[#8C9399]">{group.items.length} item(s)</span>
                  </div>

                  {/* Fulfillment Choice (Filtered to allowed options) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#8C9399] uppercase tracking-wider font-semibold block">
                      Choose Fulfillment Method
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {allowsDelivery && (
                        <button
                          type="button"
                          onClick={() => setSellerConfigs(prev => ({
                            ...prev,
                            [sellerId]: { ...(prev[sellerId] || conf), fulfillmentType: 'seller_delivers' }
                          }))}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            conf.fulfillmentType === 'seller_delivers'
                              ? 'border-[#C8A96A] bg-[#C8A96A]/10 text-white'
                              : 'border-white/[0.06] text-[#8C9399] hover:border-white/[0.15]'
                          } ${!allowsPickup ? 'col-span-2' : ''}`}
                        >
                          <div className="flex items-center gap-1.5 font-medium text-[11px]">
                            <Truck className="w-3.5 h-3.5 text-[#C8A96A]" />
                            <span>Seller Delivers</span>
                            {!allowsPickup && (
                              <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                Delivery Only
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8C9399] mt-0.5">
                            Transport: {vendorDeliveryFee > 0 ? formatNaira(vendorDeliveryFee) : 'Free'}
                          </p>
                        </button>
                      )}

                      {allowsPickup && (
                        <button
                          type="button"
                          onClick={() => setSellerConfigs(prev => ({
                            ...prev,
                            [sellerId]: { ...(prev[sellerId] || conf), fulfillmentType: 'buyer_pickup' }
                          }))}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            conf.fulfillmentType === 'buyer_pickup'
                              ? 'border-[#C8A96A] bg-[#C8A96A]/10 text-white'
                              : 'border-white/[0.06] text-[#8C9399] hover:border-white/[0.15]'
                          } ${!allowsDelivery ? 'col-span-2' : ''}`}
                        >
                          <div className="flex items-center gap-1.5 font-medium text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Self Pickup</span>
                            {!allowsDelivery && (
                              <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                Pickup Only
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8C9399] mt-0.5">
                            {pickupConfig?.locationKind === 'custom' ? 'Store Pickup (₦0)' : 'Meet at Checkpoint (₦0)'}
                          </p>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Meeting Point Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#8C9399] flex items-center justify-between">
                      <span>Campus Meeting Point</span>
                      <span className="text-[10px] text-emerald-400/90 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Safe Checkpoint Verified
                      </span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSellerConfigs(prev => ({
                          ...prev,
                          [sellerId]: { ...(prev[sellerId] || conf), meetingPointKind: 'safe_checkpoint' }
                        }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
                          conf.meetingPointKind === 'safe_checkpoint'
                            ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                            : 'bg-white/[0.02] border-white/[0.08] text-[#8C9399]'
                        }`}
                      >
                        Safe Checkpoint
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellerConfigs(prev => ({
                          ...prev,
                          [sellerId]: { ...(prev[sellerId] || conf), meetingPointKind: 'custom' }
                        }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
                          conf.meetingPointKind === 'custom'
                            ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                            : 'bg-white/[0.02] border-white/[0.08] text-[#8C9399]'
                        }`}
                      >
                        Custom Hostel/Lodge
                      </button>
                    </div>

                    {conf.meetingPointKind === 'safe_checkpoint' ? (
                      <div className="relative">
                        <select
                          value={conf.checkpointLabel}
                          onChange={(e) => setSellerConfigs(prev => ({
                            ...prev,
                            [sellerId]: { ...(prev[sellerId] || conf), checkpointLabel: e.target.value }
                          }))}
                          className="w-full bg-[#020406] border border-white/[0.12] rounded-xl px-3 py-2 text-white appearance-none cursor-pointer focus:border-[#C8A96A] outline-none pr-8"
                        >
                          {safePoints.map((pt) => (
                            <option key={pt} value={pt} className="bg-[#090D14] text-white">
                              {pt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#8C9399] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={conf.customLocation}
                        onChange={(e) => setSellerConfigs(prev => ({
                          ...prev,
                          [sellerId]: { ...(prev[sellerId] || conf), customLocation: e.target.value }
                        }))}
                        placeholder="e.g. Block C, Room 14, Silver Hostel (3-120 chars)"
                        maxLength={120}
                        className="w-full bg-[#020406] border border-white/[0.12] rounded-xl px-3 py-2 text-white placeholder-[#8C9399]/60 focus:border-[#C8A96A] outline-none text-xs"
                      />
                    )}
                  </div>

                  {/* Scheduled Delivery Date & Time Slot */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-[#8C9399] flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-[#C8A96A]" /> Delivery Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                        value={conf.scheduledDate || defaultDateStr}
                        onChange={(e) => {
                          const val = e.target.value || defaultDateStr;
                          setSellerConfigs(prev => ({
                            ...prev,
                            [sellerId]: { ...(prev[sellerId] || conf), scheduledDate: val }
                          }));
                        }}
                        className="w-full bg-[#020406] border border-white/[0.12] rounded-xl px-2.5 py-1.5 text-white text-[11px] outline-none focus:border-[#C8A96A]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8C9399] flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-[#C8A96A]" /> Time Slot
                      </label>
                      <select
                        value={conf.timeSlot}
                        onChange={(e) => setSellerConfigs(prev => ({
                          ...prev,
                          [sellerId]: { ...(prev[sellerId] || conf), timeSlot: e.target.value as any }
                        }))}
                        className="w-full bg-[#020406] border border-white/[0.12] rounded-xl px-2.5 py-1.5 text-white text-[11px] outline-none focus:border-[#C8A96A] cursor-pointer"
                      >
                        <option value="morning" className="bg-[#090D14]">Morning (9am - 12pm)</option>
                        <option value="afternoon" className="bg-[#090D14]">Afternoon (12pm - 4pm)</option>
                        <option value="evening" className="bg-[#090D14]">Evening (4pm - 7pm)</option>
                        <option value="any" className="bg-[#090D14]">Any Time (Flexible)</option>
                      </select>
                    </div>
                  </div>

                  {/* Pickup Days and Location Details */}
                  {conf.fulfillmentType === 'buyer_pickup' && (
                    <div className="p-2 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/20 text-[10px] space-y-0.5 text-slate-300">
                      {availablePickupDays.length > 0 && (
                        <div>
                          <strong className="text-[#C8A96A]">Available Pickup Days:</strong>{' '}
                          <span>{availablePickupDays.map((d: any) => String(d).slice(0, 3).toUpperCase()).join(', ')}</span>
                        </div>
                      )}
                      {pickupConfig?.timeSlot && (
                        <div>
                          <strong className="text-white">Pickup Hours:</strong> {pickupConfig.timeSlot}
                        </div>
                      )}
                      {pickupConfig?.locationLabel && pickupConfig.locationKind === 'custom' && (
                        <div>
                          <strong className="text-white">Store Address:</strong> {pickupConfig.locationLabel}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Sharing & Cancellation Policy Line for this Vendor */}
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] space-y-1">
                    <div className="text-white font-medium text-[11px]">
                      {conf.fulfillmentType === 'buyer_pickup' || vendorDeliveryFee === 0 ? (
                        <span className="text-emerald-400">Contact shared immediately · 2-hour cancellation window</span>
                      ) : (
                        <span className="text-[#C8A96A]">Contact shared upon transport payment · Cancel before agreed time</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8C9399] leading-relaxed">
                      {conf.fulfillmentType === 'buyer_pickup' || vendorDeliveryFee === 0
                        ? 'Seller contact details are unlocked immediately at checkout. You can cancel this order within 2 hours of ordering.'
                        : 'Your phone number and location are shared with the seller once you pay the delivery fee. The seller will call you to agree a delivery time. You can cancel until the seller sets an agreed delivery time.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buyer Phone Number Verification & Contact Sharing Notice */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-2.5">
            <label className="block text-[11px] font-semibold text-white uppercase tracking-wider">
              Buyer Nigerian Mobile Number *
            </label>
            <input
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="e.g. 08012345678 or +2348012345678"
              required
              className="w-full bg-[#020406] border border-white/[0.12] rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-[#C8A96A] outline-none"
            />
            <p className="text-[10px] text-[#8C9399] leading-relaxed">
              Your phone number and location are shared with the seller once you pay the delivery fee. The seller will call you to agree a delivery time.
            </p>
          </div>

          {/* Pay Inside App Warning Notice */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2.5 text-amber-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-relaxed">
              <strong>Notice:</strong> Always pay inside the app. Paying outside the app means no refund and can get your account closed.
            </span>
          </div>

          {/* Consolidated Financial Summary */}
          <div className="rounded-2xl bg-[#020406] border border-white/[0.12] p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9399]">
                Total Order Value
              </span>
              <span className="text-xl font-mono font-bold text-[#C8A96A]">
                {formatNaira(grandTotal)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-emerald-400 font-medium">Goods Value (Due on Delivery)</span>
                  <p className="text-[10px] text-[#8C9399]">Pay inside the app only after inspecting items</p>
                </div>
                <span className="text-emerald-400 font-mono font-semibold">{formatNaira(totalGoodsDue)}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-slate-300">
                    {totalUpfrontDelivery > 0 ? 'Transport Commitment (Paystack)' : 'Campus Pickup Fee'}
                  </span>
                  <p className="text-[10px] text-[#8C9399]">
                    {totalUpfrontDelivery > 0 ? 'Includes Paystack gateway processing fee' : 'Free campus checkpoint meetup'}
                  </p>
                </div>
                <span className="text-white font-mono font-medium">
                  {totalUpfrontDelivery > 0 ? formatNaira(totalUpfrontDelivery) : '₦0 (Free Pickup)'}
                </span>
              </div>

              <div className="border-t border-white/[0.08] pt-2 flex justify-between items-baseline">
                <div>
                  <span className="text-white font-semibold text-xs">Due Right Now (Upfront)</span>
                  <p className="text-[10px] text-[#8C9399]">
                    {totalUpfrontDelivery > 0 ? 'Transport fee to dispatch seller' : 'Zero upfront payment required'}
                  </p>
                </div>
                <span className="text-sm text-white font-mono font-bold">
                  {totalUpfrontDelivery > 0 ? formatNaira(totalUpfrontDelivery) : '₦0'}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className="w-full py-4 px-4 rounded-xl bg-[#C8A96A] hover:bg-[#D4AF37] text-[#020406] font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#020406]" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : totalUpfrontDelivery > 0 ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#020406]" />
                  <span>Pay Transport {formatNaira(totalUpfrontDelivery)} · Order Total {formatNaira(grandTotal)}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#020406]" />
                  <span>Confirm Pickup Order · {formatNaira(grandTotal)} Due on Inspection</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-[#8C9399] font-light">
              Securely processed via Paystack. You only pay for goods at the safe checkpoint after inspecting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
