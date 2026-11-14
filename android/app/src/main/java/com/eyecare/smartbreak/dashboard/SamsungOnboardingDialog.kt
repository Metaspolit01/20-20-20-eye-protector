package com.eyecare.smartbreak.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eyecare.smartbreak.permissions.SamsungOptimizationHelper

@Composable
fun SamsungOnboardingDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    SamsungOptimizationHelper.openSamsungBackgroundUsageLimits(context)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF0284C7)
                )
            ) {
                Text("Open Samsung Battery Settings")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Got It", color = Color(0xFF94A3B8))
            }
        },
        icon = {
            Icon(
                imageVector = Icons.Default.BatteryChargingFull,
                contentDescription = null,
                tint = Color(0xFF38BDF8),
                modifier = Modifier.size(36.dp)
            )
        },
        title = {
            Text(
                text = "Samsung Galaxy M15 Setup",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "One UI 8.0 on Galaxy M15 5G aggressively sleeps background timers. To guarantee precise 20-minute eye breaks:",
                    fontSize = 14.sp,
                    color = Color(0xFFCBD5E1)
                )

                StepItem(
                    stepNumber = "1",
                    title = "Add to Never sleeping apps",
                    description = "Settings → Battery → Background usage limits → Never sleeping apps → Add (+) '20-20-20 Smart Eye Break'."
                )

                StepItem(
                    stepNumber = "2",
                    title = "Set Battery to Unrestricted",
                    description = "App Info → Battery → Select 'Unrestricted'."
                )

                StepItem(
                    stepNumber = "3",
                    title = "Enable Accessibility Service",
                    description = "Settings → Accessibility → Installed services → Turn ON '20-20-20 Eye Break Assistant'."
                )
            }
        },
        containerColor = Color(0xFF0B192C),
        shape = RoundedCornerShape(20.dp)
    )
}

@Composable
private fun StepItem(
    stepNumber: String,
    title: String,
    description: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = Color(0xFF0369A1),
            modifier = Modifier.size(24.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = stepNumber,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
            Text(
                text = description,
                fontSize = 12.sp,
                color = Color(0xFF94A3B8)
            )
        }
    }
}
