package com.eyecare.smartbreak.monitoring

import android.content.Context
import android.os.Build
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager

class CallStateTracker(
    private val context: Context,
    private val onCallStateChanged: (isInCall: Boolean) -> Unit
) {
    private val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
    private var legacyListener: PhoneStateListener? = null
    private var modernCallback: TelephonyCallback? = null

    fun startListening() {
        if (telephonyManager == null) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                override fun onCallStateChanged(state: Int) {
                    val inCall = state == TelephonyManager.CALL_STATE_OFFHOOK ||
                            state == TelephonyManager.CALL_STATE_RINGING
                    onCallStateChanged(inCall)
                }
            }
            modernCallback = callback
            try {
                telephonyManager.registerTelephonyCallback(context.mainExecutor, callback)
            } catch (_: SecurityException) {
                // If READ_PHONE_STATE is not granted, gracefully treat as not in call
            }
        } else {
            @Suppress("DEPRECATION")
            val listener = object : PhoneStateListener() {
                @Deprecated("Deprecated in Java")
                override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                    val inCall = state == TelephonyManager.CALL_STATE_OFFHOOK ||
                            state == TelephonyManager.CALL_STATE_RINGING
                    onCallStateChanged(inCall)
                }
            }
            legacyListener = listener
            try {
                @Suppress("DEPRECATION")
                telephonyManager.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
            } catch (_: SecurityException) {
            }
        }
    }

    fun stopListening() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && modernCallback != null) {
            telephonyManager?.unregisterTelephonyCallback(modernCallback!!)
            modernCallback = null
        } else if (legacyListener != null) {
            @Suppress("DEPRECATION")
            telephonyManager?.listen(legacyListener, PhoneStateListener.LISTEN_NONE)
            legacyListener = null
        }
    }
}
