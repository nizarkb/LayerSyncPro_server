package com.example.layerfarm.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Done
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.layerfarm.data.BiosecurityCheck

@Composable
fun BiosecurityScreen(
    viewModel: FarmViewModel,
    modifier: Modifier = Modifier
) {
    val checks by viewModel.biosecurityChecks.collectAsState()

    var activeTab by remember { mutableStateOf("form") } // "form" | "history"

    // Form states
    var inspectorName by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("2026-07-02") }
    var footBath by remember { mutableStateOf(false) }
    var vehicleSpray by remember { mutableStateOf(false) }
    var feedWarehouse by remember { mutableStateOf(false) }
    var cageWalkway by remember { mutableStateOf(false) }
    var safeDisposal by remember { mutableStateOf(false) }
    var trayDisinfected by remember { mutableStateOf(false) }
    var waterSanitized by remember { mutableStateOf(false) }
    var wildBird by remember { mutableStateOf(false) }
    var notes by remember { mutableStateOf("") }

    // Dynamic compliance score
    val checkedCount = listOf(
        footBath, vehicleSpray, feedWarehouse, cageWalkway,
        safeDisposal, trayDisinfected, waterSanitized, wildBird
    ).count { it }
    val dynamicScore = (checkedCount * 100) / 8

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        
        // Header
        Column {
            Text(
                text = "Biosekuriti & Sanitasi",
                style = MaterialTheme.typography.headlineMedium,
                color = Color(0xFF0F172A)
            )
            Text(
                text = "Evaluasi kepatuhan 8 titik krisis biosekuriti harian.",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF64748B)
            )
        }

        // Segmented Control Tabs
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { activeTab = "form" },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeTab == "form") Color(0xFF10B981) else Color(0xFFE2E8F0),
                    contentColor = if (activeTab == "form") Color.White else Color(0xFF64748B)
                ),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("Form Pemeriksaan", style = MaterialTheme.typography.titleSmall)
            }
            Button(
                onClick = { activeTab = "history" },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeTab == "history") Color(0xFF10B981) else Color(0xFFE2E8F0),
                    contentColor = if (activeTab == "history") Color.White else Color(0xFF64748B)
                ),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("Riwayat Kepatuhan", style = MaterialTheme.typography.titleSmall)
            }
        }

        if (activeTab == "form") {
            // COMPLIANCE FORM
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Circular Indicator & Dynamic score card
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                        border = BorderStroke(1.dp, Color(0xFFBBF7D0)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "Skor Kepatuhan Harian",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color(0xFF15803D)
                                )
                                Text(
                                    "Nilai dihitung otomatis dari 8 poin biosekuriti.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF166534)
                                )
                            }
                            Text(
                                text = "$dynamicScore%",
                                style = MaterialTheme.typography.headlineLarge,
                                color = Color(0xFF15803D),
                                modifier = Modifier.padding(start = 12.dp)
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = inspectorName,
                        onValueChange = { inspectorName = it },
                        label = { Text("Nama Pemeriksa (Petugas)") },
                        placeholder = { Text("Misal: Ahmad Fauzi") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    OutlinedTextField(
                        value = date,
                        onValueChange = { date = it },
                        label = { Text("Tanggal Pemeriksaan") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // CHECKBOXES - 8 points
                item {
                    Text(
                        "Daftar Checklist Kepatuhan",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF0F172A),
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }

                val checklistItems = listOf(
                    Triple("1. Sanitasi Alas Kaki (Footbath)", "Sanitasi alas kaki masuk kandang dalam kondisi aktif, bersih, dan disinfektan diganti rutin.", footBath) { footBath = it },
                    Triple("2. Penyemprotan Disinfektan Kendaraan", "Setiap kendaraan operasional atau tamu disemprot disinfektan di gerbang depan.", vehicleSpray) { vehicleSpray = it },
                    Triple("3. Kebersihan Gudang Pakan", "Gudang pakan dalam kondisi bersih, kering, tertutup, dan terbebas dari serangan hama/tikus.", feedWarehouse) { feedWarehouse = it },
                    Triple("4. Pembersihan Jalan & Sela Kandang", "Sela-sela antar kandang dan jalan utama ditiup/disapu bersih dari debu dan kotoran ayam.", cageWalkway) { cageWalkway = it },
                    Triple("5. Pemusnahan Bangkai Ayam Aman", "Pemusnahan bangkai ayam harian dilakukan dengan aman dan steril (dikubur/dibakar di tempat khusus).", safeDisposal) { safeDisposal = it },
                    Triple("6. Disinfeksi Tray Telur", "Semua tray telur didisinfeksi menyeluruh sebelum masuk atau meninggalkan lingkungan peternakan.", trayDisinfected) { trayDisinfected = it },
                    Triple("7. Klorinasi Air Minum Ayam", "Proses klorinasi atau sanitasi tangki air utama berjalan normal sesuai takaran harian.", waterSanitized) { waterSanitized = it },
                    Triple("8. Kawat Pelindung Burung Liar", "Kawat atau jaring pelindung kandang utuh sempurna untuk mencegah burung liar penular penyakit.", wildBird) { wildBird = it }
                )

                items(checklistItems) { item ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        color = Color.White,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Checkbox(
                                checked = item.second,
                                onCheckedChange = item.third,
                                colors = CheckboxDefaults.colors(checkedColor = Color(0xFF10B981))
                            )
                            Column {
                                Text(
                                    text = item.first,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = Color(0xFF0F172A)
                                )
                                Text(
                                    text = item.second,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF64748B)
                                )
                            }
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Catatan Temuan Lapangan") },
                        placeholder = { Text("Semua aman atau ada kawat kandang C robek sedikit...") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item {
                    Button(
                        onClick = {
                            viewModel.addBiosecurityCheck(
                                inspectorName = inspectorName,
                                date = date,
                                footBath = footBath,
                                vehicleSpray = vehicleSpray,
                                feedWarehouse = feedWarehouse,
                                cageWalkway = cageWalkway,
                                safeDisposal = safeDisposal,
                                trayDisinfected = trayDisinfected,
                                waterSanitized = waterSanitized,
                                wildBird = wildBird,
                                notes = notes
                            )
                            // reset form
                            inspectorName = ""
                            footBath = false
                            vehicleSpray = false
                            feedWarehouse = false
                            cageWalkway = false
                            safeDisposal = false
                            trayDisinfected = false
                            waterSanitized = false
                            wildBird = false
                            notes = ""
                            activeTab = "history"
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp)
                            .height(52.dp)
                    ) {
                        Text("Simpan Pemeriksaan Biosekuriti")
                    }
                }
            }
        } else {
            // INSPECTIONS HISTORY LIST
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (checks.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Belum ada riwayat kepatuhan biosekuriti tercatat.", color = Color(0xFF94A3B8))
                        }
                    }
                } else {
                    items(checks) { check ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Tanggal: ${check.date}",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Color(0xFF0F172A)
                                    )
                                    Text(
                                        text = "Pemeriksa: ${check.inspectorName}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color(0xFF64748B)
                                    )
                                    if (check.notes.isNotEmpty()) {
                                        Text(
                                            text = "Temuan: ${check.notes}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }
                                
                                // Score circle badge
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = when {
                                        check.score >= 80 -> Color(0xFFD1FAE5)
                                        check.score >= 50 -> Color(0xFFFEF3C7)
                                        else -> Color(0xFFFEE2E2)
                                    }
                                ) {
                                    Text(
                                        text = "${check.score}%",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = when {
                                            check.score >= 80 -> Color(0xFF065F46)
                                            check.score >= 50 -> Color(0xFF92400E)
                                            else -> Color(0xFF991B1B)
                                        },
                                        modifier = Modifier.padding(horizontal = 12.dp, py = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
