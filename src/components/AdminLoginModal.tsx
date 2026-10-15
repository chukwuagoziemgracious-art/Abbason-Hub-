import React, { useState } from 'react';
import { X, Shield, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const valid = store.authenticateAdmin(passcode);
    setLoading(false);

    if (valid) {
      onSuccess();
      onClose();
    } else {
      setError('Incorrect admin authorization key. Access is strictly restricted to platform administration.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-amber-500/40 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#f3c84b] mx-auto flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-950/50">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">Abbason Administration</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Restricted moderation area. Only authorized platform owners and administrators can access this portal.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Admin Passcode / Master Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                placeholder="Enter admin passcode (e.g. abbason2026)"
                className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none pr-9 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Default owner key: <span className="font-mono text-slate-400">abbason2026</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full py-2.5 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-md cursor-pointer"
          >
            <span>Unlock Admin Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
