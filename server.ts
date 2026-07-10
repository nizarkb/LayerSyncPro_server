import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";
import { LayerFarmLog, VaccinationSchedule, BiosecurityCheck, User, StockItem, StockTransaction, SalesRecord, Flock } from "./src/types.js";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "layersupersecretjwttoken123!";

// Express app initialization
const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Akses ditolak. Token tidak ditemukan." });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    // Check user in db to ensure active status and fetch latest SaaS details
    const userInDb = db.getUsers().find(u => u.id === verified.id);
    if (!userInDb) {
      res.status(401).json({ message: "User tidak ditemukan." });
      return;
    }
    if (userInDb.status === "suspended") {
      res.json({ success: false, isSuspended: true, message: "Akun Anda ditangguhkan (Suspended). Silakan hubungi admin atau selesaikan pembayaran langganan Anda." });
      return;
    }
    req.user = userInDb; // Use complete User object from DB with latest SaaS metadata
    next();
  } catch (error) {
    res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Email sender helper
async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    const config = db.getSmtpConfig();
    if (!config.host || !config.user) {
      console.warn("SMTP host or user is not configured in database. Skipping email sending.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port) || 587,
      secure: !!config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      timeout: 10000 // 10s
    } as any);

    await transporter.sendMail({
      from: `"${config.fromName || "Sistem Peternakan Layer"}" <${config.fromEmail || config.user}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`Email successfully sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

// Register
app.post("/api/auth/register", async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Username, email, dan password wajib diisi." });
    return;
  }

  // Check if username already exists
  if (db.getUserByUsername(username)) {
    res.status(400).json({ message: "Username sudah digunakan." });
    return;
  }

  // Check if email already exists
  if (db.getUserByEmail(email)) {
    res.status(400).json({ message: "Email sudah terdaftar." });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = db.createUser({
    username,
    email,
    role: role || "petugas",
    isVerified: false,
    verificationToken: verificationCode,
  }, passwordHash);

  // Seed default tenant environment for the newly registered user (Opsi B)
  db.seedUserData(newUser.id);

  let emailSent = false;
  let smtpWarning = false;

  const config = db.getSmtpConfig();
  if (config && config.host && config.user) {
    emailSent = await sendEmail(
      email,
      "Verifikasi Akun Anda - Sistem Peternakan Layer",
      `
        <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Selamat Datang di Sistem Peternakan Layer!</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-top: 16px;">Gunakan kode verifikasi berikut untuk menyelesaikan pendaftaran akun Anda:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e293b; margin: 24px 0; border-radius: 8px;">
            ${verificationCode}
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.4;">Kode verifikasi ini hanya berlaku untuk pendaftaran akun Anda. Harap tidak membagikan kode ini kepada siapa pun.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">Sistem Peternakan Layer © 2026</p>
        </div>
      `
    );
  } else {
    smtpWarning = true;
  }

  res.status(201).json({
    success: true,
    message: smtpWarning 
      ? "Registrasi berhasil! Akun Anda telah dibuat. Namun, SMTP belum dikonfigurasi oleh Super Admin. Harap hubungi Super Admin untuk memverifikasi akun Anda secara manual."
      : "Registrasi berhasil! Silakan periksa email Anda untuk memasukkan kode verifikasi 6-digit.",
    emailSent,
    smtpWarning,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified
    }
  });
});

// Verify email OTP
app.post("/api/auth/verify", (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ message: "Email dan kode verifikasi wajib diisi." });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ message: "Pengguna dengan email ini tidak ditemukan." });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ message: "Akun Anda sudah terverifikasi sebelumnya. Silakan login." });
    return;
  }

  if (user.verificationToken !== code) {
    res.status(400).json({ message: "Kode verifikasi salah atau tidak valid." });
    return;
  }

  db.setUserVerifiedStatus(user.id, true);
  res.json({ success: true, message: "Akun Anda berhasil diverifikasi. Silakan login." });
});

// Resend verification email
app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Email wajib diisi." });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ message: "Pengguna dengan email ini tidak ditemukan." });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ message: "Akun Anda sudah terverifikasi sebelumnya. Silakan login." });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setUserVerificationToken(user.id, code);

  const config = db.getSmtpConfig();
  if (!config.host || !config.user) {
    res.status(400).json({ success: false, message: "Pengaturan SMTP belum dikonfigurasi oleh Super Admin. Silakan hubungi Super Admin untuk verifikasi manual." });
    return;
  }

  const sent = await sendEmail(
    email,
    "Kode Verifikasi Baru - Sistem Peternakan Layer",
    `
      <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Kode Verifikasi Baru</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-top: 16px;">Berikut adalah kode verifikasi pendaftaran akun baru Anda yang berlaku:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e293b; margin: 24px 0; border-radius: 8px;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.4;">Kode ini menggantikan kode yang dikirim sebelumnya. Harap rahasiakan kode ini.</p>
      </div>
    `
  );

  if (sent) {
    res.json({ success: true, message: "Kode verifikasi baru berhasil dikirim ke email Anda." });
  } else {
    res.status(500).json({ success: false, message: "Gagal mengirimkan email verifikasi. Periksa konfigurasi SMTP atau coba lagi." });
  }
});

