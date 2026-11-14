package com.eyecare.smartbreak.storage

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val Context.statsDataStore by preferencesDataStore(name = "eye_break_statistics")

class StatisticsStore(private val context: Context) {

    private object Keys {
        val COMPLETED_BREAKS_TODAY = intPreferencesKey("completed_breaks_today")
        val TODAY_SCREEN_ON_MS = longPreferencesKey("today_screen_on_ms")
        val STATS_DATE = stringPreferencesKey("stats_date")
    }

    private fun getTodayDateString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }

    val statisticsFlow: Flow<DailyStatistics> = context.statsDataStore.data.map { prefs ->
        val today = getTodayDateString()
        val storedDate = prefs[Keys.STATS_DATE] ?: ""
        if (storedDate != today) {
            DailyStatistics(completedBreaksToday = 0, todayScreenOnMs = 0L, date = today)
        } else {
            DailyStatistics(
                completedBreaksToday = prefs[Keys.COMPLETED_BREAKS_TODAY] ?: 0,
                todayScreenOnMs = prefs[Keys.TODAY_SCREEN_ON_MS] ?: 0L,
                date = storedDate
            )
        }
    }

    suspend fun incrementCompletedBreaks() {
        val today = getTodayDateString()
        context.statsDataStore.edit { prefs ->
            val storedDate = prefs[Keys.STATS_DATE] ?: ""
            if (storedDate != today) {
                prefs[Keys.STATS_DATE] = today
                prefs[Keys.COMPLETED_BREAKS_TODAY] = 1
                prefs[Keys.TODAY_SCREEN_ON_MS] = 0L
            } else {
                val current = prefs[Keys.COMPLETED_BREAKS_TODAY] ?: 0
                prefs[Keys.COMPLETED_BREAKS_TODAY] = current + 1
            }
        }
    }

    suspend fun recordScreenOnTime(additionalMs: Long) {
        if (additionalMs <= 0) return
        val today = getTodayDateString()
        context.statsDataStore.edit { prefs ->
            val storedDate = prefs[Keys.STATS_DATE] ?: ""
            if (storedDate != today) {
                prefs[Keys.STATS_DATE] = today
                prefs[Keys.COMPLETED_BREAKS_TODAY] = 0
                prefs[Keys.TODAY_SCREEN_ON_MS] = additionalMs
            } else {
                val current = prefs[Keys.TODAY_SCREEN_ON_MS] ?: 0L
                prefs[Keys.TODAY_SCREEN_ON_MS] = current + additionalMs
            }
        }
    }
}
