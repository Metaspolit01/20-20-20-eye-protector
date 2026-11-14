package com.eyecare.smartbreak.timer

import android.os.SystemClock
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.ceil

/**
 * MonotonicBreakTimer provides an accurate countdown based on SystemClock.elapsedRealtime().
 * Rendering jitter or device sleep does not distort the exact 20-second break duration.
 */
class MonotonicBreakTimer(
    private val breakDurationSeconds: Int = 20,
    private val clock: () => Long = { SystemClock.elapsedRealtime() }
) {
    private var job: Job? = null
    private var deadlineMs: Long = 0L

    private val _remainingSeconds = MutableStateFlow(breakDurationSeconds)
    val remainingSeconds: StateFlow<Int> = _remainingSeconds.asStateFlow()

    private val _isCompleted = MutableStateFlow(false)
    val isCompleted: StateFlow<Boolean> = _isCompleted.asStateFlow()

    fun start(scope: CoroutineScope, onFinish: () => Unit) {
        cancel()
        val now = clock()
        deadlineMs = now + (breakDurationSeconds * 1000L)
        _remainingSeconds.value = breakDurationSeconds
        _isCompleted.value = false

        job = scope.launch(Dispatchers.Default) {
            while (isActive) {
                val current = clock()
                val remainingMs = (deadlineMs - current).coerceAtLeast(0L)
                val seconds = ceil(remainingMs / 1000.0).toInt()
                _remainingSeconds.value = seconds

                if (current >= deadlineMs) {
                    _isCompleted.value = true
                    withContext(Dispatchers.Main) {
                        onFinish()
                    }
                    break
                }
                delay(100L) // Frequent tick for smooth sub-second UI synchronization
            }
        }
    }

    fun cancel() {
        job?.cancel()
        job = null
    }
}
