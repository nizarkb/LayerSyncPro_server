package com.example.layerfarm.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import com.example.layerfarm.data.LayerFarmLog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SyncScreen(
    viewModel: FarmViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isSimulationMode by viewModel.isSimulationMode.collectAsState()
    val serverBaseUrl by viewModel.serverBaseUrl.collectAsState()
    val aiStudioCookie by viewModel.aiStudioCookie.collectAsState()
    val username by viewModel.username.collectAsState()
    val password by viewModel.password.collectAsState()
    
    val isSyncing by viewModel.isSyncing.collectAsState()
    val syncStatusText by viewModel.syncStatusText.collectAsState()
    val syncLogs by viewModel.syncLogs.collectAsState()
    val activeConflicts by viewModel.activeConflicts.collectAsState()

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
                    text = "Sinkronisasi & Server",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = "Konfigurasi konektivitas server & sinkronisasi data.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )
            }
        }

        // ==========================================
        // 1. CONNECTION MODE SWITCH (Bullet Point G)
        // ==========================================
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
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
                        text = if (isSimulationMode) "Mode Simulasi Aktif" else "Mode Real Server Aktif",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        text = if (isSimulationMode) "Data disinkronkan ke database simulasi memori lokal." else "Aplikasi terhubung langsung ke API Server produksi.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B)
                    )
                }
                Switch(
                    checked = !isSimulationMode,
                    onCheckedChange = { viewModel.isSimulationMode.value = !it },
                    colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF10B981))
                )
            }
        }

        // ==========================================
        // 2. CONFIGURATION FIELDS (Bullet Point G)
        // ==========================================
        if (!isSimulationMode) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Parameter Koneksi Server",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF0F172A)
                    )

                    OutlinedTextField(
                        value = serverBaseUrl,
                        onValueChange = { viewModel.serverBaseUrl.value = it },
                        label = { Text("Server Base URL") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = aiStudioCookie,
                        onValueChange = { viewModel.aiStudioCookie.value = it },
                        label = { Text("Cookie Otorisasi AI Studio (Dev / Preview)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = username,
                            onValueChange = { viewModel.username.value = it },
                            label = { Text("Username") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = password,
                            onValueChange = { viewModel.password.value = it },
                            label = { Text("Password") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // ==========================================
        // 3. SYNC ACTIONS (Bullet Point G)
        // ==========================================
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = { viewModel.runSync() },
                enabled = !isSyncing,
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
            ) {
                if (isSyncing) {
                    CircularProgressIndicator(
                        color = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Icon(Icons.Default.Refresh, contentDescription = "Sinkronkan")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sinkronkan Sekarang")
                }
            }
        }

        // Status description
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = Color(0xFFF1F5F9),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "Status Sinkronisasi: $syncStatusText",
                style = MaterialTheme.typography.bodyMedium,
                color = Color(0xFF0F172A),
                modifier = Modifier.padding(12.dp)
            )
        }

        // ==========================================
        // 4. CONFLICT RESOLUTION OVERLAYS (Bullet Point G)
        // ==========================================
        if (activeConflicts.isNotEmpty()) {
            Text(
                text = "Konflik Data Terdeteksi (${activeConflicts.size})",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFFEF4444)
            )
            
            activeConflicts.forEach { conflict ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F2)),
                    border = BorderStroke(1.dp, Color(0xFFFECDD3)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = conflict.description,
                            style = MaterialTheme.typography.titleMedium,
                            color = Color(0xFF9F1239)
                        )

                        // SIDE BY SIDE COMPARISON
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Local HP Box
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = BorderStroke(1.dp, Color(0xFFFDA4AF)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text("DATA HP (LOKAL)", style = MaterialTheme.typography.labelSmall, color = Color(0xFFEF4444))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    when (conflict.type) {
                                        "LOG" -> {
                                            val localLog = conflict.localData as LayerFarmLog
                                            Text("Telur: ${localLog.eggCount} butir", style = MaterialTheme.typography.bodyMedium)
                                            Text("Berat: ${localLog.eggWeight} kg", style = MaterialTheme.typography.bodyMedium)
                                            Text("Kematian: ${localLog.chickenDead} ekor", style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                }
                            }

                            // Remote Cloud Box
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = BorderStroke(1.dp, Color(0xFF93C5FD)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text("DATA CLOUD (REMOTE)", style = MaterialTheme.typography.labelSmall, color = Color(0xFF3B82F6))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    when (conflict.type) {
                                        "LOG" -> {
                                            val remoteLog = conflict.remoteData as LayerFarmLog
                                            Text("Telur: ${remoteLog.eggCount} butir", style = MaterialTheme.typography.bodyMedium)
                                            Text("Berat: ${remoteLog.eggWeight} kg", style = MaterialTheme.typography.bodyMedium)
                                            Text("Kematian: ${remoteLog.chickenDead} ekor", style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                }
                            }
                        }

                        // Action options
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { viewModel.resolveConflict(conflict, useLocal = true) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Gunakan Data HP")
                            }
                            Button(
                                onClick = { viewModel.resolveConflict(conflict, useLocal = false) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Gunakan Data Cloud")
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // 5. CLOUD DATABASE VIEWER / INJECTOR (Bullet Point G)
        // ==========================================
        if (isSimulationMode) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                border = BorderStroke(1.dp, Color(0xFFBBF7D0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "🛠️ Cloud Database Viewer & Sim Konflik",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color(0xFF15803D)
                    )
                    Text(
                        text = "Suntikkan percabangan / divergensi data cloud untuk menguji layar Resolusi Konflik Manual harian.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF166534)
                    )
                    Button(
                        onClick = { viewModel.injectTestConflict() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Suntik Konflik Simulasi")
                    }
                }
            }
        }

        // ==========================================
        // 6. SYNC LOGGER SEGMENT (Bullet Point G)
        // ==========================================
        Text(
            text = "Log Aktivitas Sinkronisasi",
            style = MaterialTheme.typography.titleMedium,
            color = Color(0xFF0F172A)
        )
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = Color(0xFF0F172A),
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(14.dp)
                    .fillMaxSize()
            ) {
                Text(
                    text = "TERMINAL LOGS:",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF94A3B8)
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                Box(modifier = Modifier.fillMaxSize()) {
                    val logsText = syncLogs.joinToString("\n")
                    Text(
                        text = logsText,
                        color = Color(0xFF10B981),
                        fontFamily = FontFamily.Monospace,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}
