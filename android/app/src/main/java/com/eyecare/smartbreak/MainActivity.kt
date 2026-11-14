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
import com.eyecare.smartbreak.permissions.PermissionHelper
import com.eyecare.smartbreak.service.EyeBreakAccessibilityService
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import com.eyecare.smartbreak.storage.DailyStatistics
import com.eyecare.smartbreak.timer.TimerState
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
                        this,
                        EyeBreakAccessibilityService::class.java
                    )
                )
            }
            var systemBatteryReady by remember {
                mutableStateOf(PermissionHelper.isBatteryOptimizationIgnored(this))
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
            val timerState by (service?.screenTimeEngine?.state ?: remember {
                mutableStateOf(
                    TimerState(
                        isMonitoring = preferences.isMonitoringEnabled,
                        targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
                    )
                )
            } as State<TimerState>)

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
                            service?.screenTimeEngine?.setMonitoringEnabled(enabled)
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
                            service?.screenTimeEngine?.updatePreferences(newPrefs)
                        }
                    },
                    onNavigateBack = { currentScreen = "dashboard" }
                )
            }
        }
    }
}
