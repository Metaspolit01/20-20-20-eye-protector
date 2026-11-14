package com.eyecare.smartbreak.permissions

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build

object SamsungOptimizationHelper {

    val isSamsungDevice: Boolean
        get() = Build.MANUFACTURER.equals("samsung", ignoreCase = true) ||
                Build.BRAND.equals("samsung", ignoreCase = true)

    /**
     * Attempts to launch Samsung One UI Battery / Background usage limits screen.
     */
    fun openSamsungBackgroundUsageLimits(context: Context): Boolean {
        val intents = listOf(
            // One UI Background usage limits / Battery screens
            Intent().apply {
                component = ComponentName(
                    "com.samsung.android.lool",
                    "com.samsung.android.sm.battery.ui.usage.CheckableAppListActivity"
                )
            },
            Intent().apply {
                component = ComponentName(
                    "com.samsung.android.lool",
                    "com.samsung.android.sm.battery.ui.BatteryActivity"
                )
            },
            Intent("com.samsung.android.sm.ACTION_BATTERY"),
            Intent().apply {
                component = ComponentName(
                    "com.samsung.android.sm",
                    "com.samsung.android.sm.ui.battery.BatteryActivity"
                )
            },
            Intent(Intent.ACTION_POWER_USAGE_SUMMARY),
            Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        )

        for (intent in intents) {
            try {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                return true
            } catch (_: Exception) {
            }
        }

        // Generic fallback to this app's real Android Settings -> Battery page
        return try {
            val appDetailsIntent = Intent(
                android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                android.net.Uri.parse("package:${context.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(appDetailsIntent)
            true
        } catch (_: Exception) {
            false
        }
    }
}
