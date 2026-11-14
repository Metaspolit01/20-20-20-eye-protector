package com.eyecare.smartbreak.timer

data class TimerState(
    val isMonitoring: Boolean = true,
    val isInteractive: Boolean = true,
    val isKeyguardLocked: Boolean = false,
    val isInCall: Boolean = false,
    val currentForegroundPackage: String = "",
    val accumulatedScreenOnMs: Long = 0L,
    val targetIntervalMs: Long = 20 * 60 * 1000L,
    val isSnoozed: Boolean = false,
    val isBreakDue: Boolean = false,
    val isBreakSuppressed: Boolean = false,
    val isBreakActive: Boolean = false,
    val breakDeadlineRealtimeMs: Long? = null,
    val remainingBreakSeconds: Int = 20
) {
    val remainingIntervalMs: Long
        get() = (targetIntervalMs - accumulatedScreenOnMs).coerceAtLeast(0L)

    val progressFraction: Float
        get() = if (targetIntervalMs > 0) {
            (accumulatedScreenOnMs.toFloat() / targetIntervalMs.toFloat()).coerceIn(0f, 1f)
        } else 0f
}
