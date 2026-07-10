# INSTRUKSI PENGEMBANGAN APLIKASI ANDROID (INTEGRASI FITUR BARU & FIX KONEKSI)

> **PENTING UNTUK AGENT PEMBUAT APLIKASI ANDROID:**  
> Dokumen ini berisi instruksi lengkap, spesifikasi API, model data, serta aturan bisnis terbaru untuk diimplementasikan ke dalam aplikasi Android menggunakan Kotlin + Jetpack Compose. Ikuti instruksi ini secara presisi untuk mengintegrasikan fitur **Catatan Penjualan (Sales Manager)** dan menyelesaikan masalah kegagalan koneksi/login.

---

## 1. Perbaikan Konfigurasi Koneksi & Base URL
Aplikasi Android mengalami kegagalan login karena menggunakan URL pengembangan (`dev`) yang sudah kedaluwarsa atau tidak aktif. Server produksi/shared aktif berada pada URL berikut:

*   **Shared/Production Base URL:** `https://ais-pre-tkklojq5hfmwaai7dpgjit-1023004766485.asia-southeast1.run.app/`
*   **Token Cookie Pengembang (jika diperlukan oleh proxy AI Studio):** `__SECURE-aistudio_auth_token=4FnGrkz2y_21NfpUNG4wARBeuwlPe6py6mLVXi05eFk=`

### Tugas Anda pada `FarmViewModel.kt`:
Pastikan variabel `serverBaseUrl` dan state default diatur menggunakan URL produksi di atas agar koneksi Retrofit berjalan lancar dan tidak lagi mengalami kegagalan login atau jabat tangan (handshake).

---

## 2. Spesifikasi Model Data Penjualan (`SalesRecord`)
Tambahkan model data Kotlin baru berikut ke dalam paket data/model Anda, atau daftarkan ke dalam database lokal Room Anda untuk mendukung penyimpanan offline jika diperlukan.

```kotlin
import com.google.gson.annotations.SerializedName

data class SalesRecord(
    @SerializedName("id") val id: String,                    // ID unik (misal: "sale-xxxxxxxxx")
    @SerializedName("userId") val userId: String,            // ID pengguna pemilik catatan
    @SerializedName("date") val date: String,                // Format: YYYY-MM-DD
    @SerializedName("category") val category: String,        // Nilai: "egg" | "chicken" | "manure" | "other"
    @SerializedName("quantity") val quantity: Double,        // Jumlah kuantitas penjualan
    @SerializedName("unit") val unit: String,                // Contoh: "butir", "kg", "ekor", "karung"
    @SerializedName("unitPrice") val unitPrice: Double,      // Harga Satuan (dalam Rupiah)
    @SerializedName("totalPrice") val totalPrice: Double,    // Total (Kuantitas * Harga Satuan)
    @SerializedName("buyerName") val buyerName: String,      // Nama pelanggan/pembeli
    @SerializedName("paymentStatus") val paymentStatus: String, // Nilai: "paid" (Lunas) | "unpaid" (Belum Lunas)
    @SerializedName("notes") val notes: String,              // Catatan tambahan transaksi
    @SerializedName("createdAt") val createdAt: Long,        // Epoch timestamp milidetik
    @SerializedName("lastUpdated") val lastUpdated: Long     // Epoch timestamp milidetik
)
```

---

## 3. Integrasi Endpoint API Retrofit (`ApiService.kt`)
Tambahkan sekumpulan interface endpoint berikut ke dalam deklarasi Retrofit Anda di aplikasi Android:

