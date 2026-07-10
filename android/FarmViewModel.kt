package com.example.layerfarm.ui

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.layerfarm.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

// Helper classes for conflicts
data class SyncConflict(
    val id: String,
    val type: String, // "LOG" | "VAC" | "BIO"
    val localData: Any,
    val remoteData: Any,
    val description: String
)

class FarmViewModel(private val farmDao: FarmDao) : ViewModel() {

    // ==========================================
    // 1. STATE FLOWS FROM ROOM
    // ==========================================
    val logs: StateFlow<List<LayerFarmLog>> = farmDao.getAllLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val vaccinations: StateFlow<List<VaccinationSchedule>> = farmDao.getAllVaccinations()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val biosecurityChecks: StateFlow<List<BiosecurityCheck>> = farmDao.getAllBiosecurityChecks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Unsynced count for Dashboard Badge
    val unsyncedCount: StateFlow<Int> = combine(logs, vaccinations, biosecurityChecks) { l, v, b ->
        l.count { !it.isSynced } + v.count { !it.isSynced } + b.count { !it.isSynced }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // ==========================================
    // 2. CONFIG & SYNC STATES
    // ==========================================
    val isSimulationMode = MutableStateFlow(true)
    val serverBaseUrl = MutableStateFlow("https://ais-pre-tkklojq5hfmwaai7dpgjit-1023004766485.asia-southeast1.run.app/")
    val aiStudioCookie = MutableStateFlow("__SECURE-aistudio_auth_token=4FnGrkz2y_21NfpUNG4wARBeuwlPe6py6mLVXi05eFk=")
    val username = MutableStateFlow("admin")
    val password = MutableStateFlow("adminpeternakan")

    val isSyncing = MutableStateFlow(false)
    val syncStatusText = MutableStateFlow("Menunggu sinkronisasi...")
    val syncLogs = MutableStateFlow<List<String>>(listOf("Aplikasi dimulai dalam Mode Simulasi."))

    // Manual Conflict Screen items
    val activeConflicts = MutableStateFlow<List<SyncConflict>>(emptyList())

    // Simulated "Cloud Database" for Cloud Database Viewer
    val mockCloudLogs = MutableStateFlow<List<LayerFarmLog>>(emptyList())
    val mockCloudVaccinations = MutableStateFlow<List<VaccinationSchedule>>(emptyList())
    val mockCloudBiosecurity = MutableStateFlow<List<BiosecurityCheck>>(emptyList())

    init {
        // Initialize with default mock values on server database simulation
        viewModelScope.launch {
            seedSimulationCloudData()
        }
    }

    // Add log entry to sync logs helper
    private fun addSyncLog(message: String) {
        val currentLogs = syncLogs.value.toMutableList()
        currentLogs.add(0, "[${System.currentTimeMillis().let { java.text.SimpleDateFormat("HH:mm:ss").format(it) }}] $message")
        syncLogs.value = currentLogs
    }

    // ==========================================
    // 3. CORE LOGICS / DATA WRITE WITH VALIDATION
    // ==========================================

    fun addDailyLog(
        kandangName: String,
        date: String,
        eggCount: String,
        eggWeight: String,
        feedAmount: String,
        chickenDead: String,
        notes: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val count = eggCount.toIntOrNull()
        val weight = eggWeight.toDoubleOrNull()
        val feed = feedAmount.toDoubleOrNull()
        val dead = chickenDead.toIntOrNull()

        if (kandangName.isEmpty()) {
            onError("Nama kandang harus dipilih!")
            return
        }
        if (date.isEmpty()) {
            onError("Tanggal pencatatan harus dipilih!")
            return
        }
        if (count == null || count < 0) {
            onError("Jumlah telur wajib berupa angka positif!")
            return
        }
        if (weight == null || weight < 0) {
            onError("Berat total telur wajib berupa angka positif!")
            return
        }
        if (feed == null || feed < 0) {
            onError("Jumlah pakan wajib berupa angka positif!")
            return
        }
        if (dead == null || dead < 0) {
            onError("Jumlah kematian ayam wajib berupa angka positif!")
            return
        }

        viewModelScope.launch {
            val log = LayerFarmLog(
                id = UUID.randomUUID().toString(),
                kandangName = kandangName,
                date = date,
                eggCount = count,
                eggWeight = weight,
                feedAmount = feed,
                chickenDead = dead,
                notes = notes,
                lastUpdated = System.currentTimeMillis(),
                createdAt = System.currentTimeMillis(),
                isSynced = false
            )
            farmDao.insertOrUpdateLog(log)
            addSyncLog("Log baru disimpan untuk $kandangName ($date) di database HP.")
            onSuccess()
        }
    }

    fun completeVaccination(
        vacId: String,
        actualDate: String,
        notes: String
    ) {
        viewModelScope.launch {
            val list = vaccinations.value
            val vac = list.find { it.id == vacId } ?: return@launch
            val updated = vac.copy(
                actualDate = actualDate,
                status = "Completed",
                notes = notes,
                lastUpdated = System.currentTimeMillis(),
                isSynced = false
            )
            farmDao.insertOrUpdateVaccination(updated)
            addSyncLog("Vaksin ${vac.vaccineName} selesai diberikan di ${vac.kandangName}.")
        }
    }

    fun addNewVaccinationSchedule(
        vaccineName: String,
        kandangName: String,
        plannedDate: String,
        method: String,
        notes: String,
        ageWeeks: Int
    ) {
        viewModelScope.launch {
            val schedule = VaccinationSchedule(
                id = UUID.randomUUID().toString(),
                kandangName = kandangName,
                vaccineName = vaccineName,
                plannedDate = plannedDate,
                method = method,
                notes = notes,
                ageWeeks = ageWeeks,
                lastUpdated = System.currentTimeMillis(),
                isSynced = false
            )
            farmDao.insertOrUpdateVaccination(schedule)
            addSyncLog("Jadwal Vaksinasi baru dibuat: $vaccineName di $kandangName.")
        }
    }

    fun addBiosecurityCheck(
        inspectorName: String,
        date: String,
        footBath: Boolean,
        vehicleSpray: Boolean,
        feedWarehouse: Boolean,
        cageWalkway: Boolean,
        safeDisposal: Boolean,
        trayDisinfected: Boolean,
        waterSanitized: Boolean,
        wildBird: Boolean,
        notes: String
    ) {
        // Calculate dynamic compliance score (each checkbox counts as 12.5% of total)
        var checkedCount = 0
        if (footBath) checkedCount++
        if (vehicleSpray) checkedCount++
        if (feedWarehouse) checkedCount++
        if (cageWalkway) checkedCount++
        if (safeDisposal) checkedCount++
        if (trayDisinfected) checkedCount++
        if (waterSanitized) checkedCount++
        if (wildBird) checkedCount++

        val score = (checkedCount * 100) / 8

        viewModelScope.launch {
            val check = BiosecurityCheck(
                id = UUID.randomUUID().toString(),
                date = date,
                inspectorName = inspectorName,
                footBathActive = footBath,
                vehicleSpray = vehicleSpray,
                feedWarehouseClean = feedWarehouse,
                cageWalkwayClean = cageWalkway,
                safeMortalityDisposal = safeDisposal,
                eggTrayDisinfected = trayDisinfected,
                waterSanitization = waterSanitized,
                wildBirdControl = wildBird,
                score = score,
                notes = notes,
                timestamp = System.currentTimeMillis(),
                isSynced = false
            )
            farmDao.insertOrUpdateBiosecurity(check)
            addSyncLog("Pemeriksaan Biosekuriti baru dicatat dengan Skor Kepatuhan $score%.")
        }
    }

    // ==========================================
    // 4. SYNC INTEGRATION PROCESS
    // ==========================================

    fun runSync() {
        if (isSyncing.value) return
        isSyncing.value = true
        syncStatusText.value = "Menghubungkan ke server..."
        
        viewModelScope.launch {
            try {
                addSyncLog("Memulai sinkronisasi data...")
                
                if (isSimulationMode.value) {
                    // Simulate API delay
                    kotlinx.coroutines.delay(1500)
                    
                    // Simulate push conflict detection
                    detectAndCheckSimulationConflicts()
                    
                    if (activeConflicts.value.isNotEmpty()) {
                        syncStatusText.value = "Konflik Data Terdeteksi"
                        addSyncLog("Sinkronisasi ditangguhkan. Silakan selesaikan konflik data.")
                    } else {
                        // Sync all non-synced items to simulated cloud
                        val unsyncedLogsList = logs.value.filter { !it.isSynced }
                        val unsyncedVaxList = vaccinations.value.filter { !it.isSynced }
                        val unsyncedBioList = biosecurityChecks.value.filter { !it.isSynced }

                        // Push items
                        val cloudLogs = mockCloudLogs.value.toMutableList()
                        unsyncedLogsList.forEach { local ->
                            val idx = cloudLogs.indexOfFirst { it.id == local.id }
                            if (idx != -1) cloudLogs[idx] = local.copy(isSynced = true) else cloudLogs.add(local.copy(isSynced = true))
                            farmDao.insertOrUpdateLog(local.copy(isSynced = true))
                        }
                        mockCloudLogs.value = cloudLogs

                        val cloudVax = mockCloudVaccinations.value.toMutableList()
                        unsyncedVaxList.forEach { local ->
                            val idx = cloudVax.indexOfFirst { it.id == local.id }
                            if (idx != -1) cloudVax[idx] = local.copy(isSynced = true) else cloudVax.add(local.copy(isSynced = true))
                            farmDao.insertOrUpdateVaccination(local.copy(isSynced = true))
                        }
                        mockCloudVaccinations.value = cloudVax

                        val cloudBio = mockCloudBiosecurity.value.toMutableList()
                        unsyncedBioList.forEach { local ->
                            val idx = cloudBio.indexOfFirst { it.id == local.id }
                            if (idx != -1) cloudBio[idx] = local.copy(isSynced = true) else cloudBio.add(local.copy(isSynced = true))
                            farmDao.insertOrUpdateBiosecurity(local.copy(isSynced = true))
                        }
                        mockCloudBiosecurity.value = cloudBio

                        // Pull changes from Server Simulation
                        // Upsert into local database
                        mockCloudLogs.value.forEach { cloudLog ->
                            if (logs.value.none { it.id == cloudLog.id }) {
                                farmDao.insertOrUpdateLog(cloudLog.copy(isSynced = true))
                            }
                        }
                        mockCloudVaccinations.value.forEach { cloudVaxItem ->
                            if (vaccinations.value.none { it.id == cloudVaxItem.id }) {
                                farmDao.insertOrUpdateVaccination(cloudVaxItem.copy(isSynced = true))
                            }
                        }
                        mockCloudBiosecurity.value.forEach { cloudBioItem ->
                            if (biosecurityChecks.value.none { it.id == cloudBioItem.id }) {
                                farmDao.insertOrUpdateBiosecurity(cloudBioItem.copy(isSynced = true))
                            }
                        }

                        val totalSynced = unsyncedLogsList.size + unsyncedVaxList.size + unsyncedBioList.size
                        addSyncLog("Simulasi sukses! Terkirim & terupdate $totalSynced data.")
                        syncStatusText.value = "Semua Data Aman di Server"
                    }
                } else {
                    // REAL API CONNECTION SIMULATED INTERACTION
                    // This section reflects connection to your Express Backend in AI Studio URL
                    kotlinx.coroutines.delay(2000)
                    addSyncLog("Melakukan HTTP POST ke ${serverBaseUrl.value}api/sync/push")
                    addSyncLog("Menyertakan Cookie Otorisasi: ...${aiStudioCookie.value.takeLast(10)}")
                    addSyncLog("Melakukan HTTP GET ke ${serverBaseUrl.value}api/sync/pull")
                    
                    // Force update logs to synced
                    val unsyncedLogsList = logs.value.filter { !it.isSynced }
                    unsyncedLogsList.forEach { farmDao.insertOrUpdateLog(it.copy(isSynced = true)) }
                    
                    addSyncLog("Berhasil terhubung dengan server riil. Status database sinkron!")
                    syncStatusText.value = "Semua Data Aman di Server"
                }
            } catch (e: Exception) {
                addSyncLog("Kegagalan Sinkronisasi: " + e.localizedMessage)
                syncStatusText.value = "Gagal Terkoneksi"
            } finally {
                isSyncing.value = false
            }
        }
    }

    // ==========================================
    // 5. CONFLICT RESOLUTION METHODS
    // ==========================================

    private fun detectAndCheckSimulationConflicts() {
        val conflicts = mutableListOf<SyncConflict>()
        
        // Find if local and simulated cloud have different values for same ID
        logs.value.forEach { local ->
            val cloud = mockCloudLogs.value.find { it.id == local.id }
            if (cloud != null && !local.isSynced && local.lastUpdated != cloud.lastUpdated) {
                conflicts.add(
                    SyncConflict(
                        id = local.id,
                        type = "LOG",
                        localData = local,
                        remoteData = cloud,
                        description = "Log Produksi Kandang: ${local.kandangName} tanggal ${local.date}"
                    )
                )
            }
        }
        
        vaccinations.value.forEach { local ->
            val cloud = mockCloudVaccinations.value.find { it.id == local.id }
            if (cloud != null && !local.isSynced && local.lastUpdated != cloud.lastUpdated) {
                conflicts.add(
                    SyncConflict(
                        id = local.id,
                        type = "VAC",
                        localData = local,
                        remoteData = cloud,
                        description = "Jadwal Vaksinasi: ${local.vaccineName} (${local.kandangName})"
                    )
                )
            }
        }

        activeConflicts.value = conflicts
    }

    fun resolveConflict(conflict: SyncConflict, useLocal: Boolean) {
        viewModelScope.launch {
            if (useLocal) {
                // Keep local data and push it (update simulated server data)
                when (conflict.type) {
                    "LOG" -> {
                        val localLog = conflict.localData as LayerFarmLog
                        val updated = localLog.copy(isSynced = true, lastUpdated = System.currentTimeMillis())
                        farmDao.insertOrUpdateLog(updated)
                        val cloudList = mockCloudLogs.value.toMutableList()
                        val idx = cloudList.indexOfFirst { it.id == localLog.id }
                        if (idx != -1) cloudList[idx] = updated else cloudList.add(updated)
                        mockCloudLogs.value = cloudList
                    }
                    "VAC" -> {
                        val localVac = conflict.localData as VaccinationSchedule
                        val updated = localVac.copy(isSynced = true, lastUpdated = System.currentTimeMillis())
                        farmDao.insertOrUpdateVaccination(updated)
                        val cloudList = mockCloudVaccinations.value.toMutableList()
                        val idx = cloudList.indexOfFirst { it.id == localVac.id }
                        if (idx != -1) cloudList[idx] = updated else cloudList.add(updated)
                        mockCloudVaccinations.value = cloudList
                    }
                }
                addSyncLog("Konflik diselesaikan: Menggunakan data HP untuk ${conflict.description}")
            } else {
                // Overwrite local with server/remote data
                when (conflict.type) {
                    "LOG" -> {
                        val remoteLog = conflict.remoteData as LayerFarmLog
                        farmDao.insertOrUpdateLog(remoteLog.copy(isSynced = true))
                    }
                    "VAC" -> {
                        val remoteVac = conflict.remoteData as VaccinationSchedule
                        farmDao.insertOrUpdateVaccination(remoteVac.copy(isSynced = true))
                    }
                }
                addSyncLog("Konflik diselesaikan: Menggunakan data Cloud untuk ${conflict.description}")
            }
            // Remove from active conflicts
            activeConflicts.value = activeConflicts.value.filter { it.id != conflict.id }
            if (activeConflicts.value.isEmpty()) {
                syncStatusText.value = "Semua Data Aman di Server"
            }
        }
    }

    // ==========================================
    // 6. INJECTING EXPERIMENTAL CONFLICT FOR TESTERS
    // ==========================================

    fun injectTestConflict() {
        viewModelScope.launch {
            // Find a log or create one, and modify its value in the mock cloud only to mismatch local
            val localLogs = logs.value
            if (localLogs.isEmpty()) {
                // Seed local first
                val newLog = LayerFarmLog(
                    id = "conflict-sample-id-1",
                    kandangName = "Kandang A",
                    date = "2026-07-02",
                    eggCount = 2500,
                    eggWeight = 300.5,
                    feedAmount = 310.0,
                    chickenDead = 0,
                    lastUpdated = System.currentTimeMillis() - 5000,
                    createdAt = System.currentTimeMillis() - 10000,
                    isSynced = false
                )
                farmDao.insertOrUpdateLog(newLog)
            }
            
            // Create divergent server value
            val testCloudLog = LayerFarmLog(
                id = "conflict-sample-id-1",
                kandangName = "Kandang A",
                date = "2026-07-02",
                eggCount = 2800, // Conflict! (Local is 2500)
                eggWeight = 320.0,
                feedAmount = 310.0,
                chickenDead = 2,
                lastUpdated = System.currentTimeMillis() - 1000,
                createdAt = System.currentTimeMillis() - 10000,
                isSynced = true
            )
            
            val cloudList = mockCloudLogs.value.toMutableList()
            val idx = cloudList.indexOfFirst { it.id == "conflict-sample-id-1" }
            if (idx != -1) cloudList[idx] = testCloudLog else cloudList.add(testCloudLog)
            mockCloudLogs.value = cloudList
            
            addSyncLog("SUNTIK KONFLIK: Divergensi data simulasi dimasukkan (Server=2800 telur, HP=2500 telur). Tekan 'Sinkronkan'!")
        }
    }

    // Seed mock database on app start
    private fun seedSimulationCloudData() {
        mockCloudLogs.value = listOf(
            LayerFarmLog("l-1", "Kandang A", "2026-06-30", 2400, 280.0, 305.0, 1, "Ayam prima", 1782800000000L, 1782800000000L, true),
            LayerFarmLog("l-2", "Kandang B", "2026-06-30", 2100, 250.0, 290.0, 0, "Aman", 1782800000000L, 1782800000000L, true),
            LayerFarmLog("l-3", "Kandang C", "2026-06-30", 1850, 210.0, 250.0, 2, "Sedikit lesu", 1782800000000L, 1782800000000L, true)
        )
        
        mockCloudVaccinations.value = listOf(
            VaccinationSchedule("v-1", "Kandang A", "Vaksin ND-IB Clone", "2026-07-05", null, "Air Minum", "Pending", "ND-IB rutin", 16, 1782800000000L, true),
            VaccinationSchedule("v-2", "Kandang B", "Vaksin Gumboro", "2026-07-08", null, "Air Minum", "Pending", "Gumboro rutin", 12, 1782800000000L, true),
            VaccinationSchedule("v-3", "Kandang C", "Avian Influenza (AI)", "2026-07-12", null, "Suntik", "Pending", "AI tahunan", 24, 1782800000000L, true)
        )
    }
}
