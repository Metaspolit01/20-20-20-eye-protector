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
}