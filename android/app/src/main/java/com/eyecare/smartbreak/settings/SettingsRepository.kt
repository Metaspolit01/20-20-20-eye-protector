package com.eyecare.smartbreak.settings

import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore by preferencesDataStore(name = "eye_break_settings")

class SettingsRepository(private val context: Context) {

    private object PreferencesKeys {
        val INTERVAL_MINUTES = intPreferencesKey("interval_minutes")
        val BREAK_DURATION_SECONDS = intPreferencesKey("break_duration_seconds")
        val SNOOZE_DURATION_MINUTES = intPreferencesKey("snooze_duration_minutes")
        val SOUND_ENABLED = booleanPreferencesKey("sound_enabled")
        val VIBRATION_ENABLED = booleanPreferencesKey("vibration_enabled")
        val MONITORING_ENABLED = booleanPreferencesKey("monitoring_enabled")
        val SETUP_COMPLETED = booleanPreferencesKey("setup_completed")
        val EXCLUDED_PACKAGES = stringSetPreferencesKey("excluded_packages")
        val ACCUMULATED_SCREEN_ON_MS = longPreferencesKey("accumulated_screen_on_ms")
    }

    val preferencesFlow: Flow<EyeBreakPreferences> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) {
                emit(emptyPreferences())
            } else {
                throw exception
            }
        }
        .map { preferences ->
            EyeBreakPreferences(
                intervalMinutes = preferences[PreferencesKeys.INTERVAL_MINUTES] ?: 20,
                breakDurationSeconds = preferences[PreferencesKeys.BREAK_DURATION_SECONDS] ?: 20,
                snoozeDurationMinutes = preferences[PreferencesKeys.SNOOZE_DURATION_MINUTES] ?: 5,
                isSoundEnabled = preferences[PreferencesKeys.SOUND_ENABLED] ?: true,
                isVibrationEnabled = preferences[PreferencesKeys.VIBRATION_ENABLED] ?: true,
                isMonitoringEnabled = preferences[PreferencesKeys.MONITORING_ENABLED] ?: true,
                hasCompletedSetup = preferences[PreferencesKeys.SETUP_COMPLETED] ?: false,
                excludedNavigationPackages = preferences[PreferencesKeys.EXCLUDED_PACKAGES]
                    ?: setOf("com.google.android.apps.maps", "com.waze")
            ).validate()
        }

    val savedAccumulatedScreenOnMs: Flow<Long> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { preferences ->
            preferences[PreferencesKeys.ACCUMULATED_SCREEN_ON_MS] ?: 0L
        }

    suspend fun updatePreferences(newPrefs: EyeBreakPreferences) {
        val valid = newPrefs.validate()
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.INTERVAL_MINUTES] = valid.intervalMinutes
            preferences[PreferencesKeys.BREAK_DURATION_SECONDS] = valid.breakDurationSeconds
            preferences[PreferencesKeys.SNOOZE_DURATION_MINUTES] = valid.snoozeDurationMinutes
            preferences[PreferencesKeys.SOUND_ENABLED] = valid.isSoundEnabled
            preferences[PreferencesKeys.VIBRATION_ENABLED] = valid.isVibrationEnabled
            preferences[PreferencesKeys.MONITORING_ENABLED] = valid.isMonitoringEnabled
            preferences[PreferencesKeys.SETUP_COMPLETED] = valid.hasCompletedSetup
            preferences[PreferencesKeys.EXCLUDED_PACKAGES] = valid.excludedNavigationPackages
        }
    }

    suspend fun saveAccumulatedScreenOn(accumulatedMs: Long) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.ACCUMULATED_SCREEN_ON_MS] = accumulatedMs
        }
    }

    suspend fun setMonitoringEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.MONITORING_ENABLED] = enabled
        }
    }

    suspend fun setSetupCompleted(completed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.SETUP_COMPLETED] = completed
        }
    }
}
