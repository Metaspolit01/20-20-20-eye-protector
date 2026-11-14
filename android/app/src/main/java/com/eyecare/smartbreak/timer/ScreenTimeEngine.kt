package com.eyecare.smartbreak.timer

import android.os.SystemClock
import com.eyecare.smartbreak.exclusions.ExclusionManager
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Authoritative Screen-Time Engine for Samsung Galaxy M15 5G & Android 16.
 *
 * Employs SystemClock.elapsedRealtime() delta reconciliation rather than a high-frequency polling
 * loop, conserving CPU & battery while guaranteeing millisecond precision.
 */
class ScreenTimeEngine(
    private var preferences: EyeBreakPreferences,
    private val exclusionManager: ExclusionManager,
    private val onBreakTriggered: () -> Unit,
    private val onBreakDismissed: () -> Unit,
    private val onStatePersisted: (accumulatedMs: Long) -> Unit,
    private val clock: () -> Long = { SystemClock.elapsedRealtime() }
) {
    private val _state = MutableStateFlow(
        TimerState(
            isMonitoring = preferences.isMonitoringEnabled,
            targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
        )
    )
    val state: StateFlow<TimerState> = _state.asStateFlow()

    private var lastTrackingTimestamp: Long? = null

    init {
        if (isEligibleForTracking()) {
            lastTrackingTimestamp = clock()
        }
    }

    @Synchronized
    fun isEligibleForTracking(): Boolean {
        val s = _state.value
        return s.isMonitoring && s.isInteractive && !s.isKeyguardLocked && !s.isBreakActive
    }

    @Synchronized
    fun reconcileTime(now: Long = clock()) {
        val current = _state.value
        if (isEligibleForTracking() && lastTrackingTimestamp != null) {
            val delta = (now - lastTrackingTimestamp!!).coerceAtLeast(0L)
            val updatedAccumulated = current.accumulatedScreenOnMs + delta
            lastTrackingTimestamp = now

            if (updatedAccumulated >= current.targetIntervalMs) {
                _state.update {
                    it.copy(
                        accumulatedScreenOnMs = updatedAccumulated,
                        isBreakDue = true
                    )
                }
                evaluateBreakDisplay(now)
            } else {
                _state.update { it.copy(accumulatedScreenOnMs = updatedAccumulated) }
            }
        } else {
            lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        }

        // If a break is due and pending suppression release
        if (_state.value.isBreakDue && !_state.value.isBreakActive) {
            evaluateBreakDisplay(now)
        }
    }

    @Synchronized
    private fun evaluateBreakDisplay(now: Long) {
        val current = _state.value
        if (!current.isInteractive || current.isKeyguardLocked || !current.isMonitoring) {
            _state.update { it.copy(isBreakSuppressed = true) }
            return
        }

        if (exclusionManager.isExcluded(current.currentForegroundPackage, current.isInCall)) {
            _state.update { it.copy(isBreakSuppressed = true) }
            return
        }

        // Eligible! Launch break overlay
        _state.update {
            it.copy(
                isBreakSuppressed = false,
                isBreakActive = true,
                breakDeadlineRealtimeMs = now + (preferences.breakDurationSeconds * 1000L),
                remainingBreakSeconds = preferences.breakDurationSeconds
            )
        }
        lastTrackingTimestamp = null
        onBreakTriggered()
    }

    @Synchronized
    fun onScreenOn(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isInteractive = true) }
        if (isEligibleForTracking()) {
            lastTrackingTimestamp = now
        }
        reconcileTime(now)
    }

    @Synchronized
    fun onScreenOff(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isInteractive = false) }
        lastTrackingTimestamp = null
        onStatePersisted(_state.value.accumulatedScreenOnMs)
    }

    @Synchronized
    fun onKeyguardLocked(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isKeyguardLocked = true) }
        lastTrackingTimestamp = null
        onStatePersisted(_state.value.accumulatedScreenOnMs)
    }

    @Synchronized
    fun onKeyguardUnlocked(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isKeyguardLocked = false) }
        if (isEligibleForTracking()) {
            lastTrackingTimestamp = now
        }
        reconcileTime(now)
    }

    @Synchronized
    fun onForegroundPackageChanged(packageName: String, now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(currentForegroundPackage = packageName) }
        reconcileTime(now)
    }

    @Synchronized
    fun onCallStateChanged(inCall: Boolean, now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isInCall = inCall) }
        reconcileTime(now)
    }

    @Synchronized
    fun skipBreak(now: Long = clock()) {
        _state.update {
            it.copy(
                isBreakActive = false,
                isBreakDue = false,
                isBreakSuppressed = false,
                isSnoozed = false,
                breakDeadlineRealtimeMs = null,
                accumulatedScreenOnMs = 0L,
                targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        onBreakDismissed()
        onStatePersisted(0L)
    }

    @Synchronized
    fun snoozeBreak(now: Long = clock()) {
        _state.update {
            it.copy(
                isBreakActive = false,
                isBreakDue = false,
                isBreakSuppressed = false,
                isSnoozed = true,
                breakDeadlineRealtimeMs = null,
                accumulatedScreenOnMs = 0L,
                targetIntervalMs = preferences.snoozeDurationMinutes * 60 * 1000L
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        onBreakDismissed()
        onStatePersisted(0L)
    }

    @Synchronized
    fun completeBreak(now: Long = clock()) {
        _state.update {
            it.copy(
                isBreakActive = false,
                isBreakDue = false,
                isBreakSuppressed = false,
                isSnoozed = false,
                breakDeadlineRealtimeMs = null,
                accumulatedScreenOnMs = 0L,
                targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        onBreakDismissed()
        onStatePersisted(0L)
    }

    @Synchronized
    fun setMonitoringEnabled(enabled: Boolean, now: Long = clock()) {
        reconcileTime(now)
        _state.update {
            it.copy(
                isMonitoring = enabled,
                isBreakActive = if (!enabled) false else it.isBreakActive
            )
        }
        if (!enabled) {
            lastTrackingTimestamp = null
            onBreakDismissed()
        } else {
            if (isEligibleForTracking()) {
                lastTrackingTimestamp = now
            }
        }
        onStatePersisted(_state.value.accumulatedScreenOnMs)
    }

    @Synchronized
    fun updatePreferences(newPrefs: EyeBreakPreferences, now: Long = clock()) {
        preferences = newPrefs
        reconcileTime(now)
        if (!_state.value.isSnoozed) {
            _state.update { it.copy(targetIntervalMs = preferences.intervalMinutes * 60 * 1000L) }
        }
    }

    @Synchronized
    fun restoreAccumulatedState(restoredMs: Long, now: Long = clock()) {
        _state.update {
            it.copy(
                accumulatedScreenOnMs = restoredMs,
                isBreakDue = restoredMs >= it.targetIntervalMs
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
    }
}