// Forgot Password - Send Reset OTP
app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Email wajib diisi." });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ message: "Pengguna dengan email tersebut tidak terdaftar di sistem." });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setUserResetToken(user.id, code, 15 * 60 * 1000); // 15 minutes validity

  const config = db.getSmtpConfig();
  if (!config.host || !config.user) {
    res.status(400).json({ success: false, message: "Fitur lupa kata sandi tidak aktif karena SMTP belum dikonfigurasi oleh Super Admin. Harap hubungi Super Admin Anda." });
    return;
  }

  const sent = await sendEmail(
    email,
    "Atur Ulang Kata Sandi - Sistem Peternakan Layer",
    `
      <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; background-color: #ffffff;">
        <h2 style="color: #991b1b; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 1px solid #fbf2f2; padding-bottom: 12px;">Atur Ulang Kata Sandi</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-top: 16px;">Kami menerima permintaan pengaturan ulang kata sandi untuk akun Anda. Silakan gunakan kode OTP berikut untuk melanjutkan:</p>
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #991b1b; margin: 24px 0; border-radius: 8px;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.4;">Kode OTP ini berlaku selama 15 menit. Jika Anda tidak merasa mengajukan permintaan ini, harap abaikan pesan ini.</p>
      </div>
    `
  );

  if (sent) {
    res.json({ success: true, message: "Kode OTP untuk mengatur ulang kata sandi telah dikirim ke email Anda." });
  } else {
    res.status(500).json({ success: false, message: "Gagal mengirim email reset kata sandi. Silakan coba kembali beberapa saat lagi." });
  }
});

// Reset Password - Verify Reset OTP and Set New Password
app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ message: "Email, kode OTP reset, dan kata sandi baru wajib diisi." });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ message: "Pengguna tidak ditemukan." });
    return;
  }

  if (user.resetToken !== code) {
    res.status(400).json({ message: "Kode OTP reset salah." });
    return;
  }

  if (!user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
    res.status(400).json({ message: "Kode OTP reset telah kedaluwarsa. Silakan ajukan ulang permintaan lupa kata sandi." });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  db.updatePassword(user.id, passwordHash);

  res.json({ success: true, message: "Kata sandi Anda berhasil diperbarui. Silakan login menggunakan kata sandi baru Anda." });
});

// Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { usernameOrEmail, username, password } = req.body;
  const identifier = usernameOrEmail || username;

  if (!identifier || !password) {
    res.status(400).json({ message: "Username/Email dan password wajib diisi." });
    return;
  }

  // Find user by username or email
  let user = db.getUserByUsername(identifier);
  if (!user) {
    user = db.getUserByEmail(identifier);
  }

  if (!user) {
    res.status(400).json({ message: "Username atau password salah." });
    return;
  }

  // Check email verification status
  if (user.isVerified === false) {
    res.status(400).json({ 
      isUnverified: true, 
      email: user.email, 
      message: "Akun Anda belum terverifikasi. Silakan lakukan verifikasi email terlebih dahulu." 
    });
    return;
  }

  const passwordHash = db.getPasswordHash(user.id);
  if (!passwordHash || !bcrypt.compareSync(password, passwordHash)) {
    res.status(400).json({ message: "Username atau password salah." });
    return;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Login berhasil.",
    token,
    user,
  });
});

// Get profile
app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST simulate upgrade (Self-service upgrade simulator for tenants)
app.post("/api/auth/simulate-upgrade", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { plan } = req.body;
  if (!plan || !["free", "pro", "enterprise"].includes(plan)) {
    res.status(400).json({ success: false, message: "Plan langganan tidak valid." });
    return;
  }

  const status = req.user!.status || "active";
  db.updateTenantSaaS(req.user!.id, plan, status);

  const updatedUser = db.getUsers().find(u => u.id === req.user!.id);
  res.json({
    success: true,
    message: `Selamat! Simulasi upgrade ke paket ${plan.toUpperCase()} berhasil. Kuota Anda telah diperluas secara otomatis.`,
    user: updatedUser
  });
});

// POST clear all user data (Clean slate)
app.post("/api/auth/clear-my-data", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.clearData(req.user!.id);
    res.json({
      success: true,
      message: "Seluruh data peternakan Anda (kandang, flock, log harian, vaksinasi, biosekuriti, stok, dan penjualan) berhasil dihapus secara permanen."
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menghapus data peternakan.", error: error.message });
  }
});

// ==========================================
// SUPER ADMIN ENDPOINTS
// ==========================================

// GET all users (Super Admin only)
app.get("/api/superadmin/users", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin yang dapat mengelola pengguna." });
    return;
  }
  res.json(db.getUsers());
});

// GET tenants data stats (Super Admin only)
app.get("/api/superadmin/tenants-stats", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin yang dapat mengakses statistik tenant." });
    return;
  }
  res.json(db.getTenantsStats());
});

// GET tenant details (Super Admin only)
app.get("/api/superadmin/tenants/:userId/details", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  const details = db.getTenantDetails(req.params.userId);
  if (!details) {
    res.status(404).json({ success: false, message: "Tenant tidak ditemukan." });
    return;
  }
  res.json(details);
});

// PUT update tenant SaaS subscription (Super Admin only)
app.put("/api/superadmin/tenants/:userId/saas", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  const { plan, status } = req.body;
  if (!plan || !status) {
    res.status(400).json({ success: false, message: "Plan dan Status wajib diisi." });
    return;
  }
  const success = db.updateTenantSaaS(req.params.userId, plan, status);
  if (!success) {
    res.status(404).json({ success: false, message: "Tenant tidak ditemukan." });
    return;
  }
  res.json({ success: true, message: "Subscription SaaS tenant berhasil diperbarui." });
});

// PUT update user role (Super Admin only)
app.put("/api/superadmin/users/:id/role", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  const { role } = req.body;
  if (!role || (role !== "superadmin" && role !== "admin" && role !== "petugas")) {
    res.status(400).json({ success: false, message: "Role tidak valid." });
    return;
  }
  const success = db.updateUserRole(req.params.id, role);
  if (!success) {
    res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    return;
  }
  res.json({ success: true, message: `Berhasil mengubah role menjadi ${role}.` });
});

