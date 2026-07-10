# Panduan Integrasi REST API - Aplikasi Android Client (LayerFarm)

Dokumen ini menjelaskan spesifikasi lengkap REST API untuk diintegrasikan dengan aplikasi Android client (baik Kotlin native, Jetpack Compose, Flutter, atau React Native). Sistem LayerFarm didesain menggunakan arsitektur **Offline-First**, di mana aplikasi mobile dapat menyimpan data secara lokal menggunakan Room Database dan melakukan sinkronisasi dua arah secara berkala.

---

## 1. Spesifikasi Umum & Autentikasi

### Base URL
Semua request API dikirimkan ke domain server utama:
* **Development / Live URL:** `https://ais-pre-tkklojq5hfmwaai7dpgjit-1023004766485.asia-southeast1.run.app` (Silakan ganti sesuai dengan domain produksi Anda)

### Header Autentikasi (JWT Bearer)
Untuk mengakses endpoint terproteksi, tambahkan header berikut pada request HTTP Anda:
```http
Authorization: Bearer <your_jwt_token_here>
Content-Type: application/json
```

---

## 2. API Autentikasi (`/api/auth`)

### A. Registrasi Pengguna Baru
Mendaftarkan akun petugas lapangan baru atau admin.
* **Endpoint:** `POST /api/auth/register`
* **Payload Body:**
```json
{
  "username": "budi_lapangan",
  "email": "budi@gmail.com",
  "password": "password123",
  "role": "petugas" // Pilihan: "petugas" atau "admin"
}
```
* **Response (Success - SMTP Aktif):**
```json
{
  "success": true,
  "message": "Registrasi berhasil! Silakan periksa email Anda untuk memasukkan kode verifikasi 6-digit.",
  "emailSent": true,
  "smtpWarning": false,
  "user": {
    "id": "u-budi_lapangan-1719999999",
    "username": "budi_lapangan",
    "email": "budi@gmail.com",
    "role": "petugas",
    "isVerified": false
  }
}
```

---

### B. Verifikasi OTP Email
Memverifikasi akun pendaftaran baru menggunakan 6-digit kode OTP dari email.
* **Endpoint:** `POST /api/auth/verify`
* **Payload Body:**
```json
{
  "email": "budi@gmail.com",
  "code": "123456"
}
```
* **Response (Success):**
```json
{
  "success": true,
  "message": "Akun Anda berhasil diverifikasi. Silakan login."
}
```

---

### C. Kirim Ulang Kode OTP Verifikasi
Mengirim ulang OTP verifikasi apabila kode sebelumnya kedaluwarsa atau hilang.
* **Endpoint:** `POST /api/auth/resend-verification`
* **Payload Body:**
```json
{
  "email": "budi@gmail.com"
}
```
* **Response (Success):**
```json
{
  "success": true,
  "message": "Kode verifikasi baru berhasil dikirim ke email Anda."
}
```

---

### D. Login Akun
Mengautentikasi pengguna untuk mendapatkan JWT Token berdurasi 7 hari.
* **Endpoint:** `POST /api/auth/login`
* **Payload Body:**
```json
{
  "usernameOrEmail": "budi@gmail.com", // atau "budi_lapangan"
  "password": "password123"
}
```
* **Response (Success):**
```json
{
  "message": "Login berhasil.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u-budi_lapangan-1719999999",
    "username": "budi_lapangan",
    "email": "budi@gmail.com",
    "role": "petugas",
    "isVerified": true
  }
}
```
* **Response (Gagal - Belum Verifikasi):**
```json
{
  "isUnverified": true,
  "email": "budi@gmail.com",
  "message": "Akun Anda belum terverifikasi. Silakan lakukan verifikasi email terlebih dahulu."
}
```

---

### E. Lupa Kata Sandi (Minta OTP Reset)
Mengirimkan kode OTP reset password ke email terdaftar.
* **Endpoint:** `POST /api/auth/forgot-password`
* **Payload Body:**
```json
{
  "email": "budi@gmail.com"
}
```
* **Response (Success):**
```json
{
  "success": true,
  "message": "Kode OTP untuk mengatur ulang kata sandi telah dikirim ke email Anda."
}
```

---

### F. Atur Ulang Kata Sandi
Memperbarui kata sandi lama menggunakan kode OTP reset yang didapatkan dari email.
* **Endpoint:** `POST /api/auth/reset-password`
* **Payload Body:**
```json
{
  "email": "budi@gmail.com",
  "code": "654321",
  "newPassword": "passwordBaru123"
}
```
* **Response (Success):**
```json
{
  "success": true,
  "message": "Kata sandi Anda berhasil diperbarui. Silakan login menggunakan kata sandi baru Anda."
}
```

---

## 3. Mesin Sinkronisasi Dua Arah (`/api/sync`)

Untuk mendukung performa Offline-First di Android, sinkronisasi menggunakan mekanisme timestamp-based.

### A. Push Data (Upload Data Lokal ke Server)
Aplikasi mobile mengirimkan data terbaru/terubah yang direkam saat offline ke server. Jika ID data sudah ada di server, server akan melakukan **upsert** (update atau insert) dengan mengambil data dengan timestamp `lastUpdated` terbaru.

