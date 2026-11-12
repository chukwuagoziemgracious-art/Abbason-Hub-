import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building, 
  CreditCard, 
  FileText,
  Sparkles,
  Phone
} from 'lucide-react';
import { store } from '../services/store';

interface SellerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SellerVerificationModal: React.FC<SellerVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const currentUser = store.getCurrentUser();
  const campuses = store.getCampuses().filter(c => c.id !== 'all');
  const activeCampus = store.getActiveCampus();

  const [matricNumber, setMatricNumber] = useState('');
  const [facultyDepartment, setFacultyDepartment] = useState('');
  const [level, setLevel] = useState('300 Level');
  const [hostelShopLocation, setHostelShopLocation] = useState(currentUser?.hostel || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [idDocumentType, setIdDocumentType] = useState('University Student ID Card');
  const [bankName, setBankName] = useState('Access Bank Nigeria');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(currentUser?.name || '');
  const [categoriesToSell, setCategoriesToSell] = useState('Electronics & Gadgets');
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
  );
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFastVerifying, setIsFastVerifying] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.hostel && !hostelShopLocation) setHostelShopLocation(currentUser.hostel);
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
      if (currentUser.name && !accountName) setAccountName(currentUser.name);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const currentStatus = currentUser ? store.getSellerVerificationStatus(currentUser.id) : 'not_applied';
  const isOwner = currentUser?.email?.toLowerCase() === 'chukwuagoziemgracious@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await store.submitSellerVerification({
        matricNumber,
        facultyDepartment,
        level,
        hostelShopLocation,
        idDocumentType,
        idCardPhotoUrl,
        bankName,
        accountNumber,
        accountName,
        categoriesToSell,
        phone
      });
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Verification submit error:', err);
      setSubmitError(err.message || 'Verification submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0B1120] border border-white/[0.1] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <ShieldCheck className="w-5 h-5 text-[#C8A96A]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white font-serif">
                Campus Seller Verification
              </h3>
              <p className="text-[11px] text-[#8C9399]">
                Only verified university vendors can sell on Abbason Hub
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center border border-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Trust Banner */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-white">Why is verification required?</p>
                <p className="text-[#8C9399] text-[11px] leading-relaxed font-light">
                  To protect fellow campus students from counterfeit items and fraud, all sellers must verify their student status and settlement account before posting listings.
                </p>
              </div>
            </div>
          </div>

          {!currentUser ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#C8A96A]/20 text-[#C8A96A] mx-auto flex items-center justify-center border border-[#C8A96A]/40">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white font-serif">
                Sign In Required
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Please sign in with your student account before applying for verified seller status.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : currentStatus === 'verified' ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h4 className="text-lg font-bold text-white font-serif">
                You Are a Verified Campus Vendor!
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your student vendor credentials and settlement details are active. You can list items, manage inventory, and receive direct Paystack student payouts.
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs max-w-sm mx-auto space-y-1 text-slate-300">
                <div><span className="text-slate-400 font-medium">Vendor:</span> {currentUser.name}</div>
                <div><span className="text-slate-400 font-medium">Campus:</span> {activeCampus.name}</div>
                <div><span className="text-slate-400 font-medium">WhatsApp / Call:</span> {currentUser.phone || 'Configured'}</div>
                <div><span className="text-slate-400 font-medium">Status:</span> <span className="text-emerald-400 font-bold">Verified Student Vendor ✓</span></div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#C8A96A] hover:bg-[#b89858] text-black text-xs font-bold cursor-pointer transition-colors shadow-lg"
              >
                Done
              </button>
            </div>
          ) : currentStatus === 'pending' || submittedSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
                <Clock className="w-8 h-8 animate-pulse text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-white font-serif">
                Application Under Admin Review
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your matriculation credentials, WhatsApp number, and NUBAN bank account have been submitted to the Abbason moderation queue. Once reviewed, you will be notified and your badge will be activated.
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs max-w-sm mx-auto space-y-1 text-slate-400">
                <div><span className="text-slate-200 font-medium">Applicant:</span> {currentUser.name}</div>
                <div><span className="text-slate-200 font-medium">Campus:</span> {activeCampus.name}</div>
                <div><span className="text-slate-200 font-medium">WhatsApp / Phone:</span> {phone || currentUser.phone || 'Recorded'}</div>
                <div><span className="text-slate-200 font-medium">Status:</span> <span className="text-amber-400 font-bold">Pending Review</span></div>
              </div>

              {/* Instant Verification Helper for Owner & Testing */}
              {isOwner && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsFastVerifying(true);
                      await store.fastVerifySeller(currentUser.id);
                      setIsFastVerifying(false);
                      setSubmittedSuccess(false);
                      if (onSuccess) onSuccess();
                    }}
                    disabled={isFastVerifying}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isFastVerifying ? 'Activating...' : 'Instant Verify (Owner Access)'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
                  {submitError}
                </div>
              )}

              {/* Step 1: Student Credentials */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="font-medium text-white text-xs flex items-center gap-1.5 uppercase tracking-wider text-[#C8A96A]">
                  <FileText className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>1. University Student Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Matriculation / Student ID No. *
                    </label>
                    <input
                      type="text"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      required
                      placeholder="e.g. 2022/ENG/10291"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Level *
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="100 Level">100 Level</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                      <option value="500 Level (Final Year)">500 Level (Final Year)</option>
                      <option value="Postgraduate">Postgraduate (PG)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Faculty & Department *
                    </label>
                    <input
                      type="text"
                      value={facultyDepartment}
                      onChange={(e) => setFacultyDepartment(e.target.value)}
                      required
                      placeholder="e.g. Engineering / Electrical"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Hostel / Lodge Location *
                    </label>
                    <input
                      type="text"
                      value={hostelShopLocation}
                      onChange={(e) => setHostelShopLocation(e.target.value)}
                      required
                      placeholder="e.g. Diamond Valley Hostel Room 12"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                    <span>Student WhatsApp / Contact Phone Number *</span>
                    <span className="text-[9px] text-[#C8A96A] font-normal lowercase">Required for order notifications</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono">
                      🇳🇬 +234
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="08012345678"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl pl-16 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Proof of Student Status *
                  </label>
                  <select
                    value={idDocumentType}
                    onChange={(e) => setIdDocumentType(e.target.value)}
                    className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="University Student ID Card">University Student ID Card</option>
                    <option value="School Portal Course Registration Slip">School Portal Course Registration Slip</option>
                    <option value="Faculty Clearance Document">Faculty Clearance Document</option>
                    <option value="Jamb Admission Letter">Jamb Admission Letter</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Bank Settlement Details */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="font-medium text-white text-xs flex items-center gap-1.5 uppercase tracking-wider text-[#C8A96A]">
                  <CreditCard className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>2. Settlement Bank Account (For Direct Paystack Payouts)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Nigerian Bank Name *
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="Access Bank Nigeria">Access Bank Nigeria</option>
                      <option value="Zenith Bank PLC">Zenith Bank PLC</option>
                      <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTBank)</option>
                      <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                      <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                      <option value="OPay Digital Services">OPay Digital Services</option>
                      <option value="Kuda Bank (Microfinance)">Kuda Bank (Microfinance)</option>
                      <option value="PalmPay Nigeria">PalmPay Nigeria</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      10-Digit NUBAN Account Number *
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="0123456789"
                      className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Beneficiary Account Name *
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    placeholder="Must match student registration name"
                    className="w-full bg-[#0B1120] border border-white/[0.08] focus:border-[#C8A96A] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Code of Conduct Checkbox */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[#C8A96A]/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agree-seller"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#C8A96A] focus:ring-[#C8A96A]"
                />
                <label htmlFor="agree-seller" className="text-[11px] text-[#8C9399] leading-relaxed cursor-pointer font-light">
                  I agree to Abbason Hub terms: I understand that the buyer pays transport upfront and settles the item price via Paystack upon physical inspection. Platform commission is 3% (capped at ₦2,000).
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !agreeTerms || !matricNumber || !accountNumber}
                className="w-full py-3 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-lg shadow-[#f3c84b]/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit Application for Admin Approval</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
