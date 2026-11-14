package com.eyecare.smartbreak.service

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import com.eyecare.smartbreak.SmartEyeBreakApp
import com.eyecare.smartbreak.exclusions.ExclusionManager
import com.eyecare.smartbreak.monitoring.CallStateTracker
import com.eyecare.smartbreak.monitoring.ScreenStateReceiver
import com.eyecare.smartbreak.overlay.BreakOverlayManager
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import com.eyecare.smartbreak.sound.SoundVibrationHelper
import com.eyecare.smartbreak.timer.ScreenTimeEngine
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class EyeBreakAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private lateinit var exclusionManager: ExclusionManager
    private lateinit var overlayManager: BreakOverlayManager
    private lateinit var soundVibrationHelper: SoundVibrationHelper
    private lateinit var screenReceiver: ScreenStateReceiver
    private lateinit var callTracker: CallStateTracker

    var screenTimeEngine: ScreenTimeEngine? = null
        private set

    override fun onServiceConnected() {
        super.onServiceConnected()
        currentInstance = this
        _isServiceConnected.value = true

        val app = application as SmartEyeBreakApp
        exclusionManager = ExclusionManager()
        soundVibrationHelper = SoundVibrationHelper(this)

        overlayManager = BreakOverlayManager(
            service = this,
            onSkipAction = {
                screenTimeEngine?.skipBreak()
            },
            onSnoozeAction = {
                screenTimeEngine?.snoozeBreak()
            },
            onCompletedAction = {
                serviceScope.launch {
                    app.statisticsStore.incrementCompletedBreaks()
                }
                screenTimeEngine?.completeBreak()
            }
        )

        val engine = ScreenTimeEngine(
            preferences = EyeBreakPreferences(),
            exclusionManager = exclusionManager,
            onBreakTriggered = {
                serviceScope.launch {
                    app.settingsRepository.preferencesFlow.collect { prefs ->
                        soundVibrationHelper.triggerBreakAlert(prefs.isSoundEnabled, prefs.isVibrationEnabled)
                        overlayManager.show(prefs.breakDurationSeconds)
                    }
                }
            },
            onBreakDismissed = {
                overlayManager.dismiss()
            },
            onStatePersisted = { accumulatedMs ->
                serviceScope.launch {
                    app.settingsRepository.saveAccumulatedScreenOn(accumulatedMs)
                }
            }
        )
        screenTimeEngine = engine

        // Register hardware broadcast receivers
        screenReceiver = ScreenStateReceiver(
            onScreenOn = { engine.onScreenOn() },
            onScreenOff = { engine.onScreenOff() },
            onUserPresent = { engine.onKeyguardUnlocked() },
            onKeyguardStateChanged = { isLocked ->
                if (isLocked) engine.onKeyguardLocked() else engine.onKeyguardUnlocked()
            }
        )
        screenReceiver.register(this)

        callTracker = CallStateTracker(this) { isInCall ->
            engine.onCallStateChanged(isInCall)
        }
        callTracker.startListening()

        // Sync DataStore preferences
        serviceScope.launch {
            app.settingsRepository.preferencesFlow.collect { prefs ->
                exclusionManager.updateNavigationPackages(prefs.excludedNavigationPackages)
                engine.updatePreferences(prefs)
                engine.setMonitoringEnabled(prefs.isMonitoringEnabled)
            }
        }

        // Restore saved accumulated time
        serviceScope.launch {
            app.settingsRepository.savedAccumulatedScreenOnMs.collect { savedMs ->
                if (savedMs > 0 && engine.state.value.accumulatedScreenOnMs == 0L) {
                    engine.restoreAccumulatedState(savedMs)
                }
            }
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val pkg = event.packageName?.toString() ?: return
            screenTimeEngine?.onForegroundPackageChanged(pkg)
        }
    }

    override fun onInterrupt() {
        overlayManager.dismiss()
    }

    override fun onDestroy() {
        screenReceiver.unregister(this)
        callTracker.stopListening()
        overlayManager.onDestroy()
        serviceScope.cancel()
        currentInstance = null
        _isServiceConnected.value = false
        super.onDestroy()
    }

    companion object {
        private val _isServiceConnected = MutableStateFlow(false)
        val isServiceConnected = _isServiceConnected.asStateFlow()

        var currentInstance: EyeBreakAccessibilityService? = null
            private set
    }
}
