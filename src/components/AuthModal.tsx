import React, { useState } from 'react';
import { 
  X, 
  User, 
  Store, 
  ShieldCheck, 
  MapPin, 
  Lock, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { store } from '../services/store';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminLogin?: () => void;
  onOpenSellerVerification?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenAdminLogin,
  onOpenSellerVerification
}) => {
  const campuses = store.getCampuses().filter(c => c.id !== 'all');
  const activeCampus = store.getActiveCampus();
  const currentUser = store.getCurrentUser();
  const isSellerVerified = store.canUserSell(currentUser.id);
  const verificationStatus = store.getSellerVerificationStatus(currentUser.id);

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [campusId, setCampusId] = useState(activeCampus.id === 'all' ? 'unizik' : activeCampus.id);
  const [hostel, setHostel] = useState('Campus Hostel Block');
  const [storeName, setStoreName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isRegister) {
      if (!name.trim() || !email.trim()) return;
      const newUser = store.registerUser({
        name,
        email,
        phone: phone || '+234 800 000 0000',
        role,
        campusId,
        hostel,
        storeName: role === 'seller' ? storeName || `${name}'s Shop` : undefined
      });
      setFeedback(`Welcome to Abbason Hub, ${newUser.name}!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      // Find existing user or switch
      const existing = store.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        store.setCurrentUser(existing);
        setFeedback(`Logged in as ${existing.name}!`);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Register demo profile seamlessly without window.alert
        const registered = store.registerUser({
          name: email.split('@')[0],
          email,
          phone: '+234 814 000 0000',
          role: 'student',
          campusId: campusId || 'unizik',
          hostel: 'Campus Area'
        });
        setFeedback(`Created account for ${registered.name}!`);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }
  };

  const handleSelectPreloadedStudent = (user: typeof currentUser) => {
    store.setCurrentUser(user);
    setFeedback(`Switched profile to ${user.name}`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-purple-900/70 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-[#f3c84b]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Student Account
              </h3>
              <p className="text-[11px] text-slate-400">
                Abbason Hub · Multi-Campus Nigeria
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

        {/* Current Active User Card */}
        <div className="p-4 bg-gradient-to-r from-purple-950/60 to-slate-900 border-b border-purple-950 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Profile</span>
              <div className="text-sm font-bold text-white">{currentUser.name}</div>
              <div className="text-slate-400 text-[11px]">{currentUser.email}</div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Campus</span>
              <span className="text-[#f3c84b] font-medium">{currentUser.campusName.split('(')[0]}</span>
              {isSellerVerified ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Seller
                </span>
              ) : verificationStatus === 'pending' ? (
                <span className="text-amber-400 text-[10px] font-bold block mt-0.5">
                  Verification Pending
                </span>
              ) : (
                <span className="text-slate-400 text-[10px] block mt-0.5">
                  Student Buyer
                </span>
              )}
            </div>
          </div>

          {!isSellerVerified && onOpenSellerVerification && (
            <button
              onClick={() => {
                onClose();
                onOpenSellerVerification();
              }}
              className="mt-3 w-full py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/70 border border-purple-700/60 text-[#f3c84b] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply to Become a Verified Seller</span>
            </button>
          )}
        </div>

        {feedback && (
          <div className="p-2.5 bg-emerald-950 border-b border-emerald-500/50 text-emerald-200 text-xs text-center font-semibold">
            {feedback}
          </div>
        )}

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex border-b border-purple-950 bg-[#0B1120] text-xs">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              !isRegister
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Switch / Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2.5 font-semibold transition-colors border-b-2 cursor-pointer ${
              isRegister
                ? 'border-[#f3c84b] text-[#f3c84b]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Student Profile
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {!isRegister ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Enter Your Student Email
                </label>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@university.edu.ng"
                    className="flex-1 bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* Quick Profile Switcher for Testing */}
              <div className="pt-2 border-t border-purple-950/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Sample Campus Accounts:
                </span>
                <div className="space-y-1.5">
                  {store.getUsers().slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectPreloadedStudent(u)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.id === u.id
                          ? 'bg-purple-950/80 border-[#f3c84b] text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.isVerifiedSeller && (
                            <span className="text-emerald-400 text-[10px]">✓ Verified Vendor</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.campusName.split('(')[0]} · {u.role}</div>
                      </div>
                      {currentUser.id === u.id && (
                        <span className="text-xs text-[#f3c84b] font-bold">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Ebuka Okonkwo"
                  className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  University / Campus *
                </label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Student Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="student@campus.edu.ng"
                    className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+234 810 000 0000"
                    className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Hostel / Commercial Lodge
                </label>
                <input
                  type="text"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="e.g. Moremi Hall or Perm Site Lodge"
                  className="w-full bg-[#0B1120] border border-slate-800 focus:border-[#f3c84b] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-2"
              >
                <span>Register Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Discreet Admin Portal Link at bottom for Owner */}
          <div className="pt-3 border-t border-purple-950/60 text-center">
            {onOpenAdminLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminLogin();
                }}
                className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Abbason Platform Owner & Administration Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
