# Panduan Integrasi Android & Server (Sistem Manajemen Peternakan Layer)

Dokumen ini berisi panduan teknis lengkap untuk mengintegrasikan aplikasi Android (dikembangkan di Google AI Studio) dengan backend server Node.js/Express. 

Panduan ini menggunakan pendekatan **Offline-First dengan Sinkronisasi Berbasis Timestamp**, memungkinkan aplikasi Android tetap dapat mencatat data di kandang (meski tanpa sinyal internet) dan melakukan sinkronisasi dua arah saat terhubung kembali ke internet.

---

## 1. Arsitektur Komunikasi & Keamanan

### A. Autentikasi JWT (JSON Web Token)
Sebagian besar API endpoint dilindungi menggunakan middleware JWT.
1. Android mengirim request Login (`POST /api/auth/login`) dengan kredensial (`username` dan `password`).
2. Server merespon dengan membawa objek `user` dan string `token` (JWT).
3. Android harus menyimpan string `token` tersebut di **EncryptedSharedPreferences** atau **DataStore**.
4. Untuk setiap request berikutnya yang membutuhkan autentikasi, Android wajib menyertakan header:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```

### B. Keamanan Tambahan di Lingkungan Google AI Studio (PENTING!)
Saat melakukan pengujian menggunakan URL development AI Studio (`ais-dev-...`), sistem reverse proxy nginx AI Studio memproteksi akses luar.
Agar aplikasi Android Anda bisa melakukan "hit" ke server ini selama masa development, Anda **wajib** menyertakan cookie proteksi AI Studio di header setiap request:
```http
Cookie: __SECURE-aistudio_auth_token=<TOKEN_COOKIES_ANDA>
```
*Catatan: Cookie ini hanya diperlukan saat pengujian di URL development (`ais-dev-...`). Saat aplikasi server dideploy ke produksi (shared atau custom URL), header Cookie ini tidak lagi diperlukan.*

---

## 2. Struktur Model Data (Kotlin)

Sesuaikan model data berikut di project Android Anda (disarankan menggunakan library Gson atau Kotlinx Serialization):

```kotlin
import com.google.gson.annotations.SerializedName

// 1. Model Log Kandang (LayerFarmLog)
data class LayerFarmLog(
    @SerializedName("id") val id: String, // Gunakan UUID di Android untuk mencegah duplikasi (e.g., UUID.randomUUID().toString())
    @SerializedName("kandangName") val kandangName: String,
    @SerializedName("date") val date: String, // Format: YYYY-MM-DD
    @SerializedName("eggCount") val eggCount: Int,
    @SerializedName("eggWeight") val eggWeight: Double, // dalam kg
    @SerializedName("feedAmount") val feedAmount: Double, // dalam kg
    @SerializedName("chickenDead") val chickenDead: Int,
    @SerializedName("notes") val notes: String,
    @SerializedName("lastUpdated") val lastUpdated: Long, // Epoch timestamp milidetik
    @SerializedName("createdAt") val createdAt: Long // Epoch timestamp milidetik
)

// 2. Model Jadwal Vaksinasi (VaccinationSchedule)
data class VaccinationSchedule(
    @SerializedName("id") val id: String,
    @SerializedName("kandangName") val kandangName: String,
    @SerializedName("vaccineName") val vaccineName: String,
    @SerializedName("plannedDate") val plannedDate: String, // YYYY-MM-DD
    @SerializedName("actualDate") val actualDate: String?, // YYYY-MM-DD atau null jika belum divaksin
    @SerializedName("method") val method: String, // e.g., "Air Minum", "Suntik"
    @SerializedName("status") val status: String, // "Pending" atau "Completed"
    @SerializedName("notes") val notes: String,
    @SerializedName("ageWeeks") val ageWeeks: Int,
    @SerializedName("lastUpdated") val lastUpdated: Long
)

