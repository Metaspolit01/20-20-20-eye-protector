package com.eyecare.smartbreak.service

import android.accessibilityservice.AccessibilityService
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.telephony.TelephonyManager
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.ViewModelStore
import androidx.lifecycle.ViewModelStoreOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.eyecare.smartbreak.SmartEyeBreakApp
import com.eyecare.smartbreak.exclusions.ExclusionManager
import com.eyecare.smartbreak.overlay.BreakOverlayContent
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import com.eyecare.smartbreak.timer.ScreenTimeEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class EyeBreakAccessibilityService : AccessibilityService(), LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {

    companion object {
        private val _isServiceConnected = MutableStateFlow(false)
        val isServiceConnected: StateFlow<Boolean> = _isServiceConnected.asStateFlow()

        var currentInstance: EyeBreakAccessibilityService? = null
            private set
    }

    private val lifecycleRegistry = LifecycleRegistry(this)
    private val store = ViewModelStore()
    private val savedStateRegistryController = SavedStateRegistryController.create(this)

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val viewModelStore: ViewModelStore get() = store
    override val savedStateRegistry: SavedStateRegistry get() = savedStateRegistryController.savedStateRegistry

    lateinit var screenTimeEngine: ScreenTimeEngine
        private set
    private lateinit var exclusionManager: ExclusionManager

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private var windowManager: WindowManager? = null
    private var overlayView: ComposeView? = null
    private var isOverlayShowing = false

    private val handler = Handler(Looper.getMainLooper())
    private val timerRunnable = object : Runnable {
        override fun run() {
            if (::screenTimeEngine.isInitialized) {
                screenTimeEngine.reconcileTime()
            }
            handler.postDelayed(this, 1000L)
        }
    }

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (!::screenTimeEngine.isInitialized) return
            when (intent?.action) {
                Intent.ACTION_SCREEN_ON -> screenTimeEngine.onScreenOn()
                Intent.ACTION_SCREEN_OFF -> screenTimeEngine.onScreenOff()
                Intent.ACTION_USER_PRESENT -> screenTimeEngine.onKeyguardUnlocked()
                TelephonyManager.ACTION_PHONE_STATE_CHANGED -> {
                    val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                    val inCall = state == TelephonyManager.EXTRA_STATE_OFFHOOK || state == TelephonyManager.EXTRA_STATE_RINGING
                    screenTimeEngine.onCallStateChanged(inCall)
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        currentInstance = this
        _isServiceConnected.value = true
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)

        val app = application as SmartEyeBreakApp
        exclusionManager = ExclusionManager(this)
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
        val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
        val isInteractive = powerManager?.isInteractive ?: true
        val isKeyguardLocked = keyguardManager?.isKeyguardLocked ?: false

        serviceScope.launch {
            val initialPrefs = app.settingsRepository.preferencesFlow.first()
            exclusionManager.updateExcludedPackages(initialPrefs.excludedPackages)

            screenTimeEngine = ScreenTimeEngine(
                preferences = initialPrefs,
                exclusionManager = exclusionManager,
                onBreakTriggered = {
                    playNotificationEffects(initialPrefs)
                },
                onBreakDismissed = {
                    serviceScope.launch {
                        app.statisticsStore.incrementCompletedBreaks()
                    }
                },
                onStatePersisted = { accumulatedMs ->
                    serviceScope.launch {
                        app.statisticsStore.recordScreenOnTime(accumulatedMs)
                    }
                }
            )

            if (!isInteractive) screenTimeEngine.onScreenOff()
            if (isKeyguardLocked) screenTimeEngine.onKeyguardLocked()

            launch {
                app.settingsRepository.preferencesFlow.collect { prefs ->
                    screenTimeEngine.updatePreferences(prefs)
                }
            }

            launch {
                screenTimeEngine.state.collect { timerState ->
                    if (timerState.isBreakActive && !isOverlayShowing) {
                        showOverlay()
                    } else if (!timerState.isBreakActive && isOverlayShowing) {
                        hideOverlay()
                    }
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
            addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
        }
        registerReceiver(screenReceiver, filter)

        handler.post(timerRunnable)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: ""
            if (packageName.isNotEmpty() && ::screenTimeEngine.isInitialized) {
                screenTimeEngine.onForegroundPackageChanged(packageName)
            }
        }
    }

    override fun onInterrupt() {}

    private fun showOverlay() {
        if (isOverlayShowing || windowManager == null) return
        val composeView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(this@EyeBreakAccessibilityService)
            setViewTreeViewModelStoreOwner(this@EyeBreakAccessibilityService)
            setViewTreeSavedStateRegistryOwner(this@EyeBreakAccessibilityService)
            setContent {
                val timerState by screenTimeEngine.state.collectAsState()
                BreakOverlayContent(
                    remainingSeconds = timerState.remainingBreakSeconds,
                    onSkip = {
                        screenTimeEngine.skipBreak()
                    },
                    onSnooze = {
                        screenTimeEngine.snoozeBreak()
                    }
                )
            }
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        try {
            windowManager?.addView(composeView, params)
            overlayView = composeView
            isOverlayShowing = true
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun hideOverlay() {
        if (!isOverlayShowing || overlayView == null) return
        try {
            windowManager?.removeView(overlayView)
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            overlayView = null
            isOverlayShowing = false
        }
    }

    private fun playNotificationEffects(preferences: EyeBreakPreferences) {
        if (preferences.isSoundEnabled) {
            try {
                val notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val ringtone: Ringtone? = RingtoneManager.getRingtone(applicationContext, notificationUri)
                ringtone?.play()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        if (preferences.isVibrationEnabled) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vibratorManager.defaultVibrator.vibrate(
                        VibrationEffect.createOneShot(400L, VibrationEffect.DEFAULT_AMPLITUDE)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
                    vibrator.vibrate(VibrationEffect.createOneShot(400L, VibrationEffect.DEFAULT_AMPLITUDE))
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(timerRunnable)
        try {
            unregisterReceiver(screenReceiver)
        } catch (_: Exception) {}
        hideOverlay()
        currentInstance = null
        _isServiceConnected.value = false
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
    }
}
