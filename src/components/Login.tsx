import React, { useState, useEffect } from "react";
import { Lock, Mail, User, Shield, Info, ArrowRight, ArrowLeft, RefreshCw, Key, CheckCircle, Sun, Moon } from "lucide-react";
import Logo from "./Logo.tsx";

interface LoginProps {
  onLoginSuccess: (token: string, user: { username: string; email: string; role: "superadmin" | "admin" | "petugas" }) => void;
}

type ViewState = "login" | "register" | "verify" | "forgot" | "reset";

export default function Login({ onLoginSuccess }: LoginProps) {
  const [viewState, setViewState] = useState<ViewState>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [role, setRole] = useState<"admin" | "petugas">("petugas");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleQuickLogin = async (usr: string, pass: string) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: usr, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.isUnverified) {
          setEmail(data.email || "");
          setViewState("verify");
          throw new Error(data.message || "Akun Anda belum diverifikasi.");
        }
        throw new Error(data.message || "Login gagal.");
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: username || email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (data.isUnverified) {
          setEmail(data.email || email);
          setViewState("verify");
          throw new Error(data.message);
        }
        throw new Error(data.message || "Terjadi kesalahan.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal.");
      }

      setSuccessMsg(data.message);
      // Automatically redirect to verify code entry for this email
      setEmail(email);
      setViewState("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Verifikasi gagal.");
      }

      setSuccessMsg(data.message || "Akun Anda telah berhasil diverifikasi! Silakan login.");
      setViewState("login");
      setPassword(""); // Clear password field
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim ulang OTP.");
      }
      setSuccessMsg(data.message || "Kode verifikasi baru berhasil dikirim.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal meminta reset password.");
      }
      setSuccessMsg(data.message || "Kode OTP reset password telah dikirim.");
      setViewState("reset");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengubah kata sandi.");
      }
      setSuccessMsg(data.message || "Kata sandi berhasil diubah! Silakan login.");
      setViewState("login");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8 relative transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 shadow-xs transition-smooth cursor-pointer"
          title={theme === "light" ? "Mode Gelap (Malam)" : "Mode Terang (Siang)"}
        >
          {theme === "light" ? <Moon className="w-4.5 h-4.5 text-slate-600" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
        </button>
      </div>
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 transition-smooth">
        
        {/* Header */}
        <div className="flex justify-center mb-1">
          <Logo variant="stacked" size="xl" />
        </div>

        {/* Quick Credentials Info Box (Only visible in normal Login / Register view) */}
        {(viewState === "login" || viewState === "register") && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-2">
            <div className="flex items-center font-semibold gap-1 text-emerald-950">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pilih Akun Demo untuk Masuk Instan:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              <button
                id="quick-login-superadmin"
                type="button"
                onClick={() => handleQuickLogin("superadmin", "superadmin123")}
                className="flex flex-col items-center p-1.5 bg-white hover:bg-emerald-50 border border-emerald-200/60 rounded-lg text-center transition-all cursor-pointer"
              >
                <span className="font-bold text-[11px] text-amber-800 flex items-center gap-0.5">⭐ Super Admin</span>
                <span className="text-[9px] text-slate-500">superadmin123</span>
              </button>
              <button
                id="quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin("admin", "adminpeternakan")}
                className="flex flex-col items-center p-1.5 bg-white hover:bg-emerald-50 border border-emerald-200/60 rounded-lg text-center transition-all cursor-pointer"
              >
                <span className="font-bold text-[11px] text-slate-800">Admin</span>
                <span className="text-[9px] text-slate-500">adminpeternakan</span>
              </button>
              <button
                id="quick-login-petugas"
                type="button"
                onClick={() => handleQuickLogin("petugas", "petugas123")}
                className="flex flex-col items-center p-1.5 bg-white hover:bg-emerald-50 border border-emerald-200/60 rounded-lg text-center transition-all cursor-pointer"
              >
                <span className="font-bold text-[11px] text-slate-800">Petugas</span>
                <span className="text-[9px] text-slate-500">petugas123</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div id="login-error-alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span className="leading-normal font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div id="login-success-alert" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-normal font-medium">{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN STATE */}
        {viewState === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  placeholder="Masukkan username atau email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setEmail(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setViewState("forgot");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setViewState("register");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                Belum punya akun? <span className="text-emerald-600 font-bold">Registrasi sekarang</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER STATE */}
        {viewState === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  id="register-username"
                  type="text"
                  required
                  placeholder="Contoh: andis"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  id="register-email"
                  type="email"
                  required
                  placeholder="Contoh: andi@peternakan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  id="register-password"
                  type="password"
                  required
                  placeholder="Buat sandi minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Peran Pengguna (Role)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole("petugas")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === "petugas"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Petugas Lapangan
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === "admin"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Utama
                </button>
              </div>
            </div>

            <button
              id="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Buat Akun Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewState("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </div>
          </form>
        )}

        {/* 3. VERIFY OTP STATE */}
        {viewState === "verify" && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-900">
                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Verifikasi Akun Diperlukan
              </p>
              <p className="leading-relaxed">Kami telah mengirimkan 6-digit kode OTP verifikasi ke email Anda: <strong className="font-semibold">{email}</strong></p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Alamat Email Pengguna
              </label>
              <input
                type="email"
                required
                readOnly
                value={email}
                className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 focus:outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kode Verifikasi OTP (6 Digit)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Contoh: 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-center tracking-[0.25em] font-mono text-lg font-bold text-slate-950 transition-smooth"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="flex-1 py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Kirim Ulang Kode
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-[1.5] py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Selesaikan Verifikasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewState("login");
                setError("");
                setSuccessMsg("");
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Login
            </button>
          </form>
        )}

        {/* 4. FORGOT PASSWORD STATE */}
        {viewState === "forgot" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="text-left space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Lupa Kata Sandi?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Masukkan email yang terdaftar untuk menerima kode verifikasi OTP 6-digit guna mengatur ulang kata sandi.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Email Terdaftar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Kirim Kode OTP Reset</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewState("login");
                setError("");
                setSuccessMsg("");
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Login
            </button>
          </form>
        )}

        {/* 5. RESET PASSWORD STATE */}
        {viewState === "reset" && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs space-y-0.5">
              <p className="font-semibold">Kode OTP Telah Dikirim</p>
              <p className="leading-relaxed">Cek kotak masuk email <strong className="font-medium">{email}</strong> dan masukkan kode OTP beserta password baru.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kode OTP Reset (6 Digit)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Key className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Masukkan OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-center tracking-[0.25em] font-mono text-lg font-bold text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm text-slate-900 transition-smooth"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Perbarui Kata Sandi</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewState("login");
                setError("");
                setSuccessMsg("");
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Login
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
