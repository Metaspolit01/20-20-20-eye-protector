package com.eyecare.smartbreak.exclusions

/**
 * Manages exclusion policies for active phone calls and navigation applications.
 */
class ExclusionManager(
    private var excludedNavigationPackages: Set<String> = DEFAULT_NAVIGATION_PACKAGES
) {

    fun updateNavigationPackages(packages: Set<String>) {
        excludedNavigationPackages = packages
    }

    fun isExcluded(currentPackage: String, isInCall: Boolean): Boolean {
        if (isInCall) return true
        if (excludedNavigationPackages.contains(currentPackage)) {
            return true
        }
        return false
    }

    companion object {
        val DEFAULT_NAVIGATION_PACKAGES = setOf(
            "com.google.android.apps.maps", // Google Maps
            "com.waze",                      // Waze Navigation
            "com.here.app.maps",             // HERE WeGo
            "com.sygic.aura"                 // Sygic GPS
        )
    }
}