// 3. Model Checklist Biosekuriti (BiosecurityCheck)
data class BiosecurityCheck(
    @SerializedName("id") val id: String,
    @SerializedName("date") val date: String, // YYYY-MM-DD
    @SerializedName("inspectorName") val inspectorName: String,
    @SerializedName("footBathActive") val footBathActive: Boolean,
    @SerializedName("vehicleSpray") val vehicleSpray: Boolean,
    @SerializedName("feedWarehouseClean") val feedWarehouseClean: Boolean,
    @SerializedName("cageWalkwayClean") val cageWalkwayClean: Boolean,
    @SerializedName("safeMortalityDisposal") val safeMortalityDisposal: Boolean,
    @SerializedName("eggTrayDisinfected") val eggTrayDisinfected: Boolean,
    @SerializedName("waterSanitization") val waterSanitization: Boolean,
    @SerializedName("wildBirdControl") val wildBirdControl: Boolean,
    @SerializedName("score") val score: Int, // 0 - 100
    @SerializedName("notes") val notes: String,
    @SerializedName("timestamp") val timestamp: Long // Epoch timestamp milidetik
)

// 4. Model Catatan Penjualan (SalesRecord)
data class SalesRecord(
    @SerializedName("id") val id: String, // ID Transaksi unik (disarankan UUID dari Android jika input offline)
    @SerializedName("date") val date: String, // Format: YYYY-MM-DD
    @SerializedName("category") val category: String, // "egg" (Telur), "chicken" (Ayam Afkir), "manure" (Pupuk Kascing), "other" (Lainnya)
    @SerializedName("quantity") val quantity: Double,
    @SerializedName("unit") val unit: String, // "butir", "kg", "ekor", "karung", dll
    @SerializedName("unitPrice") val unitPrice: Double, // Harga Satuan (Rp)
    @SerializedName("totalPrice") val totalPrice: Double, // Otomatis dihitung di server: quantity * unitPrice
    @SerializedName("buyerName") val buyerName: String, // Nama Pembeli/Pelanggan
    @SerializedName("paymentStatus") val paymentStatus: String, // "paid" (Lunas) atau "unpaid" (Belum Lunas)
    @SerializedName("notes") val notes: String, // Catatan tambahan
    @SerializedName("lastUpdated") val lastUpdated: Long, // Epoch timestamp milidetik
    @SerializedName("createdAt") val createdAt: Long // Epoch timestamp milidetik
)
```

### Model Payload untuk Sinkronisasi

```kotlin
// Request Payload untuk melakukan PUSH ke server
data class SyncPushPayload(
    @SerializedName("logs") val logs: List<LayerFarmLog>,
    @SerializedName("vaccinations") val vaccinations: List<VaccinationSchedule>,
    @SerializedName("biosecurity") val biosecurity: List<BiosecurityCheck>
)

// Response Payload setelah melakukan PUSH ke server
data class SyncPushResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String,
    @SerializedName("syncedIds") val syncedIds: List<String>
)

// Response Payload saat melakukan PULL dari server
data class SyncPullResponse(
    @SerializedName("logs") val logs: List<LayerFarmLog>,
    @SerializedName("vaccinations") val vaccinations: List<VaccinationSchedule>,
    @SerializedName("biosecurity") val biosecurity: List<BiosecurityCheck>,
    @SerializedName("serverTimestamp") val serverTimestamp: Long
)
```

---

## 3. Retrofit API Service Interface (Kotlin)

Buat interface berikut untuk mendefinisikan komunikasi API Retrofit:

```kotlin
import retrofit2.Response
import retrofit2.http.*

interface FarmApiService {

    // ------------------------------------------
    // AUTHENTICATION ENDPOINTS
    // ------------------------------------------
    
    @POST("api/auth/login")
    suspend fun login(
        @Body credentials: Map<String, String> // Kirim {"username": "admin", "password": "..."}
    ): Response<Map<String, Any>> // Mengembalikan token dan data user

    @GET("api/auth/me")
    suspend fun getProfile(
        @Header("Authorization") bearerToken: String
    ): Response<Map<String, Any>>

    // ------------------------------------------
    // SYNC ENDPOINTS (Core Offline-First)
    // ------------------------------------------