```kotlin
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ... endpoint login dan sync yang sudah ada ...

    /**
     * Mengambil seluruh catatan transaksi penjualan pengguna.
     */
    @GET("api/sales")
    suspend fun getSalesRecords(
        @Header("Authorization") bearerToken: String
    ): Response<List<SalesRecord>>

    /**
     * Membuat catatan penjualan baru.
     */
    @POST("api/sales")
    suspend fun createSalesRecord(
        @Header("Authorization") bearerToken: String,
        @Body payload: SalesPayload
    ): Response<SalesResponse>

    /**
     * Memperbarui transaksi penjualan yang ada.
     */
    @PUT("api/sales/{id}")
    suspend fun updateSalesRecord(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String,
        @Body payload: SalesPayload
    ): Response<SalesResponse>

    /**
     * Menghapus transaksi penjualan.
     */
    @DELETE("api/sales/{id}")
    suspend fun deleteSalesRecord(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String
    ): Response<SalesResponse>
}

// Request Payload Helper
data class SalesPayload(
    val date: String,
    val category: String,
    val quantity: Double,
    val unit: String,
    val unitPrice: Double,
    val buyerName: String,
    val paymentStatus: String,
    val notes: String
)

// Response Wrapper Helper
data class SalesResponse(
    val success: Boolean,
    val message: String,
    val sale: SalesRecord? = null
)
```

---

## 4. Aturan Bisnis Penting: Integrasi Stok Otomatis
Backend server kami memiliki logika **integrasi stok otomatis yang pintar**. Sebagai pengembang Android, Anda harus menyelaraskan UI dan logika aplikasi sesuai dengan aturan ini:

1.  **Auto-Deduct (Hanya Berlaku untuk "butir"):**
    *   Jika pengguna mencatat penjualan dengan kategori `egg` (telur) dan mengetik satuan `butir` (case-insensitive), server akan **mengurangi stok telur segar di gudang secara otomatis** sebesar kuantitas transaksi.
    *   Jika pengguna memasukkan satuan lain (misalnya `kg` atau `peti`), server **TIDAK** memotong stok otomatis guna menghindari anomali konversi berat.
2.  **Koreksi Cerdas saat Edit / Hapus:**
    *   Jika transaksi penjualan telur dalam satuan `butir` di-edit kuantitasnya, server menghitung selisihnya dan menyesuaikan stok telur di gudang secara otomatis.
    *   Jika transaksi penjualan telur dalam satuan `butir` dihapus (`DELETE`), server akan **mengembalikan kuantitas telur tersebut** ke dalam stok gudang (mengurangi dampak pemotongan sebelumnya).

### Desain Panduan UI di Android (Form Input):
*   Sediakan pilihan kategori berupa **Chip/Button Group**:
    *   `egg` (Label: 🥚 Telur)
    *   `chicken` (Label: 🐔 Ayam Afkir)
    *   `manure` (Label: 💩 Pupuk Kascing)
    *   `other` (Label: 📦 Lainnya)
*   **Smart Info Notice di Form:**
    *   Jika kategori terpilih adalah `Telur` dan input satuan diketik `"butir"`, tampilkan pesan edukatif berwarna hijau/biru di bawah form:
        > *"Sistem akan otomatis memotong stok telur segar di gudang sebanyak [X] butir."*
    *   Jika kategori adalah `Telur` tetapi satuan yang diketik adalah selain `"butir"` (seperti `"kg"`), tampilkan info berwarna kuning/amber:
        > *"Penjualan dalam satuan [satuan] tidak memotong stok otomatis untuk mencegah anomali data berat. Lakukan penyesuaian stok manual di menu Manajemen Stok jika diperlukan."*
*   **Perhitungan Total Otomatis:**
    *   Buat field `totalPrice` terhitung secara real-time di UI saat pengguna mengetik `Kuantitas` dan `Harga Satuan`.

---

## 5. Spesifikasi Model Data & API Endpoint Flock (`Flock`)
Untuk mendukung manajemen siklus hidup populasi ayam yang presisi, tambahkan model data Flock berikut ke aplikasi Android:

