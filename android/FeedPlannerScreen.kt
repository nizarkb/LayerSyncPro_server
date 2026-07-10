package com.example.layerfarm.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedPlannerScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var chickenPopulation by remember { mutableStateOf("") }
    var targetFeedPerChickenByGrams by remember { mutableStateOf("110") } // standar 110 gram per ekor

    val population = chickenPopulation.toDoubleOrNull() ?: 0.0
    val feedPerChicken = targetFeedPerChickenByGrams.toDoubleOrNull() ?: 0.0

    // Calculations
    val totalFeedKg = (population * feedPerChicken) / 1000.0 // grams to kg
    val totalBagsOf50Kg = totalFeedKg / 50.0

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        
        // Header with Back arrow
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
                    text = "Perencana Pakan",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Alat hitung cepat kebutuhan pakan harian ayam.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Input Fields
        OutlinedTextField(
            value = chickenPopulation,
            onValueChange = { chickenPopulation = it },
            label = { Text("Jumlah Populasi Ayam Saat Ini (Ekor)") },
            placeholder = { Text("Misal: 3000") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = targetFeedPerChickenByGrams,
            onValueChange = { targetFeedPerChickenByGrams = it },
            label = { Text("Standar Pemberian Pakan per Ayam (Gram/Ekor/Hari)") },
            placeholder = { Text("Standar: 110") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Calculations Display Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "📊 ESTIMASI KEBUTUHAN PAKAN HARIAN",
                    style = MaterialTheme.typography.titleSmall,
                    color = Color(0xFF64748B)
                )

                // Row 1: Total Kilograms
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Total Berat Pakan:",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "${String.format("%.1f", totalFeedKg)} kg",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color(0xFF10B981)
                    )
                }

                // Row 2: Total Bags
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Total Karung Pakan (50kg):",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = "${String.format("%.1f", totalBagsOf50Kg)} Karung",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color(0xFFF59E0B)
                    )
                }

                Divider(color = Color(0xFFF1F5F9))

                // Detail Explanation
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Text("💡", style = MaterialTheme.typography.titleLarge)
                    Text(
                        text = "Rekomendasi takaran ini mengasumsikan ayam berumur produktif (layer aktif). " +
                                "Pastikan pakan terdistribusi merata di talang air dan wadah pakan kandang demi meminimalkan pakan tercecer.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B)
                    )
                }
            }
        }
    }
}
