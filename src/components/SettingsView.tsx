import React from 'react';
import { ArrowLeft, Volume2, Vibrate, RotateCcw } from 'lucide-react';
import { EngineConfig, DEFAULT_CONFIG } from '../engine/screenTimeEngine';
import { playBreakChime } from '../utils/audioChime';

interface SettingsViewProps {
  config: EngineConfig;
  onUpdateConfig: (newConfig: Partial<EngineConfig>) => void;
  onNavigateBack: () => void;
  onReplaySetupTour?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  onNavigateBack,
  onReplaySetupTour,
}) => {
  const handleResetDefaults = () => {
    onUpdateConfig(DEFAULT_CONFIG);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto text-white text-xs select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateBack}
            aria-label="Back to Dashboard"
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-sm tracking-tight text-white">Settings</h1>
        </div>

        <button
          onClick={handleResetDefaults}
          aria-label="Reset to Defaults"
          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Defaults</span>
        </button>
      </div>

      <div className="space-y-3.5 py-3">
        {/* Screen-Time Interval Slider */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Screen-Time Interval</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{config.intervalMinutes} min</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="1"
            value={config.intervalMinutes}
            onChange={(e) => onUpdateConfig({ intervalMinutes: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">Time before break reminder.</p>
        </div>

        {/* Break Duration Slider */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Break Duration</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{config.breakDurationSeconds} sec</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={config.breakDurationSeconds}
            onChange={(e) => onUpdateConfig({ breakDurationSeconds: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">Rest countdown length.</p>
        </div>

        {/* Snooze Duration Slider */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Snooze Duration</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{config.snoozeDurationMinutes} min</span>
          </div>
          <input
            type="range"
            min="2"
            max="15"
            step="1"
            value={config.snoozeDurationMinutes}
            onChange={(e) => onUpdateConfig({ snoozeDurationMinutes: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[10px] text-slate-400">Delay when snoozed.</p>
        </div>

        {/* Sound & Vibration Toggles */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="font-semibold text-white">Reminder Chime</p>
                <p className="text-[10px] text-slate-400">Play sound on break start</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={playBreakChime}
                className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-slate-700"
              >
                Test
              </button>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => onUpdateConfig({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="font-semibold text-white">Haptic Vibration</p>
                <p className="text-[10px] text-slate-400">Vibrate on break start</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.vibrationEnabled}
              onChange={(e) => onUpdateConfig({ vibrationEnabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {onReplaySetupTour && (
          <button
            type="button"
            onClick={onReplaySetupTour}
            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-xs transition-colors"
          >
            Replay First-Time Setup Tour
          </button>
        )}
      </div>

      {/* Done Button */}
      <button
        onClick={onNavigateBack}
        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-lg shadow-cyan-950/50"
      >
        Save & Return
      </button>
    </div>
  );
};