```kotlin
data class Flock(
    @SerializedName("id") val id: String,                    // ID unik (misal: "f-xxxxxxxxx")
    @SerializedName("userId") val userId: String,            // ID pemilik
    @SerializedName("kandangId") val kandangId: String,      // ID Kandang penempatan
    @SerializedName("kandangName") val kandangName: String,  // Nama Kandang penempatan
    @SerializedName("name") val name: String,                // Nama/Kode Flock (e.g. "Lohmann Batch 12")
    @SerializedName("breed") val breed: String,              // Strain/Jenis Ras (e.g. "Lohmann Brown")
    @SerializedName("initialPopulation") val initialPopulation: Int, // Populasi awal masuk
    @SerializedName("currentPopulation") val currentPopulation: Int, // Populasi saat ini
    @SerializedName("entryDate") val entryDate: String,      // Tanggal masuk (YYYY-MM-DD)
    @SerializedName("hatchDate") val hatchDate: String,      // Tanggal menetas (YYYY-MM-DD)
    @SerializedName("ageWeeksAtEntry") val ageWeeksAtEntry: Int, // Umur saat masuk (minggu)
    @SerializedName("status") val status: String,            // "active" | "depopulated"
    @SerializedName("notes") val notes: String,              // Catatan tambahan
    @SerializedName("createdAt") val createdAt: Long,
    @SerializedName("lastUpdated") val lastUpdated: Long
)
```

### Retrofit Endpoint di `ApiService.kt`:
```kotlin
    @GET("api/flocks")
    suspend fun getFlocks(
        @Header("Authorization") bearerToken: String
    ): Response<List<Flock>>

    @POST("api/flocks")
    suspend fun createFlock(
        @Header("Authorization") bearerToken: String,
        @Body payload: FlockPayload
    ): Response<FlockResponse>

    @PUT("api/flocks/{id}")
    suspend fun updateFlock(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String,
        @Body payload: FlockPayload
    ): Response<FlockResponse>

    @DELETE("api/flocks/{id}")
    suspend fun deleteFlock(
        @Header("Authorization") bearerToken: String,
        @Path("id") id: String
    ): Response<FlockResponse>
```

### Aturan Bisnis & Integrasi Penting (Backend-Symmetric):
1. **Auto-Deduct Kematian Ayam (Mortality):**
   * Saat petugas/pengguna mencatat log harian (`LayerFarmLog`) dengan jumlah kematian ayam (`chickenDead > 0`), server backend kami **secara cerdas akan langsung mengurangi sisa populasi aktif (`currentPopulation`) dari Flock Aktif yang berada di kandang tersebut**, serta mengurangi populasi `Kandang` itu sendiri.
   * Koreksi cerdas juga berlaku jika log harian tersebut di-edit atau di-DELETE secara offline maupun online.
2. **Kalkulasi Umur Dinamis di UI Android:**
   * Umur sekarang (dalam minggu) dihitung secara dinamis:
     `Umur Sekarang = ageWeeksAtEntry + (Hari Sejak Tanggal Masuk / 7)`
     Tampilkan umur dinamis ini pada kartu flock di UI Anda!

---

## 6. Sinkronisasi Data Offline (Room Database Local Sync)
Jika aplikasi mendukung penyimpanan offline, buat tabel Room baru untuk `SalesRecord` serta `Flock` dan tambahkan fungsionalitas antrean sinkronisasi (sync queue):
1.  Saat offline, simpan data transaksi penjualan dan flock ke database lokal dengan flag status `isPendingSync = true`.
2.  Saat online (atau ketika tombol Sync ditekan di `SyncScreen`), unggah data penjualan tertunda ke server secara berurutan menggunakan metode `POST /api/sales` atau `PUT /api/sales/{id}`, lalu perbarui status di database lokal menjadi `isPendingSync = false`.

---

Silakan implementasikan perubahan di atas pada kode sumber Android (Kotlin, Compose, Room, Retrofit) Anda sekarang. Pastikan semua rute mengarah ke Base URL yang baru agar proses autentikasi berhasil kembali!