// PUT update user verification status (Super Admin only)
app.put("/api/superadmin/users/:id/verified", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  const { isVerified } = req.body;
  const success = db.setUserVerifiedStatus(req.params.id, !!isVerified);
  if (!success) {
    res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    return;
  }
  res.json({ success: true, message: "Status verifikasi berhasil diubah." });
});

// DELETE user (Super Admin only)
app.delete("/api/superadmin/users/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  if (req.params.id === req.user.id) {
    res.status(400).json({ success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." });
    return;
  }
  const success = db.deleteUser(req.params.id);
  if (!success) {
    res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    return;
  }
  res.json({ success: true, message: "Pengguna berhasil dihapus dari sistem." });
});

// GET SMTP settings (Super Admin only)
app.get("/api/superadmin/smtp", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  res.json(db.getSmtpConfig());
});

// POST save SMTP settings (Super Admin only)
app.post("/api/superadmin/smtp", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  const { host, port, secure, user, pass, fromName, fromEmail } = req.body;
  
  db.setSmtpConfig({
    host: host || "",
    port: Number(port) || 587,
    secure: !!secure,
    user: user || "",
    pass: pass || "",
    fromName: fromName || "Sistem Peternakan Layer",
    fromEmail: fromEmail || "",
  });
  
  res.json({ success: true, message: "Konfigurasi SMTP berhasil disimpan." });
});

// POST test SMTP connection (Super Admin only)
app.post("/api/superadmin/smtp/test", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== "superadmin") {
    res.status(403).json({ success: false, message: "Akses ditolak. Hanya Super Admin." });
    return;
  }
  
  const { host, port, secure, user, pass, fromName, fromEmail, testEmail } = req.body;
  if (!host || !user || !pass || !testEmail) {
    res.status(400).json({ success: false, message: "Parameter host, user, pass, dan email pengetesan wajib diisi." });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: !!secure,
      auth: { user, pass },
      timeout: 10000 // 10 seconds
    } as any);

    await transporter.verify();

    await transporter.sendMail({
      from: `"${fromName || "Sistem Peternakan Layer"}" <${fromEmail || user}>`,
      to: testEmail,
      subject: "Uji Coba Hubungan SMTP - Sukses!",
      html: `
        <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 500px; border: 1px solid #22c55e; border-radius: 12px; margin: 0 auto; background-color: #ffffff;">
          <h2 style="color: #15803d; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 1px solid #f0fdf4; padding-bottom: 12px;">Koneksi SMTP Berhasil!</h2>
          <p style="font-size: 14px; color: #1e293b; line-height: 1.5; margin-top: 16px;">Pengujian SMTP Anda pada Panel Layanan Super Admin berhasil dilakukan.</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Pengaturan ini sekarang aman digunakan untuk mengirimkan kode verifikasi OTP pendaftaran pelanggan dan pengaturan ulang kata sandi.</p>
          <hr style="border: 0; border-top: 1px solid #f0fdf4; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">Sistem Peternakan Layer © 2026</p>
        </div>
      `
    });

    res.json({ success: true, message: "Koneksi SMTP berhasil! Email uji coba berhasil dikirim ke " + testEmail });
  } catch (error: any) {
    console.error("SMTP direct test error:", error);
    res.status(500).json({ success: false, message: "Koneksi SMTP Gagal: " + error.message });
  }
});


// ==========================================
// SYNC ENDPOINTS (For Mobile App Integration)
// ==========================================

// POST /api/sync/push - Receive local data from Android App and save it
app.post("/api/sync/push", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mobile can send logs array directly, or a structured payload: { logs, vaccinations, biosecurity }
    let incomingLogs: LayerFarmLog[] = [];
    let incomingVaccinations: VaccinationSchedule[] = [];
    let incomingBiosecurity: BiosecurityCheck[] = [];

    const body = req.body;
    
    if (Array.isArray(body)) {
      // Direct array is treated as LayerFarmLog array
      incomingLogs = body;
    } else if (body && typeof body === "object") {
      if (Array.isArray(body.logs)) incomingLogs = body.logs;
      if (Array.isArray(body.vaccinations)) incomingVaccinations = body.vaccinations;
      if (Array.isArray(body.biosecurity)) incomingBiosecurity = body.biosecurity;
      
      // Fallback: if just a single log is sent
      if (!body.logs && !body.vaccinations && !body.biosecurity && body.id && body.kandangName) {
        incomingLogs = [body as LayerFarmLog];
      }
    }

    const syncedIds: string[] = [];

    // Process logs
    incomingLogs.forEach((log) => {
      if (log.id && log.kandangName) {
        db.upsertLog({
          ...log,
          eggCount: Number(log.eggCount) || 0,
          eggWeight: Number(log.eggWeight) || 0,
          feedAmount: Number(log.feedAmount) || 0,
          chickenDead: Number(log.chickenDead) || 0,
          lastUpdated: log.lastUpdated || Date.now(),
        }, req.user!.id);
        syncedIds.push(log.id);
      }
    });

    // Process vaccinations
    incomingVaccinations.forEach((vac) => {
      if (vac.id && vac.vaccineName) {
        db.upsertVaccination({
          ...vac,
          lastUpdated: vac.lastUpdated || Date.now(),
        }, req.user!.id);
        syncedIds.push(vac.id);
      }
    });

    // Process biosecurity checklist
    incomingBiosecurity.forEach((bio) => {
      if (bio.id && bio.inspectorName) {
        db.upsertBiosecurity({
          ...bio,
          timestamp: bio.timestamp || Date.now(),
        }, req.user!.id);
        syncedIds.push(bio.id);
      }
    });

    res.json({
      success: true,
      message: "Sinkronisasi (push) berhasil diproses.",
      syncedIds,
    });
  } catch (error: any) {
    console.error("Sync push error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan internal sinkronisasi server.", error: error.message });
  }
});

