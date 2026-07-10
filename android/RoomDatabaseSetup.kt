package com.example.layerfarm.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// ==========================================
// 1. ROOM ENTITIES
// ==========================================

@Entity(tableName = "layer_farm_logs")
data class LayerFarmLog(
    @PrimaryKey val id: String, // Use UUID.randomUUID().toString()
    val kandangName: String,
    val date: String, // format YYYY-MM-DD
    val eggCount: Int,
    val eggWeight: Double, // in kg
    val feedAmount: Double, // in kg
    val chickenDead: Int,
    val notes: String = "",
    val lastUpdated: Long, // timestamp
    val createdAt: Long, // timestamp
    val isSynced: Boolean = false // track synchronization status
)

@Entity(tableName = "vaccination_schedules")
data class VaccinationSchedule(
    @PrimaryKey val id: String,
    val kandangName: String,
    val vaccineName: String,
    val plannedDate: String, // YYYY-MM-DD
    val actualDate: String? = null, // YYYY-MM-DD or null
    val method: String, // e.g., "Air Minum", "Suntik", "Tetes Mata", "Spray"
    val status: String = "Pending", // "Pending" or "Completed"
    val notes: String = "",
    val ageWeeks: Int,
    val lastUpdated: Long,
    val isSynced: Boolean = false
)

@Entity(tableName = "biosecurity_checks")
data class BiosecurityCheck(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val inspectorName: String,
    val footBathActive: Boolean,
    val vehicleSpray: Boolean,
    val feedWarehouseClean: Boolean,
    val cageWalkwayClean: Boolean,
    val safeMortalityDisposal: Boolean,
    val eggTrayDisinfected: Boolean,
    val waterSanitization: Boolean,
    val wildBirdControl: Boolean,
    val score: Int, // 0 - 100
    val notes: String = "",
    val timestamp: Long,
    val isSynced: Boolean = false
)

// ==========================================
// 2. ROOM DAOS
// ==========================================

@Dao
interface FarmDao {
    // Log harian
    @Query("SELECT * FROM layer_farm_logs ORDER BY date DESC")
    fun getAllLogs(): Flow<List<LayerFarmLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateLog(log: LayerFarmLog)

    @Query("SELECT * FROM layer_farm_logs WHERE isSynced = 0")
    suspend fun getUnsyncedLogs(): List<LayerFarmLog>

    @Query("UPDATE layer_farm_logs SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markLogsSynced(ids: List<String>)

    // Jadwal Vaksinasi
    @Query("SELECT * FROM vaccination_schedules ORDER BY plannedDate ASC")
    fun getAllVaccinations(): Flow<List<VaccinationSchedule>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateVaccination(vac: VaccinationSchedule)

    @Query("SELECT * FROM vaccination_schedules WHERE isSynced = 0")
    suspend fun getUnsyncedVaccinations(): List<VaccinationSchedule>

    @Query("UPDATE vaccination_schedules SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markVaccinationsSynced(ids: List<String>)

    // Checklist Biosecurity
    @Query("SELECT * FROM biosecurity_checks ORDER BY date DESC")
    fun getAllBiosecurityChecks(): Flow<List<BiosecurityCheck>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateBiosecurity(check: BiosecurityCheck)

    @Query("SELECT * FROM biosecurity_checks WHERE isSynced = 0")
    suspend fun getUnsyncedBiosecurity(): List<BiosecurityCheck>

    @Query("UPDATE biosecurity_checks SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markBiosecuritySynced(ids: List<String>)
}

// ==========================================
// 3. DATABASE SETUP
// ==========================================

@Database(
    entities = [LayerFarmLog::class, VaccinationSchedule::class, BiosecurityCheck::class],
    version = 1,
    exportSchema = false
)
abstract class FarmDatabase : RoomDatabase() {
    abstract fun farmDao(): FarmDao
}
