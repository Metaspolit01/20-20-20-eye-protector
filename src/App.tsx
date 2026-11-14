import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  CheckCircle,
  FileCode,
  ShieldCheck,
  Download,
  Info,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ScreenTimeEngine, DEFAULT_CONFIG, EngineConfig, EngineState } from './engine/screenTimeEngine';
import { PhoneFrame } from './components/PhoneFrame';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { BreakOverlayView } from './components/BreakOverlayView';
import { HardwareController } from './components/HardwareController';
import { SamsungGuideModal } from './components/SamsungGuideModal';
import { SetupTourView } from './components/SetupTourView';
import { TestMatrixRunner } from './components/TestMatrixRunner';
import { CodeExplorer } from './components/CodeExplorer';
import { playBreakChime } from './utils/audioChime';
import { downloadAndroidProjectZip } from './utils/androidProjectZip';

const SETUP_STORAGE_KEY = 'smart_eye_break_setup_done';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'tests' | 'code' | 'guide'>('simulator');
  const [currentPhoneScreen, setCurrentPhoneScreen] = useState<'dashboard' | 'settings'>('dashboard');
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return true;
    return window.localStorage.getItem(SETUP_STORAGE_KEY) === 'true';
  });
  const [isServiceConnected, setIsServiceConnected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return true;
    return window.localStorage.getItem(SETUP_STORAGE_KEY) === 'true';
  });
  const [isNeverSleepingConfigured, setIsNeverSleepingConfigured] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return true;
    return window.localStorage.getItem(SETUP_STORAGE_KEY) === 'true';
  });
  const [isBatteryUnrestricted, setIsBatteryUnrestricted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return true;
    return window.localStorage.getItem(SETUP_STORAGE_KEY) === 'true';
  });
  const [showSamsungModal, setShowSamsungModal] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>('09:41');
  const [justRecovered, setJustRecovered] = useState<boolean>(false);
  const recoveryTimerRef = useRef<number | null>(null);

  const triggerRecoveryWindow = () => {
    setJustRecovered(true);
    if (recoveryTimerRef.current !== null) {
      window.clearTimeout(recoveryTimerRef.current);
    }
    recoveryTimerRef.current = window.setTimeout(() => {
      setJustRecovered(false);
    }, 4000);
  };

  // Engine instance inside ref so it persists across renders
  const engineRef = useRef<ScreenTimeEngine | null>(null);
  const [engineState, setEngineState] = useState<EngineState>(() => {
    const initialSetupDone =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).get('autostart') === '1' ||
        window.localStorage.getItem(SETUP_STORAGE_KEY) === 'true');
    const eng = new ScreenTimeEngine({
      ...DEFAULT_CONFIG,
      monitoringEnabled: initialSetupDone ? DEFAULT_CONFIG.monitoringEnabled : false,
    });
    engineRef.current = eng;
    return eng.getState();
  });

  const lastBreakActiveRef = useRef<boolean>(false);

  // Engine tick loop with speed multiplier
  useEffect(() => {
    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;

      // In normal mode, tick with real time; in speed mode, advance simulated clock
      const now = performance.now();
      eng.updateTime(now);
      const newState = eng.getState();
      setEngineState(newState);

      // Play audio chime when break becomes newly active; trigger recovery when break ends
      if (newState.isBreakActive && !lastBreakActiveRef.current) {
        if (config.soundEnabled) {
          playBreakChime();
        }
      } else if (!newState.isBreakActive && lastBreakActiveRef.current) {
        triggerRecoveryWindow();
      }
      lastBreakActiveRef.current = newState.isBreakActive;
    }, 100);

    return () => clearInterval(interval);
  }, [config.soundEnabled]);

  // Fast-forward / time-warp effect
  useEffect(() => {
    if (speedMultiplier <= 1) return;

    const fastInterval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;

      // Advance by (speedMultiplier * 100ms)
      const virtualDelta = (speedMultiplier - 1) * 100;
      const s = eng.getState();
      if (eng.isEligibleForTracking()) {
        eng.updateTime(performance.now() + virtualDelta);
        setEngineState(eng.getState());
      }
    }, 100);

    return () => clearInterval(fastInterval);
  }, [speedMultiplier]);

  // Actions
  const handleToggleScreenPower = () => {
    const eng = engineRef.current;
    if (!eng) return;
    if (engineState.isInteractive) {
      eng.onScreenOff();
    } else {
      eng.onScreenOn();
    }
    setEngineState(eng.getState());
  };

  const handleToggleKeyguardLock = () => {
    const eng = engineRef.current;
    if (!eng) return;
    if (engineState.isKeyguardLocked) {
      eng.onKeyguardUnlocked();
    } else {
      eng.onKeyguardLocked();
    }
    setEngineState(eng.getState());
  };

  const handleTogglePhoneCall = () => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.onCallStateChanged(!engineState.isInCall);
    setEngineState(eng.getState());
  };

  const handleSelectForegroundApp = (pkg: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.onForegroundPackageChanged(pkg);
    setEngineState(eng.getState());
  };

  const handleFastForwardMinutes = (minutes: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const addedMs = minutes * 60 * 1000;
    // Advance accumulated time
    if (eng.isEligibleForTracking()) {
      const currentAcc = engineState.accumulatedScreenOnMs + addedMs;
      eng.simulateReboot(currentAcc);
      eng.updateTime();
      setEngineState(eng.getState());
    }
  };

  const handleTriggerBreakNow = () => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.simulateReboot(config.intervalMinutes * 60 * 1000);
    eng.updateTime();
    setEngineState(eng.getState());
  };

  const handleSimulateReboot = () => {
    const eng = engineRef.current;
    if (!eng) return;
    // Preserve current accumulated time, simulate reboot
    const saved = engineState.accumulatedScreenOnMs;
    eng.simulateReboot(saved);
    setEngineState(eng.getState());
  };

  const handleToggleMonitoring = (enabled: boolean) => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.setMonitoringEnabled(enabled);
    setEngineState(eng.getState());
  };

  const handleUpdateConfig = (newConfig: Partial<EngineConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    const eng = engineRef.current;
    if (eng) {
      eng.updateConfig(updated);
      setEngineState(eng.getState());
    }
  };

  const handleSkipBreak = () => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.skipBreak();
    triggerRecoveryWindow();
    setEngineState(eng.getState());
  };

  const handleSnoozeBreak = () => {
    const eng = engineRef.current;
    if (!eng) return;
    eng.snoozeBreak();
    setEngineState(eng.getState());
  };

  const handleCompleteSetupTour = () => {
    if (!isServiceConnected || !isNeverSleepingConfigured || !isBatteryUnrestricted) {
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETUP_STORAGE_KEY, 'true');
    }
    setHasCompletedSetup(true);
    setCurrentPhoneScreen('dashboard');
    const eng = engineRef.current;
    if (eng) {
      eng.setMonitoringEnabled(true);
      setEngineState(eng.getState());
    }
  };

  const handleResetSetupTour = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SETUP_STORAGE_KEY);
    }
    setHasCompletedSetup(false);
    setIsServiceConnected(false);
    setIsNeverSleepingConfigured(false);
    setIsBatteryUnrestricted(false);
    setCurrentPhoneScreen('dashboard');
    const eng = engineRef.current;
    if (eng) {
      eng.setMonitoringEnabled(false);
      eng.simulateReboot(0);
      setEngineState(eng.getState());
    }
  };

  return (
    <div className="min-h-screen bg-[#020914] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#040f21]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">20-20-20 Smart Eye Break Assistant</h1>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                  Samsung Galaxy M15 5G
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Native Android 16 • One UI 8.0 • Compile SDK 36 • 100% Offline Accessibility Overlay
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Device Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'tests'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Test Matrix (A-L)</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'code'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Kotlin & APK Code</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'guide'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Samsung Setup</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: DEVICE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Samsung Galaxy M15 5G Phone Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <PhoneFrame
                isScreenOff={!engineState.isInteractive}
                currentTimeString={currentTimeDisplay}
              >
                {/* Mandatory Setup Tour gates access until system setup verified */}
                {!hasCompletedSetup || !isServiceConnected ? (
                  <SetupTourView
                    isAccessibilityServiceConnected={isServiceConnected}
                    isNeverSleepingConfigured={isNeverSleepingConfigured}
                    isBatteryUnrestricted={isBatteryUnrestricted}
                    onEnableAccessibilityService={(enabled) => setIsServiceConnected(enabled)}
                    onSetNeverSleepingConfigured={(enabled) => setIsNeverSleepingConfigured(enabled)}
                    onSetBatteryUnrestricted={(enabled) => setIsBatteryUnrestricted(enabled)}
                    onCompleteTour={handleCompleteSetupTour}
                    onOpenApkExport={() => setActiveTab('code')}
                  />
                ) : engineState.isBreakActive ? (
                  <BreakOverlayView
                    remainingSeconds={engineState.remainingBreakSeconds}
                    onSkip={handleSkipBreak}
                    onSnooze={handleSnoozeBreak}
                  />
                ) : currentPhoneScreen === 'dashboard' ? (
                  <DashboardView
                    state={engineState}
                    config={config}
                    justRecovered={justRecovered}
                    onToggleMonitoring={handleToggleMonitoring}
                    onOpenSettings={() => setCurrentPhoneScreen('settings')}
                  />
                ) : (
                  <SettingsView
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onNavigateBack={() => setCurrentPhoneScreen('dashboard')}
                    onReplaySetupTour={handleResetSetupTour}
                  />
                )}
              </PhoneFrame>
            </div>

            {/* Right: Hardware & OS Simulator Deck + Architecture Status */}
            <div className="lg:col-span-7 space-y-5">
              <HardwareController
                state={engineState}
                isAccessibilityServiceConnected={isServiceConnected}
                speedMultiplier={speedMultiplier}
                onToggleScreenPower={handleToggleScreenPower}
                onToggleKeyguardLock={handleToggleKeyguardLock}
                onTogglePhoneCall={handleTogglePhoneCall}
                onSelectForegroundApp={handleSelectForegroundApp}
                onFastForwardMinutes={handleFastForwardMinutes}
                onTriggerBreakNow={handleTriggerBreakNow}
                onSetSpeedMultiplier={setSpeedMultiplier}
                onSimulateReboot={handleSimulateReboot}
                onToggleAccessibilityService={() => setIsServiceConnected(!isServiceConnected)}
                onResetSetupTour={handleResetSetupTour}
              />

              {/* Live Technical State Metrics Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Live Engine Diagnostics</h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    SystemClock.elapsedRealtime()
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Accumulated Screen Time</p>
                    <p className="font-mono text-base font-bold text-white mt-0.5">
                      {Math.floor(engineState.accumulatedScreenOnMs / 1000)}s{' '}
                      <span className="text-slate-400 text-xs">
                        ({(engineState.accumulatedScreenOnMs / (60 * 1000)).toFixed(1)}m)
                      </span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Target Interval</p>
                    <p className="font-mono text-base font-bold text-cyan-300 mt-0.5">
                      {Math.floor(engineState.targetIntervalMs / (60 * 1000))} min
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Tracking Eligibility</p>
                    <p className="font-mono text-base font-bold mt-0.5 text-emerald-400">
                      {engineState.isMonitoring && engineState.isInteractive && !engineState.isKeyguardLocked && !engineState.isBreakActive
                        ? 'TRUE (Accumulating)'
                        : 'FALSE (Paused)'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Exclusion Status</p>
                    <p
                      className={`font-mono text-base font-bold mt-0.5 ${
                        engineState.isBreakSuppressed
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {engineState.isBreakSuppressed ? 'SUPPRESSED' : 'NORMAL'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Active Overlay Window</p>
                    <p className="font-mono text-base font-bold mt-0.5 text-cyan-300">
                      {engineState.isBreakActive ? 'VISIBLE (00:20)' : 'NONE'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Offline / Privacy</p>
                    <p className="font-mono text-base font-bold mt-0.5 text-emerald-400">
                      100% ZERO NETWORK
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEST MATRIX RUNNER */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <TestMatrixRunner />
          </div>
        )}

        {/* TAB 3: CODE EXPLORER & APK DOWNLOAD */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <CodeExplorer />
          </div>
        )}

        {/* TAB 4: SAMSUNG SETUP GUIDE */}
        {activeTab === 'guide' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-white max-w-4xl mx-auto shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Samsung Galaxy M15 5G (SM-M156B) Deployment & Knox Guide
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ensuring reliable 20-20-20 timing under One UI 8.0 power saving
                  </p>
                </div>
              </div>

              <button
                onClick={downloadAndroidProjectZip}
                className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android Studio ZIP</span>
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">1. Samsung One UI 8.0 Background Policy</h3>
                <p className="text-slate-300">
                  Samsung devices employ strict background limits that aggressively suspend process alarms and wake locks. To ensure the 20-20-20 assistant runs continuously:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>
                    Open <strong>Settings → Battery → Background usage limits → Never sleeping apps</strong>.
                  </li>
                  <li>Tap the <strong>+</strong> button in the top right and select <strong>20-20-20 Smart Eye Break</strong>.</li>
                  <li>
                    Go to <strong>Settings → Apps → 20-20-20 Smart Eye Break → Battery</strong> and select <strong>Unrestricted</strong>.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">2. Accessibility Overlay Authorization</h3>
                <p className="text-slate-300">
                  The application uses <code>TYPE_ACCESSIBILITY_OVERLAY</code> to guarantee smooth full-screen presentation:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>Open <strong>Settings → Accessibility → Installed services</strong> (or Installed apps).</li>
                  <li>Find <strong>20-20-20 Eye Break Assistant</strong> and switch it to <strong>ON</strong>.</li>
                  <li>
                    Privacy Note: The service config explicitly sets <code>canRetrieveWindowContent="false"</code>. The application cannot inspect keystrokes, personal messages, or screen data.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">3. Building the APK with Android Studio</h3>
                <p className="text-slate-300">
                  Click the <strong>Download Android Studio Project (.ZIP)</strong> button, unzip the folder, and open it in Android Studio Ladybug or newer.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400">
                  ./gradlew assembleDebug<br />
                  adb install -r app/build/outputs/apk/debug/app-debug.apk
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Samsung Modal */}
      <SamsungGuideModal
        isOpen={showSamsungModal}
        onClose={() => setShowSamsungModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        <p>
          20-20-20 Smart Eye Break Assistant • Samsung Galaxy M15 5G (SM-M156B) • Android 16 / One UI 8.0 • 100% Offline
        </p>
      </footer>
    </div>
  );
}
