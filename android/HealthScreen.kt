package com.example.layerfarm.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.layerfarm.data.VaccinationSchedule

@Composable
fun HealthScreen(
    viewModel: FarmViewModel,
    modifier: Modifier = Modifier
) {
    val vaccinations by viewModel.vaccinations.collectAsState()
    
    var activeSubSection by remember { mutableStateOf("list") } // "list" | "add"

    // Dialog Complete Vaccine parameters
    var showCompleteDialog by remember { mutableStateOf(false) }
    var selectedVacId by remember { mutableStateOf("") }
    var selectedVacName by remember { mutableStateOf("") }
    var actualDateInput by remember { mutableStateOf("2026-07-02") }
    var actualNotesInput by remember { mutableStateOf("") }

    // Add Form parameters
    var formVaccineName by remember { mutableStateOf("") }
    var formKandangName by remember { mutableStateOf("Kandang A") }
    var formPlannedDate by remember { mutableStateOf("2026-07-05") }
    var formMethod by remember { mutableStateOf("Air Minum") }
    var formAgeWeeks by remember { mutableStateOf("") }
    var formNotes by remember { mutableStateOf("") }
    
    val methodList = listOf("Air Minum", "Tetes Mata", "Suntik", "Spray")

    if (showCompleteDialog) {
        AlertDialog(
            onDismissRequest = { showCompleteDialog = false },
            title = { Text("Selesaikan Vaksinasi") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Konfirmasi penyelesaian vaksin $selectedVacName", style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(
                        value = actualDateInput,
                        onValueChange = { actualDateInput = it },
                        label = { Text("Tanggal Pelaksanaan Riil (YYYY-MM-DD)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = actualNotesInput,
                        onValueChange = { actualNotesInput = it },
                        label = { Text("Catatan Hasil / Efek Samping") },
                        placeholder = { Text("Semua aman, nafsu makan stabil...") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.completeVaccination(selectedVacId, actualDateInput, actualNotesInput)
                        showCompleteDialog = false
                    }
                ) {
                    Text("Konfirmasi Selesai")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCompleteDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        
        // Tab Navigation
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Vaksin & Kesehatan",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Kelola jadwal pencegahan penyakit ayam petelur.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )
            }
        }

        // Sub sections toggle
        TabRow(selectedTabIndex = if (activeSubSection == "list") 0 else 1) {
            Tab(
                selected = activeSubSection == "list",
                onClick = { activeSubSection = "list" },
                icon = { Icon(Icons.Default.List, contentDescription = "Daftar") },
                text = { Text("Jadwal Vaksin") }
            )
            Tab(
                selected = activeSubSection == "add",
                onClick = { activeSubSection = "add" },
                icon = { Icon(Icons.Default.Add, contentDescription = "Tambah") },
                text = { Text("Tambah Jadwal") }
            )
        }

        if (activeSubSection == "list") {
            // LIST VIEW WITH PENDING VS COMPLETED
            val pendingVax = vaccinations.filter { it.status == "Pending" }
            val completedVax = vaccinations.filter { it.status == "Completed" }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (pendingVax.isNotEmpty()) {
                    item {
                        Text(
                            text = "Menunggu Pelaksanaan (${pendingVax.size})",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color(0xFFF59E0B),
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                    items(pendingVax) { vac ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
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
                                        text = vac.vaccineName,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Color(0xFF0F172A)
                                    )
                                    Text(
                                        text = "Kandang: ${vac.kandangName} • Target Umur: ${vac.ageWeeks} mgg",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Color(0xFF64748B)
                                    )
                                    Text(
                                        text = "Direncanakan: ${vac.plannedDate} • Metode: ${vac.method}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFF10B981)
                                    )
                                    if (vac.notes.isNotEmpty()) {
                                        Text(
                                            text = "Note: ${vac.notes}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }
                                Button(
                                    onClick = {
                                        selectedVacId = vac.id
                                        selectedVacName = vac.vaccineName
                                        showCompleteDialog = true
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD1FAE5), contentColor = Color(0xFF047857)),
                                    modifier = Modifier.height(44.dp) // Accessibility targets
                                ) {
                                    Icon(Icons.Default.Check, contentDescription = "Selesai")
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Selesai")
                                }
                            }
                        }
                    }
                }

                if (completedVax.isNotEmpty()) {
                    item {
                        Text(
                            text = "Sudah Selesai (${completedVax.size})",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color(0xFF10B981),
                            modifier = Modifier.padding(vertical = 4.dp, top = 12.dp)
                        )
                    }
                    items(completedVax) { vac ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                            border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = vac.vaccineName,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Color(0xFF94A3B8)
                                )
                                Text(
                                    text = "Kandang: ${vac.kandangName} • Selesai: ${vac.actualDate}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF64748B)
                                )
                                if (vac.notes.isNotEmpty()) {
                                    Text(
                                        text = "Hasil: ${vac.notes}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFF64748B)
                                    )
                                }
                            }
                        }
                    }
                }

                if (pendingVax.isEmpty() && completedVax.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 40.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Belum ada jadwal vaksinasi terdaftar.", color = Color(0xFF94A3B8))
                        }
                    }
                }
            }
        } else {
            // FORM TAMBAH JADWAL
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = formVaccineName,
                    onValueChange = { formVaccineName = it },
                    label = { Text("Nama Vaksin") },
                    placeholder = { Text("ND-IB Clone, AI, Gumboro, dll.") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = formKandangName,
                    onValueChange = { formKandangName = it },
                    label = { Text("Target Kandang") },
                    placeholder = { Text("Kandang A") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = formPlannedDate,
                    onValueChange = { formPlannedDate = it },
                    label = { Text("Tanggal Rencana Pelaksanaan (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Metode drop select
                var expandMethods by remember { mutableStateOf(false) }
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = formMethod,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Metode Aplikasi") },
                        trailingIcon = {
                            IconButton(onClick = { expandMethods = true }) {
                                Icon(Icons.Default.Add, contentDescription = "Select")
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                    DropdownMenu(
                        expanded = expandMethods,
                        onDismissRequest = { expandMethods = false }
                    ) {
                        methodList.forEach { m ->
                            DropdownMenuItem(
                                text = { Text(m) },
                                onClick = {
                                    formMethod = m
                                    expandMethods = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = formAgeWeeks,
                    onValueChange = { formAgeWeeks = it },
                    label = { Text("Target Umur Ayam (Minggu)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = formNotes,
                    onValueChange = { formNotes = it },
                    label = { Text("Catatan Tambahan") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        val ageInt = formAgeWeeks.toIntOrNull() ?: 0
                        viewModel.addNewVaccinationSchedule(
                            vaccineName = formVaccineName,
                            kandangName = formKandangName,
                            plannedDate = formPlannedDate,
                            method = formMethod,
                            notes = formNotes,
                            ageWeeks = ageInt
                        )
                        // Reset form
                        formVaccineName = ""
                        formAgeWeeks = ""
                        formNotes = ""
                        activeSubSection = "list"
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    Text("Buat Jadwal Vaksin")
                }
            }
        }
    }
}
