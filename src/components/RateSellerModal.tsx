import React, { useState } from 'react';
import { X, Star, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { store } from '../services/store';
import { Order } from '../types';

interface RateSellerModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const RateSellerModal: React.FC<RateSellerModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  const getRatingFeedback = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Outstanding seller! Fast handover & perfect condition';
      case 4:
        return 'Great experience! Good student vendor';
      case 3:
        return 'Satisfactory handover, item as described';
      case 2:
        return 'Below expectation or delayed delivery';
      case 1:
        return 'Poor experience with this vendor';
      default:
        return 'Rate your experience';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    store.addSellerReview({
      sellerId: order.sellerId,
      orderId: order.id,
      rating,
      comment: comment.trim()
    });

    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setComment('');
      onClose();
      if (onSubmitted) onSubmitted();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-purple-900/70 shadow-2xl overflow-hidden my-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40 animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-serif">Review Published!</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Thank you for contributing to campus trust on Abbason Hub. Your review is now visible to other students.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-[#f3c84b]">
                <Star className="w-5 h-5 fill-[#f3c84b]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-serif">Rate Your Seller</h3>
                <p className="text-[11px] text-slate-400">
                  Order #{order.orderNumber} · {order.sellerName}
                </p>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{order.sellerName}</span>
                <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Vendor
                </span>
              </div>
              <span className="text-[11px] text-purple-300 font-mono">
                {order.items.length} item(s) delivered
              </span>
            </div>

            {/* Star Rating Selector */}
            <div className="text-center py-2 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-slate-600 hover:scale-125 transition-transform cursor-pointer"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= currentDisplayRating
                          ? 'text-[#f3c84b] fill-[#f3c84b] drop-shadow-[0_0_8px_rgba(243,200,75,0.4)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-medium text-amber-300 h-5">
                {getRatingFeedback(currentDisplayRating)}
              </p>
            </div>

            {/* Review Comment Textarea */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                Share details about the handover & item condition
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Delivered on time at hostel gate, let me test the gadget before sharing OTP, very polite student seller..."
                className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="w-full py-3 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-lg shadow-[#f3c84b]/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit Verified Review</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
