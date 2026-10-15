import React, { useState, useMemo } from 'react';
import { X, Search, Check, Building2, Smartphone, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { NIGERIAN_BANKS, NigerianBank, searchNigerianBanks } from '../data/nigerianBanks';

interface BankSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBankName?: string;
  currentAccountNumber?: string;
  currentAccountName?: string;
  onSave: (bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
  }) => void;
}

export const BankSwitcherModal: React.FC<BankSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentBankName = 'PalmPay',
  currentAccountNumber = '',
  currentAccountName = '',
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>(currentBankName);
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState(
    currentAccountNumber.replace(/\*/g, '') || ''
  );
  const [accountName, setAccountName] = useState(currentAccountName || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredBanks = useMemo(() => {
    return searchNigerianBanks(searchQuery);
  }, [searchQuery]);

  const popularBanks = useMemo(() => {
    return NIGERIAN_BANKS.filter((b) => b.popular);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const effectiveBankName = selectedBank === 'other' ? customBankName.trim() : selectedBank;

    if (!effectiveBankName) {
      setError('Please select or specify your Nigerian bank or digital wallet.');
      return;
    }

    const cleanAcc = accountNumber.replace(/\D/g, '');
    if (cleanAcc.length !== 10) {
      setError('Please enter a valid 10-digit Nigerian NUBAN account number.');
      return;
    }

    if (!accountName.trim()) {
      setError('Please enter the account holder name as registered with your bank.');
      return;
    }

    const matchedBank = NIGERIAN_BANKS.find((b) => b.name === effectiveBankName);

    onSave({
      bankName: effectiveBankName,
      accountNumber: cleanAcc,
      accountName: accountName.trim(),
      bankCode: matchedBank?.code
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] border border-purple-900/70 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-950/80 bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Change Settlement Bank / Payout Account
              </h3>
              <p className="text-xs text-slate-400">
                Supports all Nigerian banks & fintechs (PalmPay, OPay, Moniepoint, etc.)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Payout bank updated successfully!</span>
            </div>
          )}

          {/* Quick Popular Banks & Fintechs */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Popular Student Wallets & Banks
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {popularBanks.slice(0, 8).map((bank) => {
                const isSelected = selectedBank === bank.name;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      setSelectedBank(bank.name);
                      setCustomBankName('');
                    }}
                    className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#f3c84b]/15 border-[#f3c84b] text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0"
                      style={{ backgroundColor: bank.color || '#4c1d95' }}
                    >
                      {bank.logoInitial}
                    </div>
                    <span className="truncate text-[11px] font-medium">{bank.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#f3c84b] ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search All Nigerian Banks */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Or Search All Nigerian Banks
              </label>
              <span className="text-[10px] text-slate-500">{filteredBanks.length} available</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PalmPay, OPay, Access, Zenith, Moniepoint..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c84b]"
              />
            </div>

            <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-1 divide-y divide-slate-800/60 space-y-0.5">
              {filteredBanks.map((bank) => {
                const isSelected = selectedBank === bank.name;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      setSelectedBank(bank.name);
                      setCustomBankName('');
                    }}
                    className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/60 text-[#f3c84b] font-semibold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] text-white shrink-0"
                        style={{ backgroundColor: bank.color || '#4c1d95' }}
                      >
                        {bank.logoInitial}
                      </div>
                      <span className="truncate">{bank.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize shrink-0 font-normal">
                        ({bank.category})
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#f3c84b] shrink-0 ml-2" />}
                  </button>
                );
              })}

              {/* Other Bank option */}
              <button
                type="button"
                onClick={() => setSelectedBank('other')}
                className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between text-xs cursor-pointer ${
                  selectedBank === 'other'
                    ? 'bg-purple-950/60 text-[#f3c84b] font-semibold'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <span>+ Other Nigerian Bank / Microfinance Bank</span>
                {selectedBank === 'other' && <Check className="w-3.5 h-3.5 text-[#f3c84b]" />}
              </button>
            </div>
          </div>

          {selectedBank === 'other' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">
                Enter Bank / Institution Name
              </label>
              <input
                type="text"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                placeholder="e.g. Hope PSBank, Sparkle MFB, etc."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c84b]"
                required
              />
            </div>
          )}

          {/* Account Number */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">
                10-Digit NUBAN Account Number / Wallet Number
              </label>
              <span className="text-[10px] text-slate-500">For OPay/PalmPay: usually your phone number</span>
            </div>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 8066950607 or 0123456789"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono tracking-wider placeholder-slate-500 focus:outline-none focus:border-[#f3c84b]"
              required
            />
          </div>

          {/* Account Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">
              Account Holder Name (As registered with bank)
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Chukwuagoziem Gracious / Emeka Okonkwo"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c84b]"
              required
            />
          </div>

          {/* Safety & Non-Custodial Note */}
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-200/90 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transparent Settlement Notice</span>
            </div>
            <p>
              Abbason Hub does not hold your funds. Payouts are dispatched directly to your designated bank account once the buyer verifies their 6-digit delivery OTP in person.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#f3c84b] hover:bg-[#eab308] text-slate-950 font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <span>Save Bank Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
