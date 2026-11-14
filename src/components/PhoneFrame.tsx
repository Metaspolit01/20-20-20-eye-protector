import React from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  isScreenOff: boolean;
  currentTimeString?: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  isScreenOff,
  currentTimeString = '09:41',
}) => {
  return (
    <div className="relative mx-auto flex flex-col items-center">
      {/* Outer Samsung Galaxy M15 5G Chassis */}
      <div className="relative w-[375px] h-[780px] bg-[#17191c] rounded-[48px] p-[10px] shadow-2xl ring-1 ring-white/15 shadow-cyan-950/40 select-none">
        {/* Antenna bands & subtle border highlight */}
        <div className="absolute inset-0 rounded-[48px] border-[2px] border-slate-700/60 pointer-events-none" />

        {/* Physical buttons on right edge (Power / Fingerprint & Volume rocker) */}
        <div className="absolute -right-[3px] top-[140px] w-[3px] h-[60px] bg-slate-600 rounded-r-md" />
        <div className="absolute -right-[3px] top-[220px] w-[3px] h-[44px] bg-slate-600 rounded-r-md" />

        {/* Screen Bezel Area */}
        <div className="relative w-full h-full bg-black rounded-[38px] overflow-hidden flex flex-col">
          {/* Top Speaker Earpiece Grille */}
          <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[52px] h-[3.5px] bg-neutral-800 rounded-full z-40" />

          {/* Samsung Infinity-U Waterdrop Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[34px] h-[22px] bg-black rounded-b-[18px] z-30 flex items-center justify-center">
            <div className="w-[10px] h-[10px] rounded-full bg-neutral-900 border border-neutral-700/80 flex items-center justify-center">
              <div className="w-[4px] h-[4px] rounded-full bg-cyan-950/80" />
            </div>
          </div>

          {/* Screen Content or Black Screen when OFF */}
          {isScreenOff ? (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-slate-600 p-6 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center mb-3">
                <span className="text-xl">🌙</span>
              </div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Samsung Galaxy M15 5G</p>
              <p className="text-sm text-slate-400 font-semibold mt-1">Screen is Powered OFF</p>
              <p className="text-[11px] text-slate-600 mt-2 max-w-[220px]">
                Accumulated screen-on duration is paused and preserved in memory/DataStore.
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#031024]">
              {/* Samsung One UI 8.0 Status Bar */}
              <div className="h-8 w-full px-5 pt-1.5 flex items-center justify-between text-white text-[11px] font-medium z-20 shrink-0">
                <span className="font-mono tracking-tight">{currentTimeString}</span>
                <div className="flex items-center gap-1.5 opacity-90">
                  <span className="text-[9px] font-bold tracking-tighter bg-cyan-500/20 text-cyan-300 px-1 rounded">5G</span>
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px]">85%</span>
                    <Battery className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* In-Screen App Content */}
              <div className="flex-1 w-full overflow-hidden relative flex flex-col">
                {children}
              </div>

              {/* Samsung Navigation Bar Pill */}
              <div className="h-4 w-full flex items-center justify-center shrink-0 bg-transparent z-20 pointer-events-none">
                <div className="w-28 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Device Badge under mockup */}
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono font-medium text-slate-300">Samsung Galaxy M15 5G (SM-M156B)</span>
        <span className="text-slate-600">•</span>
        <span className="text-cyan-400">Android 16 • One UI 8.0</span>
      </div>
    </div>
  );
};
