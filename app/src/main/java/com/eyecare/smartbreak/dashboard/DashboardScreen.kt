package com.eyecare.smartbreak.dashboard

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
import kotlinx.coroutines.launch
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

    // Natural Eye Blinking Loop
    LaunchedEffect(
        timerState.isMonitoring,
        timerState.isInteractive,
        timerState.isKeyguardLocked,
        timerState.isBreakDue,
        timerState.isBreakSuppressed,
        isRecovering
    ) {
        if (!timerState.isMonitoring || !timerState.isInteractive || timerState.isKeyguardLocked ||
            timerState.isBreakDue || timerState.isBreakSuppressed || isRecovering
        ) {
            isBlinking = false
            return@LaunchedEffect
        }
        while (true) {
            val blinkDelay = kotlin.random.Random.nextLong(2200L, 4600L)
            delay(blinkDelay)
            isBlinking = true
            delay(130L)
            isBlinking = false

            // 25% chance of double-blink
            if (kotlin.random.Random.nextFloat() < 0.25f) {
                delay(90L)
                isBlinking = true
                delay(110L)
                isBlinking = false
            }
        }
    }

    // Natural Gaze Saccades Loop
    val animGazeX = remember { Animatable(0f) }
    val animGazeY = remember { Animatable(0f) }

    LaunchedEffect(
        timerState.isMonitoring,
        timerState.isInteractive,
        timerState.isKeyguardLocked
    ) {
        if (!timerState.isMonitoring || !timerState.isInteractive || timerState.isKeyguardLocked) {
            animGazeX.snapTo(0f)
            animGazeY.snapTo(0f)
            return@LaunchedEffect
        }
        while (true) {
            val holdTime = kotlin.random.Random.nextLong(1600L, 3600L)
            delay(holdTime)

            val (targetX, targetY) = if (kotlin.random.Random.nextFloat() < 0.40f) {
                Pair(0f, 0f)
            } else {
                val angle = kotlin.random.Random.nextFloat() * 2f * PI.toFloat()
                val dist = kotlin.random.Random.nextFloat() * 24f + 8f
                Pair(cos(angle) * dist, sin(angle) * dist * 0.5f)
            }

            val duration = kotlin.random.Random.nextInt(110, 190)
            launch {
                animGazeX.animateTo(
                    targetValue = targetX,
                    animationSpec = tween(durationMillis = duration, easing = FastOutSlowInEasing)
                )
            }
            launch {
                animGazeY.animateTo(
                    targetValue = targetY,
                    animationSpec = tween(durationMillis = duration, easing = FastOutSlowInEasing)
                )
            }
        }
    }

    val progressVal = timerState.progressFraction * 100f
    val targetOpenness = when {
        isBlinking -> 0.0f
        isRecovering -> 1.0f
        timerState.isBreakDue || timerState.isBreakSuppressed || progressVal >= 100f -> 0.28f
        progressVal >= 80f -> 0.50f - ((progressVal - 80f) / 19f).coerceIn(0f, 1f) * 0.20f
        progressVal >= 50f -> 0.85f - ((progressVal - 50f) / 30f).coerceIn(0f, 1f) * 0.17f
        else -> 1.0f
    }
    val animatedOpenness by animateFloatAsState(
        targetValue = targetOpenness,
        animationSpec = tween(
            durationMillis = if (isBlinking) 90 else 240,
            easing = FastOutLinearInEasing
        ),
        label = "EyeOpenness"
    )

    val redness = when {
        isRecovering -> 0.04f
        timerState.isBreakDue || timerState.isBreakSuppressed || progressVal >= 100f -> 0.96f
        progressVal >= 80f -> 0.58f + ((progressVal - 80f) / 19f).coerceIn(0f, 1f) * 0.34f
        progressVal >= 50f -> 0.18f + ((progressVal - 50f) / 30f).coerceIn(0f, 1f) * 0.24f
        progressVal >= 40f -> ((progressVal - 40f) / 10f) * 0.10f
        else -> 0f
    }

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
                        } else if (progressVal >= 80f) {
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
                        gazeX = animGazeX.value,
                        gazeY = animGazeY.value,
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
                    Text("${todaySec / 60}m ${todaySec % 60}s", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
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
}
