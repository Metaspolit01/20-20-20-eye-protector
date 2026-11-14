/**
 * Authoritative 20-20-20 Screen-Time Engine
 * Modeled after native Android SystemClock.elapsedRealtime(), PowerManager.isInteractive,
 * KeyguardManager.isKeyguardLocked, and Telephony/Navigation exclusions.
 */

export interface EngineConfig {
  intervalMinutes: number;   // Default 20
  breakDurationSeconds: number; // Default 20
  snoozeDurationMinutes: number; // Default 5
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  excludedPackages: string[]; // e.g. ["com.google.android.apps.maps", "com.waze"]
  monitoringEnabled: boolean;
}

export const DEFAULT_CONFIG: EngineConfig = {
  intervalMinutes: 20,
  breakDurationSeconds: 20,
  snoozeDurationMinutes: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  excludedPackages: [
    'com.google.android.apps.maps',
    'com.waze',
  ],
  monitoringEnabled: true,
};

export interface EngineState {
  // Authoritative tracking states
  isMonitoring: boolean;
  isInteractive: boolean;   // Screen ON
  isKeyguardLocked: boolean; // Device locked
  isInCall: boolean;        // Active phone call
  currentForegroundPackage: string; // Active package name

  // Accumulated durations in milliseconds
  accumulatedScreenOnMs: number;
  lastTrackingTimestampMs: number | null; // Monotonic timestamp when current tracking interval began

  // Target deadline
  targetIntervalMs: number; // e.g. 20 * 60 * 1000 or snooze
  isSnoozed: boolean;

  // Break overlay state
  isBreakDue: boolean;
  isBreakSuppressed: boolean; // Break is due but postponed because of call or navigation
  isBreakActive: boolean;     // Break overlay is currently displaying
  breakDeadlineMs: number | null; // Monotonic timestamp when active 20s break completes
  remainingBreakSeconds: number;

  // Daily statistics
  completedBreaksToday: number;
  todayAccumulatedScreenOnMs: number;
}

export class ScreenTimeEngine {
  private config: EngineConfig;
  private state: EngineState;
  private clockNowMs: () => number;

  constructor(
    initialConfig: Partial<EngineConfig> = {},
    customClock?: () => number
  ) {
    this.config = { ...DEFAULT_CONFIG, ...initialConfig };
    this.clockNowMs = customClock || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    const targetMs = this.config.intervalMinutes * 60 * 1000;
    this.state = {
      isMonitoring: this.config.monitoringEnabled,
      isInteractive: true,
      isKeyguardLocked: false,
      isInCall: false,
      currentForegroundPackage: 'com.sec.android.app.launcher',
      accumulatedScreenOnMs: 0,
      lastTrackingTimestampMs: this.clockNowMs(),
      targetIntervalMs: targetMs,
      isSnoozed: false,
      isBreakDue: false,
      isBreakSuppressed: false,
      isBreakActive: false,
      breakDeadlineMs: null,
      remainingBreakSeconds: this.config.breakDurationSeconds,
      completedBreaksToday: 0,
      todayAccumulatedScreenOnMs: 0,
    };
  }

  public getState(): Readonly<EngineState> {
    return { ...this.state };
  }

  public getConfig(): Readonly<EngineConfig> {
    return { ...this.config };
  }

  /**
   * Evaluates if screen-on time should currently be accumulating
   */
  public isEligibleForTracking(): boolean {
    return (
      this.state.isMonitoring &&
      this.state.isInteractive &&
      !this.state.isKeyguardLocked &&
      !this.state.isBreakActive
    );
  }

  /**
   * Checks if current activity excludes overlay display
   */
  public isActivityExcluded(): boolean {
    if (this.state.isInCall) return true;
    if (this.config.excludedPackages.includes(this.state.currentForegroundPackage)) {
      return true;
    }
    return false;
  }

  /**
   * Internal reconciliation of elapsed time based on monotonic clock
   */
  public updateTime(currentTimeMs?: number): void {
    const now = currentTimeMs ?? this.clockNowMs();

    // 1. If currently in a break countdown
    if (this.state.isBreakActive && this.state.breakDeadlineMs !== null) {
      const remainingMs = Math.max(0, this.state.breakDeadlineMs - now);
      this.state.remainingBreakSeconds = Math.ceil(remainingMs / 1000);

      if (now >= this.state.breakDeadlineMs) {
        // Break successfully completed!
        this.completeBreak(now);
      }
      return;
    }

    // 2. Accumulate screen-on time if eligible
    if (this.isEligibleForTracking() && this.state.lastTrackingTimestampMs !== null) {
      const delta = Math.max(0, now - this.state.lastTrackingTimestampMs);
      this.state.accumulatedScreenOnMs += delta;
      this.state.todayAccumulatedScreenOnMs += delta;
      this.state.lastTrackingTimestampMs = now;

      // Check if threshold reached
      if (this.state.accumulatedScreenOnMs >= this.state.targetIntervalMs) {
        this.state.isBreakDue = true;
        this.evaluateBreakTrigger(now);
      }
    } else {
      // Not eligible, keep timestamp null or updated
      this.state.lastTrackingTimestampMs = this.isEligibleForTracking() ? now : null;
    }

    // 3. If a break is already due or was suppressed, re-evaluate whenever eligibility changes
    if (this.state.isBreakDue && !this.state.isBreakActive) {
      this.evaluateBreakTrigger(now);
    }
  }

