import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreenTimeEngine, DEFAULT_CONFIG } from './screenTimeEngine';

test('Test A: Screen stays ON for 20 minutes -> Break overlay triggers', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Initially at 0ms accumulated, tracking active
  assert.equal(engine.getState().isBreakActive, false);
  assert.equal(engine.getState().accumulatedScreenOnMs, 0);

  // Advance time by 10 minutes (600,000 ms)
  simulatedTime += 10 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, false);
  assert.equal(engine.getState().accumulatedScreenOnMs, 10 * 60 * 1000);

  // Advance by another 10 minutes (total 20 min)
  simulatedTime += 10 * 60 * 1000;
  engine.updateTime(simulatedTime);

  const state = engine.getState();
  assert.equal(state.isBreakActive, true, 'Break should become active at 20 min');
  assert.equal(state.remainingBreakSeconds, 20, 'Break duration should initialize to 20 seconds');
});

test('Test B: Screen ON for 10m, OFF for 10m, then ON for 10m -> Break appears after second 10m', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // ON for 10 minutes
  simulatedTime += 10 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().accumulatedScreenOnMs, 10 * 60 * 1000);

  // Turn Screen OFF
  engine.onScreenOff(simulatedTime);
  assert.equal(engine.getState().isInteractive, false);

  // Device remains screen OFF for 10 minutes
  simulatedTime += 10 * 60 * 1000;
  engine.updateTime(simulatedTime);
  // Accumulated time must NOT increase while screen is OFF
  assert.equal(engine.getState().accumulatedScreenOnMs, 10 * 60 * 1000);
  assert.equal(engine.getState().isBreakActive, false);

  // Turn Screen back ON
  engine.onScreenOn(simulatedTime);
  assert.equal(engine.getState().isInteractive, true);

  // Device is used for another 10 minutes
  simulatedTime += 10 * 60 * 1000;
  engine.updateTime(simulatedTime);

  // Total accumulated should now be 20 min and break is active
  assert.equal(engine.getState().accumulatedScreenOnMs, 20 * 60 * 1000);
  assert.equal(engine.getState().isBreakActive, true);
});

test('Test C & D: Switching apps (Instagram, YouTube, Chrome, Game) keeps tracking', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // YouTube for 5 minutes
  engine.onForegroundPackageChanged('com.google.android.youtube', simulatedTime);
  simulatedTime += 5 * 60 * 1000;
  engine.updateTime(simulatedTime);

  // Instagram for 5 minutes
  engine.onForegroundPackageChanged('com.instagram.android', simulatedTime);
  simulatedTime += 5 * 60 * 1000;
  engine.updateTime(simulatedTime);

  // Game (Asphalt 9) for 10 minutes
  engine.onForegroundPackageChanged('com.gameloft.android.ANMP.GloftA9HM', simulatedTime);
  simulatedTime += 10 * 60 * 1000;
  engine.updateTime(simulatedTime);

  assert.equal(engine.getState().accumulatedScreenOnMs, 20 * 60 * 1000);
  assert.equal(engine.getState().isBreakActive, true, 'Gaming or video apps are not excluded by default');
});

test('Test E: Active phone call suppresses reminder and resumes after call ends', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Screen ON for 18 minutes
  simulatedTime += 18 * 60 * 1000;
  engine.updateTime(simulatedTime);

  // Phone call starts
  engine.onCallStateChanged(true, simulatedTime);
  assert.equal(engine.getState().isInCall, true);

  // User talks for 4 minutes with screen on (total 22 min accumulated)
  simulatedTime += 4 * 60 * 1000;
  engine.updateTime(simulatedTime);

  assert.equal(engine.getState().isBreakDue, true, 'Break should be due');
  assert.equal(engine.getState().isBreakSuppressed, true, 'Break should be suppressed during phone call');
  assert.equal(engine.getState().isBreakActive, false, 'Overlay must NOT appear during phone call');

  // Phone call terminates
  engine.onCallStateChanged(false, simulatedTime);
  assert.equal(engine.getState().isBreakSuppressed, false);
  assert.equal(engine.getState().isBreakActive, true, 'Break should trigger as soon as call ends');
});

