package com.eyecare.smartbreak.timer

import com.eyecare.smartbreak.exclusions.ExclusionManager
import com.eyecare.smartbreak.settings.EyeBreakPreferences
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ScreenTimeEngineTest {

    private var currentTimeMs: Long = 100_000L
    private lateinit var exclusionManager: ExclusionManager
    private var breakTriggeredCount = 0
    private var breakDismissedCount = 0
    private var persistedStateMs = 0L

    private fun createEngine(prefs: EyeBreakPreferences = EyeBreakPreferences()): ScreenTimeEngine {
        return ScreenTimeEngine(
            preferences = prefs,
            exclusionManager = exclusionManager,
            onBreakTriggered = { breakTriggeredCount++ },
            onBreakDismissed = { breakDismissedCount++ },
            onStatePersisted = { persistedStateMs = it },
            clock = { currentTimeMs }
        )
    }

    @Before
    fun setup() {
        currentTimeMs = 100_000L
        breakTriggeredCount = 0
        breakDismissedCount = 0
        persistedStateMs = 0L
        exclusionManager = ExclusionManager()
    }

    @Test
    fun testA_20MinuteScreenOnTriggersBreak() {
        val engine = createEngine()
        assertFalse(engine.state.value.isBreakActive)

        currentTimeMs += 20 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)

        assertTrue("Break overlay should trigger after 20 minutes", engine.state.value.isBreakActive)
        assertEquals(1, breakTriggeredCount)
    }

    @Test
    fun testB_ScreenOffPausesAccumulation() {
        val engine = createEngine()

        // 10 minutes on
        currentTimeMs += 10 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)
        assertEquals(10 * 60 * 1000L, engine.state.value.accumulatedScreenOnMs)

        // Turn screen off for 10 minutes
        engine.onScreenOff(currentTimeMs)
        currentTimeMs += 10 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)
        assertEquals(10 * 60 * 1000L, engine.state.value.accumulatedScreenOnMs)
        assertFalse(engine.state.value.isBreakActive)

        // Turn screen back on for 10 minutes
        engine.onScreenOn(currentTimeMs)
        currentTimeMs += 10 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)
        assertTrue(engine.state.value.isBreakActive)
    }

    @Test
    fun testE_PhoneCallSuppressesBreakUntilCallEnds() {
        val engine = createEngine()

        currentTimeMs += 18 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)

        // Call begins
        engine.onCallStateChanged(true, currentTimeMs)
        currentTimeMs += 5 * 60 * 1000L // Exceeds 20 minutes
        engine.reconcileTime(currentTimeMs)

        assertTrue(engine.state.value.isBreakDue)
        assertTrue(engine.state.value.isBreakSuppressed)
        assertFalse(engine.state.value.isBreakActive)

        // Call terminates
        engine.onCallStateChanged(false, currentTimeMs)
        assertTrue(engine.state.value.isBreakActive)
    }

    @Test
    fun testF_NavigationExclusionQueuesBreak() {
        val engine = createEngine()
        engine.onForegroundPackageChanged("com.google.android.apps.maps", currentTimeMs)

        currentTimeMs += 22 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)

        assertTrue(engine.state.value.isBreakSuppressed)
        assertFalse(engine.state.value.isBreakActive)

        // Return to launcher
        engine.onForegroundPackageChanged("com.sec.android.app.launcher", currentTimeMs)
        assertTrue(engine.state.value.isBreakActive)
    }

    @Test
    fun testG_SkipRestarts20MinuteInterval() {
        val engine = createEngine()
        currentTimeMs += 20 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)
        assertTrue(engine.state.value.isBreakActive)

        engine.skipBreak(currentTimeMs)
        assertFalse(engine.state.value.isBreakActive)
        assertEquals(0L, engine.state.value.accumulatedScreenOnMs)
        assertEquals(20 * 60 * 1000L, engine.state.value.targetIntervalMs)
    }

    @Test
    fun testH_SnoozeSchedules5MinuteReminder() {
        val engine = createEngine()
        currentTimeMs += 20 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)
        assertTrue(engine.state.value.isBreakActive)

        engine.snoozeBreak(currentTimeMs)
        assertFalse(engine.state.value.isBreakActive)
        assertTrue(engine.state.value.isSnoozed)
        assertEquals(5 * 60 * 1000L, engine.state.value.targetIntervalMs)

        currentTimeMs += 5 * 60 * 1000L
        engine.reconcileTime(currentTimeMs)
        assertTrue(engine.state.value.isBreakActive)
    }
}
