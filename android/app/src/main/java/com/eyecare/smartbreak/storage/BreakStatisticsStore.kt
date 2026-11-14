package com.eyecare.smartbreak.storage

import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.*

private val Context.statsDataStore by preferencesDataStore(name = "eye_break_stats")

data class DailyStatistics(
    val completedBreaksToday: Int = 0,
    val todayScreenOnMs: Long = 0L,
    val dateKey: String = ""
)

class BreakStatisticsStore(private val context: Context) {

    private val dateFormatter = SimpleDateFormat("yyyyMMdd", Locale.US)

    private fun todayKey(): String = dateFormatter.format(Date())

    val statisticsFlow: Flow<DailyStatistics> = context.statsDataStore.data.map { preferences ->
        val currentDay = todayKey()
        val storedDay = preferences[stringPreferencesKey("current_date")] ?: currentDay

        if (storedDay != currentDay) {
            // New day: reset daily count
            DailyStatistics(0, 0L, currentDay)
        } else {
            DailyStatistics(
                completedBreaksToday = preferences[intPreferencesKey("completed_breaks")] ?: 0,
                todayScreenOnMs = preferences[longPreferencesKey("today_screen_on_ms")] ?: 0L,
                dateKey = currentDay
            )
        }
    }

    suspend fun incrementCompletedBreaks() {
        val currentDay = todayKey()
        context.statsDataStore.edit { prefs ->
            val storedDay = prefs[stringPreferencesKey("current_date")] ?: currentDay
            if (storedDay != currentDay) {
                prefs[stringPreferencesKey("current_date")] = currentDay
                prefs[intPreferencesKey("completed_breaks")] = 1
                prefs[longPreferencesKey("today_screen_on_ms")] = 0L
            } else {
                val count = prefs[intPreferencesKey("completed_breaks")] ?: 0
                prefs[intPreferencesKey("completed_breaks")] = count + 1
            }
        }
    }

    suspend fun addScreenOnTime(msDelta: Long) {
        val currentDay = todayKey()
        context.statsDataStore.edit { prefs ->
            val storedDay = prefs[stringPreferencesKey("current_date")] ?: currentDay
            if (storedDay != currentDay) {
                prefs[stringPreferencesKey("current_date")] = currentDay
                prefs[intPreferencesKey("completed_breaks")] = 0
                prefs[longPreferencesKey("today_screen_on_ms")] = msDelta
            } else {
                val current = prefs[longPreferencesKey("today_screen_on_ms")] ?: 0L
                prefs[longPreferencesKey("today_screen_on_ms")] = current + msDelta
            }
        }
    }
}
