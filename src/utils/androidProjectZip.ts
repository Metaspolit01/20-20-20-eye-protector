import JSZip from 'jszip';
import { normalizeEyeLottieData } from '../engine/eyeMotionState';

export interface AndroidFileEntry {
  path: string;
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFileEntry[] = [
  {
    path: 'build.gradle.kts',
    description: 'Root Gradle Build Script',
    content: `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.0" apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    description: 'Root Gradle Settings Script',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "SmartEyeBreakAssistant"
include(":app")`
  },
  {
    path: 'gradle.properties',
    description: 'Gradle Properties',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official`
  },
  {
    path: 'app/build.gradle.kts',
    description: 'App Module Gradle Build Script (SDK 36, Compose Material 3)',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.eyecare.smartbreak"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.eyecare.smartbreak"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.5")
    implementation("androidx.activity:activity-compose:1.9.2")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")
    implementation("com.airbnb.android:lottie-compose:6.5.2")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    description: 'Android Manifest (100% Offline, Zero Internet, Accessibility Service)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Strictly offline: NO android.permission.INTERNET -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".SmartEyeBreakApp"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.SmartEyeBreakAssistant">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.EyeBreakAccessibilityService"
            android:exported="true"
            android:label="@string/accessibility_service_label"
            android:description="@string/accessibility_service_description"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <receiver
            android:name=".boot.BootCompletedReceiver"
            android:exported="true"
            android:enabled="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`
  },
  {
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    description: 'Accessibility Service XML Configuration (canRetrieveWindowContent=false)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="false"
    android:accessibilityFlags="flagDefault" />`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    description: 'String Resources with 20-20-20 Guidelines',
    content: `<resources>
    <string name="app_name">20-20-20 Smart Eye Break</string>
    <string name="accessibility_service_label">20-20-20 Eye Break Assistant</string>
    <string name="accessibility_service_description">Automatically monitors accumulated screen-on time to remind you to rest your eyes every 20 minutes (20-20-20 rule). Uses accessibility overlays solely to present the full-screen blue relaxation visual. Does NOT inspect screen content, keystrokes, messages, or private data.</string>

    <string name="break_title">TIME FOR AN EYE BREAK</string>
    <string name="break_instruction">Look at something 20 feet away for 20 seconds.</string>
    <string name="break_subtext">Give your eyes a little rest.</string>
    <string name="action_skip">Skip</string>
    <string name="action_snooze">Snooze 5 min</string>
</resources>`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/timer/ScreenTimeEngine.kt',
    description: 'Core ScreenTimeEngine (SystemClock monotonic delta, pauses, single authoritative state)',
    content: `package com.eyecare.smartbreak.timer

import android.os.SystemClock
import com.eyecare.smartbreak.exclusions.ExclusionManager
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class ScreenTimeEngine(
    private var preferences: EyeBreakPreferences,
    private val exclusionManager: ExclusionManager,
    private val onBreakTriggered: () -> Unit,
    private val onBreakDismissed: () -> Unit,
    private val onStatePersisted: (accumulatedMs: Long) -> Unit,
    private val clock: () -> Long = { SystemClock.elapsedRealtime() }
) {
    private val _state = MutableStateFlow(
        TimerState(
            isMonitoring = preferences.isMonitoringEnabled,
            targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
        )
    )
    val state: StateFlow<TimerState> = _state.asStateFlow()

    private var lastTrackingTimestamp: Long? = null

    init {
        if (isEligibleForTracking()) {
            lastTrackingTimestamp = clock()
        }
    }

    @Synchronized
    fun isEligibleForTracking(): Boolean {
        val s = _state.value
        return s.isMonitoring && s.isInteractive && !s.isKeyguardLocked && !s.isBreakActive
    }

    @Synchronized
    fun reconcileTime(now: Long = clock()) {
        val current = _state.value
        if (isEligibleForTracking() && lastTrackingTimestamp != null) {
            val delta = (now - lastTrackingTimestamp!!).coerceAtLeast(0L)
            val updatedAccumulated = current.accumulatedScreenOnMs + delta
            lastTrackingTimestamp = now

            if (updatedAccumulated >= current.targetIntervalMs) {
                _state.update {
                    it.copy(
                        accumulatedScreenOnMs = updatedAccumulated,
                        isBreakDue = true
                    )
                }
                evaluateBreakDisplay(now)
            } else {
                _state.update { it.copy(accumulatedScreenOnMs = updatedAccumulated) }
            }
        } else {
            lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        }

        if (_state.value.isBreakDue && !_state.value.isBreakActive) {
            evaluateBreakDisplay(now)
        }
    }

    @Synchronized
    private fun evaluateBreakDisplay(now: Long) {
        val current = _state.value
        if (!current.isInteractive || current.isKeyguardLocked || !current.isMonitoring) {
            _state.update { it.copy(isBreakSuppressed = true) }
            return
        }

        if (exclusionManager.isExcluded(current.currentForegroundPackage, current.isInCall)) {
            _state.update { it.copy(isBreakSuppressed = true) }
            return
        }

        _state.update {
            it.copy(
                isBreakSuppressed = false,
                isBreakActive = true,
                breakDeadlineRealtimeMs = now + (preferences.breakDurationSeconds * 1000L),
                remainingBreakSeconds = preferences.breakDurationSeconds
            )
        }
        lastTrackingTimestamp = null
        onBreakTriggered()
    }

    @Synchronized
    fun onScreenOn(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isInteractive = true) }
        if (isEligibleForTracking()) lastTrackingTimestamp = now
        reconcileTime(now)
    }

    @Synchronized
    fun onScreenOff(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isInteractive = false) }
        lastTrackingTimestamp = null
        onStatePersisted(_state.value.accumulatedScreenOnMs)
    }

    @Synchronized
    fun onKeyguardLocked(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isKeyguardLocked = true) }
        lastTrackingTimestamp = null
        onStatePersisted(_state.value.accumulatedScreenOnMs)
    }

    @Synchronized
    fun onKeyguardUnlocked(now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isKeyguardLocked = false) }
        if (isEligibleForTracking()) lastTrackingTimestamp = now
        reconcileTime(now)
    }

    @Synchronized
    fun onForegroundPackageChanged(packageName: String, now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(currentForegroundPackage = packageName) }
        reconcileTime(now)
    }

    @Synchronized
    fun onCallStateChanged(inCall: Boolean, now: Long = clock()) {
        reconcileTime(now)
        _state.update { it.copy(isInCall = inCall) }
        reconcileTime(now)
    }

    @Synchronized
    fun skipBreak(now: Long = clock()) {
        _state.update {
            it.copy(
                isBreakActive = false,
                isBreakDue = false,
                isBreakSuppressed = false,
                isSnoozed = false,
                breakDeadlineRealtimeMs = null,
                accumulatedScreenOnMs = 0L,
                targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        onBreakDismissed()
        onStatePersisted(0L)
    }

    @Synchronized
    fun snoozeBreak(now: Long = clock()) {
        _state.update {
            it.copy(
                isBreakActive = false,
                isBreakDue = false,
                isBreakSuppressed = false,
                isSnoozed = true,
                breakDeadlineRealtimeMs = null,
                accumulatedScreenOnMs = 0L,
                targetIntervalMs = preferences.snoozeDurationMinutes * 60 * 1000L
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        onBreakDismissed()
        onStatePersisted(0L)
    }

    @Synchronized
    fun completeBreak(now: Long = clock()) {
        _state.update {
            it.copy(
                isBreakActive = false,
                isBreakDue = false,
                isBreakSuppressed = false,
                isSnoozed = false,
                breakDeadlineRealtimeMs = null,
                accumulatedScreenOnMs = 0L,
                targetIntervalMs = preferences.intervalMinutes * 60 * 1000L
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
        onBreakDismissed()
        onStatePersisted(0L)
    }

    @Synchronized
    fun setMonitoringEnabled(enabled: Boolean, now: Long = clock()) {
        reconcileTime(now)
        _state.update {
            it.copy(
                isMonitoring = enabled,
                isBreakActive = if (!enabled) false else it.isBreakActive
            )
        }
        if (!enabled) {
            lastTrackingTimestamp = null
            onBreakDismissed()
        } else {
            if (isEligibleForTracking()) lastTrackingTimestamp = now
        }
        onStatePersisted(_state.value.accumulatedScreenOnMs)
    }

    @Synchronized
    fun restoreAccumulatedState(restoredMs: Long, now: Long = clock()) {
        _state.update {
            it.copy(
                accumulatedScreenOnMs = restoredMs,
                isBreakDue = restoredMs >= it.targetIntervalMs
            )
        }
        lastTrackingTimestamp = if (isEligibleForTracking()) now else null
    }
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/overlay/BreakOverlayContent.kt',
    description: 'Full-Screen Animated Blue Overlay (Jetpack Compose)',
    content: `package com.eyecare.smartbreak.overlay

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Snooze
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun BreakOverlayContent(
    remainingSeconds: Int,
    onSkip: () -> Unit,
    onSnooze: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "GradientFlow")
    val gradientOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "FlowOffset"
    )

    val eyePulse by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "EyePulse"
    )

    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF031024),
            Color(0xFF0A2540),
            Color(0xFF0F3B66),
            Color(0xFF04142B)
        ),
        startY = gradientOffset * 0.2f,
        endY = gradientOffset * 0.2f + 1600f
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 28.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Surface(
                color = Color(0x330284C7),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x6638BDF8))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Visibility,
                        contentDescription = null,
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "20-20-20 RULE IN EFFECT",
                        color = Color(0xFFE0F2FE),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )
                }
            }

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Text(
                    text = "TIME FOR AN EYE BREAK",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center
                )

                val formattedTime = String.format("00:%02d", remainingSeconds.coerceAtLeast(0))
                Surface(
                    color = Color(0x220F172A),
                    shape = RoundedCornerShape(24.dp),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0x5538BDF8))
                ) {
                    Text(
                        text = formattedTime,
                        color = Color(0xFF67E8F9),
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 32.dp, vertical = 12.dp),
                        letterSpacing = 3.sp
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Text(
                        text = "Look at something 20 feet away for 20 seconds.",
                        color = Color(0xFFF1F5F9),
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        lineHeight = 24.sp
                    )
                    Text(
                        text = "Give your eyes a little rest.",
                        color = Color(0xFF94A3B8),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(
                    onClick = onSnooze,
                    modifier = Modifier.weight(1f).height(56.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("Snooze 5 min", fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = onSkip,
                    modifier = Modifier.weight(1f).height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                ) {
                    Text("Skip", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/permissions/SamsungOptimizationHelper.kt',
    description: 'Samsung One UI 8.0 & Galaxy M15 5G Battery Exemption Helper',
    content: `package com.eyecare.smartbreak.permissions

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build

object SamsungOptimizationHelper {
    val isSamsungDevice: Boolean
        get() = Build.MANUFACTURER.equals("samsung", ignoreCase = true) ||
                Build.BRAND.equals("samsung", ignoreCase = true)

    fun openSamsungBackgroundUsageLimits(context: Context): Boolean {
        val intents = listOf(
            Intent().apply {
                component = ComponentName("com.samsung.android.lool", "com.samsung.android.sm.battery.ui.usage.CheckableAppListActivity")
            },
            Intent().apply {
                component = ComponentName("com.samsung.android.lool", "com.samsung.android.sm.battery.ui.BatteryActivity")
            },
            Intent("com.samsung.android.sm.ACTION_BATTERY"),
            Intent(Intent.ACTION_POWER_USAGE_SUMMARY),
            Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        )
        for (intent in intents) {
            try {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                return true
            } catch (_: Exception) {}
        }
        return try {
            context.startActivity(
                Intent(
                    android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    android.net.Uri.parse("package:\${context.packageName}")
                ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
            )
            true
        } catch (_: Exception) {
            false
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/permissions/PermissionHelper.kt',
    description: 'Accessibility, Battery Optimization & Background Restriction System Checks',
    content: `package com.eyecare.smartbreak.permissions

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.ActivityManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.TextUtils
import android.view.accessibility.AccessibilityManager

object PermissionHelper {

    fun isAccessibilityServiceEnabled(context: Context, serviceClass: Class<out AccessibilityService>): Boolean {
        val expectedComponentName = ComponentName(context, serviceClass)

        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
        val enabledList = am?.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        if (enabledList != null) {
            for (serviceInfo in enabledList) {
                val resolveInfo = serviceInfo.resolveInfo?.serviceInfo ?: continue
                if (resolveInfo.packageName == context.packageName &&
                    resolveInfo.name == serviceClass.name
                ) {
                    return true
                }
            }
        }

        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)

        while (colonSplitter.hasNext()) {
            val componentNameString = colonSplitter.next()
            val enabledComponent = ComponentName.unflattenFromString(componentNameString)
            if (enabledComponent != null && enabledComponent == expectedComponentName) {
                return true
            }
        }
        return false
    }

    fun openAccessibilitySettings(context: Context, serviceClass: Class<out AccessibilityService>? = null) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            if (serviceClass != null) {
                val componentName = ComponentName(context, serviceClass).flattenToString()
                putExtra(":settings:fragment_args_key", componentName)
                putExtra(":settings:show_fragment_args", Bundle().apply {
                    putString(":settings:fragment_args_key", componentName)
                })
            }
        }
        try {
            context.startActivity(intent)
        } catch (_: Exception) {
            context.startActivity(Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            })
        }
    }

    fun isBatteryOptimizationIgnored(context: Context): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        return powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: false
    }

    fun isBackgroundRestricted(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            return activityManager?.isBackgroundRestricted ?: false
        }
        return false
    }

    fun requestIgnoreBatteryOptimization(context: Context) {
        val directPrompt = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:\${context.packageName}")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            context.startActivity(directPrompt)
            return
        } catch (_: Exception) {}

        try {
            context.startActivity(
                Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
            )
            return
        } catch (_: Exception) {}

        openAppBatterySettings(context)
    }

    fun openAppBatterySettings(context: Context) {
        val intent = Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:\${context.packageName}")
        ).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            context.startActivity(intent)
        } catch (_: Exception) {
            context.startActivity(Intent(Settings.ACTION_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            })
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/dashboard/SetupTourScreen.kt',
    description: 'Mandatory First-Time Setup Tour with ON_RESUME System Verification',
    content: `package com.eyecare.smartbreak.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.eyecare.smartbreak.permissions.PermissionHelper
import com.eyecare.smartbreak.permissions.SamsungOptimizationHelper
import com.eyecare.smartbreak.service.EyeBreakAccessibilityService

@Composable
fun SetupTourScreen(
    isServiceConnected: Boolean,
    onCompleteSetup: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var currentStep by remember { mutableIntStateOf(1) }
    var visitedSamsungLimits by remember { mutableStateOf(false) }

    var accessibilityConfigured by remember(isServiceConnected) {
        mutableStateOf(
            isServiceConnected || PermissionHelper.isAccessibilityServiceEnabled(
                context,
                EyeBreakAccessibilityService::class.java
            )
        )
    }
    var batteryUnrestrictedConfigured by remember {
        mutableStateOf(PermissionHelper.isBatteryOptimizationIgnored(context))
    }
    var neverSleepingConfigured by remember { mutableStateOf(false) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                accessibilityConfigured = PermissionHelper.isAccessibilityServiceEnabled(
                    context,
                    EyeBreakAccessibilityService::class.java
                ) || isServiceConnected
                batteryUnrestrictedConfigured = PermissionHelper.isBatteryOptimizationIgnored(context) &&
                    !PermissionHelper.isBackgroundRestricted(context)
                if (visitedSamsungLimits && batteryUnrestrictedConfigured) {
                    neverSleepingConfigured = true
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val canAdvanceFromStep2 = accessibilityConfigured
    val canAdvanceFromStep3 = neverSleepingConfigured && batteryUnrestrictedConfigured

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF041229), Color(0xFF061836), Color(0xFF030D1F))
                )
            )
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SETUP • STEP $currentStep OF 4",
                        color = Color(0xFF7DD3FC),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "SM-M156B",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    for (step in 1..4) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(5.dp)
                                .background(
                                    color = if (step <= currentStep) Color(0xFF38BDF8) else Color(0xFF1E293B),
                                    shape = RoundedCornerShape(3.dp)
                                )
                        )
                    }
                }
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                when (currentStep) {
                    1 -> {
                        Text("20-20-20 Eye Care", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Rest your eyes every 20 minutes for 20 seconds.",
                            color = Color(0xFFCBD5E1),
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                    2 -> {
                        Text("Accessibility Overlay", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Required to show break screen.", color = Color(0xFF94A3B8), fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(20.dp))
                        Card(
                            onClick = {
                                PermissionHelper.openAccessibilitySettings(
                                    context,
                                    EyeBreakAccessibilityService::class.java
                                )
                            },
                            colors = CardDefaults.cardColors(
                                containerColor = if (accessibilityConfigured) Color(0xFF064E3B) else Color(0xFF0B192C)
                            ),
                            border = BorderStroke(1.dp, if (accessibilityConfigured) Color(0xFF34D399) else Color(0xFF1E293B)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Open Accessibility Settings", color = Color.White, fontWeight = FontWeight.Bold)
                                    Text(
                                        if (accessibilityConfigured) "Configured" else "Not configured — tap to open",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }
                    }
                    3 -> {
                        Text("Battery & Sleep Setup", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Tap each box to configure in Phone Settings.", color = Color(0xFF94A3B8), fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Card(
                            onClick = {
                                visitedSamsungLimits = true
                                SamsungOptimizationHelper.openSamsungBackgroundUsageLimits(context)
                            },
                            colors = CardDefaults.cardColors(
                                containerColor = if (neverSleepingConfigured) Color(0xFF064E3B) else Color(0xFF0B192C)
                            ),
                            border = BorderStroke(1.dp, if (neverSleepingConfigured) Color(0xFF34D399) else Color(0xFF1E293B)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Never sleeping apps", color = Color.White, fontWeight = FontWeight.Bold)
                                Text(
                                    if (neverSleepingConfigured) "Configured" else "Tap to open Phone Battery Settings",
                                    color = Color(0xFF94A3B8),
                                    fontSize = 11.sp
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Card(
                            onClick = { PermissionHelper.requestIgnoreBatteryOptimization(context) },
                            colors = CardDefaults.cardColors(
                                containerColor = if (batteryUnrestrictedConfigured) Color(0xFF064E3B) else Color(0xFF0B192C)
                            ),
                            border = BorderStroke(1.dp, if (batteryUnrestrictedConfigured) Color(0xFF34D399) else Color(0xFF1E293B)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Unrestricted battery", color = Color.White, fontWeight = FontWeight.Bold)
                                Text(
                                    if (batteryUnrestrictedConfigured) "Configured" else "Tap to allow Unrestricted battery",
                                    color = Color(0xFF94A3B8),
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                    4 -> {
                        Text("Setup Verified", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("All system permissions are configured.", color = Color(0xFFCBD5E1), fontSize = 14.sp)
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (currentStep > 1) {
                    OutlinedButton(onClick = { currentStep-- }, modifier = Modifier.height(54.dp)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                }
                when (currentStep) {
                    1 -> Button(onClick = { currentStep = 2 }, modifier = Modifier.weight(1f).height(54.dp)) {
                        Text("Start Setup", fontWeight = FontWeight.Bold)
                    }
                    2 -> Button(
                        onClick = { currentStep = 3 },
                        enabled = canAdvanceFromStep2,
                        modifier = Modifier.weight(1f).height(54.dp)
                    ) {
                        Text(if (canAdvanceFromStep2) "Continue" else "Configure Above to Continue")
                    }
                    3 -> Button(
                        onClick = { currentStep = 4 },
                        enabled = canAdvanceFromStep3,
                        modifier = Modifier.weight(1f).height(54.dp)
                    ) {
                        Text(if (canAdvanceFromStep3) "Continue" else "Configure Both to Continue")
                    }
                    4 -> Button(
                        onClick = onCompleteSetup,
                        modifier = Modifier.weight(1f).height(54.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                    ) {
                        Text("Enter App", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/dashboard/SettingsScreen.kt',
    description: 'Clean Settings Screen (Intervals & Alerts)',
    content: `package com.eyecare.smartbreak.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eyecare.smartbreak.settings.EyeBreakPreferences

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    preferences: EyeBreakPreferences,
    onSavePreferences: (EyeBreakPreferences) -> Unit,
    onNavigateBack: () -> Unit
) {
    var intervalMinutes by remember(preferences) { mutableFloatStateOf(preferences.intervalMinutes.toFloat()) }
    var breakDurationSeconds by remember(preferences) { mutableFloatStateOf(preferences.breakDurationSeconds.toFloat()) }
    var snoozeDurationMinutes by remember(preferences) { mutableFloatStateOf(preferences.snoozeDurationMinutes.toFloat()) }
    var isSoundEnabled by remember(preferences) { mutableStateOf(preferences.isSoundEnabled) }
    var isVibrationEnabled by remember(preferences) { mutableStateOf(preferences.isVibrationEnabled) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF031024),
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF031024)
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Screen-Time Interval", color = Color.White, fontWeight = FontWeight.SemiBold)
                        Text("\${intervalMinutes.toInt()} min", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = intervalMinutes,
                        onValueChange = {
                            intervalMinutes = it
                            onSavePreferences(preferences.copy(intervalMinutes = it.toInt()))
                        },
                        valueRange = 5f..60f,
                        steps = 10
                    )
                    Text("Time before break reminder.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }

            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Break Duration", color = Color.White, fontWeight = FontWeight.SemiBold)
                        Text("\${breakDurationSeconds.toInt()} sec", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = breakDurationSeconds,
                        onValueChange = {
                            breakDurationSeconds = it
                            onSavePreferences(preferences.copy(breakDurationSeconds = it.toInt()))
                        },
                        valueRange = 10f..60f,
                        steps = 9
                    )
                    Text("Rest countdown length.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }

            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Snooze Duration", color = Color.White, fontWeight = FontWeight.SemiBold)
                        Text("\${snoozeDurationMinutes.toInt()} min", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = snoozeDurationMinutes,
                        onValueChange = {
                            snoozeDurationMinutes = it
                            onSavePreferences(preferences.copy(snoozeDurationMinutes = it.toInt()))
                        },
                        valueRange = 2f..15f,
                        steps = 12
                    )
                    Text("Delay when snoozed.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }

            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text("Reminder Chime", color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text("Play sound on break start", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        }
                        Switch(checked = isSoundEnabled, onCheckedChange = {
                            isSoundEnabled = it
                            onSavePreferences(preferences.copy(isSoundEnabled = it))
                        })
                    }
                    HorizontalDivider(color = Color(0x33334155))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text("Haptic Vibration", color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text("Vibrate on break start", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        }
                        Switch(checked = isVibrationEnabled, onCheckedChange = {
                            isVibrationEnabled = it
                            onSavePreferences(preferences.copy(isVibrationEnabled = it))
                        })
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/MainActivity.kt',
    description: 'Single-Activity Entry with Live System Setup Verification Gate',
    content: `package com.eyecare.smartbreak

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
}`
  },
  {
    path: 'app/src/main/java/com/eyecare/smartbreak/dashboard/DashboardScreen.kt',
    description: 'Dashboard with Realistic Animated Eye Inside Spacious Timer Ring and Text Outside',
    content: `package com.eyecare.smartbreak.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eyecare.smartbreak.timer.TimerState
import kotlinx.coroutines.delay
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    timerState: TimerState,
    completedBreaksToday: Int,
    todayScreenOnMs: Long,
    onToggleMonitoring: (Boolean) -> Unit,
    onOpenSettings: () -> Unit
) {
    var isBlinking by remember { mutableStateOf(false) }
    var isRecovering by remember { mutableStateOf(false) }
    var previousBreakCount by remember { mutableIntStateOf(completedBreaksToday) }

    LaunchedEffect(completedBreaksToday) {
        if (completedBreaksToday > previousBreakCount) {
            isRecovering = true
            delay(4000)
            isRecovering = false
        }
        previousBreakCount = completedBreaksToday
    }

    val progressPercent = (timerState.progressFraction * 100f).coerceIn(0f, 100f)

    LaunchedEffect(
        timerState.isMonitoring,
        timerState.isInteractive,
        timerState.isKeyguardLocked,
        timerState.isBreakDue,
        timerState.isBreakSuppressed,
        isRecovering,
        progressPercent
    ) {
        if (!timerState.isMonitoring || !timerState.isInteractive || timerState.isKeyguardLocked ||
            timerState.isBreakDue || timerState.isBreakSuppressed || isRecovering || progressPercent >= 80f
        ) {
            isBlinking = false
            return@LaunchedEffect
        }
        while (true) {
            delay(4500)
            isBlinking = true
            delay(320)
            isBlinking = false
        }
    }

    val targetOpenness = when {
        isBlinking -> 0.04f
        isRecovering -> 1.0f
        timerState.isBreakDue || timerState.isBreakSuppressed || progressPercent >= 100f -> 0.28f
        progressPercent >= 80f -> 0.50f - ((progressPercent - 80f) / 19f).coerceIn(0f, 1f) * 0.20f
        progressPercent >= 50f -> 0.85f - ((progressPercent - 50f) / 30f).coerceIn(0f, 1f) * 0.17f
        else -> 1.0f
    }
    val animatedOpenness by animateFloatAsState(
        targetValue = targetOpenness,
        animationSpec = tween(durationMillis = if (isBlinking) 130 else 360),
        label = "EyeOpenness"
    )

    val redness = when {
        isRecovering -> 0.04f
        timerState.isBreakDue || timerState.isBreakSuppressed || progressPercent >= 100f -> 0.96f
        progressPercent >= 80f -> 0.58f + ((progressPercent - 80f) / 19f).coerceIn(0f, 1f) * 0.34f
        progressPercent >= 50f -> 0.18f + ((progressPercent - 50f) / 30f).coerceIn(0f, 1f) * 0.24f
        progressPercent >= 40f -> ((progressPercent - 40f) / 10f) * 0.10f
        else -> 0f
    }

    val infiniteTransition = rememberInfiniteTransition(label = "EyeGaze")
    val gazePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 7000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "GazePhase"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        RealisticEyeCanvas(
                            openness = 1.0f,
                            redness = 0f,
                            gazeX = 0f,
                            gazeY = 0f,
                            modifier = Modifier.size(34.dp)
                        )
                        Text("20-20-20 Assistant", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    }
                },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF031024),
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF031024)
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(18.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(modifier = Modifier.size(272.dp), contentAlignment = Alignment.Center) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeWidth = 8.dp.toPx()
                        val diameter = size.minDimension - strokeWidth
                        val topLeft = Offset(strokeWidth / 2f, strokeWidth / 2f)
                        val arcSize = Size(diameter, diameter)

                        drawArc(
                            color = Color(0xAA1E293B),
                            startAngle = -90f,
                            sweepAngle = 360f,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                        val arcColors = if (redness >= 0.72f) {
                            listOf(Color(0xFFFB7185), Color(0xFFEF4444), Color(0xFFFB7185))
                        } else if (progressPercent >= 80f) {
                            listOf(Color(0xFFF97316), Color(0xFFFBBF24), Color(0xFFEF4444))
                        } else {
                            listOf(Color(0xFF0284C7), Color(0xFF38BDF8), Color(0xFF67E8F9))
                        }
                        drawArc(
                            brush = Brush.sweepGradient(arcColors),
                            startAngle = -90f,
                            sweepAngle = 360f * timerState.progressFraction,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                    }

                    RealisticEyeCanvas(
                        openness = animatedOpenness,
                        redness = redness,
                        gazeX = sin(gazePhase) * 5.5f,
                        gazeY = cos(gazePhase * 0.8f) * 2.5f,
                        modifier = Modifier.size(244.dp)
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = if (timerState.isSnoozed) "SNOOZED" else "NEXT BREAK IN",
                        color = if (timerState.isSnoozed) Color(0xFFFBBF24) else Color(0xFF94A3B8),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.6.sp
                    )
                    val remainingSec = (timerState.remainingIntervalMs / 1000).toInt()
                    Text(
                        text = String.format(Locale.US, "%02d:%02d", remainingSec / 60, remainingSec % 60),
                        color = Color.White,
                        fontSize = 52.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = if (!timerState.isMonitoring) "Monitoring Paused"
                        else if (timerState.isBreakSuppressed) "Suppressed (In Call / Nav)"
                        else if (timerState.isKeyguardLocked) "Screen Locked"
                        else if (!timerState.isInteractive) "Screen Off"
                        else "Tracking Active",
                        color = Color(0xFF38BDF8),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Button(
                    onClick = { onToggleMonitoring(!timerState.isMonitoring) },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (timerState.isMonitoring) Color(0xFF1E293B) else Color(0xFF0284C7)
                    )
                ) {
                    Text(
                        text = if (timerState.isMonitoring) "Pause Monitoring" else "Start Monitoring",
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("BREAKS TODAY", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text("$completedBreaksToday", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
                val todaySec = (todayScreenOnMs / 1000).toInt()
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("SCREEN TIME", fontSize = 11.sp, color = Color(0xFF94A3B8))
                    Text("\${todaySec / 60}m \${todaySec % 60}s", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                }
            }
        }
    }
}

@Composable
private fun RealisticEyeCanvas(
    openness: Float,
    redness: Float,
    gazeX: Float,
    gazeY: Float,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f

        val leftX = w * 0.08f
        val leftY = cy + h * 0.02f
        val rightX = w * 0.925f
        val rightY = cy - h * 0.012f
        val closeShift = (1f - openness) * h * 0.058f
        val upperCtrlY = cy - h * 0.258f * openness + closeShift
        val lowerCtrlY = cy + h * 0.218f * (0.22f + openness * 0.78f) + closeShift * 0.22f

        val aperturePath = Path().apply {
            moveTo(leftX, leftY)
            cubicTo(w * 0.28f, upperCtrlY, w * 0.68f, upperCtrlY * 0.97f + cy * 0.03f, rightX, rightY)
            cubicTo(w * 0.69f, lowerCtrlY, w * 0.28f, lowerCtrlY + h * 0.015f, leftX, leftY)
            close()
        }
        val upperPath = Path().apply {
            moveTo(leftX, leftY)
            cubicTo(w * 0.28f, upperCtrlY, w * 0.68f, upperCtrlY * 0.97f + cy * 0.03f, rightX, rightY)
        }
        val waterlinePath = Path().apply {
            moveTo(leftX + w * 0.05f, leftY + h * 0.005f)
            cubicTo(w * 0.28f, lowerCtrlY + h * 0.006f, w * 0.69f, lowerCtrlY - h * 0.008f, rightX - w * 0.015f, rightY + h * 0.004f)
        }

        clipPath(aperturePath) {
            drawOval(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFFBFAF7), Color(0xFFEFEBE5), Color(0xFFCBC3BB), Color(0xFF8D837C)),
                    center = Offset(cx * 0.94f, cy * 0.92f),
                    radius = w * 0.48f
                ),
                topLeft = Offset(w * 0.04f, h * 0.14f),
                size = Size(w * 0.92f, h * 0.72f)
            )
            if (redness > 0.01f) {
                drawOval(
                    brush = Brush.radialGradient(
                        colors = listOf(Color(0xFFFCA5A5).copy(alpha = redness * 0.20f), Color(0xFFEF4444).copy(alpha = redness * 0.48f), Color(0xFFB91C1C).copy(alpha = redness * 0.82f)),
                        center = Offset(cx, cy),
                        radius = w * 0.48f
                    ),
                    topLeft = Offset(w * 0.04f, h * 0.14f),
                    size = Size(w * 0.92f, h * 0.72f)
                )
                drawCircle(
                    brush = Brush.radialGradient(colors = listOf(Color(0xFFD22020).copy(alpha = redness * 0.88f), Color.Transparent), center = Offset(w * 0.15f, leftY), radius = w * 0.26f),
                    radius = w * 0.26f,
                    center = Offset(w * 0.15f, leftY)
                )
                drawCircle(
                    brush = Brush.radialGradient(colors = listOf(Color(0xFFD22020).copy(alpha = redness * 0.88f), Color.Transparent), center = Offset(w * 0.85f, rightY), radius = w * 0.26f),
                    radius = w * 0.26f,
                    center = Offset(w * 0.85f, rightY)
                )
                val vesselAlpha = (redness * 0.88f).coerceIn(0f, 0.9f)
                drawLine(color = Color(0xFFCD2020).copy(alpha = vesselAlpha), start = Offset(w * 0.10f, cy - h * 0.01f), end = Offset(w * 0.30f, cy), strokeWidth = 2.0f, cap = StrokeCap.Round)
                drawLine(color = Color(0xFFCD2020).copy(alpha = vesselAlpha * 0.82f), start = Offset(w * 0.12f, cy + h * 0.03f), end = Offset(w * 0.31f, cy + h * 0.045f), strokeWidth = 1.6f, cap = StrokeCap.Round)
                drawLine(color = Color(0xFFCD2020).copy(alpha = vesselAlpha), start = Offset(w * 0.90f, cy - h * 0.015f), end = Offset(w * 0.69f, cy - h * 0.02f), strokeWidth = 2.0f, cap = StrokeCap.Round)
                drawLine(color = Color(0xFFCD2020).copy(alpha = vesselAlpha * 0.82f), start = Offset(w * 0.88f, cy + h * 0.03f), end = Offset(w * 0.68f, cy + h * 0.04f), strokeWidth = 1.6f, cap = StrokeCap.Round)
            }
            drawCircle(
                brush = Brush.radialGradient(colors = listOf(if (redness > 0.4f) Color(0xFFD95757) else Color(0xFFD47C77), Color(0xFFAB5250), Color.Transparent), center = Offset(leftX + w * 0.028f, leftY), radius = w * 0.055f),
                radius = w * 0.055f,
                center = Offset(leftX + w * 0.028f, leftY)
            )
            val irisCenter = Offset(cx + gazeX, cy - h * 0.012f + gazeY)
            val irisRadius = w * 0.215f
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFF135785), Color(0xFF1D78B0), Color(0xFF13537D), Color(0xFF0B2B44), Color.Transparent),
                    center = irisCenter,
                    radius = irisRadius * 1.04f
                ),
                radius = irisRadius * 1.04f,
                center = irisCenter
            )
            for (i in 0 until 96) {
                val angle = (i / 96f) * (2f * PI).toFloat()
                val rIn = irisRadius * 0.28f
                val rOut = irisRadius * (0.88f + (i % 3) * 0.025f)
                drawLine(
                    color = if (i % 3 == 0) Color(0xFFAADCF8).copy(alpha = 0.26f) else Color(0xFF4AB2E4).copy(alpha = 0.20f),
                    start = Offset(irisCenter.x + cos(angle) * rIn, irisCenter.y + sin(angle) * rIn),
                    end = Offset(irisCenter.x + cos(angle) * rOut, irisCenter.y + sin(angle) * rOut),
                    strokeWidth = if (i % 2 == 0) 1.4f else 1.0f
                )
            }
            drawCircle(
                brush = Brush.radialGradient(colors = listOf(Color(0xFFBC985C).copy(alpha = 0.36f), Color(0xFF94A888).copy(alpha = 0.16f), Color.Transparent), center = irisCenter, radius = irisRadius * 0.58f),
                radius = irisRadius * 0.58f,
                center = irisCenter
            )
            drawCircle(color = Color(0xFF04060A), radius = irisRadius * 0.36f, center = irisCenter)
            drawCircle(color = Color.White.copy(alpha = 0.92f), radius = irisRadius * 0.17f, center = Offset(irisCenter.x - irisRadius * 0.28f, irisCenter.y - irisRadius * 0.29f))
            drawCircle(color = Color.White.copy(alpha = 0.68f), radius = irisRadius * 0.055f, center = Offset(irisCenter.x + irisRadius * 0.30f, irisCenter.y + irisRadius * 0.23f))
            drawPath(path = upperPath, color = Color(0xFF0A0910).copy(alpha = 0.18f), style = Stroke(width = w * 0.088f, cap = StrokeCap.Round))
            drawPath(path = upperPath, color = Color(0xFF0C0A10).copy(alpha = 0.34f), style = Stroke(width = w * 0.042f, cap = StrokeCap.Round))
            drawPath(path = waterlinePath, color = (if (redness > 0.45f) Color(0xFFBA5C5C) else Color(0xFFBA8682)).copy(alpha = 0.50f), style = Stroke(width = w * 0.012f, cap = StrokeCap.Round))
        }
        drawPath(path = upperPath, color = Color(0xFF141115), style = Stroke(width = w * 0.016f, cap = StrokeCap.Round))
        if (w > 120f) {
            for (i in 2 until 18) {
                val t = i / 19f
                val bx = leftX + (rightX - leftX) * t
                val arcFactor = sin(t * PI).toFloat()
                val by = leftY + (rightY - leftY) * t - (cy - upperCtrlY) * 0.72f * arcFactor
                val lashLen = h * (0.03f + arcFactor * 0.035f) * (0.65f + openness * 0.35f)
                val sweepX = (t - 0.32f) * w * 0.05f
                drawLine(color = Color(0xFF121016).copy(alpha = 0.85f), start = Offset(bx, by), end = Offset(bx + sweepX, by - lashLen), strokeWidth = 1.4f, cap = StrokeCap.Round)
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    description: 'Deep navy adaptive launcher icon background',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#031024"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#0C2A4D"
        android:fillAlpha="0.55"
        android:pathData="M54,18 A36,36 0 1,1 53.99,18 Z" />
</vector>`
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    description: 'Anatomical cerulean eye Android adaptive launcher icon foreground',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#F1F5F9"
        android:pathData="M21,54 C35,34 73,34 87,54 C73,72 35,72 21,54 Z" />
    <path
        android:fillColor="#071A2F"
        android:pathData="M54,39 A15,15 0 1,1 53.99,39 Z" />
    <path
        android:fillColor="#0284C7"
        android:pathData="M54,40.2 A13.8,13.8 0 1,1 53.99,40.2 Z" />
    <path
        android:strokeColor="#38BDF8"
        android:strokeWidth="1"
        android:strokeAlpha="0.5"
        android:pathData="M54,45.5 A8.5,8.5 0 1,1 53.99,45.5 Z" />
    <path
        android:fillColor="#020617"
        android:pathData="M54,48.5 A5.5,5.5 0 1,1 53.99,48.5 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:fillAlpha="0.95"
        android:pathData="M49.5,48.5 A2.6,2.0 0 1,1 49.49,48.5 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:fillAlpha="0.7"
        android:pathData="M58.8,57.5 A1.1,1.1 0 1,1 58.79,57.5 Z" />
    <path
        android:strokeColor="#0F172A"
        android:strokeWidth="2.4"
        android:strokeLineCap="round"
        android:pathData="M21,54 C35,34 73,34 87,54" />
    <path
        android:strokeColor="#94A3B8"
        android:strokeWidth="1.0"
        android:strokeAlpha="0.6"
        android:strokeLineCap="round"
        android:pathData="M22.5,54.3 C36,72 72,72 85.5,54.3" />
</vector>`
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    description: 'Android adaptive launcher icon',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    description: 'Android adaptive round launcher icon',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  }
];

const LOTTIE_ASSET_BUNDLES: Array<{ zipPath: string; webPath: string }> = [
  { zipPath: 'app/src/main/assets/eye_healthy.json', webPath: '/assets/aistudio/eye_healthy_3668be00.json' },
  { zipPath: 'app/src/main/assets/eye_blink.json', webPath: '/assets/aistudio/eye_blink_ff9efeda.json' },
  { zipPath: 'app/src/main/assets/eye_tired.json', webPath: '/assets/aistudio/eye_tired_9143fadf.json' },
  { zipPath: 'app/src/main/assets/eye_squeeze.json', webPath: '/assets/aistudio/eye_squeeze_bca725aa.json' },
  { zipPath: 'app/src/main/assets/eye_overdue.json', webPath: '/assets/aistudio/eye_overdue_e6ca7719.json' },
  { zipPath: 'app/src/main/assets/eye_recovery.json', webPath: '/assets/aistudio/eye_recovery_600c0ff4.json' },
];

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();

  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  await Promise.all(
    LOTTIE_ASSET_BUNDLES.map(async (asset) => {
      try {
        const res = await fetch(asset.webPath);
        if (res.ok) {
          const json = await res.json();
          zip.file(asset.zipPath, JSON.stringify(normalizeEyeLottieData(json)));
        }
      } catch {
        // Ignore network failure if offline
      }
    })
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '20-20-20-smart-eye-break-android-studio.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