test('Test F: Navigation application (Google Maps) suppresses reminder and queues until navigation ends', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Open Google Maps (excluded package)
  engine.onForegroundPackageChanged('com.google.android.apps.maps', simulatedTime);
  assert.equal(engine.isActivityExcluded(), true);

  // Run for 25 minutes while driving
  simulatedTime += 25 * 60 * 1000;
  engine.updateTime(simulatedTime);

  assert.equal(engine.getState().isBreakDue, true);
  assert.equal(engine.getState().isBreakSuppressed, true);
  assert.equal(engine.getState().isBreakActive, false);

  // Exit navigation to launcher
  engine.onForegroundPackageChanged('com.sec.android.app.launcher', simulatedTime);
  assert.equal(engine.getState().isBreakActive, true, 'Pending break displays as soon as navigation exits');
});

test('Test G: Skip a break restarts normal 20-minute interval', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Reach 20 minutes
  simulatedTime += 20 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, true);

  // User taps Skip
  engine.skipBreak(simulatedTime);
  assert.equal(engine.getState().isBreakActive, false);
  assert.equal(engine.getState().accumulatedScreenOnMs, 0);
  assert.equal(engine.getState().targetIntervalMs, 20 * 60 * 1000);

  // 15 minutes later, break should NOT be active
  simulatedTime += 15 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, false);

  // Another 5 minutes (total 20 min from skip)
  simulatedTime += 5 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, true);
});

test('Test H: Snooze a break schedules reminder after 5 minutes', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Reach 20 minutes
  simulatedTime += 20 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, true);

  // User taps Snooze
  engine.snoozeBreak(simulatedTime);
  assert.equal(engine.getState().isBreakActive, false);
  assert.equal(engine.getState().isSnoozed, true);
  assert.equal(engine.getState().targetIntervalMs, 5 * 60 * 1000);

  // Advance by 4 minutes
  simulatedTime += 4 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, false);

  // Advance by 1 more minute (5 min total)
  simulatedTime += 1 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, true, 'Snoozed break appears after exactly 5 minutes');
});

test('Test I: Device lock (Keyguard) pauses tracking and preserves accumulated duration', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Screen on for 12 minutes
  simulatedTime += 12 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().accumulatedScreenOnMs, 12 * 60 * 1000);

  // Lock phone
  engine.onKeyguardLocked(simulatedTime);
  assert.equal(engine.getState().isKeyguardLocked, true);

  // 15 minutes pass while locked
  simulatedTime += 15 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().accumulatedScreenOnMs, 12 * 60 * 1000, 'Accumulated duration preserved');

  // Unlock phone
  engine.onKeyguardUnlocked(simulatedTime);
  // Another 8 minutes of use
  simulatedTime += 8 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().accumulatedScreenOnMs, 20 * 60 * 1000);
  assert.equal(engine.getState().isBreakActive, true);
});

test('Test J: Reboot recovery restores persisted timer state safely', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Simulate device reboot with 14 minutes restored from DataStore
  engine.simulateReboot(14 * 60 * 1000, simulatedTime);
  assert.equal(engine.getState().accumulatedScreenOnMs, 14 * 60 * 1000);

  // 6 more minutes of screen on
  simulatedTime += 6 * 60 * 1000;
  engine.updateTime(simulatedTime);
  assert.equal(engine.getState().isBreakActive, true);
});

test('Test L: Pause monitoring from dashboard halts break reminders', () => {
  let simulatedTime = 100000;
  const engine = new ScreenTimeEngine({}, () => simulatedTime);

  // Pause monitoring
  engine.setMonitoringEnabled(false, simulatedTime);
  assert.equal(engine.getState().isMonitoring, false);

  // 40 minutes pass
  simulatedTime += 40 * 60 * 1000;
  engine.updateTime(simulatedTime);

  assert.equal(engine.getState().accumulatedScreenOnMs, 0);
  assert.equal(engine.getState().isBreakActive, false);
});