    /**
     * PUSH: Mengirimkan data lokal Android yang baru dibuat/diubah ke server
     */
    @POST("api/sync/push")
    suspend fun pushData(
        @Header("Authorization") bearerToken: String,
        @Body payload: SyncPushPayload
    ): Response<SyncPushResponse>

    /**
     * PULL: Mengunduh data terbaru dari server yang dibuat/diubah setelah timestamp tertentu
     * @param lastSyncTimestamp Timestamp terakhir kali Android sukses melakukan sync (dalam milidetik)
     */
    @GET("api/sync/pull")
    suspend fun pullData(
        @Header("Authorization") bearerToken: String,
        @Query("lastSyncTimestamp") lastSyncTimestamp: Long
    ): Response<SyncPullResponse>

    // ------------------------------------------
    // SALES MANAGEMENT ENDPOINTS
    // ------------------------------------------

    /**
     * Mengambil daftar catatan penjualan pengguna.
     */
    @GET("api/sales")
    suspend fun getSalesRecords(
        @Header("Authorization") bearerToken: String
    ): Response<List<SalesRecord>>

    /**
     * Membuat catatan penjualan baru.
     * PENTING: Jika kategori "egg" (telur) dan satuan "butir", server secara otomatis
     * akan mengurangi stok telur segar di gudang sebanyak kuantitas penjualan.
     */
    @POST("api/sales")
    suspend fun createSalesRecord(
        @Header("Authorization") bearerToken: String,
        @Body record: Map<String, Any>
    ): Response<Map<String, Any>>

    /**
     * Memperbarui catatan penjualan yang sudah ada.
     * Server secara cerdas mengkoreksi selisih kuantitas untuk memperbarui stok telur segar jika sesuai.
     */
    @PUT("api/sales/{id}")
    suspend fun updateSalesRecord(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String,
        @Body record: Map<String, Any>
    ): Response<Map<String, Any>>

    /**
     * Menghapus catatan penjualan.
     * Jika penjualan sebelumnya otomatis memotong stok telur segar, menghapus data ini
     * akan mengembalikan kuantitas telur tersebut kembali ke stok gudang.
     */
    @DELETE("api/sales/{id}")
    suspend fun deleteSalesRecord(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String
    ): Response<Map<String, Any>>
}
```

---

## 4. Strategi Sinkronisasi Offline-First

Untuk membuat aplikasi Android berjalan secara offline dan bisa sinkron saat online:

1. **Gunakan Room Database di Android** sebagai penyimpanan lokal utama.
2. Saat user membuat log, jadwal, atau checklist biosekuriti baru:
   - Buat ID unik menggunakan UUID di sisi Android: `id = UUID.randomUUID().toString()`.
   - Set atribut `lastUpdated` dengan waktu saat ini: `System.currentTimeMillis()`.
   - Simpan langsung ke Room DB lokal secara instan. UI langsung ter-update dari DB lokal.
3. **Simpan status sinkronisasi lokal**:
   - Gunakan `SharedPreferences` untuk menyimpan variabel `last_sync_timestamp` (tipe `Long`, default `0L`).
4. **Alur Proses Sinkronisasi (Sync Job)**:
   Saat perangkat mendeteksi koneksi internet (atau saat tombol "Sinkronkan" ditekan):
   
   **Langkah A: PUSH (Kirim Perubahan Lokal ke Server)**
   - Ambil semua data di Room DB lokal yang memiliki `lastUpdated > last_sync_timestamp`.
   - Jika ada data baru/diubah, bungkus ke dalam `SyncPushPayload` dan lakukan POST ke `/api/sync/push`.
   - Jika response sukses, tandai id yang berhasil disinkronkan.
   
   **Langkah B: PULL (Ambil Perubahan Server ke Lokal)**
   - Lakukan GET ke `/api/sync/pull?lastSyncTimestamp=<last_sync_timestamp>`.
   - Server akan mengembalikan semua data yang memiliki waktu modifikasi lebih baru dibanding timestamp tersebut.
   - Masukkan/Update (`upsert`) data yang diterima dari server ke dalam Room DB lokal.
   - Ambil `serverTimestamp` dari response server, lalu simpan nilai ini sebagai `last_sync_timestamp` baru di `SharedPreferences`.

---

## 5. Implementasi Retrofit Client dengan Deteksi Dev Environment (Kotlin)

Berikut adalah template pembuatan **Retrofit Client** yang otomatis menyertakan token JWT dan cookie proxy Google AI Studio selama masa development:

```kotlin
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    // Ganti dengan URL Development atau Production Anda
    private const val BASE_URL = "https://ais-dev-tkklojq5hfmwaai7dpgjit-1023004766485.asia-southeast1.run.app/"
    
    // Cookie AI Studio untuk mem-bypass otorisasi proxy (Wajib diisi di fase dev)
    private const val AI_STUDIO_AUTH_COOKIE = "__SECURE-aistudio_auth_token=4FnGrkz2y_21NfpUNG4wARBeuwlPe6py6mLVXi05eFk="

    private var jwtToken: String? = null

    // Fungsi untuk menset token JWT setelah sukses login
    fun setToken(token: String) {
        this.jwtToken = token
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val originalRequest = chain.request()
                val requestBuilder = originalRequest.newBuilder()

                // 1. Otomatis tambahkan Cookie Proxy AI Studio (Hanya untuk testing dev URL)
                if (BASE_URL.contains("ais-dev") || BASE_URL.contains("ais-pre")) {
                    requestBuilder.addHeader("Cookie", AI_STUDIO_AUTH_COOKIE)
                }

                // 2. Otomatis tambahkan Bearer Token jika user sudah login
                jwtToken?.let { token ->
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }

                requestBuilder.addHeader("Content-Type", "application/json")
                requestBuilder.addHeader("Accept", "application/json")

                chain.proceed(requestBuilder.build())
            }
            .build()
    }

    val apiService: FarmApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(FarmApiService::class.java)
    }
}
```

---

## 6. Contoh Pemanggilan API Login & Sinkronisasi di Android

```kotlin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.lang.Exception

