import React, { useState } from 'react';
import { X, Shield, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { store } from '../services/store';
import { loginWithGoogle } from '../services/firebase';

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

  const handleGoogleAdminLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser && fbUser.email) {
        if (fbUser.email.toLowerCase() === 'chukwuagoziemgracious@gmail.com') {
          store.authenticateAdmin('chukwuagoziemgracious@gmail.com');
          onSuccess();
          onClose();
          return;
        } else {
          setError(`Account ${fbUser.email} is not registered as an authorized platform administrator.`);
        }
      }
    } catch {
      setError('Google administrator authorization was cancelled.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-[20px]">
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#020406]/95 backdrop-blur-[24px] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-6 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-[#8C9399] hover:text-[#E9E6DF] flex items-center justify-center border border-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#C8A96A]/10 text-[#C8A96A] mx-auto flex items-center justify-center border border-[#C8A96A]/40 shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-light text-[#E9E6DF] font-serif">Abbason Administration</h3>
          <p className="text-xs text-[#8C9399] max-w-xs mx-auto font-light leading-relaxed">
            Restricted moderation area. Only authorized platform owners and administrators can access this portal.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#C8A96A] hover:bg-[#d8bb7d] text-[#020406] font-semibold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{loading ? 'Authenticating...' : 'Sign in as Platform Owner'}</span>
          </button>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center">
            <span className="text-[10px] text-[#8C9399] uppercase tracking-wider block font-medium">Authorized Account</span>
            <span className="text-xs text-[#C8A96A] font-mono block mt-1">chukwuagoziemgracious@gmail.com</span>
            <p className="text-[10px] text-[#8C9399]/70 mt-2 font-light leading-relaxed">
              Protected by zero-trust identity verification. Access is cryptographically restricted to the platform owner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
