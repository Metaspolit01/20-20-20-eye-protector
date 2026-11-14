package com.eyecare.smartbreak.settings

data class EyeBreakPreferences(
    val intervalMinutes: Int = 20,
    val breakDurationSeconds: Int = 20,
    val snoozeDurationMinutes: Int = 5,
    val isMonitoringEnabled: Boolean = true,
    val hasCompletedSetup: Boolean = false,
    val isSoundEnabled: Boolean = true,
    val isVibrationEnabled: Boolean = true,
    val excludedPackages: Set<String> = emptySet()
)