// GET /api/sync/pull - Send updated server-side data to Android App
app.get("/api/sync/pull", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const lastSyncStr = req.query.lastSyncTimestamp;
    const lastSyncTimestamp = lastSyncStr ? parseInt(lastSyncStr as string, 10) : 0;

    const allLogs = db.getLogs(req.user!.id);
    const allVaccinations = db.getVaccinations(req.user!.id);
    const allBiosecurity = db.getBiosecurityChecks(req.user!.id);

    // Filter updated data
    const updatedLogs = allLogs.filter((log) => (log.lastUpdated || 0) > lastSyncTimestamp);
    const updatedVaccinations = allVaccinations.filter((v) => (v.lastUpdated || 0) > lastSyncTimestamp);
    const updatedBiosecurity = allBiosecurity.filter((b) => (b.timestamp || 0) > lastSyncTimestamp);

    res.json({
      logs: updatedLogs,
      vaccinations: updatedVaccinations,
      biosecurity: updatedBiosecurity,
      serverTimestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Sync pull error:", error);
    res.status(500).json({ message: "Gagal menarik data sinkronisasi.", error: error.message });
  }
});

// POST /api/sync/reset - Clear all logs, vaccinations, biosecurity and kandangs (admin only)
app.post("/api/sync/reset", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
      res.status(403).json({ success: false, message: "Hanya Admin dan Super Admin yang dapat menghapus seluruh data operasional." });
      return;
    }

    db.clearData(req.user!.id);
    res.json({ success: true, message: "Seluruh data operasional berhasil dihapus. Database siap disinkronkan dari perangkat Android." });
  } catch (error: any) {
    console.error("Reset database error:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus data operasional.", error: error.message });
  }
});


// ==========================================
// CORE CRUD API: LAYER FARM LOGS
// ==========================================

// GET all logs (with optional filters)
app.get("/api/logs", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  let logs = db.getLogs(req.user!.id);

  const { kandangName, date, startDate, endDate } = req.query;

  if (kandangName) {
    logs = logs.filter((l) => l.kandangName.toLowerCase() === (kandangName as string).toLowerCase());
  }
  if (date) {
    logs = logs.filter((l) => l.date === date);
  }
  if (startDate && endDate) {
    logs = logs.filter((l) => l.date >= (startDate as string) && l.date <= (endDate as string));
  }

  // Sort logs by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));

  res.json(logs);
});

// POST new log
app.post("/api/logs", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kandangName, date, eggCount, eggWeight, feedAmount, chickenDead, notes, deathReason } = req.body;

    if (!kandangName || !date) {
      res.status(400).json({ message: "Kandang dan tanggal wajib diisi." });
      return;
    }

    const existingLogs = db.getLogs(req.user!.id);
    const maxLogs = req.user!.maxLogs !== undefined ? req.user!.maxLogs : 30;
    if (existingLogs.length >= maxLogs) {
      res.json({
        success: false,
        quotaExceeded: true,
        limitType: "logs",
        message: `Batas kuota log harian terlampaui. Akun Anda (Paket ${req.user!.plan?.toUpperCase()}) hanya diperbolehkan maksimal ${maxLogs} log. Silakan hubungi admin atau upgrade paket Anda ke PRO untuk mendapatkan kapasitas lebih.`
      });
      return;
    }

    const newLog: LayerFarmLog = {
      id: `log-${req.user!.id}-${kandangName.replace(/\s+/g, "-").toLowerCase()}-${date}-${Date.now().toString(36)}`,
      kandangName,
      date,
      eggCount: Number(eggCount) || 0,
      eggWeight: Number(eggWeight) || 0,
      feedAmount: Number(feedAmount) || 0,
      chickenDead: Number(chickenDead) || 0,
      deathReason: deathReason || "",
      notes: notes || "",
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    };

    db.upsertLog(newLog, req.user!.id);
    db.adjustStockForLog(req.user!.id, null, newLog);
    db.adjustFlockAndKandangForLog(req.user!.id, null, newLog);
    res.status(201).json({ message: "Log harian berhasil disimpan.", log: newLog });
  } catch (error: any) {
    console.error("Error saving daily log:", error);
    res.status(500).json({ message: `Gagal menyimpan log harian: ${error.message}` });
  }
});

// PUT update log
app.put("/api/logs/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getLogs(req.user!.id).find((l) => l.id === id);

    if (!existing) {
      res.status(404).json({ message: "Log tidak ditemukan." });
      return;
    }

    const oldLog = { ...existing };
    const updatedLog: LayerFarmLog = {
      ...existing,
      ...req.body,
      id, // ensure ID can't be overwritten
      eggCount: req.body.eggCount !== undefined ? Number(req.body.eggCount) : existing.eggCount,
      eggWeight: req.body.eggWeight !== undefined ? Number(req.body.eggWeight) : existing.eggWeight,
      feedAmount: req.body.feedAmount !== undefined ? Number(req.body.feedAmount) : existing.feedAmount,
      chickenDead: req.body.chickenDead !== undefined ? Number(req.body.chickenDead) : existing.chickenDead,
      lastUpdated: Date.now(),
    };

    db.upsertLog(updatedLog, req.user!.id);
    db.adjustStockForLog(req.user!.id, oldLog, updatedLog);
    db.adjustFlockAndKandangForLog(req.user!.id, oldLog, updatedLog);
    res.json({ message: "Log harian berhasil diperbarui.", log: updatedLog });
  } catch (error: any) {
    console.error("Error updating daily log:", error);
    res.status(500).json({ message: `Gagal memperbarui log harian: ${error.message}` });
  }
});

