package com.example.layerfarm.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import com.example.layerfarm.data.LayerFarmLog

@Composable
fun ReportsScreen(
    viewModel: FarmViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val logs by viewModel.logs.collectAsState()

    // 10 chronological data points for charts
    val chartData = listOf(
        ChartPoint("23 Jun", 2580, 1),
        ChartPoint("24 Jun", 2610, 0),
        ChartPoint("25 Jun", 2640, 2),
        ChartPoint("26 Jun", 2590, 1),
        ChartPoint("27 Jun", 2650, 0),
        ChartPoint("28 Jun", 2710, 3),
        ChartPoint("29 Jun", 2680, 1),
        ChartPoint("30 Jun", 2740, 0),
        ChartPoint("01 Jul", 2780, 1),
        ChartPoint("02 Jul", 2750, 2)
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        
        // Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Kembali")
            }
            Column {
                Text(
                    text = "Laporan Grafis & Analitik",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Laporan visualisasi performa kandang riil.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // ==========================================
        // 1. CHART 1: LINE CHART - TREN PRODUKSI TELUR
        // ==========================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "🥚 Tren Produksi Telur (Butir / Hari)",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Memperlihatkan tren fluktuasi produksi telur 10 hari terakhir.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                // Native Canvas line chart
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                ) {
                    val width = size.width
                    val height = size.height
                    
                    val paddingLeft = 40f
                    val paddingRight = 20f
                    val paddingTop = 20f
                    val paddingBottom = 40f
                    
                    val graphWidth = width - paddingLeft - paddingRight
                    val graphHeight = height - paddingTop - paddingBottom

                    // Scaling values
                    val maxEggs = 3000f
                    val minEggs = 2400f
                    
                    // Draw horizontal grids
                    val gridCount = 4
                    for (i in 0..gridCount) {
                        val y = paddingTop + (i * graphHeight / gridCount)
                        drawLine(
                            color = Color(0xFFF1F5F9),
                            start = Offset(paddingLeft, y),
                            end = Offset(width - paddingRight, y),
                            strokeWidth = 2f
                        )
                    }

                    // Create path for line chart
                    val eggPath = Path()
                    chartData.forEachIndexed { index, point ->
                        val x = paddingLeft + (index * graphWidth / (chartData.size - 1))
                        // Scale Y
                        val scaledY = paddingTop + graphHeight - ((point.eggs - minEggs) / (maxEggs - minEggs)) * graphHeight
                        
                        if (index == 0) {
                            eggPath.moveTo(x, scaledY)
                        } else {
                            eggPath.lineTo(x, scaledY)
                        }
                    }

                    // Draw line
                    drawPath(
                        path = eggPath,
                        color = Color(0xFF10B981),
                        style = Stroke(width = 6f)
                    )

                    // Draw dots and text
                    chartData.forEachIndexed { index, point ->
                        val x = paddingLeft + (index * graphWidth / (chartData.size - 1))
                        val scaledY = paddingTop + graphHeight - ((point.eggs - minEggs) / (maxEggs - minEggs)) * graphHeight
                        
                        // Circle node
                        drawCircle(
                            color = Color.White,
                            radius = 10f,
                            center = Offset(x, scaledY)
                        )
                        drawCircle(
                            color = Color(0xFF10B981),
                            radius = 6f,
                            center = Offset(x, scaledY)
                        )
                    }
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(chartData.first().label, style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                    Text("Tren Berjalan", style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                    Text(chartData.last().label, style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                }
            }
        }

        // ==========================================
        // 2. CHART 2: BAR CHART - TREN MORTALITAS (KEMATIAN)
        // ==========================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "💀 Angka Kematian Ayam (Mortalitas)",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Visualisasi untuk mendeteksi dini indikasi wabah penyakit secara spasial.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                // Native Canvas Bar Chart
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                ) {
                    val width = size.width
                    val height = size.height
                    
                    val paddingLeft = 40f
                    val paddingRight = 20f
                    val paddingTop = 20f
                    val paddingBottom = 40f
                    
                    val graphWidth = width - paddingLeft - paddingRight
                    val graphHeight = height - paddingTop - paddingBottom

                    // Draw grid lines
                    val gridCount = 3
                    for (i in 0..gridCount) {
                        val y = paddingTop + (i * graphHeight / gridCount)
                        drawLine(
                            color = Color(0xFFF1F5F9),
                            start = Offset(paddingLeft, y),
                            end = Offset(width - paddingRight, y),
                            strokeWidth = 2f
                        )
                    }

                    val maxDead = 4f
                    val barWidth = (graphWidth / chartData.size) * 0.6f
                    val gap = (graphWidth / chartData.size) * 0.4f

                    chartData.forEachIndexed { index, point ->
                        val x = paddingLeft + (index * (barWidth + gap)) + gap / 2
                        val scaledBarHeight = (point.dead / maxDead) * graphHeight
                        val y = paddingTop + graphHeight - scaledBarHeight

                        drawRect(
                            color = if (point.dead > 1) Color(0xFFEF4444) else Color(0xFFF59E0B),
                            topLeft = Offset(x, y),
                            size = Size(barWidth, scaledBarHeight)
                        )
                    }
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(chartData.first().label, style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                    Text("Mortalitas Harian (Ekor)", style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                    Text(chartData.last().label, style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                }
            }
        }
    }
}

// Data holder
data class ChartPoint(
    val label: String,
    val eggs: Int,
    val dead: Int
)
