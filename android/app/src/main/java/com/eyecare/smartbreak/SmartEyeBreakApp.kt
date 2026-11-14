package com.eyecare.smartbreak

import android.app.Application
import com.eyecare.smartbreak.settings.SettingsRepository
import com.eyecare.smartbreak.storage.BreakStatisticsStore

class SmartEyeBreakApp : Application() {

    lateinit var settingsRepository: SettingsRepository
        private set

    lateinit var statisticsStore: BreakStatisticsStore
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        settingsRepository = SettingsRepository(this)
        statisticsStore = BreakStatisticsStore(this)
    }

    companion object {
        lateinit var instance: SmartEyeBreakApp
            private set
    }
}