// DELETE log
app.delete("/api/logs/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getLogs(req.user!.id).find((l) => l.id === id);

    if (!existing) {
      res.status(404).json({ message: "Log tidak ditemukan." });
      return;
    }

    const deleted = db.deleteLog(id, req.user!.id);
    if (deleted) {
      db.adjustStockForLog(req.user!.id, existing, null);
      db.adjustFlockAndKandangForLog(req.user!.id, existing, null);
    }

    res.json({ message: "Log harian berhasil dihapus." });
  } catch (error: any) {
    console.error("Error deleting daily log:", error);
    res.status(500).json({ message: `Gagal menghapus log harian: ${error.message}` });
  }
});


// ==========================================
// CORE CRUD API: VACCINATION SCHEDULES
// ==========================================

// GET all vaccinations (with optional status filter)
app.get("/api/vaccinations", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  let vax = db.getVaccinations(req.user!.id);
  const { status } = req.query;

  if (status) {
    vax = vax.filter((v) => v.status.toLowerCase() === (status as string).toLowerCase());
  }

  // Sort by plannedDate descending
  vax.sort((a, b) => b.plannedDate.localeCompare(a.plannedDate));

  res.json(vax);
});

// POST new vaccination schedule
app.post("/api/vaccinations", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { kandangName, vaccineName, plannedDate, method, ageWeeks, notes } = req.body;

  if (!kandangName || !vaccineName || !plannedDate || !method) {
    res.status(400).json({ message: "Nama kandang, vaksin, tanggal direncanakan, dan metode wajib diisi." });
    return;
  }

  const newVax: VaccinationSchedule = {
    id: `vax-${req.user!.id}-${Date.now().toString(36)}`,
    kandangName,
    vaccineName,
    plannedDate,
    actualDate: null,
    method,
    status: "Pending",
    notes: notes || "",
    ageWeeks: Number(ageWeeks) || 0,
    lastUpdated: Date.now(),
  };

  db.upsertVaccination(newVax, req.user!.id);
  res.status(201).json({ message: "Jadwal vaksinasi berhasil ditambahkan.", vaccination: newVax });
});

// PUT update vaccination (or quick complete)
app.put("/api/vaccinations/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getVaccinations(req.user!.id).find((v) => v.id === id);

  if (!existing) {
    res.status(404).json({ message: "Jadwal vaksinasi tidak ditemukan." });
    return;
  }

  const updatedVax: VaccinationSchedule = {
    ...existing,
    ...req.body,
    id,
    lastUpdated: Date.now(),
  };

  const isTransitioningToCompleted = existing.status === "Pending" && req.body.status === "Completed";
  db.upsertVaccination(updatedVax, req.user!.id);
  if (isTransitioningToCompleted) {
    db.adjustStockForVaccination(req.user!.id, updatedVax);
  }
  res.json({ message: "Jadwal vaksinasi berhasil diperbarui.", vaccination: updatedVax });
});

// DELETE vaccination
app.delete("/api/vaccinations/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteVaccination(id, req.user!.id);

  if (!deleted) {
    res.status(404).json({ message: "Jadwal vaksinasi tidak ditemukan." });
    return;
  }

  res.json({ message: "Jadwal vaksinasi berhasil dihapus." });
});


// ==========================================
// CORE CRUD API: BIOSECURITY CHECKS
// ==========================================

// GET all biosecurity checks
app.get("/api/biosecurity", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const checks = db.getBiosecurityChecks(req.user!.id);
  // Sort by date descending
  const sorted = [...checks].sort((a, b) => b.date.localeCompare(a.date));
  res.json(sorted);
});

// POST new biosecurity check
app.post("/api/biosecurity", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const {
    date,
    inspectorName,
    footBathActive,
    vehicleSpray,
    feedWarehouseClean,
    cageWalkwayClean,
    safeMortalityDisposal,
    eggTrayDisinfected,
    waterSanitization,
    wildBirdControl,
    notes,
  } = req.body;

  if (!date || !inspectorName) {
    res.status(400).json({ message: "Tanggal dan nama pengawas wajib diisi." });
    return;
  }

  // Calculate score automatically based on 8 items
  const items = [
    !!footBathActive,
    !!vehicleSpray,
    !!feedWarehouseClean,
    !!cageWalkwayClean,
    !!safeMortalityDisposal,
    !!eggTrayDisinfected,
    !!waterSanitization,
    !!wildBirdControl,
  ];
  const checkedCount = items.filter(Boolean).length;
  const score = Math.round((checkedCount / 8) * 100);

  const newCheck: BiosecurityCheck = {
    id: `bio-${req.user!.id}-${date}-${Date.now().toString(36)}`,
    date,
    inspectorName,
    footBathActive: !!footBathActive,
    vehicleSpray: !!vehicleSpray,
    feedWarehouseClean: !!feedWarehouseClean,
    cageWalkwayClean: !!cageWalkwayClean,
    safeMortalityDisposal: !!safeMortalityDisposal,
    eggTrayDisinfected: !!eggTrayDisinfected,
    waterSanitization: !!waterSanitization,
    wildBirdControl: !!wildBirdControl,
    score,
    notes: notes || "",
    timestamp: Date.now(),
  };

  db.upsertBiosecurity(newCheck, req.user!.id);
  res.status(201).json({ message: "Inspeksi biosekuriti berhasil disimpan.", check: newCheck });
});

