package com.example.layerfarm.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.layerfarm.data.LayerFarmLog

@Composable
fun FarmDashboardScreen(
    viewModel: FarmViewModel,
    onNavigateToTab: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val logs by viewModel.logs.collectAsState()
    val unsyncedCount by viewModel.unsyncedCount.collectAsState()
    
    // Calculate today's aggregate metrics
    val todayDate = "2026-07-02" // Representative of current data timestamp
    val todayLogs = logs.filter { it.date == todayDate }
    
    val totalTodayEggs = todayLogs.sumOf { it.eggCount }
    val totalTodayWeight = todayLogs.sumOf { it.eggWeight }
    val avgEggWeight = if (totalTodayEggs > 0) (totalTodayWeight * 1000) / totalTodayEggs else 0.0 // in grams
    
    val totalTodayFeed = todayLogs.sumOf { it.feedAmount }
    val todayDeadCount = todayLogs.sumOf { it.chickenDead }
    
    // Feed Conversion Ratio (FCR)
    val todayFcr = if (totalTodayWeight > 0 && totalTodayFeed > 0) totalTodayFeed / totalTodayWeight else 0.0
    
    // Estimasi populasi ayam aktif (misal standar total populasi 3.000 ekor)
    val totalPopulation = 3000
    val mortalityPercent = (todayDeadCount.toDouble() / totalPopulation) * 100

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        
        // ==========================================
        // 1. HEADER TITLE
        // ==========================================
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Kinerja Peternakan",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Ikhtisar Harian • $todayDate",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )
            }
        }

        // ==========================================
        // 2. SYNCHRONIZATION BADGE STATUS (Bullet Point A)
        // ==========================================
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = if (unsyncedCount > 0) Color(0xFFFEF3C7) else Color(0xFFD1FAE5),
            border = BorderStroke(1.dp, if (unsyncedCount > 0) Color(0xFFF59E0B) else Color(0xFF10B981)),
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onNavigateToTab("utilities") }
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = if (unsyncedCount > 0) Icons.Default.Info else Icons.Default.CheckCircle,
                    contentDescription = "Status Sync",
                    tint = if (unsyncedCount > 0) Color(0xFFD97706) else Color(0xFF057857)
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (unsyncedCount > 0) "$unsyncedCount Data Menunggu Sinkronisasi" else "Semua Data Aman di Server",
                        style = MaterialTheme.typography.titleSmall,
                        color = if (unsyncedCount > 0) Color(0xFF92400E) else Color(0xFF065F46)
                    )
                    Text(
                        text = if (unsyncedCount > 0) "Koneksikan internet dan tekan tombol sinkronisasi di menu." else "Data lokal Anda telah dicadangkan sepenuhnya.",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (unsyncedCount > 0) Color(0xFFB45309) else Color(0xFF047857)
                    )
                }
                Icon(
                    imageVector = Icons.Default.KeyboardArrowRight,
                    contentDescription = "Sync Menu",
                    tint = if (unsyncedCount > 0) Color(0xFFD97706) else Color(0xFF057857)
                )
            }
        }

        // ==========================================
        // 3. KPI CARD: PRODUKSI TELUR (Bullet Point A)
        // ==========================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("🥚", style = MaterialTheme.typography.titleLarge)
                    Text(
                        "PRODUKSI TELUR",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF64748B)
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "$totalTodayEggs Butir",
                        style = MaterialTheme.typography.headlineLarge,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "Total: ${String.format("%.1f", totalTodayWeight)} kg",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF10B981)
                    )
                }
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Rata-rata berat per butir:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF64748B)
                    )
                    Text(
                        text = "${String.format("%.1f", avgEggWeight)} gram",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF0F172A)
                    )
                }
            }
        }

        // ==========================================
        // 4. KPI CARD: KONSUMSI PAKAN & FCR (Bullet Point A)
        // ==========================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("🌾", style = MaterialTheme.typography.titleLarge)
                    Text(
                        "KONSUMSI PAKAN & INDEKS FCR",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF64748B)
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "${String.format("%.1f", totalTodayFeed)} kg",
                        style = MaterialTheme.typography.headlineLarge,
                        color = Color(0xFF0F172A)
                    )
                    
                    // Display Badge FCR
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = when {
                            todayFcr <= 0 -> Color(0xFFF1F5F9)
                            todayFcr in 2.0..2.2 -> Color(0xFFD1FAE5)
                            todayFcr < 2.0 -> Color(0xFFDBEAFE)
                            else -> Color(0xFFFEE2E2)
                        },
                        modifier = Modifier.padding(bottom = 4.dp)
                    ) {
                        Text(
                            text = "FCR: ${if (todayFcr > 0) String.format("%.2f", todayFcr) else "0.00"}",
                            style = MaterialTheme.typography.titleSmall,
                            color = when {
                                todayFcr <= 0 -> Color(0xFF64748B)
                                todayFcr in 2.0..2.2 -> Color(0xFF065F46)
                                todayFcr < 2.0 -> Color(0xFF1E40AF)
                                else -> Color(0xFF991B1B)
                            },
                            modifier = Modifier.padding(horizontal = 8.dp, py = 4.dp)
                        )
                    }
                }
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))
                
                Text(
                    text = when {
                        todayFcr <= 0 -> "Belum ada log berat/pakan hari ini."
                        todayFcr in 2.0..2.2 -> "Status FCR Ideal (2.0 - 2.2). Pertahankan rasio pemberian pakan."
                        todayFcr < 2.0 -> "Status Sangat Efisien (< 2.0). Serapan pakan menjadi telur sangat optimal."
                        else -> "Status FCR Tinggi (> 2.2). Periksa potensi pakan terbuang atau ayam stres."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B)
                )
            }
        }

        // ==========================================
        // 5. KPI CARD: MORTALITAS (Bullet Point A)
        // ==========================================
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("💀", style = MaterialTheme.typography.titleLarge)
                    Text(
                        "KEMATIAN AYAM (MORTALITAS)",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF64748B)
                    )
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "$todayDeadCount Ekor",
                        style = MaterialTheme.typography.headlineLarge,
                        color = if (todayDeadCount > 0) Color(0xFFEF4444) else Color(0xFF0F172A)
                    )
                    Text(
                        text = "Rasio: ${String.format("%.3f", mortalityPercent)}%",
                        style = MaterialTheme.typography.titleSmall,
                        color = if (todayDeadCount > 0) Color(0xFFEF4444) else Color(0xFF64748B)
                    )
                }
                
                Divider(modifier = Modifier.padding(vertical = 12.dp), color = Color(0xFFF1F5F9))
                
                Text(
                    text = if (todayDeadCount > 0) {
                        "Waspada: Ditemukan kematian ayam hari ini. Pastikan biosekuriti kandang ditingkatkan."
                    } else {
                        "Luar biasa! Tidak ada kematian ayam tercatat hari ini."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B)
                )
            }
        }
    }
}
