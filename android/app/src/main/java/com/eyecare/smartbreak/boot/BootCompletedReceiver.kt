package com.eyecare.smartbreak.boot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.eyecare.smartbreak.SmartEyeBreakApp
import com.eyecare.smartbreak.permissions.PermissionHelper
import com.eyecare.smartbreak.service.EyeBreakAccessibilityService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class BootCompletedReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            // Check if accessibility permission is enabled
            val isServiceEnabled = PermissionHelper.isAccessibilityServiceEnabled(
                context,
                EyeBreakAccessibilityService::class.java
            )

            if (isServiceEnabled) {
                // If service is enabled, Android's framework restarts registered accessibility services automatically.
                // We ensure persisted settings are validated.
                val app = context.applicationContext as? SmartEyeBreakApp ?: return
                CoroutineScope(Dispatchers.IO).launch {
                    val prefs = app.settingsRepository.preferencesFlow.first()
                    val savedAccumulatedMs = app.settingsRepository.savedAccumulatedScreenOnMs.first()

                    // Service instance reconciles automatically on connection
                    EyeBreakAccessibilityService.currentInstance?.let { service ->
                        service.screenTimeEngine?.restoreAccumulatedState(savedAccumulatedMs)
                        service.screenTimeEngine?.setMonitoringEnabled(prefs.isMonitoringEnabled)
                    }
                }
            }
        }
    }
}