// DELETE biosecurity report
app.delete("/api/biosecurity/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteBiosecurity(id, req.user!.id);

  if (!deleted) {
    res.status(404).json({ message: "Laporan biosekuriti tidak ditemukan." });
    return;
  }

  res.json({ message: "Laporan biosekuriti berhasil dihapus." });
});


// ==========================================
// CORE CRUD API: KANDANGS (Cages)
// ==========================================

// GET all kandangs
app.get("/api/kandangs", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = db.getKandangs(req.user!.id);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: "Gagal memuat daftar kandang.", error: error.message });
  }
});

// POST new kandang
app.post("/api/kandangs", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, population } = req.body;
    if (!name) {
      res.status(400).json({ message: "Nama kandang wajib diisi." });
      return;
    }

    const existingList = db.getKandangs(req.user!.id);
    const maxKandangs = req.user!.maxKandangs !== undefined ? req.user!.maxKandangs : 2;
    if (existingList.length >= maxKandangs) {
      res.json({
        success: false,
        quotaExceeded: true,
        limitType: "kandang",
        message: `Batas kuota kandang terlampaui. Akun Anda (Paket ${req.user!.plan?.toUpperCase()}) hanya diperbolehkan maksimal ${maxKandangs} kandang. Silakan hubungi admin atau upgrade paket Anda ke PRO untuk mendapatkan kapasitas lebih.`
      });
      return;
    }

    const newKandang = {
      id: `k-${req.user!.id}-${Date.now().toString(36)}`,
      name,
      population: Number(population) || 0,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    db.upsertKandang(newKandang, req.user!.id);
    res.status(201).json({ message: "Kandang berhasil ditambahkan.", kandang: newKandang });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal menambahkan kandang.", error: error.message });
  }
});

// PUT update kandang
app.put("/api/kandangs/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, population } = req.body;
    const existingList = db.getKandangs(req.user!.id);
    const existing = existingList.find((k) => k.id === id);

    if (!existing) {
      res.status(404).json({ message: "Kandang tidak ditemukan." });
      return;
    }

    const updatedKandang = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      population: population !== undefined ? Number(population) : existing.population,
      lastUpdated: Date.now()
    };

    db.upsertKandang(updatedKandang, req.user!.id);
    res.json({ message: "Kandang berhasil diperbarui.", kandang: updatedKandang });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal memperbarui kandang.", error: error.message });
  }
});

// DELETE kandang
app.delete("/api/kandangs/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteKandang(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ message: "Kandang tidak ditemukan." });
      return;
    }

    res.json({ message: "Kandang berhasil dihapus." });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal menghapus kandang.", error: error.message });
  }
});


// ==========================================
// CORE CRUD API: FLOCKS (Flock Management)
// ==========================================

// GET all flocks
app.get("/api/flocks", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = db.getFlocks(req.user!.id);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: "Gagal memuat daftar flock.", error: error.message });
  }
});

// POST new flock
app.post("/api/flocks", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kandangId, kandangName, name, breed, initialPopulation, currentPopulation, entryDate, hatchDate, ageWeeksAtEntry, status, notes } = req.body;
    if (!name || !breed || !kandangId) {
      res.status(400).json({ message: "Kandang, nama flock, dan jenis strain wajib diisi." });
      return;
    }

    const newFlock: Flock = {
      id: `f-${req.user!.id}-${Date.now().toString(36)}`,
      kandangId,
      kandangName: kandangName || "Kandang",
      name,
      breed,
      initialPopulation: Number(initialPopulation) || 0,
      currentPopulation: Number(currentPopulation) !== undefined ? Number(currentPopulation) : (Number(initialPopulation) || 0),
      entryDate: entryDate || new Date().toISOString().split("T")[0],
      hatchDate: hatchDate || new Date().toISOString().split("T")[0],
      ageWeeksAtEntry: Number(ageWeeksAtEntry) || 18,
      status: status || "active",
      notes: notes || "",
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    db.upsertFlock(newFlock, req.user!.id);
    res.status(201).json({ message: "Flock berhasil ditambahkan.", flock: newFlock });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal menambahkan flock ayam baru.", error: error.message });
  }
});

// PUT update flock
app.put("/api/flocks/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingList = db.getFlocks(req.user!.id);
    const existing = existingList.find((f) => f.id === id);

    if (!existing) {
      res.status(404).json({ message: "Flock tidak ditemukan." });
      return;
    }

    const updatedFlock: Flock = {
      ...existing,
      ...req.body,
      id, // ensure ID cannot be changed
      initialPopulation: req.body.initialPopulation !== undefined ? Number(req.body.initialPopulation) : existing.initialPopulation,
      currentPopulation: req.body.currentPopulation !== undefined ? Number(req.body.currentPopulation) : existing.currentPopulation,
      ageWeeksAtEntry: req.body.ageWeeksAtEntry !== undefined ? Number(req.body.ageWeeksAtEntry) : existing.ageWeeksAtEntry,
      lastUpdated: Date.now()
    };

    db.upsertFlock(updatedFlock, req.user!.id);
    res.json({ message: "Flock berhasil diperbarui.", flock: updatedFlock });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal memperbarui rincian flock.", error: error.message });
  }
});

// DELETE flock
app.delete("/api/flocks/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteFlock(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ message: "Flock tidak ditemukan." });
      return;
    }

    res.json({ message: "Flock berhasil dihapus." });
  } catch (error: any) {
    res.status(500).json({ message: "Gagal menghapus flock.", error: error.message });
  }
});


// ==========================================
// ANALYTICS & DASHBOARD ENDPOINTS
// ==========================================

