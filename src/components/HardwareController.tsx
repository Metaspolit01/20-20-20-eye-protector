import React from 'react';
import {
  Power,
  Lock,
  Unlock,
  PhoneCall,
  PhoneOff,
  FastForward,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { EngineState } from '../engine/screenTimeEngine';

interface HardwareControllerProps {
  state: EngineState;
  isAccessibilityServiceConnected: boolean;
  speedMultiplier: number;
  onToggleScreenPower: () => void;
  onToggleKeyguardLock: () => void;
  onTogglePhoneCall: () => void;
  onSelectForegroundApp: (pkg: string) => void;
  onFastForwardMinutes: (minutes: number) => void;
  onTriggerBreakNow: () => void;
  onSetSpeedMultiplier: (multiplier: number) => void;
  onSimulateReboot: () => void;
  onToggleAccessibilityService: () => void;
  onResetSetupTour: () => void;
}

const APP_PRESETS = [
  { name: 'Dashboard (App)', pkg: 'com.eyecare.smartbreak', excluded: false, badge: 'Target App' },
  { name: 'Google Maps (Nav)', pkg: 'com.google.android.apps.maps', excluded: true, badge: 'Excluded Nav' },
  { name: 'Waze (Nav)', pkg: 'com.waze', excluded: true, badge: 'Excluded Nav' },
  { name: 'YouTube (Video)', pkg: 'com.google.android.youtube', excluded: false, badge: 'Tracking' },
  { name: 'Instagram (Social)', pkg: 'com.instagram.android', excluded: false, badge: 'Tracking' },
  { name: 'Asphalt 9 (Game)', pkg: 'com.gameloft.android.ANMP.GloftA9HM', excluded: false, badge: 'Tracking' },
  { name: 'Chrome Browser', pkg: 'com.android.chrome', excluded: false, badge: 'Tracking' },
];

export const HardwareController: React.FC<HardwareControllerProps> = ({
  state,
  isAccessibilityServiceConnected,
  speedMultiplier,
  onToggleScreenPower,
  onToggleKeyguardLock,
  onTogglePhoneCall,
  onSelectForegroundApp,
  onFastForwardMinutes,
  onTriggerBreakNow,
  onSetSpeedMultiplier,
  onSimulateReboot,
  onToggleAccessibilityService,
  onResetSetupTour,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 text-white shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-tight text-white">Hardware & OS Simulator Deck</h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
          Samsung Galaxy M15 5G
        </span>
      </div>

      {/* Row 1: Hardware State Toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Screen Power ON/OFF */}
        <button
          onClick={onToggleScreenPower}
          type="button"
          aria-label="Toggle Screen Power"
          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
            state.isInteractive
              ? 'bg-slate-800/80 border-cyan-500/40 text-cyan-200 hover:bg-slate-700/80'
              : 'bg-rose-950/40 border-rose-600/60 text-rose-300 hover:bg-rose-900/50'
          }`}
        >
          <Power className={`w-4 h-4 ${state.isInteractive ? 'text-cyan-400' : 'text-rose-400'}`} />
          <span>Screen: {state.isInteractive ? 'ON' : 'OFF'}</span>
        </button>

        {/* Keyguard Lock/Unlock */}
        <button
          onClick={onToggleKeyguardLock}
          type="button"
          aria-label="Toggle Keyguard Lock"
          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
            state.isKeyguardLocked
              ? 'bg-amber-950/40 border-amber-600/60 text-amber-300 hover:bg-amber-900/50'
              : 'bg-slate-800/80 border-emerald-500/40 text-emerald-200 hover:bg-slate-700/80'
          }`}
        >
          {state.isKeyguardLocked ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <Unlock className="w-4 h-4 text-emerald-400" />
          )}
          <span>Lock: {state.isKeyguardLocked ? 'LOCKED' : 'UNLOCKED'}</span>
        </button>

        {/* Active Phone Call In Progress */}
        <button
          onClick={onTogglePhoneCall}
          type="button"
          aria-label="Toggle Phone Call"
          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
            state.isInCall
              ? 'bg-purple-950/60 border-purple-500 text-purple-200 animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
          }`}
        >
          {state.isInCall ? (
            <PhoneCall className="w-4 h-4 text-purple-400" />
          ) : (
            <PhoneOff className="w-4 h-4 text-slate-400" />
          )}
          <span>Call: {state.isInCall ? 'ACTIVE' : 'NO CALL'}</span>
        </button>

        {/* Accessibility Service Connected Toggle */}
        <button
          onClick={onToggleAccessibilityService}
          type="button"
          aria-label="Toggle Accessibility Service"
          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
            isAccessibilityServiceConnected
              ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200 hover:bg-emerald-900/40'
              : 'bg-rose-950/40 border-rose-600/60 text-rose-300 hover:bg-rose-900/50'
          }`}
        >
          {isAccessibilityServiceConnected ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          )}
          <span>Service: {isAccessibilityServiceConnected ? 'ACTIVE' : 'DISABLED'}</span>
        </button>
      </div>

      {/* Row 2: Foreground Application Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Simulate Foreground App Switch</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-300 truncate max-w-[200px]">
            {state.currentForegroundPackage}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {APP_PRESETS.map((app) => {
            const isSelected = state.currentForegroundPackage === app.pkg;
            return (
              <button
                key={app.pkg}
                onClick={() => onSelectForegroundApp(app.pkg)}
                className={`p-2 rounded-lg text-left border transition-all text-[11px] flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-white shadow-md shadow-cyan-950/60'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold truncate">{app.name}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded w-fit mt-1 ${
                    app.excluded
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {app.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Time Acceleration & Fast Forward */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <FastForward className="w-4 h-4" />
            <span>Time Warp & Fast-Forward</span>
          </div>

          {/* Speed Multiplier Pills */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-[10px] font-mono">
            {[1, 10, 60].map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => onSetSpeedMultiplier(multiplier)}
                className={`px-2 py-0.5 rounded transition-all ${
                  speedMultiplier === multiplier
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {multiplier}x
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onFastForwardMinutes(1)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200"
          >
            +1 Minute
          </button>
          <button
            onClick={() => onFastForwardMinutes(5)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200"
          >
            +5 Minutes
          </button>
          <button
            onClick={() => onFastForwardMinutes(10)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200"
          >
            +10 Minutes
          </button>
          <button
            onClick={onTriggerBreakNow}
            className="py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-cyan-950/60"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Trigger Break</span>
          </button>
        </div>
      </div>

      {/* Row 4: Device Reboot & First-Time Setup Tour Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-[11px] text-slate-400">
          Simulate Android 16 lifecycle & first-time launch:
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetSetupTour}
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Setup Tour</span>
          </button>
          <button
            onClick={onSimulateReboot}
            type="button"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Simulate Reboot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
