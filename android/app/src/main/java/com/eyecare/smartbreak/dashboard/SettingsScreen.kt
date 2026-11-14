package com.eyecare.smartbreak.dashboard

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
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
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
            // Screen-Time Interval
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Screen-Time Interval", color = Color.White, fontWeight = FontWeight.SemiBold)
                        Text("${intervalMinutes.toInt()} min", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = intervalMinutes,
                        onValueChange = {
                            intervalMinutes = it
                            onSavePreferences(preferences.copy(intervalMinutes = it.toInt()))
                        },
                        valueRange = 5f..60f,
                        steps = 10,
                        colors = SliderDefaults.colors(
                            thumbColor = Color(0xFF38BDF8),
                            activeTrackColor = Color(0xFF0284C7)
                        )
                    )
                    Text("Time before break reminder.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }

            // Break Duration
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Break Duration", color = Color.White, fontWeight = FontWeight.SemiBold)
                        Text("${breakDurationSeconds.toInt()} sec", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = breakDurationSeconds,
                        onValueChange = {
                            breakDurationSeconds = it
                            onSavePreferences(preferences.copy(breakDurationSeconds = it.toInt()))
                        },
                        valueRange = 10f..60f,
                        steps = 9,
                        colors = SliderDefaults.colors(
                            thumbColor = Color(0xFF38BDF8),
                            activeTrackColor = Color(0xFF0284C7)
                        )
                    )
                    Text("Rest countdown length.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }

            // Snooze Duration
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Snooze Duration", color = Color.White, fontWeight = FontWeight.SemiBold)
                        Text("${snoozeDurationMinutes.toInt()} min", color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                    }
                    Slider(
                        value = snoozeDurationMinutes,
                        onValueChange = {
                            snoozeDurationMinutes = it
                            onSavePreferences(preferences.copy(snoozeDurationMinutes = it.toInt()))
                        },
                        valueRange = 2f..15f,
                        steps = 12,
                        colors = SliderDefaults.colors(
                            thumbColor = Color(0xFF38BDF8),
                            activeTrackColor = Color(0xFF0284C7)
                        )
                    )
                    Text("Delay when snoozed.", fontSize = 12.sp, color = Color(0xFF94A3B8))
                }
            }

            // Sound and Vibration
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0B192C)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Reminder Chime", color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text("Play sound on break start", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        }
                        Switch(
                            checked = isSoundEnabled,
                            onCheckedChange = {
                                isSoundEnabled = it
                                onSavePreferences(preferences.copy(isSoundEnabled = it))
                            }
                        )
                    }

                    HorizontalDivider(color = Color(0x33334155))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Haptic Vibration", color = Color.White, fontWeight = FontWeight.SemiBold)
                            Text("Vibrate on break start", fontSize = 12.sp, color = Color(0xFF94A3B8))
                        }
                        Switch(
                            checked = isVibrationEnabled,
                            onCheckedChange = {
                                isVibrationEnabled = it
                                onSavePreferences(preferences.copy(isVibrationEnabled = it))
                            }
                        )
                    }
                }
            }
        }
    }
}