app.get("/api/dashboard/summary", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.getLogs(req.user!.id);
    const vaccinations = db.getVaccinations(req.user!.id);
    const biosecurity = db.getBiosecurityChecks(req.user!.id);

    if (logs.length === 0) {
      res.json({
        todayEggs: 0,
        todayEggWeight: 0,
        todayFeedAmount: 0,
        todayMortality: 0,
        todayFcr: 0,
        avgBiosecurityScore: 0,
        pendingVaccinationsCount: 0,
        kandangPerformance: [],
        recentActivity: [],
      });
      return;
    }

    // Find the latest active logging date in database (so dashboard shows beautiful populated figures)
    const sortedDates = Array.from(new Set(logs.map((l) => l.date))).sort((a, b) => b.localeCompare(a));
    const targetDate = sortedDates[0] || new Date().toISOString().split("T")[0];

    // Filter today's (latest date's) logs
    const todayLogs = logs.filter((l) => l.date === targetDate);

    const todayEggs = todayLogs.reduce((sum, l) => sum + l.eggCount, 0);
    const todayEggWeight = parseFloat(todayLogs.reduce((sum, l) => sum + l.eggWeight, 0).toFixed(2));
    const todayFeedAmount = parseFloat(todayLogs.reduce((sum, l) => sum + l.feedAmount, 0).toFixed(2));
    const todayMortality = todayLogs.reduce((sum, l) => sum + l.chickenDead, 0);

    // FCR: Total Feed (kg) / Total Egg Weight (kg)
    const todayFcr = todayEggWeight > 0 ? parseFloat((todayFeedAmount / todayEggWeight).toFixed(2)) : 0;

    // Avg Biosecurity Compliance score
    const avgBiosecurityScore = biosecurity.length > 0
      ? Math.round(biosecurity.reduce((sum, b) => sum + b.score, 0) / biosecurity.length)
      : 0;

    // Count pending vaccinations
    const pendingVaccinationsCount = vaccinations.filter((v) => v.status === "Pending").length;

    // Performance by Kandang (cumulative summary)
    const kandangNames = Array.from(new Set(logs.map((l) => l.kandangName)));
    const kandangPerformance = kandangNames.map((kName) => {
      const kLogs = logs.filter((l) => l.kandangName === kName);
      const totalEggs = kLogs.reduce((sum, l) => sum + l.eggCount, 0);
      const totalEggWeight = parseFloat(kLogs.reduce((sum, l) => sum + l.eggWeight, 0).toFixed(2));
      const totalFeed = parseFloat(kLogs.reduce((sum, l) => sum + l.feedAmount, 0).toFixed(2));
      const totalDead = kLogs.reduce((sum, l) => sum + l.chickenDead, 0);
      const avgFcr = totalEggWeight > 0 ? parseFloat((totalFeed / totalEggWeight).toFixed(2)) : 0;

      return {
        kandangName: kName,
        totalEggs,
        totalEggWeight,
        totalFeed,
        totalDead,
        avgFcr,
      };
    });

    // Recent Activities (unified chronological timeline)
    const activities: { id: string; type: "log" | "vaccination" | "biosecurity"; title: string; subtitle: string; timestamp: number }[] = [];

    // Latest 5 logs
    const sortedLogs = [...logs].sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 5);
    sortedLogs.forEach((l) => {
      activities.push({
        id: l.id,
        type: "log",
        title: `Log Produksi ${l.kandangName}`,
        subtitle: `${l.eggCount} butir telur (${l.eggWeight} kg) - Pakan: ${l.feedAmount} kg`,
        timestamp: l.lastUpdated,
      });
    });

    // Latest 3 vaccinations (completed or added)
    const sortedVax = [...vaccinations].sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 3);
    sortedVax.forEach((v) => {
      activities.push({
        id: v.id,
        type: "vaccination",
        title: `Vaksinasi: ${v.vaccineName}`,
        subtitle: `${v.kandangName} (${v.method}) - Status: ${v.status === "Completed" ? "Selesai" : "Direncanakan"}`,
        timestamp: v.lastUpdated,
      });
    });

    // Latest 3 biosecurity checks
    const sortedBio = [...biosecurity].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    sortedBio.forEach((b) => {
      activities.push({
        id: b.id,
        type: "biosecurity",
        title: `Inspeksi Biosekuriti`,
        subtitle: `Pengawas: ${b.inspectorName} - Skor Kepatuhan: ${b.score}%`,
        timestamp: b.timestamp,
      });
    });

    // Sort combined activities descending by timestamp
    const recentActivity = activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

    res.json({
      todayEggs,
      todayEggWeight,
      todayFeedAmount,
      todayMortality,
      todayFcr,
      avgBiosecurityScore,
      pendingVaccinationsCount,
      kandangPerformance,
      recentActivity,
      targetDate, // inform frontend which date this refers to
    });
  } catch (error: any) {
    console.error("Dashboard summary calculation error:", error);
    res.status(500).json({ message: "Gagal menghitung statistik ringkasan.", error: error.message });
  }
});


// ==========================================
// CORE CRUD API: STOCK / INVENTORY MANAGEMENT
// ==========================================

// GET all stock items
app.get("/api/stock", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = db.getStockItems(req.user!.id);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil data stok.", error: error.message });
  }
});

