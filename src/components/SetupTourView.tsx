import React, { useState } from 'react';
import {
  Eye,
  ShieldCheck,
  BatteryCharging,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export type SystemSettingsRoute =
  | null
  | 'accessibility'
  | 'never_sleeping'
  | 'battery_unrestricted';

interface SetupTourViewProps {
  isAccessibilityServiceConnected: boolean;
  isNeverSleepingConfigured: boolean;
  isBatteryUnrestricted: boolean;
  onEnableAccessibilityService: (enabled: boolean) => void;
  onSetNeverSleepingConfigured: (enabled: boolean) => void;
  onSetBatteryUnrestricted: (enabled: boolean) => void;
  onCompleteTour: () => void;
  onOpenApkExport?: () => void;
}

export const SetupTourView: React.FC<SetupTourViewProps> = ({
  isAccessibilityServiceConnected,
  isNeverSleepingConfigured,
  isBatteryUnrestricted,
  onEnableAccessibilityService,
  onSetNeverSleepingConfigured,
  onSetBatteryUnrestricted,
  onCompleteTour,
  onOpenApkExport,
}) => {
  const [step, setStep] = useState<number>(1);
  const [settingsRoute, setSettingsRoute] = useState<SystemSettingsRoute>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const totalSteps = 4;

  const canProceedStep2 = isAccessibilityServiceConnected;
  const canProceedStep3 = isNeverSleepingConfigured && isBatteryUnrestricted;

  const handleReturnFromSettings = (route: SystemSettingsRoute) => {
    setSettingsRoute(null);
    if (route === 'accessibility') {
      setCheckMessage(
        isAccessibilityServiceConnected
          ? 'System check: Accessibility Service is ON.'
          : 'System check: Accessibility Service is still OFF.'
      );
    } else if (route === 'never_sleeping') {
      setCheckMessage(
        isNeverSleepingConfigured
          ? 'System check: Added to Never sleeping apps.'
          : 'System check: Not added to Never sleeping apps.'
      );
    } else if (route === 'battery_unrestricted') {
      setCheckMessage(
        isBatteryUnrestricted
          ? 'System check: Battery set to Unrestricted.'
          : 'System check: Battery is still Optimized.'
      );
    }
  };

  // Simulated Android / Samsung One UI System Settings Screens
  if (settingsRoute === 'accessibility') {
    return (
      <div
        role="region"
        aria-label="Android Accessibility Settings"
        className="flex-1 flex flex-col justify-between p-4 bg-[#0b101b] text-white select-none"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => handleReturnFromSettings('accessibility')}
              aria-label="Back from Accessibility Settings"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-mono text-amber-300">Web Simulator › Accessibility</p>
              <h2 className="text-sm font-bold text-white">Installed apps</h2>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-700/40 flex items-center justify-between gap-2">
            <p className="text-[10px] text-amber-200 leading-snug">
              Browser preview simulates Settings; install APK to open real phone Settings.
            </p>
            {onOpenApkExport && (
              <button
                type="button"
                onClick={onOpenApkExport}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold shrink-0"
              >
                APK
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs text-white">20-20-20 Eye Break Assistant</p>
              <p className="text-[10px] text-slate-400">
                {isAccessibilityServiceConnected ? 'On' : 'Off'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAccessibilityServiceConnected}
              aria-label="Toggle 20-20-20 Accessibility Service"
              onClick={() => onEnableAccessibilityService(!isAccessibilityServiceConnected)}
              className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                isAccessibilityServiceConnected ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleReturnFromSettings('accessibility')}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
        >
          Return to Setup & Verify
        </button>
      </div>
    );
  }

  if (settingsRoute === 'never_sleeping') {
    return (
      <div
        role="region"
        aria-label="Samsung Never Sleeping Apps Settings"
        className="flex-1 flex flex-col justify-between p-4 bg-[#0b101b] text-white select-none"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => handleReturnFromSettings('never_sleeping')}
              aria-label="Back from Never Sleeping Apps"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-mono text-amber-300">Web Simulator › Battery › Limits</p>
              <h2 className="text-sm font-bold text-white">Never sleeping apps</h2>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-700/40 flex items-center justify-between gap-2">
            <p className="text-[10px] text-amber-200 leading-snug">
              Browser preview simulates Settings; install APK to open real phone Settings.
            </p>
            {onOpenApkExport && (
              <button
                type="button"
                onClick={onOpenApkExport}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold shrink-0"
              >
                APK
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs text-white">20-20-20 Smart Eye Break</p>
              <p className="text-[10px] text-slate-400">
                {isNeverSleepingConfigured ? 'Added to Never sleeping' : 'Not in list'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSetNeverSleepingConfigured(!isNeverSleepingConfigured)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isNeverSleepingConfigured
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isNeverSleepingConfigured ? 'Added ✓' : '+ Add'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleReturnFromSettings('never_sleeping')}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
        >
          Return to Setup & Verify
        </button>
      </div>
    );
  }

  if (settingsRoute === 'battery_unrestricted') {
    return (
      <div
        role="region"
        aria-label="Android App Battery Usage Settings"
        className="flex-1 flex flex-col justify-between p-4 bg-[#0b101b] text-white select-none"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => handleReturnFromSettings('battery_unrestricted')}
              aria-label="Back from Battery Settings"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] font-mono text-amber-300">Web Simulator › App info › Battery</p>
              <h2 className="text-sm font-bold text-white">20-20-20 Smart Eye Break</h2>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-700/40 flex items-center justify-between gap-2">
            <p className="text-[10px] text-amber-200 leading-snug">
              Browser preview simulates Settings; install APK to open real phone Settings.
            </p>
            {onOpenApkExport && (
              <button
                type="button"
                onClick={onOpenApkExport}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold shrink-0"
              >
                APK
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSetBatteryUnrestricted(true)}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between ${
                isBatteryUnrestricted
                  ? 'bg-cyan-950/50 border-cyan-400 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <span className="font-bold text-xs">Unrestricted</span>
              {isBatteryUnrestricted && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => onSetBatteryUnrestricted(false)}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between ${
                !isBatteryUnrestricted
                  ? 'bg-slate-800 border-slate-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold text-xs">Optimized</span>
              {!isBatteryUnrestricted && <CheckCircle2 className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleReturnFromSettings('battery_unrestricted')}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
        >
          Return to Setup & Verify
        </button>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Mandatory First-Time Setup Tour"
      className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-[#041229] via-[#061836] to-[#030d1f] text-white select-none overflow-y-auto"
    >
      {/* Top Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Setup • Step {step} of {totalSteps}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">SM-M156B</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= step ? 'bg-cyan-400' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content (Simple One-Line Copy) */}
      <div className="my-auto py-4 space-y-4">
        {step === 1 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-cyan-600/20 border border-cyan-400/40 flex items-center justify-center">
              <Eye className="w-10 h-10 text-cyan-300" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-lg font-black tracking-tight text-white">
                20-20-20 Eye Care
              </h1>
              <p className="text-xs text-slate-300">
                Rest your eyes every 20 minutes for 20 seconds.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Accessibility Overlay</h2>
                <p className="text-[11px] text-slate-400">Required to show break screen.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckMessage(null);
                setSettingsRoute('accessibility');
              }}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                isAccessibilityServiceConnected
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900/90 hover:border-cyan-400 border-slate-700 text-white'
              }`}
            >
              <div className="text-left">
                <p className="font-bold text-xs">Open Accessibility Settings</p>
                <p className="text-[10px] opacity-80">
                  {isAccessibilityServiceConnected ? 'Configured ✓' : 'Not configured — tap to open'}
                </p>
              </div>
              {isAccessibilityServiceConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-cyan-300 shrink-0" />
              )}
            </button>

            {checkMessage && (
              <div
                className={`p-2.5 rounded-xl text-[11px] flex items-center gap-2 border ${
                  isAccessibilityServiceConnected
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-700/50 text-amber-300'
                }`}
              >
                {isAccessibilityServiceConnected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{checkMessage}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Battery & Sleep Setup</h2>
                <p className="text-[11px] text-slate-400">Tap each box to configure in Settings.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckMessage(null);
                setSettingsRoute('never_sleeping');
              }}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                isNeverSleepingConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/60'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-white">Never sleeping apps</p>
                <p className="text-[10px] text-slate-400">
                  {isNeverSleepingConfigured ? 'Configured ✓' : 'Tap to open Samsung Battery'}
                </p>
              </div>
              {isNeverSleepingConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-cyan-300 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckMessage(null);
                setSettingsRoute('battery_unrestricted');
              }}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                isBatteryUnrestricted
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/60'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-white">Unrestricted battery</p>
                <p className="text-[10px] text-slate-400">
                  {isBatteryUnrestricted ? 'Configured ✓' : 'Tap to open App Battery'}
                </p>
              </div>
              {isBatteryUnrestricted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-cyan-300 shrink-0" />
              )}
            </button>

            {checkMessage && (
              <div className="p-2.5 rounded-xl text-[11px] flex items-center gap-2 border bg-slate-900/80 border-slate-700 text-cyan-300">
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>{checkMessage}</span>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-white">Setup Verified</h2>
              <p className="text-xs text-slate-300">
                All system permissions are configured.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Navigation Row */}
      <div className="pt-2 flex items-center gap-2.5">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setCheckMessage(null);
              setStep(step - 1);
            }}
            aria-label="Previous Setup Step"
            className="px-3.5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}

        {step === 1 && (
          <button
            type="button"
            onClick={() => {
              setCheckMessage(null);
              setStep(2);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>Start Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            disabled={!canProceedStep2}
            onClick={() => {
              setCheckMessage(null);
              setStep(3);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>{canProceedStep2 ? 'Continue' : 'Configure Above to Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            disabled={!canProceedStep3}
            onClick={() => {
              setCheckMessage(null);
              setStep(4);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>{canProceedStep3 ? 'Continue' : 'Configure Both to Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={onCompleteTour}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>Enter App</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
