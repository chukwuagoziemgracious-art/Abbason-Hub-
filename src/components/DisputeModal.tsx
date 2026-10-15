import React, { useState } from 'react';
import { X, Flag, AlertTriangle, ShieldAlert } from 'lucide-react';
import { store } from '../services/store';
import { Order } from '../types';

interface DisputeModalProps {
  order: Order | null;
  onClose: () => void;
  onDisputeFiled: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  order,
  onClose,
  onDisputeFiled,
}) => {
  const [reason, setReason] = useState('Seller did not show up at designated delivery location');
  const [description, setDescription] = useState('');

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.fileComplaint(order.id, reason, description);
    alert('Dispute submitted! Escrow payout is now frozen pending admin review.');
    onDisputeFiled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-rose-900/80 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Report Issue on Order #{order.orderNumber}
              </h3>
              <p className="text-[11px] text-slate-400">
                Seller: {order.sellerName}
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

        {/* Freezing Warning */}
        <div className="p-3.5 bg-rose-950/40 border-b border-rose-900/40 text-rose-200 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Filing this report places an immediate freeze on the seller's escrow payout. Our campus mediation team will review your case.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Select Reason for Dispute *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-400"
            >
              <option value="Seller did not show up at designated delivery location">
                Seller did not show up at designated location
              </option>
              <option value="Item was defective or broken upon inspection">
                Item was defective or damaged upon inspection
              </option>
              <option value="Item does not match specifications or photos">
                Item does not match specifications or photos
              </option>
              <option value="Wrong item delivered">
                Wrong item delivered
              </option>
              <option value="Seller demanded cash outside Abbason Hub">
                Seller demanded cash outside Abbason Hub
              </option>
              <option value="Other grievance">
                Other grievance
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Explain What Happened *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details (e.g. waited 40 mins at Ifite Gate, seller not answering calls...)"
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Submit & Freeze Escrow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
