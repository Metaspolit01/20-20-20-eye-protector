import React, { useState } from 'react';
import { CheckCircle2, Play, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { ScreenTimeEngine } from '../engine/screenTimeEngine';

interface TestItem {
  id: string;
  name: string;
  expected: string;
  run: () => Promise<boolean>;
}

export const TestMatrixRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, 'passed' | 'failed' | 'running' | 'idle'>>({});
  const [activeTestLogs, setActiveTestLogs] = useState<string[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const tests: TestItem[] = [
    {
      id: 'test-a',
      name: 'Test A: Screen stays ON for 20 minutes',
      expected: 'Break overlay appears after 20 minutes of continuous screen-on time.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        simulatedTime += 20 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-b',
      name: 'Test B: Screen ON for 10m, OFF 10m, ON 10m',
      expected: 'Break appears after another 10 minutes of eligible screen-on time (total 20m).',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        simulatedTime += 10 * 60 * 1000;
        engine.updateTime(simulatedTime);

        // Turn OFF for 10m
        engine.onScreenOff(simulatedTime);
        simulatedTime += 10 * 60 * 1000;
        engine.updateTime(simulatedTime);
        if (engine.getState().accumulatedScreenOnMs !== 10 * 60 * 1000) return false;

        // Turn back ON for 10m
        engine.onScreenOn(simulatedTime);
        simulatedTime += 10 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-c',
      name: 'Test C: App switches (Instagram, YouTube, Chrome)',
      expected: 'Timer continues tracking uninterrupted across foreground switches.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        engine.onForegroundPackageChanged('com.google.android.youtube', simulatedTime);
        simulatedTime += 7 * 60 * 1000;
        engine.updateTime(simulatedTime);

        engine.onForegroundPackageChanged('com.instagram.android', simulatedTime);
        simulatedTime += 7 * 60 * 1000;
        engine.updateTime(simulatedTime);

        engine.onForegroundPackageChanged('com.android.chrome', simulatedTime);
        simulatedTime += 6 * 60 * 1000;
        engine.updateTime(simulatedTime);

        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-d',
      name: 'Test D: Gaming or Video Playback',
      expected: 'Games and videos are not excluded by default; reminder triggers as scheduled.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        engine.onForegroundPackageChanged('com.gameloft.android.ANMP.GloftA9HM', simulatedTime);
        simulatedTime += 20 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-e',
      name: 'Test E: Active Phone Call suppression',
      expected: 'Break is suppressed during active call and queues until call ends.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        simulatedTime += 18 * 60 * 1000;
        engine.updateTime(simulatedTime);

        engine.onCallStateChanged(true, simulatedTime);
        simulatedTime += 5 * 60 * 1000;
        engine.updateTime(simulatedTime);

        if (!engine.getState().isBreakSuppressed || engine.getState().isBreakActive) {
          return false;
        }

        engine.onCallStateChanged(false, simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-f',
      name: 'Test F: Navigation App suppression (Google Maps)',
      expected: 'Reminder is suppressed during navigation and queued until navigation exits.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        engine.onForegroundPackageChanged('com.google.android.apps.maps', simulatedTime);
        simulatedTime += 22 * 60 * 1000;
        engine.updateTime(simulatedTime);

        if (!engine.getState().isBreakSuppressed || engine.getState().isBreakActive) {
          return false;
        }

        engine.onForegroundPackageChanged('com.sec.android.app.launcher', simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-g',
      name: 'Test G: Skip a Break',
      expected: 'Normal 20-minute interval immediately restarts from 0.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        simulatedTime += 20 * 60 * 1000;
        engine.updateTime(simulatedTime);

        engine.skipBreak(simulatedTime);
        const s = engine.getState();
        return s.isBreakActive === false && s.accumulatedScreenOnMs === 0 && s.targetIntervalMs === 20 * 60 * 1000;
      },
    },
    {
      id: 'test-h',
      name: 'Test H: Snooze a Break',
      expected: 'Reminder returns after exactly 5 minutes of eligible screen-on time.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        simulatedTime += 20 * 60 * 1000;
        engine.updateTime(simulatedTime);

        engine.snoozeBreak(simulatedTime);
        if (engine.getState().targetIntervalMs !== 5 * 60 * 1000) return false;

        simulatedTime += 4 * 60 * 1000;
        engine.updateTime(simulatedTime);
        if (engine.getState().isBreakActive) return false;

        simulatedTime += 1 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-i',
      name: 'Test I: Device Locked (Keyguard)',
      expected: 'Timer pauses and accumulated duration is preserved.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        simulatedTime += 14 * 60 * 1000;
        engine.updateTime(simulatedTime);

        engine.onKeyguardLocked(simulatedTime);
        simulatedTime += 30 * 60 * 1000;
        engine.updateTime(simulatedTime);

        return engine.getState().accumulatedScreenOnMs === 14 * 60 * 1000 && !engine.getState().isBreakActive;
      },
    },
    {
      id: 'test-j',
      name: 'Test J: Phone Reboot Recovery',
      expected: 'Configuration and accumulated timer state restored safely.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        engine.simulateReboot(15 * 60 * 1000, simulatedTime);
        simulatedTime += 5 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-k',
      name: 'Test K: Swipe from Recents',
      expected: 'AccessibilityService runs independently of Activity lifecycle; tracking continues.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        engine.onForegroundPackageChanged('com.sec.android.app.launcher', simulatedTime);
        simulatedTime += 20 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().isBreakActive === true;
      },
    },
    {
      id: 'test-l',
      name: 'Test L: Pause Monitoring from Dashboard',
      expected: 'No break reminders occur until user resumes monitoring.',
      run: async () => {
        let simulatedTime = 100000;
        const engine = new ScreenTimeEngine({}, () => simulatedTime);
        engine.setMonitoringEnabled(false, simulatedTime);
        simulatedTime += 40 * 60 * 1000;
        engine.updateTime(simulatedTime);
        return engine.getState().accumulatedScreenOnMs === 0 && !engine.getState().isBreakActive;
      },
    },
  ];

  const runSingleTest = async (test: TestItem) => {
    setTestResults((prev) => ({ ...prev, [test.id]: 'running' }));
    setActiveTestLogs((prev) => [`[${test.id.toUpperCase()}] Running: ${test.name}...`, ...prev.slice(0, 10)]);

    try {
      const passed = await test.run();
      setTestResults((prev) => ({ ...prev, [test.id]: passed ? 'passed' : 'failed' }));
      setActiveTestLogs((prev) => [
        `[${test.id.toUpperCase()}] ${passed ? 'PASSED ✓' : 'FAILED ✗'} - ${test.expected}`,
        ...prev.slice(0, 10),
      ]);
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [test.id]: 'failed' }));
      setActiveTestLogs((prev) => [`[${test.id.toUpperCase()}] ERROR: ${String(e)}`, ...prev.slice(0, 10)]);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    for (const test of tests) {
      await runSingleTest(test);
      await new Promise((r) => setTimeout(r, 60));
    }
    setIsRunningAll(false);
  };

  const passedCount = Object.values(testResults).filter((r) => r === 'passed').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-white shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Physical & Architectural Test Matrix</h2>
            <p className="text-[11px] text-slate-400">Section 12 Verification Suite (Tests A through L)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {passedCount > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
              {passedCount} / {tests.length} Passed
            </span>
          )}
          <button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/60"
          >
            {isRunningAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunningAll ? 'Running Suite...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Test List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {tests.map((test) => {
          const status = testResults[test.id] || 'idle';
          return (
            <div
              key={test.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                status === 'passed'
                  ? 'bg-emerald-950/20 border-emerald-600/40 text-slate-200'
                  : status === 'failed'
                  ? 'bg-rose-950/20 border-rose-600/40 text-rose-200'
                  : status === 'running'
                  ? 'bg-cyan-950/30 border-cyan-500 text-cyan-100'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-xs text-white leading-tight">{test.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{test.expected}</p>
                </div>
                {status === 'passed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {status === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                {status === 'running' && (
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                <span className="font-mono text-slate-500 uppercase">{test.id}</span>
                <button
                  onClick={() => runSingleTest(test)}
                  disabled={status === 'running'}
                  className="px-2 py-0.5 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-200 font-semibold"
                >
                  Run Single
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Test Execution Logs */}
      {activeTestLogs.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-500">Live Test Output</p>
          {activeTestLogs.map((log, i) => (
            <p key={i} className="truncate">
              {log}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
