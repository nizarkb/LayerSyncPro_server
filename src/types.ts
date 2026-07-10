/**
 * Shared Type Definitions for Layer Farm Management System
 */

export type UserRole = "superadmin" | "admin" | "petugas";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: number;
  isVerified?: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  plan?: "free" | "pro" | "enterprise";
  status?: "active" | "suspended";
  maxKandangs?: number;
  maxLogs?: number;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface LayerFarmLog {
  id: string;
  userId?: string;
  kandangName: string;
  date: string; // YYYY-MM-DD
  eggCount: number;
  eggWeight: number; // kg
  feedAmount: number; // kg
  chickenDead: number;
  deathReason?: string;
  notes: string;
  lastUpdated: number; // timestamp MS
  createdAt: number; // timestamp MS
}

export interface VaccinationSchedule {
  id: string;
  userId?: string;
  kandangName: string;
  vaccineName: string;
  plannedDate: string; // YYYY-MM-DD
  actualDate: string | null; // YYYY-MM-DD
  method: string;
  status: "Pending" | "Completed";
  notes: string;
  ageWeeks: number;
  lastUpdated: number; // timestamp MS
}

export interface BiosecurityCheck {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  inspectorName: string;
  footBathActive: boolean;
  vehicleSpray: boolean;
  feedWarehouseClean: boolean;
  cageWalkwayClean: boolean;
  safeMortalityDisposal: boolean;
  eggTrayDisinfected: boolean;
  waterSanitization: boolean;
  wildBirdControl: boolean;
  score: number; // 0 - 100
  notes: string;
  timestamp: number; // timestamp MS
}

export interface Kandang {
  id: string;
  userId?: string;
  name: string;
  population: number;
  createdAt: number;
  lastUpdated: number;
}

export interface Flock {
  id: string;
  userId?: string;
  kandangId: string; // Hubungan ke Kandang
  kandangName: string; // Nama kandang (redundancy demi performa)
  name: string; // Nama/Kode Flock (contoh: "Lohmann Batch 12")
  breed: string; // Strain/Jenis (contoh: "Lohmann Brown", "Hy-Line Brown", "Isa Brown")
  initialPopulation: number; // Populasi Awal
  currentPopulation: number; // Populasi Saat Ini
  entryDate: string; // Tanggal Masuk (YYYY-MM-DD)
  hatchDate: string; // Tanggal Menetas (YYYY-MM-DD)
  ageWeeksAtEntry: number; // Umur saat masuk (dalam minggu)
  status: "active" | "depopulated"; // active atau depopulated (sudah afkir/selesai)
  notes?: string;
  createdAt: number;
  lastUpdated: number;
}

export interface SyncPushPayload {
  logs: LayerFarmLog[];
  vaccinations: VaccinationSchedule[];
  biosecurity: BiosecurityCheck[];
}

export interface SyncPullResponse {
  logs: LayerFarmLog[];
  vaccinations: VaccinationSchedule[];
  biosecurity: BiosecurityCheck[];
  serverTimestamp: number;
}

export interface DashboardSummary {
  todayEggs: number;
  todayEggWeight: number;
  todayFeedAmount: number;
  todayMortality: number;
  todayFcr: number;
  avgBiosecurityScore: number;
  pendingVaccinationsCount: number;
  kandangPerformance: {
    kandangName: string;
    totalEggs: number;
    totalEggWeight: number;
    totalFeed: number;
    totalDead: number;
    avgFcr: number;
  }[];
  recentActivity: {
    id: string;
    type: "log" | "vaccination" | "biosecurity";
    title: string;
    subtitle: string;
    timestamp: number;
  }[];
}

export interface StockItem {
  id: string;
  userId?: string;
  name: string;
  category: "feed" | "egg" | "vaccine" | "other";
  quantity: number;
  unit: string;
  minStock: number;
  lastUpdated: number;
}

export interface StockTransaction {
  id: string;
  userId?: string;
  itemId: string;
  itemName: string;
  category: "feed" | "egg" | "vaccine" | "other";
  type: "in" | "out";
  quantity: number;
  notes: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface SalesRecord {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  category: "egg" | "chicken" | "manure" | "other"; // Telur, Ayam Afkir, Pupuk, Lainnya
  quantity: number;
  unit: string; // kg, butir, ekor, karung, dll
  unitPrice: number; // Harga satuan (Rp)
  totalPrice: number; // Total harga (Rp) (quantity * unitPrice)
  buyerName: string; // Nama pembeli
  paymentStatus: "paid" | "unpaid"; // paid = Lunas, unpaid = Belum Lunas
  notes: string;
  lastUpdated: number;
  createdAt: number;
}

