package com.eyecare.smartbreak

import android.app.Application
import com.eyecare.smartbreak.settings.SettingsRepository
import com.eyecare.smartbreak.storage.StatisticsStore

class SmartEyeBreakApp : Application() {
    val settingsRepository by lazy { SettingsRepository(this) }
    val statisticsStore by lazy { StatisticsStore(this) }
}
