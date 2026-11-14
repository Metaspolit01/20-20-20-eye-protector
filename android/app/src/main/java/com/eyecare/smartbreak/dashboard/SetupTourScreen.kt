package com.eyecare.smartbreak.dashboard

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
    var neverSleepingConfigured by remember {
        mutableStateOf(false)
    }

    // Re-check actual Android system settings whenever user returns from Settings
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
            // Top Progress Header
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = Color(0x260284C7),
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, Color(0x4D38BDF8))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = Color(0xFF38BDF8),
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "SETUP • STEP $currentStep OF 4",
                                color = Color(0xFF7DD3FC),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.8.sp
                            )
                        }
                    }

                    Text(
                        text = "SM-M156B",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
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

            // Simple One-Line Step Content
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
                        Surface(
                            shape = RoundedCornerShape(24.dp),
                            color = Color(0x330284C7),
                            border = BorderStroke(1.dp, Color(0x6638BDF8)),
                            modifier = Modifier.size(84.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Visibility,
                                    contentDescription = null,
                                    tint = Color(0xFF7DD3FC),
                                    modifier = Modifier.size(44.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Text(
                            text = "20-20-20 Eye Care",
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Rest your eyes every 20 minutes for 20 seconds.",
                            color = Color(0xFFCBD5E1),
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        )
                    }

                    2 -> {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = Color(0xFF38BDF8),
                            modifier = Modifier.size(48.dp)
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "Accessibility Overlay",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Required to show break screen.",
                            color = Color(0xFF94A3B8),
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        SetupChecklistCard(
                            title = "Open Accessibility Settings",
                            subtitle = if (accessibilityConfigured) "Configured" else "Not configured — tap to open",
                            checked = accessibilityConfigured,
                            onClick = {
                                PermissionHelper.openAccessibilitySettings(
                                    context,
                                    EyeBreakAccessibilityService::class.java
                                )
                            }
                        )
                    }

                    3 -> {
                        Icon(
                            imageVector = Icons.Default.BatteryChargingFull,
                            contentDescription = null,
                            tint = Color(0xFF38BDF8),
                            modifier = Modifier.size(48.dp)
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "Battery & Sleep Setup",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Tap each box to configure in Phone Settings.",
                            color = Color(0xFF94A3B8),
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        SetupChecklistCard(
                            title = "Never sleeping apps",
                            subtitle = if (neverSleepingConfigured) "Configured" else "Tap to open Phone Battery Settings",
                            checked = neverSleepingConfigured,
                            onClick = {
                                visitedSamsungLimits = true
                                SamsungOptimizationHelper.openSamsungBackgroundUsageLimits(context)
                            }
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        SetupChecklistCard(
                            title = "Unrestricted battery",
                            subtitle = if (batteryUnrestrictedConfigured) "Configured" else "Tap to allow Unrestricted battery",
                            checked = batteryUnrestrictedConfigured,
                            onClick = { PermissionHelper.requestIgnoreBatteryOptimization(context) }
                        )
                    }

                    4 -> {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF34D399),
                            modifier = Modifier.size(64.dp)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Setup Verified",
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "All system permissions are configured.",
                            color = Color(0xFFCBD5E1),
                            fontSize = 14.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            // Bottom Mandatory Navigation Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (currentStep > 1) {
                    OutlinedButton(
                        onClick = { currentStep-- },
                        modifier = Modifier.height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFF334155))
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                }

                when (currentStep) {
                    1 -> {
                        Button(
                            onClick = { currentStep = 2 },
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                        ) {
                            Text("Start Setup", fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
                        }
                    }

                    2 -> {
                        Button(
                            onClick = { currentStep = 3 },
                            enabled = canAdvanceFromStep2,
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                        ) {
                            Text(
                                text = if (canAdvanceFromStep2) "Continue" else "Configure Above to Continue",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    3 -> {
                        Button(
                            onClick = { currentStep = 4 },
                            enabled = canAdvanceFromStep3,
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                        ) {
                            Text(
                                text = if (canAdvanceFromStep3) "Continue" else "Configure Both to Continue",
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    4 -> {
                        Button(
                            onClick = onCompleteSetup,
                            modifier = Modifier
                                .weight(1f)
                                .height(54.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                        ) {
                            Text("Enter App", fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Default.CheckCircle, contentDescription = null)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SetupChecklistCard(
    title: String,
    subtitle: String,
    checked: Boolean,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = if (checked) Color(0xFF064E3B) else Color(0xFF0B192C)
        ),
        border = BorderStroke(
            1.dp,
            if (checked) Color(0xFF34D399) else Color(0xFF1E293B)
        ),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = if (checked) Icons.Default.CheckCircle else Icons.Default.ChevronRight,
                contentDescription = null,
                tint = if (checked) Color(0xFF34D399) else Color(0xFF38BDF8)
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(subtitle, color = Color(0xFF94A3B8), fontSize = 11.sp)
            }
        }
    }
}
