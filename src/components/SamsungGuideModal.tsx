import React from 'react';
import { X, BatteryCharging, CheckCircle2, ShieldAlert, Smartphone } from 'lucide-react';

interface SamsungGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SamsungGuideModal: React.FC<SamsungGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Samsung Galaxy M15 5G Setup Guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Samsung Galaxy M15 5G Setup</h2>
              <p className="text-xs text-cyan-400 font-mono">Model SM-M156B • One UI 8.0 / Android 16</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 flex items-start gap-2.5 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Samsung One UI 8.0 aggressively freezes background services to save battery. Follow these 4 native setup steps to guarantee uninterrupted 20-minute break alerts:
          </p>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[10px]">1</span>
              <span>Turn ON Accessibility Service</span>
            </div>
            <p className="text-slate-300 pl-7">
              Go to <strong className="text-cyan-300">Settings</strong> → <strong className="text-cyan-300">Accessibility</strong> → <strong className="text-cyan-300">Installed apps</strong> (or Installed services) → Enable <strong className="text-white">20-20-20 Eye Break Assistant</strong>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[10px]">2</span>
              <span>Add to 'Never Sleeping Apps'</span>
            </div>
            <p className="text-slate-300 pl-7">
              Go to <strong className="text-cyan-300">Settings</strong> → <strong className="text-cyan-300">Battery</strong> → <strong className="text-cyan-300">Background usage limits</strong> → <strong className="text-cyan-300">Never sleeping apps</strong> → Tap <strong className="text-white">(+)</strong> and select this app.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[10px]">3</span>
              <span>Set Battery to 'Unrestricted'</span>
            </div>
            <p className="text-slate-300 pl-7">
              Long-press the app icon → Tap <strong className="text-cyan-300">App Info (i)</strong> → <strong className="text-cyan-300">Battery</strong> → Choose <strong className="text-white">Unrestricted</strong> (instead of Optimized).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[10px]">4</span>
              <span>Allow 'Appear on Top'</span>
            </div>
            <p className="text-slate-300 pl-7">
              In App Info, ensure <strong className="text-cyan-300">Appear on top</strong> permission is toggled ON to permit full-screen overlay projection.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50"
        >
          Got It, Done!
        </button>
      </div>
    </div>
  );
};
