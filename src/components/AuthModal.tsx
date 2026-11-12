import React, { useState } from 'react';
import { 
  X, 
  User, 
  Store, 
  ShieldCheck, 
  MapPin, 
  Sparkles,
  LogOut,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { store } from '../services/store';
import { loginWithGoogle, logoutUser } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSellerVerification?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenSellerVerification
}) => {
  const campuses = store.getCampuses().filter(c => c.id !== 'all');
  const activeCampus = store.getActiveCampus();
  const currentUser = store.getCurrentUser();
  const isSellerVerified = currentUser ? store.canUserSell(currentUser.id) : false;
  const isSignedIn = store.isSignedIn();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [selectedCampusId, setSelectedCampusId] = useState(
    currentUser?.campusId || (activeCampus.id === 'all' ? 'unizik' : activeCampus.id)
  );
  const [hostel, setHostel] = useState(currentUser?.hostel || 'Campus Hostel / Area');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.campusId) setSelectedCampusId(currentUser.campusId);
      if (currentUser.hostel) setHostel(currentUser.hostel);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFeedback(null);
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser && fbUser.email) {
        await store.handleGoogleLoginSuccess(fbUser, selectedCampusId, hostel, phone);

        if (fbUser.email.toLowerCase() === 'chukwuagoziemgracious@gmail.com') {
          setFeedback(`Welcome Super Admin, ${fbUser.displayName || 'Owner'}!`);
        } else {
          setFeedback(`Signed in as ${fbUser.displayName || fbUser.email}!`);
        }
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      console.warn('Google sign-in cancelled or error:', err);
      setFeedback('Google authentication was cancelled or paused.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      store.logout();
      setFeedback('Signed out successfully.');
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      console.error('Sign out error:', err);
      store.logout();
      onClose();
    }
  };

  const handleSaveProfileDetails = async () => {
    const campus = campuses.find((c) => c.id === selectedCampusId);
    await store.updateUserProfile({
      campusId: selectedCampusId,
      campusName: campus?.name,
      hostel,
      phone
    });
    setFeedback('Profile details & phone number saved.');
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-[20px] overflow-y-auto">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#020406]/95 backdrop-blur-[24px] border border-white/[0.12] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-light text-[#E9E6DF]">
                {isSignedIn ? 'Your Student Profile' : 'Student Authentication'}
              </h3>
              <p className="text-[10px] text-[#8C9399] uppercase tracking-wider font-light">
                Abbason Hub Campus Network
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-[#8C9399] hover:text-[#E9E6DF] flex items-center justify-center border border-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="p-2.5 bg-emerald-950/80 border-b border-emerald-500/50 text-emerald-200 text-xs text-center font-medium">
            {feedback}
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Active Profile Card (Authenticated) or Guest Status Banner */}
          {isSignedIn && currentUser ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/50 flex items-center justify-center font-bold text-base text-[#C8A96A] shrink-0 font-serif">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-white text-sm truncate">{currentUser.name}</span>
                  {isSellerVerified && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Vendor</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">{currentUser.email}</div>
                <div className="text-[10px] text-[#8C9399] mt-1 flex items-center gap-1 font-light">
                  <MapPin className="w-3 h-3 text-[#C8A96A]" />
                  <span className="truncate">{currentUser.campusName || 'Select Campus'} · {currentUser.hostel || 'Hostel'}</span>
                </div>
                <div className="text-[10px] text-[#8C9399] mt-0.5 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-[#C8A96A]" />
                  <span className={currentUser.phone ? "text-slate-300" : "text-amber-400 font-sans"}>
                    {currentUser.phone || 'No phone number set — please add below'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
              <div className="text-xs font-medium text-[#E9E6DF]">Browsing as Guest</div>
              <p className="text-[11px] text-[#8C9399] font-light">
                Sign in with your Google account to access campus orders, checkout, and verified seller features.
              </p>
            </div>
          )}

          {!isSignedIn ? (
            <div className="space-y-4">
              <div className="text-[11px] text-[#8C9399] leading-relaxed font-light text-center">
                Sign in securely with your student Google Account to buy and sell on your campus feed.
              </div>

              {/* Campus Preference Selection */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Your Campus
                  </label>
                  <select
                    value={selectedCampusId}
                    onChange={(e) => setSelectedCampusId(e.target.value)}
                    className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Hostel / Hall of Residence
                  </label>
                  <input
                    type="text"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Moremi Hall or Perm Site Lodge"
                    className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Mobile / WhatsApp Phone Number *</span>
                    <span className="text-[9px] text-[#C8A96A] font-normal lowercase">Required for orders</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                      🇳🇬 +234
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl pl-16 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-[#8C9399] mt-1 font-light">
                    Used by sellers and buyers to coordinate safe on-campus drop-offs & pickup.
                  </p>
                </div>
              </div>

              {/* Sole Sign-In Method: Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.15] text-[#E9E6DF] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Campus Preferences & Phone Edit */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Registered Campus
                  </label>
                  <select
                    value={selectedCampusId}
                    onChange={(e) => setSelectedCampusId(e.target.value)}
                    className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Delivery Hostel / Drop-Off Point
                  </label>
                  <input
                    type="text"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Moremi Hall or Perm Site Lodge"
                    className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Registered Phone / WhatsApp Number *</span>
                    {!phone && <span className="text-amber-400 text-[9px] lowercase font-normal">Action needed</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                      🇳🇬 +234
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl pl-16 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfileDetails}
                  className="w-full py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-[#C8A96A] border border-[#C8A96A]/30 text-xs font-medium cursor-pointer transition-colors"
                >
                  Save Profile Details & Phone
                </button>
              </div>

              {/* Seller Verification Link if not yet verified */}
              {!isSellerVerified && onOpenSellerVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSellerVerification();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 border border-[#C8A96A]/40 text-[#C8A96A] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply for Verified Vendor Badge</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
