import React, { useState, useEffect } from "react";
import { 
  Server, Key, Mail, CheckCircle2, AlertCircle, RefreshCw, 
  Send, ShieldCheck, HelpCircle, Check, Info
} from "lucide-react";

interface SmtpSettingsProps {
  token: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export default function SmtpSettings({ token }: SmtpSettingsProps) {
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "",
    fromEmail: ""
  });
  
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  useEffect(() => {
    fetchSmtpConfig();
  }, [token]);

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch("/api/superadmin/smtp", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSmtpConfig(data);
      }
    } catch (err) {
      console.error("Gagal memuat konfigurasi SMTP:", err);
    }
  };

  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const res = await fetch("/api/superadmin/smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(smtpConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan konfigurasi.");
      setStatus({ type: "success", message: data.message || "Pengaturan SMTP mandiri berhasil disimpan ke database." });
      // clear status after 4s
      setTimeout(() => setStatus({ type: null, message: "" }), 4000);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSmtpTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      setTestStatus({ type: "error", message: "Silakan masukkan email tujuan pengujian terlebih dahulu." });
      return;
    }
    setTestLoading(true);
    setTestStatus({ type: null, message: "" });
    try {
      const res = await fetch("/api/superadmin/smtp/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...smtpConfig,
          testEmail
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Koneksi SMTP gagal. Periksa kembali host, port, kredensial, atau pengaturan SSL/TLS Anda.");
      setTestStatus({ type: "success", message: data.message || "Koneksi sukses! Email uji coba berhasil dikirim ke " + testEmail });
      // clear status after 5s
      setTimeout(() => setTestStatus({ type: null, message: "" }), 5000);
    } catch (err: any) {
      setTestStatus({ type: "error", message: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const suggestPort = (secure: boolean) => {
    setSmtpConfig(prev => ({
      ...prev,
      secure: secure,
      port: secure ? 465 : 587
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Column */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-150 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Server SMTP Mandiri (Custom Gateway)</h3>
              <p className="text-[11px] text-slate-500 font-medium">Gunakan server SMTP Anda sendiri untuk mengirim email transaksi sistem.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={fetchSmtpConfig}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            title="Muat ulang pengaturan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSmtpSave} className="p-6 space-y-6">
          {status.type === "success" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Konfigurasi Berhasil Disimpan</p>
                <p className="text-emerald-700/90 text-[11px] font-medium mt-0.5">{status.message}</p>
              </div>
            </div>
          )}

          {status.type === "error" && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Gagal Menyimpan</p>
                <p className="text-red-700/90 text-[11px] font-medium mt-0.5">{status.message}</p>
              </div>
            </div>
          )}

          {/* Preset Buttons Helper */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Rekomendasi Port Enkripsi</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => suggestPort(false)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  !smtpConfig.secure && smtpConfig.port === 587
                    ? "bg-white text-emerald-700 border-emerald-300 shadow-sm"
                    : "bg-white/50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-800"
                }`}
              >
                Port 587 (TLS / STARTTLS)
              </button>
              <button
                type="button"
                onClick={() => suggestPort(true)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  smtpConfig.secure && smtpConfig.port === 465
                    ? "bg-white text-emerald-700 border-emerald-300 shadow-sm"
                    : "bg-white/50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-800"
                }`}
              >
                Port 465 (SSL / TLS Secure)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Host */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                SMTP Host / Server Address
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: smtp.gmail.com atau mail.domain.com"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
              />
            </div>

            {/* Port */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Port SMTP
              </label>
              <input
                type="number"
                required
                placeholder="Misal: 587, 465, atau 25"
                value={smtpConfig.port || ""}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Username SMTP</span>
              </label>
              <input
                type="text"
                required
                placeholder="Email pengirim atau ID autentikasi"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Password SMTP</span>
              </label>
              <input
                type="password"
                required
                placeholder="Sandi login server SMTP"
                value={smtpConfig.pass}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
              />
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Nama Pengirim (Display Name)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Admin LayerFarm"
                value={smtpConfig.fromName}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
              />
            </div>

            {/* From Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Email Pengirim (Sender Address)
              </label>
              <input
                type="email"
                required
                placeholder="Contoh: noreply@layerfarm.com"
                value={smtpConfig.fromEmail}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 py-2 border-t border-slate-100 pt-5">
            <input
              id="smtp-secure-opt"
              type="checkbox"
              checked={smtpConfig.secure}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
              className="w-4.5 h-4.5 accent-emerald-600 rounded border-slate-300 focus:ring-emerald-500/20 mt-0.5 cursor-pointer"
            />
            <div className="space-y-0.5">
              <label htmlFor="smtp-secure-opt" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                Gunakan Koneksi Aman SSL/TLS Secara Eksplisit
              </label>
              <p className="text-[10px] text-slate-500 font-medium">
                Aktifkan jika penyedia server SMTP Anda mewajibkan koneksi SSL yang aman pada saat handshake awal (biasanya Port 465).
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Simpan Konfigurasi SMTP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Connection Test Column */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-150 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Uji Koneksi Server</h3>
              <p className="text-[11px] text-slate-500 font-medium">Kirim email pengujian HTML secara instan.</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Silakan simulasikan proses pengiriman email dari server Anda. Sistem akan membuat koneksi transaksional di backend, mengotentikasi, dan mengirimkan email sambutan HTML.
            </p>

            <div className="border border-slate-100 p-3 bg-slate-50/50 rounded-xl space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tips troubleshoot</span>
              </h4>
              <ul className="text-[10px] text-slate-500 font-semibold space-y-1 list-disc list-inside">
                <li>Gunakan sandi aplikasi (App Password) jika menggunakan Gmail.</li>
                <li>Pastikan hosting server mengizinkan koneksi outbound port 587/465.</li>
              </ul>
            </div>

            {testStatus.type === "success" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-950">Pengujian Sukses!</p>
                  <p className="text-emerald-700 text-[11px] font-medium mt-0.5">{testStatus.message}</p>
                </div>
              </div>
            )}

            {testStatus.type === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-start gap-2.5 font-semibold leading-relaxed">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-950">Konektivitas Gagal</p>
                  <p className="text-red-700 text-[11px] font-medium mt-0.5 leading-relaxed">{testStatus.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSmtpTest} className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Email Penerima Pengujian
            </label>
            <input
              type="email"
              required
              placeholder="Contoh: email-anda@domain.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-900 font-medium transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={testLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {testLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Mengirim Email Uji Coba...</span>
              </>
            ) : (
              <>
                <span>Kirim Email Test</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