* **Endpoint:** `POST /api/sync/push`
* **Headers:** `Authorization: Bearer <token>`
* **Payload Body:**
```json
{
  "logs": [
    {
      "id": "log-001",
      "kandangName": "Kandang A",
      "date": "2026-07-04",
      "eggCount": 450,
      "eggWeight": 27.5,
      "feedAmount": 50.0,
      "chickenDead": 2,
      "notes": "Aktivitas normal di pagi hari.",
      "createdAt": 1719999900000,
      "lastUpdated": 1719999999999
    }
  ],
  "vaccinations": [
    {
      "id": "vac-001",
      "kandangName": "Kandang B",
      "vaccineName": "ND-IB Clone",
      "plannedDate": "2026-07-10",
      "actualDate": "2026-07-04",
      "method": "Air Minum",
      "status": "Completed",
      "notes": "Suhu ruangan terjaga baik.",
      "ageWeeks": 12,
      "lastUpdated": 1719999999999
    }
  ],
  "biosecurity": [
    {
      "id": "bio-001",
      "date": "2026-07-04",
      "inspectorName": "Andi Pratama",
      "footBathActive": true,
      "vehicleSpray": true,
      "feedWarehouseClean": true,
      "cageWalkwayClean": true,
      "safeMortalityDisposal": true,
      "eggTrayDisinfected": true,
      "waterSanitization": true,
      "wildBirdControl": false,
      "score": 88,
      "notes": "Jaring kandang sedikit longgar.",
      "timestamp": 1719999999999
    }
  ]
}
```
* **Response (Success):**
```json
{
  "success": true,
  "message": "Sinkronisasi (push) berhasil diproses.",
  "syncedIds": ["log-001", "vac-001", "bio-001"]
}
```

---

### B. Pull Data (Unduh Data Terbaru dari Server)
Aplikasi mobile meminta data yang telah diperbarui atau ditambahkan oleh pengguna lain sejak sinkronisasi terakhir.

* **Endpoint:** `GET /api/sync/pull?lastSyncTimestamp=<timestamp_milidetik>`
* **Headers:** `Authorization: Bearer <token>`
* **Parameter:** `lastSyncTimestamp` (Gunakan `0` untuk sinkronisasi pertama kali guna mengambil seluruh data).
* **Response (Success):**
```json
{
  "logs": [
    {
      "id": "log-server-002",
      "kandangName": "Kandang C",
      "date": "2026-07-04",
      "eggCount": 320,
      "eggWeight": 19.4,
      "feedAmount": 35.2,
      "chickenDead": 0,
      "notes": "",
      "createdAt": 1720002100000,
      "lastUpdated": 1720002150000
    }
  ],
  "vaccinations": [],
  "biosecurity": [],
  "serverTimestamp": 1720002200000 
}
```
> **Petunjuk Client:** Simpan nilai `serverTimestamp` yang diterima dari respons ini ke `SharedPreferences` perangkat sebagai `lastSyncTimestamp` berikutnya.

---

## 4. Alur Integrasi Offline-First pada Android (Room + WorkManager)

Untuk performa andal bebas gangguan sinyal buruk, rekomendasikan struktur Android berikut:

```
+-------------------------------------------------------------+
|                     Android App Client                      |
+-------------------------------------------------------------+
|                                                             |
|   [ UI Layer ] -> Membaca data real-time dari Room DB       |
|         ^                                                   |
|         v (Menulis data baru dengan ID UUID lokal &         |
|            timestamp lastUpdated = systemTimeMillis)        |
|         v                                                   |
|   [ Room Database (SQLite) ]                                |
|         ^                                                   |
|         v (Sync Engine dipicu oleh WorkManager secara berkala) |
|         v                                                   |
|   [ WorkManager / SyncWorker ]                              |
|         |                                                   |
|         +---> 1. POST /api/sync/push (Kirim data lokal)     |
|         +---> 2. GET /api/sync/pull (Ambil data baru)      |
|         |                                                   |
+---------+---------------------------------------------------+
          | (Internet)
          v
+-------------------------------------------------------------+
|                     LayerFarm REST Server                   |
+-------------------------------------------------------------+
```

### Langkah Rekonsiliasi Data Lokal:
1. **Generate UUID:** Untuk setiap rekam data baru (Log, Vaksinasi, Biosekuriti) di HP, buat ID secara acak dengan format UUID (misal: `java.util.UUID.randomUUID().toString()`). Hal ini mencegah bentrok ID saat offline.
2. **Flag Sinkronisasi:** Buat kolom `isDirty: Boolean` (default `true` untuk baris baru atau hasil edit lokal) di tabel SQLite lokal Anda.
3. **Proses Sync:**
   * Ambil semua baris lokal yang memiliki `isDirty = true`.
   * Kirim data tersebut melalui `POST /api/sync/push`.
   * Jika sukses, ubah semua flag `isDirty` lokal menjadi `false`.
   * Lakukan panggilan `GET /api/sync/pull?lastSyncTimestamp=<last_saved_timestamp>` untuk mendapatkan data termutakhir yang dibuat dari device lain.
   * Masukkan/Upsert data tersebut ke Room lokal, lalu perbarui `lastSyncTimestamp` lokal dengan `serverTimestamp` terbaru.
