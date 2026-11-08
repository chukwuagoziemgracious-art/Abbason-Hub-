import React, { useState } from 'react';
import { X, MessageSquare, Phone, Copy, Check, Clock, ShieldCheck, Sparkles, Send, ExternalLink } from 'lucide-react';

interface WhatsAppContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppContactModal: React.FC<WhatsAppContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen) return null;

  const whatsappNumber = '+2348066950607';
  const displayPhone = '08066950607';

  const topics = [
    {
      id: 'general',
      label: 'General Inquiry',
      prefill: 'Hello Abbason Hub! I have a general inquiry about the campus marketplace.',
    },
    {
      id: 'order_help',
      label: 'Order & Delivery',
      prefill: 'Hello Abbason Hub! I need assistance with my order delivery and hostel location.',
    },
    {
      id: 'verification',
      label: 'Seller Verification',
      prefill: 'Hello Abbason Hub! I would like an update on my verified seller application.',
    },
    {
      id: 'checkpoints',
      label: 'Safety & Checkpoints',
      prefill: 'Hello Abbason Hub! I have a question regarding campus safe meetup points.',
    },
  ];

  const currentTopic = topics.find((t) => t.id === selectedTopic) || topics[0];
  const finalMessage = customMessage.trim() || currentTopic.prefill;
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(finalMessage)}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(displayPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-[20px]">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#020406]/95 backdrop-blur-[24px] border border-white/[0.12] p-6 sm:p-7 shadow-[0_40px_100px_rgba(0,0,0,0.9)] text-[#E9E6DF] overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C9399] hover:text-[#E9E6DF] hover:bg-white/[0.05] transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with WhatsApp Logo */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shrink-0">
            {/* WhatsApp Icon SVG */}
            <svg className="w-6 h-6 fill-emerald-400" viewBox="0 0 24 24">
              <path d="M12.031 2C6.496 2 2 6.494 2 12.029c0 1.768.461 3.493 1.336 5.013L2 22l5.127-1.344a9.98 9.98 0 0 0 4.904 1.282h.005c5.532 0 10.028-4.494 10.028-10.029A10.01 10.01 0 0 0 12.031 2zm5.871 14.167c-.244.686-1.42 1.31-1.956 1.378-.49.062-1.127.088-3.642-.952-3.219-1.331-5.289-4.577-5.45-4.792-.158-.215-1.306-1.737-1.306-3.314 0-1.577.828-2.353 1.12-2.67.294-.318.641-.397.855-.397.215 0 .43.003.619.012.2.01.468-.076.732.558.27.65.922 2.25.998 2.413.078.163.13.353.023.568-.108.215-.162.35-.323.543-.162.193-.342.431-.489.578-.162.163-.331.341-.142.666.19.324.843 1.391 1.808 2.252 1.243 1.108 2.292 1.452 2.617 1.614.324.162.513.136.702-.081.189-.217.81-.945 1.026-1.27.216-.324.432-.27.728-.162.296.108 1.889.89 2.213 1.052.324.162.54.243.621.378.08.135.08.784-.164 1.47z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-light text-[#E9E6DF] font-serif tracking-wide">Chat with Abbason Hub</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-xs text-[#8C9399] mt-0.5 font-light">
              Direct official WhatsApp support for buyers and verified campus sellers.
            </p>
          </div>
        </div>

        {/* Quick Phone Number Card with Copy */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3.5 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A] shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] font-medium text-[#8C9399] uppercase tracking-[0.2em]">
                Official Support Line
              </div>
              <div className="text-sm font-mono font-medium text-[#E9E6DF] tracking-wider">
                {displayPhone}
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyPhone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-light text-[#E9E6DF] transition-colors border border-white/[0.1] cursor-pointer"
            title="Copy WhatsApp phone number"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8C9399]" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Select Inquiry Topic */}
        <div className="mb-4">
          <label className="block text-xs font-light text-[#8C9399] mb-2 tracking-wide">
            What can we help you with?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTopic(t.id);
                  setCustomMessage('');
                }}
                className={`p-2.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                  selectedTopic === t.id
                    ? 'bg-white/[0.06] border-[#C8A96A] text-[#C8A96A]'
                    : 'bg-white/[0.02] border-white/[0.08] text-[#8C9399] hover:text-[#E9E6DF] hover:bg-white/[0.04]'
                }`}
              >
                <div className="font-light tracking-wide">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Preview or Custom Note */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-light text-[#8C9399]">
              Your message preview:
            </label>
            <span className="text-[10px] text-[#8C9399]/60 font-light">Edit before sending</span>
          </div>
          <textarea
            value={customMessage || currentTopic.prefill}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-[#020406]/90 border border-white/[0.1] p-2.5 text-xs text-[#E9E6DF] placeholder-[#8C9399]/50 focus:outline-none focus:border-[#C8A96A] font-light"
          />
        </div>

        {/* Action Button: Launch WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] cursor-pointer no-underline"
        >
          <Send className="w-4 h-4 text-slate-950" />
          <span>Open WhatsApp & Start Chat</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-900 ml-1 opacity-70" />
        </a>

        {/* Operating Hours and Trust Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#8C9399] font-light">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Support: Daily 8:00 AM – 9:00 PM WAT</span>
          </div>
          <div className="flex items-center gap-1 text-[#C8A96A]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