class SyncManager(private val db: MyLocalRoomDatabase) {

    fun doLoginAndSync() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // 1. Eksekusi Login
                val credentials = mapOf("username" to "admin", "password" to "adminpeternakan")
                val loginResponse = RetrofitClient.apiService.login(credentials)
                
                if (loginResponse.isSuccessful && loginResponse.body() != null) {
                    val responseData = loginResponse.body()!!
                    val token = responseData["token"] as String
                    
                    // Simpan token ke client
                    RetrofitClient.setToken(token)
                    println("Login sukses! Token didapatkan.")

                    // 2. Lakukan Sinkronisasi Offline-First
                    startSyncProcess()
                } else {
                    println("Login gagal: ${loginResponse.message()}")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private suspend fun startSyncProcess() {
        val sharedPrefs = MyApp.context.getSharedPreferences("sync_prefs", 0)
        val lastSync = sharedPrefs.getLong("last_sync_timestamp", 0L)

        // --- LANGKAH A: PUSH ---
        // Ambil data lokal yang diubah setelah lastSync
        val unsyncedLogs = db.logDao().getLogsUpdatedAfter(lastSync)
        val unsyncedVac = db.vaccinationDao().getVaccinationsUpdatedAfter(lastSync)
        val unsyncedBio = db.biosecurityDao().getBiosecurityUpdatedAfter(lastSync)

        if (unsyncedLogs.isNotEmpty() || unsyncedVac.isNotEmpty() || unsyncedBio.isNotEmpty()) {
            val payload = SyncPushPayload(unsyncedLogs, unsyncedVac, unsyncedBio)
            val pushResponse = RetrofitClient.apiService.pushData(payload)
            if (pushResponse.isSuccessful) {
                println("Push berhasil disinkronkan ke server: ${pushResponse.body()?.message}")
            }
        }

        // --- LANGKAH B: PULL ---
        val pullResponse = RetrofitClient.apiService.pullData(lastSync)
        if (pullResponse.isSuccessful && pullResponse.body() != null) {
            val serverData = pullResponse.body()!!

            // Simpan data baru dari server ke Room DB lokal
            if (serverData.logs.isNotEmpty()) {
                db.logDao().insertOrUpdateAll(serverData.logs)
            }
            if (serverData.vaccinations.isNotEmpty()) {
                db.vaccinationDao().insertOrUpdateAll(serverData.vaccinations)
            }
            if (serverData.biosecurity.isNotEmpty()) {
                db.biosecurityDao().insertOrUpdateAll(serverData.biosecurity)
            }

            // Simpan timestamp server terbaru sebagai acuan sync berikutnya
            sharedPrefs.edit()
                .putLong("last_sync_timestamp", serverData.serverTimestamp)
                .apply()

            println("Sinkronisasi dua arah selesai dengan sukses pada timestamp: ${serverData.serverTimestamp}")
        }
    }
}
```

---

## 7. Integrasi Logika Bisnis & Fitur Catatan Penjualan Baru

Kami telah menambahkan fitur **Catatan Penjualan** (penjualan telur, ayam afkir, pupuk kascing, dll.) yang terintegrasi secara cerdas dengan **Manajemen Stok**.

### Aturan Integrasi Stok Otomatis (Sisi Android Wajib Mengetahui!)

Sistem backend server menerapkan aturan cerdas berikut untuk mencegah anomali data:

1. **Auto-Deduct (Hanya Satuan "butir"):**
   - Jika pengguna mencatat penjualan dengan kategori `egg` (telur) dan memasukkan satuan `butir` (case-insensitive, e.g. "butir", "Butir", "BUTIR"), server akan **mengurangi stok telur segar** di gudang secara otomatis sejumlah kuantitas penjualan tersebut.
   - Jika pengguna mencatat dengan satuan lain seperti `kg`, `peti`, atau `tray`, server **TIDAK** akan memotong stok otomatis. Ini dilakukan untuk menghindari kesalahan konversi tak terstandar yang memicu anomali stok. Sebagai gantinya, aplikasi Android harus menginstruksikan pengguna untuk mencatat pengurangan stok secara manual di modul Manajemen Stok.

2. **Koreksi Pintar saat Update/Delete:**
   - **Update Kuantitas:** Jika kuantitas penjualan telur (satuan 'butir') diubah, server secara dinamis menghitung selisih (`kuantitas_baru - kuantitas_lama`) dan menyesuaikan stok telur segar di gudang (membuat transaksi masuk atau keluar baru di kartu stok).
   - **Update Kategori/Satuan:** Jika kategori diubah dari telur ke lainnya, atau satuan diganti dari 'butir' ke 'kg', server otomatis mengembalikan kuantitas telur yang terlanjur dipotong sebelumnya kembali ke gudang. Sebaliknya, jika satuan diganti menjadi 'butir', server akan otomatis memotong stok telur.
   - **Delete Transaksi:** Jika catatan transaksi penjualan dihapus, server akan otomatis membatalkan pemotongan stok dengan melakukan transaksi masuk kembali ke gudang sejumlah kuantitas transaksi yang dihapus.

### Panduan Tampilan UI Android untuk Catatan Penjualan
- **Input Form:** Sediakan pilihan kategori instan menggunakan chip/button group: 🥚 Telur, 🐔 Ayam Afkir, 💩 Pupuk, 📦 Lainnya.
- **Smart Notice:** Jika pengguna memilih kategori `Telur` dan mengetik satuan `butir`, tampilkan teks konfirmasi ramah: *"Sistem akan otomatis mengurangi stok telur segar di gudang sebanyak [X] butir."*
- Jika pengguna mengetik satuan selain `butir` (misalnya `kg`), tampilkan teks panduan: *"Penjualan dalam [satuan] tidak memotong stok otomatis. Pastikan Anda melakukan penyesuaian stok secara manual di menu Manajemen Stok jika diperlukan."*
- **Total Price Indicator:** Buat UI dinamis yang otomatis mengalikan `Jumlah (Qty)` dengan `Harga Satuan (Rp)` secara real-time sebelum data dikirim ke API server.

