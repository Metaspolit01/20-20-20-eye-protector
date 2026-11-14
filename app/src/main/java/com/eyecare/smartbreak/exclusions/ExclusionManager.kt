package com.eyecare.smartbreak.exclusions

import android.content.Context

class ExclusionManager(private val context: Context) {
    private var excludedPackages: Set<String> = emptySet()

    fun updateExcludedPackages(packages: Set<String>) {
        excludedPackages = packages
    }

    fun isExcluded(packageName: String, isInCall: Boolean): Boolean {
        if (isInCall) return true
        if (packageName.isBlank()) return false
        if (excludedPackages.contains(packageName)) return true

        val defaultInCallPackages = listOf(
            "com.android.dialer",
            "com.google.android.dialer",
            "com.samsung.android.incallui"
        )
        return defaultInCallPackages.contains(packageName)
    }
}
