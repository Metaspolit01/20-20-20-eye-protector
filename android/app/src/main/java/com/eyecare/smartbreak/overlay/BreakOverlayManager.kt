package com.eyecare.smartbreak.overlay

import android.accessibilityservice.AccessibilityService
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.WindowManager
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.*
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.eyecare.smartbreak.timer.MonotonicBreakTimer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

class BreakOverlayManager(
    private val service: AccessibilityService,
    private val onSkipAction: () -> Unit,
    private val onSnoozeAction: () -> Unit,
    private val onCompletedAction: () -> Unit
) {
    private val windowManager = service.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var overlayComposeView: ComposeView? = null
    private var monotonicTimer: MonotonicBreakTimer? = null
    private val overlayScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    val isShowing: Boolean
        get() = overlayComposeView != null

    @SuppressLint("RtlHardcoded")
    fun show(breakDurationSeconds: Int = 20) {
        if (isShowing) return // Prevent multiple overlay instances

        val dummyLifecycleOwner = OverlayLifecycleOwner()
        dummyLifecycleOwner.performRestore(null)
        dummyLifecycleOwner.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        dummyLifecycleOwner.handleLifecycleEvent(Lifecycle.Event.ON_START)
        dummyLifecycleOwner.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)

        val timer = MonotonicBreakTimer(breakDurationSeconds)
        monotonicTimer = timer

        val composeView = ComposeView(service).apply {
            setViewTreeLifecycleOwner(dummyLifecycleOwner)
            setViewTreeSavedStateRegistryOwner(dummyLifecycleOwner)

            setContent {
                val remainingSeconds by timer.remainingSeconds.collectAsState()
                BreakOverlayContent(
                    remainingSeconds = remainingSeconds,
                    onSkip = {
                        dismiss()
                        onSkipAction()
                    },
                    onSnooze = {
                        dismiss()
                        onSnoozeAction()
                    }
                )
            }
        }

        val params = WindowManager.LayoutParams().apply {
            width = WindowManager.LayoutParams.MATCH_PARENT
            height = WindowManager.LayoutParams.MATCH_PARENT
            type = WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
            flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            format = PixelFormat.TRANSLUCENT
            gravity = Gravity.FILL
        }

        try {
            windowManager.addView(composeView, params)
            overlayComposeView = composeView

            timer.start(overlayScope) {
                dismiss()
                onCompletedAction()
            }
        } catch (_: Exception) {
            overlayComposeView = null
        }
    }

    fun dismiss() {
        monotonicTimer?.cancel()
        monotonicTimer = null

        overlayComposeView?.let { view ->
            try {
                windowManager.removeView(view)
            } catch (_: Exception) {
            }
            overlayComposeView = null
        }
    }

    fun onDestroy() {
        dismiss()
        overlayScope.cancel()
    }
}

/**
 * Minimal LifecycleOwner to anchor ComposeView in a Service window
 */
private class OverlayLifecycleOwner : LifecycleOwner, SavedStateRegistryOwner {
    private val lifecycleRegistry = LifecycleRegistry(this)
    private val savedStateRegistryController = SavedStateRegistryController.create(this)

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val savedStateRegistry: SavedStateRegistry get() = savedStateRegistryController.savedStateRegistry

    fun performRestore(savedState: android.os.Bundle?) {
        savedStateRegistryController.performRestore(savedState)
    }

    fun handleLifecycleEvent(event: Lifecycle.Event) {
        lifecycleRegistry.handleLifecycleEvent(event)
    }
}