// POST a new stock item
app.post("/api/stock", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, quantity, unit, minStock } = req.body;
    if (!name || !category || quantity === undefined || !unit || minStock === undefined) {
      res.status(400).json({ message: "Semua parameter stok wajib diisi." });
      return;
    }

    const newItem: StockItem = {
      id: `s-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user!.id,
      name,
      category,
      quantity: Number(quantity) || 0,
      unit,
      minStock: Number(minStock) || 0,
      lastUpdated: Date.now()
    };

    db.upsertStockItem(newItem, req.user!.id);
    res.status(201).json({ success: true, message: "Item stok berhasil ditambahkan.", item: newItem });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menambahkan item stok.", error: error.message });
  }
});

// PUT update a stock item
app.put("/api/stock/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getStockItems(req.user!.id).find((s) => s.id === id);

    if (!existing) {
      res.status(404).json({ message: "Item stok tidak ditemukan." });
      return;
    }

    const updatedItem: StockItem = {
      ...existing,
      ...req.body,
      id,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : existing.quantity,
      minStock: req.body.minStock !== undefined ? Number(req.body.minStock) : existing.minStock,
      lastUpdated: Date.now()
    };

    db.upsertStockItem(updatedItem, req.user!.id);
    res.json({ success: true, message: "Item stok berhasil diperbarui.", item: updatedItem });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui item stok.", error: error.message });
  }
});

// DELETE a stock item
app.delete("/api/stock/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteStockItem(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ message: "Item stok tidak ditemukan." });
      return;
    }

    res.json({ success: true, message: "Item stok berhasil dihapus." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menghapus item stok.", error: error.message });
  }
});

// GET all stock transactions
app.get("/api/stock/transactions", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactions = db.getStockTransactions(req.user!.id);
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil riwayat transaksi stok.", error: error.message });
  }
});

// POST log a stock transaction manually
app.post("/api/stock/transactions", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, type, quantity, notes, date } = req.body;
    if (!itemId || !type || !quantity || !notes || !date) {
      res.status(400).json({ message: "Parameter transaksi stok tidak lengkap." });
      return;
    }

    const item = db.getStockItems(req.user!.id).find((s) => s.id === itemId);
    if (!item) {
      res.status(404).json({ message: "Item stok tidak ditemukan." });
      return;
    }

    const newTx = db.addStockTransaction({
      itemId,
      itemName: item.name,
      category: item.category,
      type,
      quantity: Number(quantity),
      notes,
      date
    }, req.user!.id);

    res.status(201).json({ success: true, message: "Transaksi stok berhasil disimpan.", transaction: newTx });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menyimpan transaksi stok.", error: error.message });
  }
});


// ==========================================
// CORE CRUD API: SALES / PENJUALAN MANAGEMENT
// ==========================================

// GET all sales records
app.get("/api/sales", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const sales = db.getSalesRecords(req.user!.id);
    // Sort descending by date, then by lastUpdated
    sales.sort((a, b) => b.date.localeCompare(a.date) || b.lastUpdated - a.lastUpdated);
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil data penjualan.", error: error.message });
  }
});

// POST a new sales record
app.post("/api/sales", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, category, quantity, unit, unitPrice, buyerName, paymentStatus, notes } = req.body;
    if (!date || !category || quantity === undefined || !unit || unitPrice === undefined || !paymentStatus) {
      res.status(400).json({ message: "Parameter penjualan tidak lengkap." });
      return;
    }

    const newSale: SalesRecord = {
      id: `sale-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user!.id,
      date,
      category,
      quantity: Number(quantity) || 0,
      unit,
      unitPrice: Number(unitPrice) || 0,
      totalPrice: (Number(quantity) || 0) * (Number(unitPrice) || 0),
      buyerName: buyerName || "",
      paymentStatus,
      notes: notes || "",
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    db.upsertSalesRecord(newSale, req.user!.id);
    res.status(201).json({ success: true, message: "Catatan penjualan berhasil disimpan.", sale: newSale });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menyimpan catatan penjualan.", error: error.message });
  }
});

// PUT update an existing sales record
app.put("/api/sales/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getSalesRecords(req.user!.id).find((s) => s.id === id);

    if (!existing) {
      res.status(404).json({ message: "Catatan penjualan tidak ditemukan." });
      return;
    }

    const { date, category, quantity, unit, unitPrice, buyerName, paymentStatus, notes } = req.body;

    const qtyVal = quantity !== undefined ? Number(quantity) : existing.quantity;
    const priceVal = unitPrice !== undefined ? Number(unitPrice) : existing.unitPrice;

    const updatedSale: SalesRecord = {
      ...existing,
      date: date || existing.date,
      category: category || existing.category,
      quantity: qtyVal,
      unit: unit || existing.unit,
      unitPrice: priceVal,
      totalPrice: qtyVal * priceVal,
      buyerName: buyerName !== undefined ? buyerName : existing.buyerName,
      paymentStatus: paymentStatus || existing.paymentStatus,
      notes: notes !== undefined ? notes : existing.notes,
      lastUpdated: Date.now()
    };

    db.upsertSalesRecord(updatedSale, req.user!.id);
    res.json({ success: true, message: "Catatan penjualan berhasil diperbarui.", sale: updatedSale });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui catatan penjualan.", error: error.message });
  }
});

// DELETE a sales record
app.delete("/api/sales/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteSalesRecord(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ message: "Catatan penjualan tidak ditemukan." });
      return;
    }

    res.json({ success: true, message: "Catatan penjualan berhasil dihapus." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menghapus catatan penjualan.", error: error.message });
  }
});


// ==========================================
// VITE DEV SERVER OR STATIC SERVING IN PRODUCTION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Integrate Vite middleware
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Catch-all route to serve the Single Page App
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`🐔 LAYER FARM MANAGEMENT SYSTEM IS ONLINE!`);
    console.log(`📡 Server running at http://0.0.0.0:${PORT}`);
    console.log(`🔑 Credentials default: admin / adminpeternakan`);
    console.log(`====================================================`);
  });
}

startServer();
