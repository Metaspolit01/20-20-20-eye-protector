# 20-20-20 Smart Eye Break Assistant (Native Android)

**Target Device:** Samsung Galaxy M15 5G (Model: `SM-M156B`)  
**OS Version:** Android 16 / One UI 8.0  
**Language:** Kotlin 2.0  
**UI Framework:** Jetpack Compose (Material 3)  
**Compilation Target:** Compile SDK 36, Target SDK 36, Min SDK 26  

---

## 1. Architecture Overview

Clean Architecture with dedicated packages:
- `service`: `EyeBreakAccessibilityService` managing system overlay window and foreground window state tracking.
- `timer`: Monotonic `ScreenTimeEngine` tracking delta milliseconds via `SystemClock.elapsedRealtime()`, preventing drift and eliminating high-frequency battery drain.
- `overlay`: `BreakOverlayManager` + `BreakOverlayContent` delivering full-screen immersive animated blue gradient, floating light particles, breathing eye relaxation visual, monotonic 20-second countdown, Skip and Snooze (5 min).
- `monitoring`: `ScreenStateReceiver` (ACTION_SCREEN_ON, ACTION_SCREEN_OFF, ACTION_USER_PRESENT) + `CallStateTracker` (TelephonyManager / TelephonyCallback).
- `exclusions`: `ExclusionManager` prioritizing phone calls and configurable GPS navigation apps (Google Maps, Waze, etc.) by queuing breaks as pending until navigation ends.
- `settings`: `EyeBreakPreferences` & `SettingsRepository` persisting configurations via Jetpack DataStore Preferences.
- `storage`: `BreakStatisticsStore` recording daily completed breaks and screen-on durations.
- `dashboard`: Jetpack Compose Material 3 Dashboard with circular progress timer, real-time status indicators, and settings.
- `boot`: `BootCompletedReceiver` restoring persisted state after device reboot.
- `permissions`: `PermissionHelper` & `SamsungOptimizationHelper` providing deep links and step-by-step guidance for Samsung One UI 8.0.

---

## 2. Privacy & Offline Policy

- **No Internet Permission:** The application does not declare or request `android.permission.INTERNET`. It functions 100% offline.
- **Privacy Hardening:** `canRetrieveWindowContent` is set to `false` in `accessibility_service_config.xml`. The app never inspects messages, passwords, keystrokes, or on-screen text.
- **Zero Ads / Zero Telemetry.**

---

## 3. How to Build the APK

### Requirements
- Android Studio Ladybug (2024.2+) or Jellyfish
- JDK 17 or higher
- Android SDK Platform 36

### Build Debug APK:
```bash
./gradlew assembleDebug
```
Output location:
`app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK:
```bash
./gradlew assembleRelease
```
Output location:
`app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 4. Installation & Samsung Galaxy M15 5G Setup

### Step 1: Install via ADB
Connect Samsung Galaxy M15 5G with USB debugging enabled:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 2: Enable Accessibility Service
1. Open phone **Settings** → **Accessibility**.
2. Tap **Installed apps** (or **Installed services**).
3. Select **20-20-20 Eye Break Assistant** and toggle **ON**.
4. Confirm permissions dialog.

### Step 3: Samsung One UI 8.0 Battery Optimization ("Never sleeping apps")
Samsung One UI aggressively sleeps background services unless explicitly exempted:
1. Open **Settings** → **Battery** → **Background usage limits**.
2. Tap **Never sleeping apps**.
3. Tap **+** (Add) and select **20-20-20 Smart Eye Break**.
4. Return to **Settings** → **Apps** → **20-20-20 Smart Eye Break** → **Battery** → Select **Unrestricted**.

---

## 5. Automated Verification Checklist

- **Test A:** Screen ON 20 min → Break overlay appears.
- **Test B:** Screen ON 10 min, OFF 10 min, ON 10 min → Break triggers after total 20 min screen-on.
- **Test C/D:** YouTube, Instagram, Games → Tracking continues smoothly.
- **Test E:** Active phone call → Break is suppressed and marked pending until call ends.
- **Test F:** Google Maps Navigation → Break is suppressed until exiting navigation.
- **Test G:** Tap Skip → Overlay dismisses and resets 20-min cycle.
- **Test H:** Tap Snooze → Overlay dismisses and triggers after 5 minutes screen-on.
- **Test I:** Keyguard locked → Accumulation pauses and state is preserved.
- **Test J:** Phone reboot → Accumulated time and preferences restored from DataStore.
