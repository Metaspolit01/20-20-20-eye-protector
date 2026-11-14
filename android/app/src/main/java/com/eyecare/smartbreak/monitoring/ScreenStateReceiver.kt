package com.eyecare.smartbreak.monitoring

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.PowerManager

class ScreenStateReceiver(
    private val onScreenOn: () -> Unit,
    private val onScreenOff: () -> Unit,
    private val onUserPresent: () -> Unit,
    private val onKeyguardStateChanged: (isLocked: Boolean) -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager

        val isLocked = keyguardManager?.isKeyguardLocked ?: false
        val isInteractive = powerManager?.isInteractive ?: true

        when (intent.action) {
            Intent.ACTION_SCREEN_ON -> {
                onScreenOn()
                onKeyguardStateChanged(isLocked)
            }
            Intent.ACTION_SCREEN_OFF -> {
                onScreenOff()
                onKeyguardStateChanged(true)
            }
            Intent.ACTION_USER_PRESENT -> {
                onUserPresent()
                onKeyguardStateChanged(false)
            }
        }
    }

    fun register(context: Context) {
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        context.registerReceiver(this, filter)
    }

    fun unregister(context: Context) {
        try {
            context.unregisterReceiver(this)
        } catch (_: IllegalArgumentException) {
        }
    }
}
