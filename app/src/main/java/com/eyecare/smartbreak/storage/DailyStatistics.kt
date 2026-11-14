package com.eyecare.smartbreak.storage

data class DailyStatistics(
    val completedBreaksToday: Int = 0,
    val todayScreenOnMs: Long = 0L,
    val date: String = ""
)
