package com.eyecare.smartbreak.timer

data class TimerState(
    val isMonitoring: Boolean = true,
    val isInteractive: Boolean = true,
    val isKeyguardLocked: Boolean = false,
    val isBreakDue: Boolean = false,
    val isBreakActive: Boolean = false,
    val isBreakSuppressed: Boolean = false,
    val isSnoozed: Boolean = false,
    val accumulatedScreenOnMs: Long = 0L,
    val targetIntervalMs: Long = 20 * 60 * 1000L,
    val remainingBreakSeconds: Int = 20,
    val breakDeadlineRealtimeMs: Long? = null,
    val currentForegroundPackage: String = "",
    val isInCall: Boolean = false
) {
    val remainingIntervalMs: Long
        get() = (targetIntervalMs - accumulatedScreenOnMs).coerceAtLeast(0L)

    val progressFraction: Float
        get() = if (targetIntervalMs > 0) {
            (accumulatedScreenOnMs.toFloat() / targetIntervalMs).coerceIn(0f, 1f)
        } else {
            0f
        }
}
