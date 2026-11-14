package com.eyecare.smartbreak.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "eye_break_settings")

class SettingsRepository(private val context: Context) {

    private object Keys {
        val INTERVAL_MINUTES = intPreferencesKey("interval_minutes")
        val BREAK_DURATION_SECONDS = intPreferencesKey("break_duration_seconds")
        val SNOOZE_DURATION_MINUTES = intPreferencesKey("snooze_duration_minutes")
        val IS_MONITORING_ENABLED = booleanPreferencesKey("is_monitoring_enabled")
        val HAS_COMPLETED_SETUP = booleanPreferencesKey("has_completed_setup")
        val IS_SOUND_ENABLED = booleanPreferencesKey("is_sound_enabled")
        val IS_VIBRATION_ENABLED = booleanPreferencesKey("is_vibration_enabled")
        val EXCLUDED_PACKAGES = stringSetPreferencesKey("excluded_packages")
    }

    val preferencesFlow: Flow<EyeBreakPreferences> = context.dataStore.data.map { prefs ->
        EyeBreakPreferences(
            intervalMinutes = prefs[Keys.INTERVAL_MINUTES] ?: 20,
            breakDurationSeconds = prefs[Keys.BREAK_DURATION_SECONDS] ?: 20,
            snoozeDurationMinutes = prefs[Keys.SNOOZE_DURATION_MINUTES] ?: 5,
            isMonitoringEnabled = prefs[Keys.IS_MONITORING_ENABLED] ?: true,
            hasCompletedSetup = prefs[Keys.HAS_COMPLETED_SETUP] ?: false,
            isSoundEnabled = prefs[Keys.IS_SOUND_ENABLED] ?: true,
            isVibrationEnabled = prefs[Keys.IS_VIBRATION_ENABLED] ?: true,
            excludedPackages = prefs[Keys.EXCLUDED_PACKAGES] ?: emptySet()
        )
    }

    suspend fun setMonitoringEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[Keys.IS_MONITORING_ENABLED] = enabled
        }
    }

    suspend fun setSetupCompleted(completed: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[Keys.HAS_COMPLETED_SETUP] = completed
        }
    }

    suspend fun updatePreferences(newPreferences: EyeBreakPreferences) {
        context.dataStore.edit { prefs ->
            prefs[Keys.INTERVAL_MINUTES] = newPreferences.intervalMinutes
            prefs[Keys.BREAK_DURATION_SECONDS] = newPreferences.breakDurationSeconds
            prefs[Keys.SNOOZE_DURATION_MINUTES] = newPreferences.snoozeDurationMinutes
            prefs[Keys.IS_MONITORING_ENABLED] = newPreferences.isMonitoringEnabled
            prefs[Keys.HAS_COMPLETED_SETUP] = newPreferences.hasCompletedSetup
            prefs[Keys.IS_SOUND_ENABLED] = newPreferences.isSoundEnabled
            prefs[Keys.IS_VIBRATION_ENABLED] = newPreferences.isVibrationEnabled
            prefs[Keys.EXCLUDED_PACKAGES] = newPreferences.excludedPackages
        }
    }
}
