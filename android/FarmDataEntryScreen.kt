package com.example.layerfarm.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmDataEntryScreen(
    viewModel: FarmViewModel,
    modifier: Modifier = Modifier
) {
    var kandangName by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("2026-07-02") }
    var eggCount by remember { mutableStateOf("") }
    var eggWeight by remember { mutableStateOf("") }
    var feedAmount by remember { mutableStateOf("") }
    var chickenDead by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    // Dropdown control states
    var isKandangMenuExpanded by remember { mutableStateOf(false) }
    val kandangList = listOf("Kandang A", "Kandang B", "Kandang C", "Kandang D")

    // Error messages and Dialog states
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Pencatatan Harian",
            style = MaterialTheme.typography.headlineMedium,
            color = Color(0xFF0F172A)
        )
        Text(
            text = "Silakan masukkan log harian produksi dan pakan kandang secara rinci.",
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF64748B)
        )

        Spacer(modifier = Modifier.height(4.dp))

        // ==========================================
        // 1. DROPDOWN PILIHAN KANDANG
        // ==========================================
        Box(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = kandangName,
                onValueChange = {},
                readOnly = true,
                label = { Text("Pilih Kandang") },
                trailingIcon = {
                    IconButton(onClick = { isKandangMenuExpanded = true }) {
                        Icon(Icons.Default.ArrowDropDown, contentDescription = "Buka Pilihan")
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isKandangMenuExpanded = true }
            )
            DropdownMenu(
                expanded = isKandangMenuExpanded,
                onDismissRequest = { isKandangMenuExpanded = false },
                modifier = Modifier.fillMaxWidth(0.9f)
            ) {
                kandangList.forEach { name ->
                    DropdownMenuItem(
                        text = { Text(name, style = MaterialTheme.typography.bodyLarge) },
                        onClick = {
                            kandangName = name
                            isKandangMenuExpanded = false
                        }
                    )
                }
            }
        }

        // ==========================================
        // 2. TANGGAL LOG
        // ==========================================
        OutlinedTextField(
            value = date,
            onValueChange = { date = it },
            label = { Text("Tanggal Pencatatan (YYYY-MM-DD)") },
            placeholder = { Text("YYYY-MM-DD") },
            trailingIcon = { Icon(Icons.Default.DateRange, contentDescription = "Kalender") },
            modifier = Modifier.fillMaxWidth()
        )

        // ==========================================
        // 3. FORM PRODUKSI TELUR
        // ==========================================
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "🥚 Produksi Telur",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFF047857)
                )
                
                OutlinedTextField(
                    value = eggCount,
                    onValueChange = { eggCount = it },
                    label = { Text("Jumlah Telur (Butir)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = eggWeight,
                    onValueChange = { eggWeight = it },
                    label = { Text("Total Berat Telur (kg)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // ==========================================
        // 4. FORM KONSUMSI PAKAN & KEMATIAN
        // ==========================================
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "🌾 Pakan & Populasi",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFF047857)
                )

                OutlinedTextField(
                    value = feedAmount,
                    onValueChange = { feedAmount = it },
                    label = { Text("Jumlah Pakan Diberikan (kg)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = chickenDead,
                    onValueChange = { chickenDead = it },
                    label = { Text("Ayam Mati (Ekor)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // ==========================================
        // 5. CATATAN / NOTES
        // ==========================================
        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("Catatan / Kondisi Khusus") },
            placeholder = { Text("Misal: Suhu kandang panas, pakan diganti merk...") },
            minLines = 3,
            modifier = Modifier.fillMaxWidth()
        )

        // Display Alerts
        errorMessage?.let {
            Text(
                text = "⚠️ $it",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }

        successMessage?.let {
            Text(
                text = "✅ $it",
                color = Color(0xFF057857),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }

        // ==========================================
        // 6. SIMPAN BUTTON
        // ==========================================
        Button(
            onClick = {
                errorMessage = null
                successMessage = null
                viewModel.addDailyLog(
                    kandangName = kandangName,
                    date = date,
                    eggCount = eggCount,
                    eggWeight = eggWeight,
                    feedAmount = feedAmount,
                    chickenDead = chickenDead,
                    notes = notes,
                    onSuccess = {
                        successMessage = "Berhasil mencatatkan log harian ke database lokal!"
                        // Clear inputs
                        eggCount = ""
                        eggWeight = ""
                        feedAmount = ""
                        chickenDead = ""
                        notes = ""
                    },
                    onError = { err ->
                        errorMessage = err
                    }
                )
            },
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Text("Simpan Log Kandang", style = MaterialTheme.typography.titleMedium)
        }
    }
}
