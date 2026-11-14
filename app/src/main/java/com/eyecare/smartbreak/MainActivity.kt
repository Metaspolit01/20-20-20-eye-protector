package com.eyecare.smartbreak

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.lifecycleScope
import com.eyecare.smartbreak.dashboard.DashboardScreen
import com.eyecare.smartbreak.dashboard.SettingsScreen
import com.eyecare.smartbreak.dashboard.SetupTourScreen
import com.eyecare.smartbreak.exclusions.ExclusionManager
import com.eyecare.smartbreak.permissions.PermissionHelper
import com.eyecare.smartbreak.service.EyeBreakAccessibilityService
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import com.eyecare.smartbreak.storage.DailyStatistics
import com.eyecare.smartbreak.timer.ScreenTimeEngine
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as SmartEyeBreakApp

        setContent {
            var currentScreen by remember { mutableStateOf("dashboard") }
            val lifecycleOwner = LocalLifecycleOwner.current

            val preferences by app.settingsRepository.preferencesFlow
                .collectAsState(initial = EyeBreakPreferences())
            val dailyStats by app.statisticsStore.statisticsFlow
                .collectAsState(initial = DailyStatistics())
            val isServiceConnected by EyeBreakAccessibilityService.isServiceConnected
                .collectAsState()

            var systemAccessibilityReady by remember {
                mutableStateOf(
                    PermissionHelper.isAccessibilityServiceEnabled(
                        this@MainActivity,
                        EyeBreakAccessibilityService::class.java
                    )
                )
            }
            var systemBatteryReady by remember {
                mutableStateOf(PermissionHelper.isBatteryOptimizationIgnored(this@MainActivity))
            }

            DisposableEffect(lifecycleOwner) {
                val observer = LifecycleEventObserver { _, event ->
                    if (event == Lifecycle.Event.ON_RESUME) {
                        systemAccessibilityReady = PermissionHelper.isAccessibilityServiceEnabled(
                            this@MainActivity,
                            EyeBreakAccessibilityService::class.java
                        )
                        systemBatteryReady = PermissionHelper.isBatteryOptimizationIgnored(this@MainActivity)
                    }
                }
                lifecycleOwner.lifecycle.addObserver(observer)
                onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
            }

            val service = EyeBreakAccessibilityService.currentInstance

            val fallbackEngine = remember(preferences) {
                ScreenTimeEngine(
                    preferences = preferences,
                    exclusionManager = ExclusionManager(applicationContext),
                    onBreakTriggered = {},
                    onBreakDismissed = {
                        lifecycleScope.launch {
                            app.statisticsStore.incrementCompletedBreaks()
                        }
                    },
                    onStatePersisted = { accumulatedMs ->
                        lifecycleScope.launch {
                            app.statisticsStore.recordScreenOnTime(accumulatedMs)
                        }
                    }
                )
            }

            LaunchedEffect(service, preferences) {
                if (service == null) {
                    while (true) {
                        delay(1000L)
                        fallbackEngine.reconcileTime()
                    }
                }
            }

            val activeEngine = service?.screenTimeEngine ?: fallbackEngine
            val timerState by activeEngine.state.collectAsState()

            val setupReady = preferences.hasCompletedSetup &&
                (systemAccessibilityReady || isServiceConnected) &&
                systemBatteryReady

            if (!setupReady) {
                SetupTourScreen(
                    isServiceConnected = systemAccessibilityReady || isServiceConnected,
                    onCompleteSetup = {
                        lifecycleScope.launch {
                            app.settingsRepository.setSetupCompleted(true)
                        }
                    }
                )
            } else if (currentScreen == "dashboard") {
                DashboardScreen(
                    timerState = timerState,
                    completedBreaksToday = dailyStats.completedBreaksToday,
                    todayScreenOnMs = dailyStats.todayScreenOnMs,
                    onToggleMonitoring = { enabled ->
                        lifecycleScope.launch {
                            app.settingsRepository.setMonitoringEnabled(enabled)
                            activeEngine.setMonitoringEnabled(enabled)
                        }
                    },
                    onOpenSettings = { currentScreen = "settings" }
                )
            } else {
                SettingsScreen(
                    preferences = preferences,
                    onSavePreferences = { newPrefs ->
                        lifecycleScope.launch {
                            app.settingsRepository.updatePreferences(newPrefs)
                            activeEngine.updatePreferences(newPrefs)
                        }
                    },
                    onNavigateBack = { currentScreen = "dashboard" }
                )
            }
        }
    }
}
