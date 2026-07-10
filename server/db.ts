import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, LayerFarmLog, VaccinationSchedule, BiosecurityCheck, Kandang, Flock, SmtpConfig, UserRole, StockItem, StockTransaction, SalesRecord } from "../src/types.js";

const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashed_password
  logs: LayerFarmLog[];
  vaccinations: VaccinationSchedule[];
  biosecurity: BiosecurityCheck[];
  kandangs?: Kandang[];
  flocks?: Flock[];
  smtp?: SmtpConfig;
  stockItems?: StockItem[];
  stockTransactions?: StockTransaction[];
  salesRecords?: SalesRecord[];
  clearedUsers?: string[];
}


class DatabaseManager {
  private data: DbSchema = {
    users: [],
    passwords: {},
    logs: [],
    vaccinations: [],
    biosecurity: [],
    kandangs: [],
    flocks: [],
    smtp: {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "",
      pass: "",
      fromName: "Sistem Peternakan Layer",
      fromEmail: "noreply@example.com"
    },
    stockItems: [],
    stockTransactions: [],
    salesRecords: [],
    clearedUsers: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        console.log(`Database loaded successfully from ${DB_FILE}. Found ${this.data.logs.length} logs, ${this.data.vaccinations.length} vaccinations.`);
        
        // Ensure superadmin and necessary fields exist
        this.ensureSuperAdmin();
      } else {
        console.log("Database file not found. Generating default seed data...");
        this.seed();
        this.save();
      }
    } catch (error) {
      console.error("Error loading database:", error);
      // Fallback to empty/seed in case of corruption
      this.seed();
      this.save();
    }
  }

  private ensureSuperAdmin() {
    let changed = false;

    // Ensure stock arrays are initialized
    if (!this.data.stockItems) {
      this.data.stockItems = [];
      changed = true;
    }
    if (!this.data.stockTransactions) {
      this.data.stockTransactions = [];
      changed = true;
    }
    if (!this.data.salesRecords) {
      this.data.salesRecords = [];
      changed = true;
    }
    if (!this.data.flocks) {
      this.data.flocks = [];
      changed = true;
    }
    if (!this.data.clearedUsers) {
      this.data.clearedUsers = [];
      changed = true;
    }

    // 1. Ensure SMTP config structure exists
    if (!this.data.smtp) {
      this.data.smtp = {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "Sistem Peternakan Layer",
        fromEmail: "noreply@example.com"
      };
      changed = true;
    }

    // 2. Ensure superadmin exists in users array
    const superadminId = "u-superadmin-1";
    const hasSuperAdmin = this.data.users.some(u => u.role === "superadmin" || u.username === "superadmin");
    
    if (!hasSuperAdmin) {
      console.log("Superadmin user not found in database. Adding default superadmin...");
      const salt = bcrypt.genSaltSync(10);
      const superadminPasswordHash = bcrypt.hashSync("superadmin123", salt);

      this.data.users.push({
        id: superadminId,
        username: "superadmin",
        email: "superadmin@peternakanlayer.com",
        role: "superadmin",
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        isVerified: true,
      });

      if (!this.data.passwords) {
        this.data.passwords = {};
      }
      this.data.passwords[superadminId] = superadminPasswordHash;
      changed = true;
    }

    // 3. Ensure other pre-existing seeded users are verified and have SaaS parameters backfilled
    this.data.users.forEach(user => {
      let userChanged = false;
      if (user.isVerified === undefined) {
        user.isVerified = true;
        userChanged = true;
      }
      if (!user.plan) {
        user.plan = user.role === "superadmin" ? "enterprise" : (user.role === "admin" ? "pro" : "free");
        userChanged = true;
      }
      if (!user.status) {
        user.status = "active";
        userChanged = true;
      }
      if (user.maxKandangs === undefined) {
        user.maxKandangs = user.plan === "enterprise" ? 9999 : (user.plan === "pro" ? 10 : 2);
        userChanged = true;
      }
      if (user.maxLogs === undefined) {
        user.maxLogs = user.plan === "enterprise" ? 999999 : (user.plan === "pro" ? 1000 : 30);
        userChanged = true;
      }
      if (userChanged) {
        changed = true;
      }
    });

    if (changed) {
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("Error saving database to file:", error);
    }
  }

  public seedUserData(userId: string) {
    // 1. Ensure default kandangs exist for this user
    if (!this.data.kandangs) {
      this.data.kandangs = [];
    }
    const userKandangs = this.data.kandangs.filter((k) => k.userId === userId);
    if (userKandangs.length === 0) {
      const defaults = [
        { id: `k-1-${userId}`, userId, name: "Kandang A", population: 1000, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, lastUpdated: Date.now() },
        { id: `k-2-${userId}`, userId, name: "Kandang B", population: 800, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, lastUpdated: Date.now() },
        { id: `k-3-${userId}`, userId, name: "Kandang C", population: 1200, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, lastUpdated: Date.now() },
      ];
      this.data.kandangs.push(...defaults);
    }

    // 2. Realistic Layer Farm Logs (Last 14 days)
    const today = new Date("2026-07-02");
    const kandangsConfig = [
      { name: "Kandang A", avgEggCount: 940, avgEggWeight: 56.4, avgFeed: 115 },
      { name: "Kandang B", avgEggCount: 730, avgEggWeight: 43.8, avgFeed: 92 },
      { name: "Kandang C", avgEggCount: 1110, avgEggWeight: 66.6, avgFeed: 138 },
    ];

    const tempLogs: LayerFarmLog[] = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      const timestamp = d.getTime();

      kandangsConfig.forEach((k) => {
        const variance = (Math.sin(i + k.name.charCodeAt(8)) * 0.05);
        const eggCount = Math.round(k.avgEggCount * (1 + variance + (Math.random() * 0.04 - 0.02)));
        const eggWeight = parseFloat((k.avgEggWeight * (1 + variance + (Math.random() * 0.03 - 0.015))).toFixed(2));
        const feedAmount = parseFloat((k.avgFeed * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2));
        
        let chickenDead = 0;
        const rand = Math.random();
        if (rand > 0.9) chickenDead = 2;
        else if (rand > 0.7) chickenDead = 1;

        const isToday = i === 0;

        tempLogs.push({
          id: `log-${userId}-${k.name.replace(" ", "-").toLowerCase()}-${dateString}`,
          userId,
          kandangName: k.name,
          date: dateString,
          eggCount,
          eggWeight,
          feedAmount,
          chickenDead,
          notes: isToday ? "Kondisi kandang bersih, ayam sehat." : "Log harian otomatis.",
          lastUpdated: timestamp,
          createdAt: timestamp,
        });
      });
    }
    this.data.logs.push(...tempLogs);

    // 3. Vaccination Schedules
    const vaccinationsData: VaccinationSchedule[] = [
      {
        id: `v-1-${userId}`,
        userId,
        kandangName: "Kandang A",
        vaccineName: "ND-IB Clone",
        plannedDate: "2026-06-15",
        actualDate: "2026-06-15",
        method: "Air Minum",
        status: "Completed",
        notes: "Diberikan pagi hari, dosis sesuai rekomendasi.",
        ageWeeks: 12,
        lastUpdated: new Date("2026-06-15").getTime(),
      },
      {
        id: `v-2-${userId}`,
        userId,
        kandangName: "Kandang B",
        vaccineName: "ND-IB Clone",
        plannedDate: "2026-06-17",
        actualDate: "2026-06-17",
        method: "Air Minum",
        status: "Completed",
        notes: "Ayam merespon baik, tidak ada gejala stres.",
        ageWeeks: 12,
        lastUpdated: new Date("2026-06-17").getTime(),
      },
      {
        id: `v-3-${userId}`,
        userId,
        kandangName: "Semua Kandang",
        vaccineName: "Avian Influenza (AI)",
        plannedDate: "2026-06-25",
        actualDate: "2026-06-25",
        method: "Suntik",
        status: "Completed",
        notes: "Vaksinasi berkala semesteran.",
        ageWeeks: 14,
        lastUpdated: new Date("2026-06-25").getTime(),
      },
      {
        id: `v-4-${userId}`,
        userId,
        kandangName: "Kandang A",
        vaccineName: "Coryza",
        plannedDate: "2026-07-04",
        actualDate: null,
        method: "Suntik",
        status: "Pending",
        notes: "Persiapkan injektor steril.",
        ageWeeks: 16,
        lastUpdated: new Date("2026-07-02").getTime(),
      },
      {
        id: `v-5-${userId}`,
        userId,
        kandangName: "Kandang B",
        vaccineName: "Coryza",
        plannedDate: "2026-07-06",
        actualDate: null,
        method: "Suntik",
        status: "Pending",
        notes: "Vaksin coryza dosis kedua.",
        ageWeeks: 16,
        lastUpdated: new Date("2026-07-02").getTime(),
      },
      {
        id: `v-6-${userId}`,
        userId,
        kandangName: "Kandang C",
        vaccineName: "Gumboro",
        plannedDate: "2026-07-10",
        actualDate: null,
        method: "Tetes Mata",
        status: "Pending",
        notes: "Tetes mata pagi hari agar terserap merata.",
        ageWeeks: 15,
        lastUpdated: new Date("2026-07-02").getTime(),
      }
    ];
    this.data.vaccinations.push(...vaccinationsData);

    // 4. Biosecurity Checks
    const tempBio: BiosecurityCheck[] = [];
    const inspectors = ["Pak Jono", "Budi Santoso", "Andi"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      const timestamp = d.getTime();

      const footBathActive = i !== 3;
      const vehicleSpray = true;
      const feedWarehouseClean = true;
      const cageWalkwayClean = i !== 1;
      const safeMortalityDisposal = true;
      const eggTrayDisinfected = i !== 5;
      const waterSanitization = true;
      const wildBirdControl = true;

      const checkedCount = [
        footBathActive,
        vehicleSpray,
        feedWarehouseClean,
        cageWalkwayClean,
        safeMortalityDisposal,
        eggTrayDisinfected,
        waterSanitization,
        wildBirdControl
      ].filter(Boolean).length;

      const score = Math.round((checkedCount / 8) * 100);

      tempBio.push({
        id: `bio-${userId}-${dateString}`,
        userId,
        date: dateString,
        inspectorName: inspectors[i % inspectors.length],
        footBathActive,
        vehicleSpray,
        feedWarehouseClean,
        cageWalkwayClean,
        safeMortalityDisposal,
        eggTrayDisinfected,
        waterSanitization,
        wildBirdControl,
        score,
        notes: score === 100 ? "Seluruh parameter biosekuriti terpenuhi dengan baik." : "Ada beberapa poin sanitasi yang terlewat, sudah dikoreksi.",
        timestamp,
      });
    }
    this.data.biosecurity.push(...tempBio);

    // 5. Seed default stock items for the user
    if (!this.data.stockItems) {
      this.data.stockItems = [];
    }
    const userStockItems = this.data.stockItems.filter((s) => s.userId === userId);
    if (userStockItems.length === 0) {
      const defaultStockItems: StockItem[] = [
        {
          id: `s-feed-${userId}`,
          userId,
          name: "Pakan Layer Masa Produksi",
          category: "feed",
          quantity: 1500, // 1500 kg
          unit: "kg",
          minStock: 300,
          lastUpdated: Date.now()
        },
        {
          id: `s-egg-${userId}`,
          userId,
          name: "Telur Ayam Segar (Fresh Egg)",
          category: "egg",
          quantity: 4500, // 4500 butir
          unit: "butir",
          minStock: 500,
          lastUpdated: Date.now()
        },
        {
          id: `s-vac1-${userId}`,
          userId,
          name: "Vaksin ND-IB Clone",
          category: "vaccine",
          quantity: 25,
          unit: "vial",
          minStock: 5,
          lastUpdated: Date.now()
        },
        {
          id: `s-vac2-${userId}`,
          userId,
          name: "Vaksin Coryza (Suntik)",
          category: "vaccine",
          quantity: 15,
          unit: "vial",
          minStock: 5,
          lastUpdated: Date.now()
        },
        {
          id: `s-other-${userId}`,
          userId,
          name: "Desinfektan Kandang",
          category: "other",
          quantity: 50,
          unit: "liter",
          minStock: 10,
          lastUpdated: Date.now()
        }
      ];
      this.data.stockItems.push(...defaultStockItems);
    }

    this.save();
  }

  private seed() {
    // 1. Create Default Users
    const salt = bcrypt.genSaltSync(10);
    const superadminPasswordHash = bcrypt.hashSync("superadmin123", salt);
    const adminPasswordHash = bcrypt.hashSync("adminpeternakan", salt);
    const petugasPasswordHash = bcrypt.hashSync("petugas123", salt);

    const superadminId = "u-superadmin-1";
    const adminId = "u-admin-1";
    const petugasId = "u-petugas-1";

    this.data.users = [
      {
        id: superadminId,
        username: "superadmin",
        email: "superadmin@peternakanlayer.com",
        role: "superadmin",
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
        isVerified: true,
        plan: "enterprise",
        status: "active",
        maxKandangs: 9999,
        maxLogs: 999999,
      },
      {
        id: adminId,
        username: "admin",
        email: "admin@peternakanlayer.com",
        role: "admin",
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        isVerified: true,
        plan: "pro",
        status: "active",
        maxKandangs: 10,
        maxLogs: 1000,
      },
      {
        id: petugasId,
        username: "petugas",
        email: "petugas@peternakanlayer.com",
        role: "petugas",
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        isVerified: true,
        plan: "free",
        status: "active",
        maxKandangs: 2,
        maxLogs: 30,
      }
    ];

    this.data.passwords = {
      [superadminId]: superadminPasswordHash,
      [adminId]: adminPasswordHash,
      [petugasId]: petugasPasswordHash,
    };

    // SMTP configuration default seed
    this.data.smtp = {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "",
      pass: "",
      fromName: "Sistem Peternakan Layer",
      fromEmail: "noreply@example.com"
    };

    // 2. Provision initial seed data for each seeded user
    this.seedUserData(superadminId);
    this.seedUserData(adminId);
    this.seedUserData(petugasId);

    console.log("Seed data created and database pre-loaded.");
  }

  public clearData(userId: string) {
    this.data.logs = this.data.logs.filter((l) => l.userId !== userId);
    this.data.vaccinations = this.data.vaccinations.filter((v) => v.userId !== userId);
    this.data.biosecurity = this.data.biosecurity.filter((b) => b.userId !== userId);
    this.data.kandangs = this.data.kandangs ? this.data.kandangs.filter((k) => k.userId !== userId) : [];
    this.data.flocks = this.data.flocks ? this.data.flocks.filter((f) => f.userId !== userId) : [];
    this.data.stockItems = this.data.stockItems ? this.data.stockItems.filter((s) => s.userId !== userId) : [];
    this.data.stockTransactions = this.data.stockTransactions ? this.data.stockTransactions.filter((st) => st.userId !== userId) : [];
    this.data.salesRecords = this.data.salesRecords ? this.data.salesRecords.filter((sr) => sr.userId !== userId) : [];
    
    if (!this.data.clearedUsers) {
      this.data.clearedUsers = [];
    }
    if (!this.data.clearedUsers.includes(userId)) {
      this.data.clearedUsers.push(userId);
    }
    
    this.save();
  }

  // Auth Operations
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getPasswordHash(userId: string): string | undefined {
    return this.data.passwords[userId];
  }

  public createUser(user: Omit<User, "id" | "createdAt">, passwordHash: string): User {
    const newUser: User = {
      ...user,
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      isVerified: user.isVerified !== undefined ? user.isVerified : false,
      verificationToken: user.verificationToken || undefined,
      plan: user.plan || "free",
      status: user.status || "active",
      maxKandangs: user.maxKandangs !== undefined ? user.maxKandangs : 2,
      maxLogs: user.maxLogs !== undefined ? user.maxLogs : 30,
    };
    this.data.users.push(newUser);
    this.data.passwords[newUser.id] = passwordHash;
    this.save();
    return newUser;
  }

  // SMTP Settings
  public getSmtpConfig(): SmtpConfig {
    if (!this.data.smtp) {
      this.data.smtp = {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "Sistem Peternakan Layer",
        fromEmail: "noreply@example.com"
      };
      this.save();
    }
    return this.data.smtp;
  }

  public setSmtpConfig(config: SmtpConfig): void {
    this.data.smtp = config;
    this.save();
  }

  // Verification & Tokens helper
  public verifyUserByToken(token: string): boolean {
    const user = this.data.users.find((u) => u.verificationToken === token);
    if (user) {
      user.isVerified = true;
      delete user.verificationToken;
      this.save();
      return true;
    }
    return false;
  }

  public setUserVerificationToken(userId: string, token: string): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.verificationToken = token;
      this.save();
    }
  }

  public setUserResetToken(userId: string, token: string, expiresMs: number): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.resetToken = token;
      user.resetTokenExpires = Date.now() + expiresMs;
      this.save();
    }
  }

  public getUserByResetToken(token: string): User | undefined {
    const user = this.data.users.find(
      (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now()
    );
    return user;
  }

  public updatePassword(userId: string, passwordHash: string): void {
    this.data.passwords[userId] = passwordHash;
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      delete user.resetToken;
      delete user.resetTokenExpires;
    }
    this.save();
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.data.users.splice(index, 1);
      delete this.data.passwords[id];
      this.save();
      return true;
    }
    return false;
  }

  public updateUserRole(id: string, role: UserRole): boolean {
    const user = this.data.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      this.save();
      return true;
    }
    return false;
  }

  public setUserVerifiedStatus(userId: string, status: boolean): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.isVerified = status;
      if (status) {
        delete user.verificationToken;
      }
      this.save();
      return true;
    }
    return false;
  }

  // Tenant/User Data Ownership Stats
  public getTenantsStats(): any[] {
    return this.data.users.map((user) => {
      const userKandangs = (this.data.kandangs || []).filter((k) => k.userId === user.id);
      const userLogs = this.data.logs.filter((l) => l.userId === user.id);
      const userVaccinations = this.data.vaccinations.filter((v) => v.userId === user.id);
      const userBiosecurity = this.data.biosecurity.filter((b) => b.userId === user.id);

      const totalPopulation = userKandangs.reduce((sum, k) => sum + (k.population || 0), 0);

      const timestamps = [
        ...userLogs.map((l) => l.lastUpdated || 0),
        ...userVaccinations.map((v) => v.lastUpdated || 0),
        ...userBiosecurity.map((b) => b.timestamp || 0),
      ].filter((t) => t > 0);
      const lastActivity = timestamps.length > 0 ? Math.max(...timestamps) : user.createdAt;

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isVerified: user.isVerified || false,
        plan: user.plan || "free",
        status: user.status || "active",
        maxKandangs: user.maxKandangs !== undefined ? user.maxKandangs : 2,
        maxLogs: user.maxLogs !== undefined ? user.maxLogs : 30,
        kandangsCount: userKandangs.length,
        logsCount: userLogs.length,
        vaccinationsCount: userVaccinations.length,
        biosecurityCount: userBiosecurity.length,
        totalCagesPopulation: totalPopulation,
        lastActivity,
      };
    });
  }

  public getTenantDetails(userId: string): any {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;

    const userKandangs = (this.data.kandangs || []).filter((k) => k.userId === userId);
    const userLogs = this.data.logs.filter((l) => l.userId === userId);
    const userVaccinations = this.data.vaccinations.filter((v) => v.userId === userId);
    const userBiosecurity = this.data.biosecurity.filter((b) => b.userId === userId);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        plan: user.plan || "free",
        status: user.status || "active",
        maxKandangs: user.maxKandangs !== undefined ? user.maxKandangs : 2,
        maxLogs: user.maxLogs !== undefined ? user.maxLogs : 30,
      },
      kandangs: userKandangs,
      logs: userLogs,
      vaccinations: userVaccinations,
      biosecurity: userBiosecurity,
    };
  }

  public updateTenantSaaS(userId: string, plan: "free" | "pro" | "enterprise", status: "active" | "suspended"): boolean {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    user.plan = plan;
    user.status = status;
    user.maxKandangs = plan === "enterprise" ? 9999 : (plan === "pro" ? 10 : 2);
    user.maxLogs = plan === "enterprise" ? 999999 : (plan === "pro" ? 1000 : 30);
    this.save();
    return true;
  }

  // LayerFarmLog Operations
  public getLogs(userId: string): LayerFarmLog[] {
    return this.data.logs.filter((l) => l.userId === userId);
  }

  public upsertLog(log: LayerFarmLog, userId: string): void {
    const logWithUser = { ...log, userId };
    const index = this.data.logs.findIndex((l) => l.id === log.id && l.userId === userId);
    if (index !== -1) {
      const original = this.data.logs[index];
      this.data.logs[index] = {
        ...logWithUser,
        createdAt: log.createdAt || original.createdAt || Date.now(),
        lastUpdated: log.lastUpdated || Date.now(),
      };
    } else {
      this.data.logs.push({
        ...logWithUser,
        createdAt: log.createdAt || Date.now(),
        lastUpdated: log.lastUpdated || Date.now(),
      });
    }
    this.save();
  }

  public deleteLog(id: string, userId: string): boolean {
    const index = this.data.logs.findIndex((l) => l.id === id && l.userId === userId);
    if (index !== -1) {
      this.data.logs.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Vaccination Operations
  public getVaccinations(userId: string): VaccinationSchedule[] {
    return this.data.vaccinations.filter((v) => v.userId === userId);
  }

  public upsertVaccination(vac: VaccinationSchedule, userId: string): void {
    const vacWithUser = { ...vac, userId };
    const index = this.data.vaccinations.findIndex((v) => v.id === vac.id && v.userId === userId);
    if (index !== -1) {
      this.data.vaccinations[index] = {
        ...vacWithUser,
        lastUpdated: vac.lastUpdated || Date.now(),
      };
    } else {
      this.data.vaccinations.push({
        ...vacWithUser,
        lastUpdated: vac.lastUpdated || Date.now(),
      });
    }
    this.save();
  }

  public deleteVaccination(id: string, userId: string): boolean {
    const index = this.data.vaccinations.findIndex((v) => v.id === id && v.userId === userId);
    if (index !== -1) {
      this.data.vaccinations.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Biosecurity Operations
  public getBiosecurityChecks(userId: string): BiosecurityCheck[] {
    return this.data.biosecurity.filter((b) => b.userId === userId);
  }

  public upsertBiosecurity(bio: BiosecurityCheck, userId: string): void {
    const bioWithUser = { ...bio, userId };
    const index = this.data.biosecurity.findIndex((b) => b.id === bio.id && b.userId === userId);
    if (index !== -1) {
      this.data.biosecurity[index] = {
        ...bioWithUser,
        timestamp: bio.timestamp || Date.now(),
      };
    } else {
      this.data.biosecurity.push({
        ...bioWithUser,
        timestamp: bio.timestamp || Date.now(),
      });
    }
    this.save();
  }

  public deleteBiosecurity(id: string, userId: string): boolean {
    const index = this.data.biosecurity.findIndex((b) => b.id === id && b.userId === userId);
    if (index !== -1) {
      this.data.biosecurity.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Kandang Operations
  public getKandangs(userId: string): Kandang[] {
    if (!this.data.kandangs) {
      this.data.kandangs = [];
    }
    const userKandangs = this.data.kandangs.filter((k) => k.userId === userId);
    const hasCleared = this.data.clearedUsers && this.data.clearedUsers.includes(userId);
    if (userKandangs.length === 0 && !hasCleared) {
      const defaults = [
        { id: `k-1-${userId}`, userId, name: "Kandang A", population: 1000, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, lastUpdated: Date.now() },
        { id: `k-2-${userId}`, userId, name: "Kandang B", population: 800, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, lastUpdated: Date.now() },
        { id: `k-3-${userId}`, userId, name: "Kandang C", population: 1200, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, lastUpdated: Date.now() },
      ];
      this.data.kandangs.push(...defaults);
      this.save();
      return defaults;
    }
    return userKandangs;
  }

  public upsertKandang(k: Kandang, userId: string): void {
    if (!this.data.kandangs) {
      this.data.kandangs = [];
    }
    const kWithUser = { ...k, userId };
    const index = this.data.kandangs.findIndex((item) => item.id === k.id && item.userId === userId);
    if (index !== -1) {
      this.data.kandangs[index] = {
        ...kWithUser,
        lastUpdated: Date.now(),
      };
    } else {
      this.data.kandangs.push({
        ...kWithUser,
        createdAt: k.createdAt || Date.now(),
        lastUpdated: Date.now(),
      });
    }
    this.save();
  }

  public deleteKandang(id: string, userId: string): boolean {
    if (!this.data.kandangs) return false;
    const index = this.data.kandangs.findIndex((k) => k.id === id && k.userId === userId);
    if (index !== -1) {
      this.data.kandangs.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ==========================================
  // FLOCK OPERATIONS
  // ==========================================

  public getFlocks(userId: string): Flock[] {
    if (!this.data.flocks) {
      this.data.flocks = [];
    }
    const userFlocks = this.data.flocks.filter((f) => f.userId === userId);
    const hasCleared = this.data.clearedUsers && this.data.clearedUsers.includes(userId);
    
    // Seed default flocks if empty and user has kandangs
    if (userFlocks.length === 0 && !hasCleared) {
      const kandangs = this.getKandangs(userId);
      const defaults: Flock[] = [];
      
      const breeds = ["Lohmann Brown", "Hy-Line Brown", "Isa Brown"];
      kandangs.forEach((k, idx) => {
        const breed = breeds[idx % breeds.length];
        defaults.push({
          id: `f-${idx + 1}-${userId}`,
          userId,
          kandangId: k.id,
          kandangName: k.name,
          name: `Flock ${breed} - Batch ${10 + idx}`,
          breed,
          initialPopulation: k.population,
          currentPopulation: k.population,
          entryDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 45 days ago
          hatchDate: new Date(Date.now() - (45 + 18 * 7) * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 18 weeks old at entry
          ageWeeksAtEntry: 18,
          status: "active",
          notes: "Flock bawaan sistem yang dikaitkan dengan kandang awal.",
          createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
          lastUpdated: Date.now()
        });
      });
      
      if (defaults.length > 0) {
        this.data.flocks.push(...defaults);
        this.save();
        return defaults;
      }
    }
    return userFlocks;
  }

  public upsertFlock(f: Flock, userId: string): void {
    if (!this.data.flocks) {
      this.data.flocks = [];
    }
    const fWithUser = { ...f, userId };
    const index = this.data.flocks.findIndex((item) => item.id === f.id && item.userId === userId);
    if (index !== -1) {
      this.data.flocks[index] = {
        ...fWithUser,
        lastUpdated: Date.now(),
      };
    } else {
      this.data.flocks.push({
        ...fWithUser,
        createdAt: f.createdAt || Date.now(),
        lastUpdated: Date.now(),
      });
    }
    this.save();
  }

  public deleteFlock(id: string, userId: string): boolean {
    if (!this.data.flocks) return false;
    const index = this.data.flocks.findIndex((f) => f.id === id && f.userId === userId);
    if (index !== -1) {
      this.data.flocks.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  public adjustFlockAndKandangForLog(userId: string, originalLog: LayerFarmLog | null, newLog: LayerFarmLog | null) {
    if (!this.data.kandangs) this.data.kandangs = [];
    if (!this.data.flocks) this.data.flocks = [];

    const adjustPopulation = (kName: string, amount: number) => {
      // Find Kandang by name (case-insensitive)
      const kandang = this.data.kandangs!.find(
        k => k.userId === userId && k.name.toLowerCase() === kName.toLowerCase()
      );
      if (kandang) {
        kandang.population = Math.max(0, kandang.population + amount);
        kandang.lastUpdated = Date.now();
      }

      // Find Active Flock in that Kandang
      if (kandang) {
        const flock = this.data.flocks!.find(
          f => f.userId === userId && f.kandangId === kandang.id && f.status === "active"
        );
        if (flock) {
          flock.currentPopulation = Math.max(0, flock.currentPopulation + amount);
          flock.lastUpdated = Date.now();
        }
      } else {
        // Fallback by kandang name
        const flock = this.data.flocks!.find(
          f => f.userId === userId && f.kandangName.toLowerCase() === kName.toLowerCase() && f.status === "active"
        );
        if (flock) {
          flock.currentPopulation = Math.max(0, flock.currentPopulation + amount);
          flock.lastUpdated = Date.now();
        }
      }
    };

    // Case 1: New log
    if (!originalLog && newLog) {
      if (newLog.chickenDead > 0) {
        adjustPopulation(newLog.kandangName, -newLog.chickenDead);
      }
    }
    // Case 2: Deleted log
    else if (originalLog && !newLog) {
      if (originalLog.chickenDead > 0) {
        adjustPopulation(originalLog.kandangName, originalLog.chickenDead);
      }
    }
    // Case 3: Updated log
    else if (originalLog && newLog) {
      if (originalLog.kandangName.toLowerCase() !== newLog.kandangName.toLowerCase()) {
        if (originalLog.chickenDead > 0) {
          adjustPopulation(originalLog.kandangName, originalLog.chickenDead);
        }
        if (newLog.chickenDead > 0) {
          adjustPopulation(newLog.kandangName, -newLog.chickenDead);
        }
      } else {
        const diff = newLog.chickenDead - originalLog.chickenDead;
        if (diff !== 0) {
          adjustPopulation(newLog.kandangName, -diff);
        }
      }
    }

    this.save();
  }

  // ==========================================
  // STOCK / INVENTORY OPERATIONS
  // ==========================================

  public getStockItems(userId: string): StockItem[] {
    if (!this.data.stockItems) {
      this.data.stockItems = [];
    }
    const userStock = this.data.stockItems.filter((s) => s.userId === userId);
    const hasCleared = this.data.clearedUsers && this.data.clearedUsers.includes(userId);
    if (userStock.length === 0 && !hasCleared) {
      this.seedDefaultStockForUser(userId);
      return this.data.stockItems.filter((s) => s.userId === userId);
    }
    return userStock;
  }

  private seedDefaultStockForUser(userId: string) {
    if (!this.data.stockItems) {
      this.data.stockItems = [];
    }
    const defaultStockItems: StockItem[] = [
      {
        id: `s-feed-${userId}`,
        userId,
        name: "Pakan Layer Masa Produksi",
        category: "feed",
        quantity: 1500,
        unit: "kg",
        minStock: 300,
        lastUpdated: Date.now()
      },
      {
        id: `s-egg-${userId}`,
        userId,
        name: "Telur Ayam Segar (Fresh Egg)",
        category: "egg",
        quantity: 4500,
        unit: "butir",
        minStock: 500,
        lastUpdated: Date.now()
      },
      {
        id: `s-vac1-${userId}`,
        userId,
        name: "Vaksin ND-IB Clone",
        category: "vaccine",
        quantity: 25,
        unit: "vial",
        minStock: 5,
        lastUpdated: Date.now()
      },
      {
        id: `s-vac2-${userId}`,
        userId,
        name: "Vaksin Coryza (Suntik)",
        category: "vaccine",
        quantity: 15,
        unit: "vial",
        minStock: 5,
        lastUpdated: Date.now()
      },
      {
        id: `s-other-${userId}`,
        userId,
        name: "Desinfektan Kandang",
        category: "other",
        quantity: 50,
        unit: "liter",
        minStock: 10,
        lastUpdated: Date.now()
      }
    ];

    for (const item of defaultStockItems) {
      const exists = this.data.stockItems.some(
        (s) => s.userId === userId && (s.id === item.id || s.category === item.category)
      );
      if (!exists) {
        this.data.stockItems.push(item);
      }
    }
    this.save();
  }

  public getStockTransactions(userId: string): StockTransaction[] {
    if (!this.data.stockTransactions) {
      this.data.stockTransactions = [];
    }
    return this.data.stockTransactions.filter((t) => t.userId === userId);
  }

  public upsertStockItem(item: StockItem, userId: string): void {
    if (!this.data.stockItems) {
      this.data.stockItems = [];
    }
    const itemWithUser = { ...item, userId };
    const index = this.data.stockItems.findIndex((s) => s.id === item.id && s.userId === userId);
    if (index !== -1) {
      this.data.stockItems[index] = {
        ...itemWithUser,
        lastUpdated: Date.now()
      };
    } else {
      this.data.stockItems.push({
        ...itemWithUser,
        id: item.id || `s-${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: Date.now()
      });
    }
    this.save();
  }

  public deleteStockItem(id: string, userId: string): boolean {
    if (!this.data.stockItems) return false;
    const index = this.data.stockItems.findIndex((s) => s.id === id && s.userId === userId);
    if (index !== -1) {
      this.data.stockItems.splice(index, 1);
      if (this.data.stockTransactions) {
        this.data.stockTransactions = this.data.stockTransactions.filter(t => t.itemId !== id);
      }
      this.save();
      return true;
    }
    return false;
  }

  public addStockTransaction(tx: Omit<StockTransaction, "id" | "timestamp">, userId: string): StockTransaction {
    if (!this.data.stockTransactions) {
      this.data.stockTransactions = [];
    }
    const newTx: StockTransaction = {
      ...tx,
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: Date.now()
    };
    this.data.stockTransactions.push(newTx);
    
    if (!this.data.stockItems) {
      this.data.stockItems = [];
    }
    const item = this.data.stockItems.find((s) => s.id === tx.itemId && s.userId === userId);
    if (item) {
      if (tx.type === "in") {
        item.quantity += tx.quantity;
      } else {
        item.quantity -= tx.quantity;
        if (item.quantity < 0) item.quantity = 0;
      }
      item.lastUpdated = Date.now();
    }
    
    this.save();
    return newTx;
  }

  public adjustStockForLog(userId: string, originalLog: LayerFarmLog | null, newLog: LayerFarmLog | null) {
    if (!this.data.stockItems) this.data.stockItems = [];
    if (!this.data.stockTransactions) this.data.stockTransactions = [];

    let feedItem = this.data.stockItems.find(s => s.userId === userId && s.category === "feed");
    let eggItem = this.data.stockItems.find(s => s.userId === userId && s.category === "egg");

    if (!feedItem || !eggItem) {
      this.seedDefaultStockForUser(userId);
      feedItem = this.data.stockItems.find(s => s.userId === userId && s.category === "feed");
      eggItem = this.data.stockItems.find(s => s.userId === userId && s.category === "egg");
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // CASE 1: Creating a new log
    if (!originalLog && newLog) {
      if (newLog.feedAmount > 0 && feedItem) {
        this.addStockTransaction({
          itemId: feedItem.id,
          itemName: feedItem.name,
          category: "feed",
          type: "out",
          quantity: newLog.feedAmount,
          notes: `Konsumsi pakan otomatis - ${newLog.kandangName} (Log Tanggal ${newLog.date})`,
          date: todayStr
        }, userId);
      }
      if (newLog.eggCount > 0 && eggItem) {
        this.addStockTransaction({
          itemId: eggItem.id,
          itemName: eggItem.name,
          category: "egg",
          type: "in",
          quantity: newLog.eggCount,
          notes: `Produksi telur otomatis - ${newLog.kandangName} (Log Tanggal ${newLog.date})`,
          date: todayStr
        }, userId);
      }
    }

    // CASE 2: Deleting a log
    else if (originalLog && !newLog) {
      if (originalLog.feedAmount > 0 && feedItem) {
        this.addStockTransaction({
          itemId: feedItem.id,
          itemName: feedItem.name,
          category: "feed",
          type: "in",
          quantity: originalLog.feedAmount,
          notes: `Reversi pembatalan log harian - ${originalLog.kandangName} (Log Tanggal ${originalLog.date})`,
          date: todayStr
        }, userId);
      }
      if (originalLog.eggCount > 0 && eggItem) {
        this.addStockTransaction({
          itemId: eggItem.id,
          itemName: eggItem.name,
          category: "egg",
          type: "out",
          quantity: originalLog.eggCount,
          notes: `Reversi pembatalan log harian - ${originalLog.kandangName} (Log Tanggal ${originalLog.date})`,
          date: todayStr
        }, userId);
      }
    }

    // CASE 3: Updating a log
    else if (originalLog && newLog) {
      const feedDiff = newLog.feedAmount - originalLog.feedAmount;
      if (feedDiff !== 0 && feedItem) {
        if (feedDiff > 0) {
          this.addStockTransaction({
            itemId: feedItem.id,
            itemName: feedItem.name,
            category: "feed",
            type: "out",
            quantity: feedDiff,
            notes: `Koreksi log harian (tambahan konsumsi) - ${newLog.kandangName} (Log Tanggal ${newLog.date})`,
            date: todayStr
          }, userId);
        } else {
          this.addStockTransaction({
            itemId: feedItem.id,
            itemName: feedItem.name,
            category: "feed",
            type: "in",
            quantity: Math.abs(feedDiff),
            notes: `Koreksi log harian (pengurangan konsumsi) - ${newLog.kandangName} (Log Tanggal ${newLog.date})`,
            date: todayStr
          }, userId);
        }
      }

      const eggDiff = newLog.eggCount - originalLog.eggCount;
      if (eggDiff !== 0 && eggItem) {
        if (eggDiff > 0) {
          this.addStockTransaction({
            itemId: eggItem.id,
            itemName: eggItem.name,
            category: "egg",
            type: "in",
            quantity: eggDiff,
            notes: `Koreksi log harian (tambahan produksi) - ${newLog.kandangName} (Log Tanggal ${newLog.date})`,
            date: todayStr
          }, userId);
        } else {
          this.addStockTransaction({
            itemId: eggItem.id,
            itemName: eggItem.name,
            category: "egg",
            type: "out",
            quantity: Math.abs(eggDiff),
            notes: `Koreksi log harian (pengurangan produksi) - ${newLog.kandangName} (Log Tanggal ${newLog.date})`,
            date: todayStr
          }, userId);
        }
      }
    }
  }

  public adjustStockForVaccination(userId: string, vac: VaccinationSchedule) {
    if (vac.status !== "Completed") return;
    if (!this.data.stockItems) this.data.stockItems = [];
    
    let vaccineItem = this.data.stockItems.find(
      s => s.userId === userId && 
           s.category === "vaccine" && 
           s.name.toLowerCase().includes(vac.vaccineName.toLowerCase())
    );

    if (!vaccineItem) {
      vaccineItem = this.data.stockItems.find(s => s.userId === userId && s.category === "vaccine");
    }

    if (vaccineItem && vaccineItem.quantity > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      this.addStockTransaction({
        itemId: vaccineItem.id,
        itemName: vaccineItem.name,
        category: "vaccine",
        type: "out",
        quantity: 1,
        notes: `Pemberian vaksin selesai otomatis - ${vac.kandangName} (${vac.vaccineName})`,
        date: todayStr
      }, userId);
    }
  }

  // ==========================================
  // SALES RECORDS OPERATIONS
  // ==========================================

  public getSalesRecords(userId: string): SalesRecord[] {
    if (!this.data.salesRecords) {
      this.data.salesRecords = [];
    }
    return this.data.salesRecords.filter((s) => s.userId === userId);
  }

  public upsertSalesRecord(record: SalesRecord, userId: string): void {
    if (!this.data.salesRecords) {
      this.data.salesRecords = [];
    }
    const recordWithUser = { ...record, userId };
    const index = this.data.salesRecords.findIndex((s) => s.id === record.id && s.userId === userId);
    
    let originalRecord: SalesRecord | null = null;
    if (index !== -1) {
      originalRecord = JSON.parse(JSON.stringify(this.data.salesRecords[index]));
      this.data.salesRecords[index] = {
        ...recordWithUser,
        lastUpdated: Date.now()
      };
    } else {
      this.data.salesRecords.push({
        ...recordWithUser,
        id: record.id || `sale-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: record.createdAt || Date.now(),
        lastUpdated: Date.now()
      });
    }
    
    // Auto adjust stock
    this.adjustStockForSale(userId, originalRecord, recordWithUser);
    
    this.save();
  }

  public deleteSalesRecord(id: string, userId: string): boolean {
    if (!this.data.salesRecords) return false;
    const index = this.data.salesRecords.findIndex((s) => s.id === id && s.userId === userId);
    if (index !== -1) {
      const originalRecord = JSON.parse(JSON.stringify(this.data.salesRecords[index]));
      this.data.salesRecords.splice(index, 1);
      
      // Auto adjust stock by reverting
      this.adjustStockForSale(userId, originalRecord, null);
      
      this.save();
      return true;
    }
    return false;
  }

  public adjustStockForSale(userId: string, originalSale: SalesRecord | null, newSale: SalesRecord | null) {
    if (!this.data.stockItems) this.data.stockItems = [];
    if (!this.data.stockTransactions) this.data.stockTransactions = [];

    let eggItem = this.data.stockItems.find(s => s.userId === userId && s.category === "egg");
    if (!eggItem) {
      this.seedDefaultStockForUser(userId);
      eggItem = this.data.stockItems.find(s => s.userId === userId && s.category === "egg");
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Helper to check if a sale is egg category and unit is 'butir' (case-insensitive)
    const isEggButir = (sale: SalesRecord | null): boolean => {
      return !!(sale && sale.category === "egg" && sale.unit && sale.unit.toLowerCase() === "butir");
    };

    // Case 1: New Sale
    if (!originalSale && newSale) {
      if (isEggButir(newSale) && newSale.quantity > 0 && eggItem) {
        this.addStockTransaction({
          itemId: eggItem.id,
          itemName: eggItem.name,
          category: "egg",
          type: "out",
          quantity: newSale.quantity,
          notes: `Penjualan telur otomatis - Pembeli: ${newSale.buyerName || "Umum"} (Ref: ${newSale.id})`,
          date: newSale.date || todayStr
        }, userId);
      }
    }
    // Case 2: Deleted Sale (revert the "out" transaction by doing an "in")
    else if (originalSale && !newSale) {
      if (isEggButir(originalSale) && originalSale.quantity > 0 && eggItem) {
        this.addStockTransaction({
          itemId: eggItem.id,
          itemName: eggItem.name,
          category: "egg",
          type: "in",
          quantity: originalSale.quantity,
          notes: `Reversi pembatalan penjualan telur - Ref: ${originalSale.id}`,
          date: todayStr
        }, userId);
      }
    }
    // Case 3: Updated Sale
    else if (originalSale && newSale) {
      const origIsButir = isEggButir(originalSale);
      const newIsButir = isEggButir(newSale);

      if (origIsButir && newIsButir) {
        const diff = newSale.quantity - originalSale.quantity;
        if (diff !== 0 && eggItem) {
          if (diff > 0) {
            this.addStockTransaction({
              itemId: eggItem.id,
              itemName: eggItem.name,
              category: "egg",
              type: "out",
              quantity: diff,
              notes: `Koreksi penjualan telur (tambahan quantity) - Ref: ${newSale.id}`,
              date: newSale.date || todayStr
            }, userId);
          } else {
            this.addStockTransaction({
              itemId: eggItem.id,
              itemName: eggItem.name,
              category: "egg",
              type: "in",
              quantity: Math.abs(diff),
              notes: `Koreksi penjualan telur (pengurangan quantity) - Ref: ${newSale.id}`,
              date: newSale.date || todayStr
            }, userId);
          }
        }
      }
      else if (origIsButir && !newIsButir && eggItem) {
        // Revert old transaction since new sale is no longer in "butir"
        this.addStockTransaction({
          itemId: eggItem.id,
          itemName: eggItem.name,
          category: "egg",
          type: "in",
          quantity: originalSale.quantity,
          notes: `Koreksi penjualan (perubahan satuan dari butir ke ${newSale.unit}) - Ref: ${newSale.id}`,
          date: todayStr
        }, userId);
      }
      else if (!origIsButir && newIsButir && eggItem) {
        // Deduct new transaction since new sale is now in "butir"
        this.addStockTransaction({
          itemId: eggItem.id,
          itemName: eggItem.name,
          category: "egg",
          type: "out",
          quantity: newSale.quantity,
          notes: `Koreksi penjualan (perubahan satuan menjadi butir) - Ref: ${newSale.id}`,
          date: newSale.date || todayStr
        }, userId);
      }
    }
  }
}

export const db = new DatabaseManager();
