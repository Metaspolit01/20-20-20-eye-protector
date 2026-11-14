package com.eyecare.smartbreak.settings

data class EyeBreakPreferences(
    val intervalMinutes: Int = 20,
    val breakDurationSeconds: Int = 20,
    val snoozeDurationMinutes: Int = 5,
    val isSoundEnabled: Boolean = true,
    val isVibrationEnabled: Boolean = true,
    val isMonitoringEnabled: Boolean = true,
    val hasCompletedSetup: Boolean = false,
    val excludedNavigationPackages: Set<String> = setOf(
        "com.google.android.apps.maps",
        "com.waze"
    )
) {
    fun validate(): EyeBreakPreferences {
        return copy(
            intervalMinutes = intervalMinutes.coerceIn(1, 120),
            breakDurationSeconds = breakDurationSeconds.coerceIn(5, 120),
            snoozeDurationMinutes = snoozeDurationMinutes.coerceIn(1, 30)
        )
    }
}
