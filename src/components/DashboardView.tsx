import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Pause,
  Play,
} from 'lucide-react';
import { EngineState, EngineConfig } from '../engine/screenTimeEngine';
import { selectEyeMotionState } from '../engine/eyeMotionState';
import { EyeMotionPlayer } from './EyeMotionPlayer';

interface DashboardViewProps {
  state: EngineState;
  config: EngineConfig;
  justRecovered?: boolean;
  onToggleMonitoring: (enabled: boolean) => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  justRecovered = false,
  onToggleMonitoring,
  onOpenSettings,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Format remaining time in interval (e.g. 20:00)
  const remainingIntervalMs = Math.max(0, state.targetIntervalMs - state.accumulatedScreenOnMs);
  const remainingTotalSec = Math.ceil(remainingIntervalMs / 1000);
  const mins = Math.floor(remainingTotalSec / 60);
  const secs = remainingTotalSec % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Calculate spacious circular progress (272px container, center 136, radius 127)
  const progressPercent = Math.min(
    100,
    Math.max(0, (state.accumulatedScreenOnMs / state.targetIntervalMs) * 100)
  );
  const radius = 127;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  // Occasional natural blink while healthy or tired
  useEffect(() => {
    if (
      !state.isMonitoring ||
      !state.isInteractive ||
      state.isKeyguardLocked ||
      state.isBreakDue ||
      state.isBreakSuppressed ||
      justRecovered ||
      progressPercent >= 80
    ) {
      setIsBlinking(false);
      return;
    }

    let blinkTimeout: number | undefined;
    const blinkInterval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 700);
    }, 4500);

    return () => {
      window.clearInterval(blinkInterval);
      if (blinkTimeout !== undefined) window.clearTimeout(blinkTimeout);
    };
  }, [
    state.isMonitoring,
    state.isInteractive,
    state.isKeyguardLocked,
    state.isBreakDue,
    state.isBreakSuppressed,
    justRecovered,
    progressPercent,
  ]);

  const eyeMotion = selectEyeMotionState({
    progressPercent,
    isBreakDue: state.isBreakDue,
    isBreakSuppressed: state.isBreakSuppressed,
    isRecovering: justRecovered,
    isBlinking,
    isMonitoring: state.isMonitoring,
  });

  // Format today's accumulated screen time
  const todayTotalSec = Math.floor(state.todayAccumulatedScreenOnMs / 1000);
  const todayMins = Math.floor(todayTotalSec / 60);
  const todayHours = Math.floor(todayMins / 60);
  const todayFormatted =
    todayHours > 0
      ? `${todayHours}h ${todayMins % 60}m`
      : `${todayMins}m ${todayTotalSec % 60}s`;

  const statusLabel = !state.isMonitoring
    ? 'Monitoring Paused'
    : state.isBreakSuppressed
    ? 'Suppressed (In Call / Nav)'
    : state.isKeyguardLocked
    ? 'Device Locked'
    : !state.isInteractive
    ? 'Screen Off'
    : 'Tracking Active';

  const ringColorClass =
    eyeMotion === 'overdue' || (eyeMotion === 'squeeze' && progressPercent >= 90)
      ? 'text-rose-500'
      : eyeMotion === 'squeeze'
      ? 'text-orange-400'
      : eyeMotion === 'recovery'
      ? 'text-emerald-400'
      : 'text-cyan-400';

  return (
    <div className="flex-1 flex flex-col justify-between px-5 py-3 overflow-y-auto text-white text-xs select-none">
      {/* Minimal Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <EyeMotionPlayer
              motionState="healthy"
              progressPercent={0}
              compact
              staticPose
            />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white leading-none">20-20-20 Assistant</h1>
            <span className="text-[10px] text-cyan-400 font-medium">Eye Strain Protection</span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="w-9 h-9 rounded-full bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/70 flex items-center justify-center text-slate-300 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Timer Section: Large Realistic Eye INSIDE Spacious Timer Ring, Timer Text OUTSIDE */}
      <div className="flex-1 flex flex-col items-center justify-center py-1 space-y-4">
        <div
          data-testid="timer-ring-boundary"
          className="relative w-[272px] h-[272px] flex items-center justify-center"
        >
          <div
            className={`absolute inset-6 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
              eyeMotion === 'overdue' || (eyeMotion === 'squeeze' && progressPercent >= 90)
                ? 'bg-rose-500/15'
                : eyeMotion === 'squeeze'
                ? 'bg-orange-500/12'
                : 'bg-cyan-500/10'
            }`}
          />

          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 272 272">
            <circle
              cx="136"
              cy="136"
              r={radius}
              className="text-slate-800/65"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="136"
              cy="136"
              r={radius}
              className={`${ringColorClass} transition-colors duration-300 ease-out`}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Seamless Large Realistic Eye Animation Inside Timer Boundary */}
          <div className="absolute inset-0 flex items-center justify-center">
            <EyeMotionPlayer motionState={eyeMotion} progressPercent={progressPercent} />
          </div>
        </div>

        {/* Timer Text Placed Outside the Boundary of Timer */}
        <div
          data-testid="timer-outside-text"
          className="flex flex-col items-center text-center"
        >
          <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-slate-400">
            {state.isSnoozed ? 'Snoozed' : 'Next Break In'}
          </span>
          <span
            data-testid="dashboard-timer-value"
            className="font-mono text-5xl font-black text-white tracking-tight my-1 leading-none"
          >
            {timeString}
          </span>
          <span
            className={`text-[11px] font-semibold mt-0.5 ${
              !state.isMonitoring
                ? 'text-rose-400'
                : state.isBreakSuppressed
                ? 'text-amber-400'
                : state.isKeyguardLocked || !state.isInteractive
                ? 'text-slate-400'
                : 'text-cyan-300'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Primary Monitoring Control */}
        <button
          onClick={() => onToggleMonitoring(!state.isMonitoring)}
          className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            state.isMonitoring
              ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/60'
          }`}
        >
          {state.isMonitoring ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause Monitoring</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start Monitoring</span>
            </>
          )}
        </button>
      </div>

      {/* Minimalist Unboxed Metrics Footer */}
      <div className="grid grid-cols-2 divide-x divide-slate-800/80 pt-2 pb-1 text-center">
        <div className="px-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Breaks Today</p>
          <p className="font-mono text-lg font-bold text-white mt-0.5">{state.completedBreaksToday}</p>
        </div>
        <div className="px-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Screen Time</p>
          <p className="font-mono text-lg font-bold text-cyan-300 mt-0.5">{todayFormatted}</p>
        </div>
      </div>
    </div>
  );
};