  private evaluateBreakTrigger(now: number): void {
    // If phone is locked or screen off, do not display break yet
    if (!this.state.isInteractive || this.state.isKeyguardLocked || !this.state.isMonitoring) {
      this.state.isBreakSuppressed = true;
      return;
    }

    // If an excluded activity is foreground (e.g. Navigation or Active Call)
    if (this.isActivityExcluded()) {
      this.state.isBreakSuppressed = true;
      return;
    }

    // Eligible! Trigger full-screen break overlay
    this.state.isBreakSuppressed = false;
    this.state.isBreakActive = true;
    this.state.breakDeadlineMs = now + (this.config.breakDurationSeconds * 1000);
    this.state.remainingBreakSeconds = this.config.breakDurationSeconds;
    // Stop screen-time accumulation during break
    this.state.lastTrackingTimestampMs = null;
  }

  /**
   * Action: Complete break automatically after countdown
   */
  public completeBreak(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.state.isBreakActive = false;
    this.state.isBreakDue = false;
    this.state.isBreakSuppressed = false;
    this.state.breakDeadlineMs = null;
    this.state.isSnoozed = false;
    this.state.completedBreaksToday += 1;
    this.resetInterval(this.config.intervalMinutes * 60 * 1000, current);
  }

  /**
   * Action: User taps Skip
   */
  public skipBreak(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.state.isBreakActive = false;
    this.state.isBreakDue = false;
    this.state.isBreakSuppressed = false;
    this.state.breakDeadlineMs = null;
    this.state.isSnoozed = false;
    this.resetInterval(this.config.intervalMinutes * 60 * 1000, current);
  }

  /**
   * Action: User taps Snooze 5 min
   */
  public snoozeBreak(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.state.isBreakActive = false;
    this.state.isBreakDue = false;
    this.state.isBreakSuppressed = false;
    this.state.breakDeadlineMs = null;
    this.state.isSnoozed = true;
    // Reset accumulated to 0 and set target to snooze duration
    this.resetInterval(this.config.snoozeDurationMinutes * 60 * 1000, current);
  }

  private resetInterval(targetMs: number, now: number): void {
    this.state.accumulatedScreenOnMs = 0;
    this.state.targetIntervalMs = targetMs;
    this.state.lastTrackingTimestampMs = this.isEligibleForTracking() ? now : null;
  }

  // Hardware and Lifecycle Event Handlers:

  public onScreenOn(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.state.isInteractive = true;
    if (this.isEligibleForTracking()) {
      this.state.lastTrackingTimestampMs = current;
    }
    this.updateTime(current);
  }

  public onScreenOff(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current); // Preserve accumulated time before pausing
    this.state.isInteractive = false;
    this.state.lastTrackingTimestampMs = null;
  }

  public onKeyguardLocked(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.state.isKeyguardLocked = true;
    this.state.lastTrackingTimestampMs = null;
  }

  public onKeyguardUnlocked(now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.state.isKeyguardLocked = false;
    if (this.isEligibleForTracking()) {
      this.state.lastTrackingTimestampMs = current;
    }
    this.updateTime(current);
  }

  public onCallStateChanged(inCall: boolean, now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.state.isInCall = inCall;
    this.updateTime(current);
  }

  public onForegroundPackageChanged(packageName: string, now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.state.currentForegroundPackage = packageName;
    this.updateTime(current);
  }

  public setMonitoringEnabled(enabled: boolean, now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.state.isMonitoring = enabled;
    this.config.monitoringEnabled = enabled;
    if (!enabled) {
      this.state.lastTrackingTimestampMs = null;
      if (this.state.isBreakActive) {
        this.state.isBreakActive = false;
        this.state.breakDeadlineMs = null;
      }
    } else {
      if (this.isEligibleForTracking()) {
        this.state.lastTrackingTimestampMs = current;
      }
    }
  }

  public updateConfig(newConfig: Partial<EngineConfig>, now?: number): void {
    const current = now ?? this.clockNowMs();
    this.updateTime(current);
    this.config = { ...this.config, ...newConfig };
    if (!this.state.isSnoozed) {
      this.state.targetIntervalMs = this.config.intervalMinutes * 60 * 1000;
    }
  }

  /**
   * Simulates device reboot recovery: restoring persisted state
   */
  public simulateReboot(restoredAccumulatedMs: number, now?: number): void {
    const current = now ?? this.clockNowMs();
    this.state.accumulatedScreenOnMs = restoredAccumulatedMs;
    this.state.isBreakActive = false;
    this.state.isBreakDue = this.state.accumulatedScreenOnMs >= this.state.targetIntervalMs;
    this.state.isBreakSuppressed = false;
    this.state.lastTrackingTimestampMs = this.isEligibleForTracking() ? current : null;
  }
}
