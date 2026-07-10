import React, { useState, useEffect } from "react";
import { 
  Check, Shield, Sparkles, Building, ChevronRight, AlertCircle, 
  RefreshCw, Layers, ClipboardList, Database, CreditCard, Lock
} from "lucide-react";

interface SaaSPlanWidgetProps {
  token: string;
  user: any;
  onPlanUpdated: () => void;
}

export default function SaaSPlanWidget({ token, user, onPlanUpdated }: SaaSPlanWidgetProps) {
  const [cagesCount, setCagesCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentPlan = user?.plan || "free";
  const maxKandangs = user?.maxKandangs !== undefined ? user?.maxKandangs : 2;
  const maxLogs = user?.maxLogs !== undefined ? user?.maxLogs : 30;

  useEffect(() => {
    fetchCurrentUsage();
  }, [token]);

  const fetchCurrentUsage = async () => {
    setLoading(true);
    try {
      // Fetch kandangs count
      const resKandangs = await fetch("/api/kandangs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resKandangs.ok) {
        const dataKandangs = await resKandangs.json();
        setCagesCount(dataKandangs.length);
      }

      // Fetch logs count
      const resLogs = await fetch("/api/logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogsCount(dataLogs.length);
      }
    } catch (err) {
      console.error("Gagal memuat status kuota:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUpgrade = async (targetPlan: "free" | "pro" | "enterprise") => {
    setUpgradeLoading(targetPlan);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/simulate-upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ plan: targetPlan })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || `Berhasil beralih ke paket ${targetPlan.toUpperCase()}!`);
        onPlanUpdated();
        fetchCurrentUsage();
        // Clear message after 4s
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        throw new Error(data.message || "Gagal melakukan simulasi upgrade.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgradeLoading(null);
    }
  };

  // Percentage calculations
  const cagePercent = Math.min(100, Math.round((cagesCount / maxKandangs) * 100));
  const logPercent = Math.min(100, Math.round((logsCount / maxLogs) * 100));

  const plans = [
    {
      id: "free",
      name: "Free Tier",
      price: "Rp 0",
      period: "selamanya",
      desc: "Cocok untuk peternak pemula dengan skala hobi/kecil.",
      color: "border-slate-200 bg-white",
      textColor: "text-slate-900",
      badgeColor: "bg-slate-100 text-slate-600",
      btnText: "Mulai Gratis",
      features: [
        "Maksimal 2 Kandang (Cages)",
        "Maksimal 30 Log Produksi",
        "Pencatatan Telur & Konsumsi Pakan",
        "Pelaporan Grafik Standar",
        "Simulasi Sinkronisasi Offline"
      ],
      limits: { kandang: 2, logs: 30 }
    },
    {
      id: "pro",
      name: "Pro Member",
      price: "Rp 199.000",
      period: "per bulan",
      desc: "Sempurna untuk peternakan komersial menengah/UMKM.",
      color: "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 relative overflow-hidden",
      textColor: "text-emerald-950",
      badgeColor: "bg-emerald-500 text-white",
      btnText: "Upgrade ke Pro",
      popular: true,
      features: [
        "Maksimal 10 Kandang (Cages)",
        "Maksimal 300 Log Produksi",
        "Seluruh Fitur Free Tier",
        "Prediksi AI Konsumsi Pakan",
        "Perencana Vaksinasi Pintar",
        "Eksport Laporan Excel/PDF",
        "Dukungan Prioritas WA/Telegram"
      ],
      limits: { kandang: 10, logs: 300 }
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Rp 499.000",
      period: "per bulan",
      desc: "Kapasitas tanpa batas untuk industri peternakan skala besar.",
      color: "border-violet-200 bg-white hover:border-violet-300",
      textColor: "text-violet-950",
      badgeColor: "bg-violet-600 text-white",
      btnText: "Hubungi Penjualan",
      features: [
        "Kandang Tanpa Batas (Unlimited)",
        "Log Produksi Tanpa Batas (Unlimited)",
        "Multi-Tenancy Skala Enterprise",
        "Akses Multi-Role Petugas Lapangan",
        "Kustomisasi Laporan Eksekutif",
        "SLA Hubungan & Integrasi API",
        "Dedicated Account Manager"
      ],
      limits: { kandang: 9999, logs: 9999 }
    }
  ];

  return (
    <div className="space-y-8">
      {/* SaaS Architecture Header banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SaaS Infrastructure Ready
            </span>
            <span className="text-slate-400 text-xs">Scenario C Enforced</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">SaaS Plan & Kuota Langganan</h2>
          <p className="text-xs text-emerald-100 font-medium max-w-2xl leading-relaxed">
            LayerFarm beroperasi sebagai platform SaaS Multi-Tenant profesional. 
            Setiap data disimpan secara aman menggunakan segmentasi kepemilikan terisolasi (Data Partitioning). 
            Super Admin dapat mengelola paket dan status penangguhan secara terpusat.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-right shrink-0">
          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Paket Aktif Anda</p>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-lg font-black uppercase tracking-tight">{currentPlan}</h3>
          </div>
          <p className="text-[10px] text-emerald-200/80 font-medium mt-1">Status: Active (Normal)</p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>Gagal: {error}</span>
        </div>
      )}

      {/* Live Quota Progress Dashboard Widget */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-emerald-600" />
              <span>Status Penggunaan Kuota Akun Operasional</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Batas kapasitas saat ini ditentukan berdasarkan ketentuan Paket <strong>{currentPlan.toUpperCase()}</strong> Anda.
            </p>
          </div>

          <button
            onClick={fetchCurrentUsage}
            disabled={loading}
            className="self-start px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Pemakaian</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cages quota */}
          <div className="border border-slate-150 rounded-2xl p-5 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Kuota Kandang (Cages)</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Kapasitas penambahan unit kandang operasional</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-slate-800">
                {cagesCount} / {maxKandangs === 9999 ? "∞" : maxKandangs} Unit
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    cagePercent >= 90 ? "bg-red-500" : cagePercent >= 70 ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${maxKandangs === 9999 ? 100 : cagePercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>{cagePercent}% Terpakai</span>
                {maxKandangs !== 9999 && cagesCount >= maxKandangs && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Kuota Penuh!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Logs quota */}
          <div className="border border-slate-150 rounded-2xl p-5 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ClipboardList className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Kuota Log Produksi Harian</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Rekam log entri laporan produksi harian</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-slate-800">
                {logsCount} / {maxLogs === 9999 ? "∞" : maxLogs} Entri
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    logPercent >= 90 ? "bg-red-500" : logPercent >= 70 ? "bg-amber-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${maxLogs === 9999 ? 100 : logPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>{logPercent}% Terpakai</span>
                {maxLogs !== 9999 && logsCount >= maxLogs && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Kuota Penuh!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing bento-grid upgrade portal */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-lg font-black tracking-tight text-slate-900">Portal Simulasi Transaksi & Pilihan Paket</h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Simulasikan proses checkout paket langganan secara instan di bawah ini. 
            Sistem SaaS LayerFarm akan memperluas kuota Anda di backend dan database secara real-time!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id;
            const isLoding = upgradeLoading === p.id;

            return (
              <div 
                key={p.id} 
                className={`border rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${p.color}`}
              >
                {p.popular && (
                  <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Sangat Direkomendasikan
                  </span>
                )}

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">{p.name}</h4>
                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          ✓ Paket Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2 border-t border-b border-slate-100">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{p.price}</span>
                    <span className="text-[10px] text-slate-400 font-bold">/ {p.period}</span>
                  </div>

                  {/* Quota details info */}
                  <div className="space-y-1 bg-slate-50/60 border border-slate-150 p-2.5 rounded-xl text-[11px] font-semibold text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kuota Kandang:</span>
                      <span className="font-bold text-slate-800">{p.limits.kandang === 9999 ? "Tanpa Batas" : `${p.limits.kandang} unit`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kuota Log Produksi:</span>
                      <span className="font-bold text-slate-800">{p.limits.logs === 9999 ? "Tanpa Batas" : `${p.limits.logs} entri`}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fitur & Manfaat:</p>
                    <ul className="space-y-2 text-xs text-slate-600 font-semibold">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => handleSimulateUpgrade(p.id as any)}
                    disabled={isCurrent || upgradeLoading !== null}
                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : p.popular
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02]"
                        : "bg-slate-800 hover:bg-slate-950 text-white"
                    }`}
                  >
                    {isLoding ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : isCurrent ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Paket Aktif Saat Ini</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Simulasikan Aktivasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-red-50/40 border border-red-200/50 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-600" />
              <span>Zona Berbahaya: Bersihkan Database</span>
            </h3>
            <p className="text-xs text-red-700 font-semibold leading-relaxed">
              Tindakan ini akan menghapus seluruh data kandang, kelompok ayam (flock), log harian, jadwal vaksinasi, daftar biosekuriti, stok pakan/telur, dan riwayat penjualan di akun Anda secara permanen. Akun Anda akan kembali bersih dari data dummy bawaan.
            </p>
          </div>

          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Bersihkan Semua Data</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  setClearLoading(true);
                  setError("");
                  setSuccessMsg("");
                  try {
                    const res = await fetch("/api/auth/clear-my-data", {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${token}`
                      }
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setSuccessMsg(data.message || "Seluruh data Anda berhasil dihapus!");
                      fetchCurrentUsage();
                      onPlanUpdated();
                      setShowClearConfirm(false);
                      setTimeout(() => setSuccessMsg(""), 5000);
                    } else {
                      throw new Error(data.message || "Gagal menghapus data.");
                    }
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setClearLoading(false);
                  }
                }}
                disabled={clearLoading}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {clearLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Ya, Hapus Permanen"
                )}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearLoading}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
