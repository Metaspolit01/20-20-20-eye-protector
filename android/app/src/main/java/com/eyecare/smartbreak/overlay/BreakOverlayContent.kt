package com.eyecare.smartbreak.overlay

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Snooze
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.random.Random

@Composable
fun BreakOverlayContent(
    remainingSeconds: Int,
    onSkip: () -> Unit,
    onSnooze: () -> Unit
) {
    // Smooth flowing gradient animation
    val infiniteTransition = rememberInfiniteTransition(label = "GradientFlow")
    val gradientOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 12000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "FlowOffset"
    )

    // Breathing pulse for eye relaxation
    val eyePulse by infiniteTransition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "EyePulse"
    )

    // Floating particles state
    val particles = remember {
        List(24) {
            Particle(
                x = Random.nextFloat(),
                y = Random.nextFloat(),
                radius = Random.nextFloat() * 4f + 2f,
                alpha = Random.nextFloat() * 0.4f + 0.15f,
                speed = Random.nextFloat() * 0.0008f + 0.0003f
            )
        }
    }

    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF031024), // Deep midnight blue
            Color(0xFF0A2540), // Royal oceanic blue
            Color(0xFF0F3B66), // Glowing cyan-blue tint
            Color(0xFF04142B)  // Dark contrast floor
        ),
        startY = gradientOffset * 0.2f,
        endY = gradientOffset * 0.2f + 1600f
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
    ) {
        // Floating particles layer
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height

            particles.forEach { p ->
                val currentY = ((p.y + (gradientOffset * p.speed)) % 1f) * height
                val currentX = p.x * width
                drawCircle(
                    color = Color(0xFF67E8F9).copy(alpha = p.alpha),
                    radius = p.radius,
                    center = Offset(currentX, currentY)
                )
            }
        }

        // Main Content Column
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 28.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header Tag
            Surface(
                color = Color(0x330284C7),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x6638BDF8))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Visibility,
                        contentDescription = null,
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "20-20-20 RULE IN EFFECT",
                        color = Color(0xFFE0F2FE),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp
                    )
                }
            }

            // Central Eye & Countdown Cluster
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // Animated Eye Visual
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(RoundedCornerShape(60.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val center = Offset(size.width / 2f, size.height / 2f)
                        // Glowing outer ring
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(Color(0x5538BDF8), Color.Transparent),
                                center = center,
                                radius = size.width / 2f * eyePulse
                            )
                        )
                        // Eyelid contour
                        drawCircle(
                            color = Color(0xFF0284C7),
                            radius = 36.dp.toPx() * eyePulse,
                            style = Stroke(width = 3.dp.toPx())
                        )
                        // Relaxing pupil
                        drawCircle(
                            color = Color(0xFF67E8F9),
                            radius = 16.dp.toPx() * (2f - eyePulse),
                            center = center
                        )
                    }
                }

                // Title
                Text(
                    text = "TIME FOR AN EYE BREAK",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.5.sp,
                    textAlign = TextAlign.Center
                )

                // Large Monotonic Countdown
                val formattedTime = String.format("00:%02d", remainingSeconds.coerceAtLeast(0))
                Surface(
                    color = Color(0x220F172A),
                    shape = RoundedCornerShape(24.dp),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0x5538BDF8))
                ) {
                    Text(
                        text = formattedTime,
                        color = Color(0xFF67E8F9),
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(horizontal = 32.dp, vertical = 12.dp),
                        letterSpacing = 3.sp
                    )
                }

                // Guidance Copy
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.padding(horizontal = 16.dp)
                ) {
                    Text(
                        text = "Look at something 20 feet away for 20 seconds.",
                        color = Color(0xFFF1F5F9),
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        lineHeight = 24.sp
                    )
                    Text(
                        text = "Give your eyes a little rest.",
                        color = Color(0xFF94A3B8),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Bottom Action Controls
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Snooze 5 min Button
                OutlinedButton(
                    onClick = onSnooze,
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color(0xFFE2E8F0)
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0x6694A3B8))
                ) {
                    Icon(
                        imageVector = Icons.Default.Snooze,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Snooze 5 min",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Skip Button
                Button(
                    onClick = onSkip,
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF0284C7),
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Skip",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

private data class Particle(
    val x: Float,
    val y: Float,
    val radius: Float,
    val alpha: Float,
    val speed: Float
)
