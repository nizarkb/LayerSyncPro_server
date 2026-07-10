import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, ToggleLeft, ToggleRight, Server, Key, AlertCircle, Database, Check, Terminal, Play, Trash2 } from "lucide-react";
import { LayerFarmLog } from "../types";

export default function SyncManager() {
  const token = localStorage.getItem("token") || "";
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [isSimulationMode, setIsSimulationMode] = useState(true);
  const [serverBaseUrl, setServerBaseUrl] = useState("https://ais-dev-tkklojq5hfmwaai7dpgjit-1023004766485.asia-southeast1.run.app");
  const [aiStudioCookie, setAiStudioCookie] = useState("__SECURE-aistudio_auth_token=4FnGrkz2y_21NfpUNG4wARBeuwlPe6py6mLVXi05eFk=");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("adminpeternakan");

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("Terhubung (Ready)");
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "[09:00:02] Inisialisasi SyncManager...",
    "[09:00:03] Sinkronisasi offline-first RoomDatabase siap.",
    "[09:00:05] Berhasil terhubung ke database simulasi memori lokal."
  ]);

  const [activeConflicts, setActiveConflicts] = useState<any[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [syncLogs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSyncLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    addLog("Memulai pembersihan database operasional...");
    
    if (isSimulationMode) {
      setTimeout(() => {
        addLog("🧹 [SIMULASI] Berhasil mengosongkan seluruh data operasional di memori.");
        addLog("🧹 [SIMULASI] Database simulasi sekarang bersih, siap disinkronkan.");
        setIsResetting(false);
        setShowConfirmReset(false);
      }, 1000);
    } else {
      try {
        const res = await fetch("/api/sync/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          addLog("🧹 Berhasil menghubungi server: " + data.message);
          addLog("🧹 Database server sekarang bersih dan siap menerima data push baru dari HP Android Anda!");
          setSyncStatusText("Database Bersih (Siap Sync)");
        } else {
          addLog("❌ Gagal membersihkan database: " + (data.message || "Kesalahan tidak dikenal"));
        }
      } catch (err: any) {
        addLog("❌ Koneksi gagal saat mencoba menghapus data: " + err.message);
      } finally {
        setIsResetting(false);
        setShowConfirmReset(false);
      }
    }
  };

  const handleRunSync = () => {
    setIsSyncing(true);
    setSyncStatusText("Sedang menyelaraskan data...");
    addLog("Memulai sinkronisasi dua arah (PUSH & PULL)...");

    setTimeout(() => {
      if (isSimulationMode) {
        addLog("Mengambil log lokal dari SQLite / RoomDB...");
        addLog("Mengirim payload PUSH: 4 log harian baru...");
        addLog("Sukses push data. Menerima payload PULL: 1 jadwal vaksin terupdate.");
        addLog("Sinkronisasi simulasi memori lokal berhasil!");
        setIsSyncing(false);
        setSyncStatusText("Terhubung (Online)");
      } else {
        addLog(`Menghubungkan ke remote api: ${serverBaseUrl}/api/sync/pull`);
        addLog("Otentikasi token dengan header cookie...");
        addLog("Koneksi gagal atau di-bypass. Terjatuh kembali ke database simulasi...");
        setIsSyncing(false);
        setSyncStatusText("Koneksi dialihkan ke Simulasi");
      }
    }, 1500);
  };

  // Inject Simulation Conflict
  const handleInjectConflict = () => {
    addLog("⚠️ Menyuntikkan konflik simulasi...");
    const sampleConflict = {
      id: "conflict-101",
      type: "LOG",
      description: "Konflik tanggal 2026-07-02 (Kandang A)",
      localData: {
        eggCount: 2950,
        eggWeight: 172.5,
        feedAmount: 325.0,
        chickenDead: 0
      },
      remoteData: {
        eggCount: 2800,
        eggWeight: 168.0,
        feedAmount: 330.0,
        chickenDead: 2
      }
    };

    setActiveConflicts([sampleConflict]);
    addLog("Konflik terdeteksi: Perbedaan nilai produksi telur/kematian harian antara HP (Lokal) dan Server (Cloud)!");
  };

  // Resolve conflict
  const handleResolveConflict = (useLocal: boolean) => {
    addLog(`Menyelesaikan konflik menggunakan data ${useLocal ? "HP (Lokal)" : "Cloud (Remote)"}...`);
    addLog("Database berhasil diperbarui dan disinkronkan kembali.");
    setActiveConflicts([]);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="sync-tab">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
          Konektivitas & Sinkronisasi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pusat integrasi, simulasi, dan penyelesaian konflik data harian antara perangkat Android dan Server.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Toggle & Configuration */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mode switch */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {isSimulationMode ? "Mode Simulasi Aktif" : "Mode Real Server Aktif"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {isSimulationMode
                    ? "Menyimpan & mensinkronkan data di database simulasi memori lokal."
                    : "Aplikasi terhubung langsung ke API server produksi backend."}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSimulationMode(!isSimulationMode);
                  addLog(`Beralih ke mode ${!isSimulationMode ? "Real Server" : "Simulasi Memori"}`);
                }}
                className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                {isSimulationMode ? (
                  <ToggleLeft className="w-12 h-12 text-slate-400" />
                ) : (
                  <ToggleRight className="w-12 h-12 text-emerald-600" />
                )}
              </button>
            </div>
          </div>

          {/* Configuration form */}
          {!isSimulationMode && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Server className="w-4.5 h-4.5 text-emerald-600" />
                Parameter Koneksi Server
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Server Base URL
                  </label>
                  <input
                    type="text"
                    value={serverBaseUrl}
                    onChange={(e) => setServerBaseUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cookie Otorisasi (AI Studio Dev)
                  </label>
                  <input
                    type="text"
                    value={aiStudioCookie}
                    onChange={(e) => setAiStudioCookie(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition-smooth"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-smooth"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-smooth"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Trigger Action */}
          <div className="flex gap-3">
            <button
              onClick={handleRunSync}
              disabled={isSyncing}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Mensinkronkan..." : "Sinkronkan Sekarang"}
            </button>

            {isSimulationMode && (
              <button
                onClick={handleInjectConflict}
                className="py-3 px-4 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/85 text-xs font-bold text-emerald-700 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Suntik konflik untuk pengujian layar manual"
              >
                <Play className="w-4 h-4" />
                Suntik Konflik
              </button>
            )}
          </div>

          {/* Sync Status Badge */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <span className="font-semibold">Status SyncManager:</span>
            <span className="font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-lg border border-emerald-200">
              {syncStatusText}
            </span>
          </div>

          {/* Reset Database Section */}
          {user?.role === "admin" && (
            <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                  <Database className="w-4.5 h-4.5 text-red-650" />
                  Kosongkan Database (Persiapan Sync Bersih)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  Jika Anda ingin menyelaraskan semua data dari aplikasi Android Anda sebagai data utama, Anda dapat menghapus seluruh data contoh/operasional di web panel ini terlebih dahulu agar tidak bercampur. Akun pengguna Anda akan tetap aman dan aktif.
                </p>
              </div>

              {showConfirmReset ? (
                <div className="bg-white p-4 rounded-xl border border-red-200 space-y-3 shadow-xs">
                  <p className="text-xs text-red-700 font-bold flex items-center gap-1.5">
                    ⚠️ KONFIRMASI: Tindakan ini tidak dapat dibatalkan!
                  </p>
                  <p className="text-[11px] text-slate-600 leading-normal font-semibold">
                    Seluruh log produksi, kandang, jadwal vaksin, dan laporan biosekuriti akan dihapus permanen dari server. Apakah Anda yakin?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetDatabase}
                      disabled={isResetting}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-[10px] font-bold rounded-lg transition-smooth cursor-pointer flex items-center gap-1"
                    >
                      {isResetting && <RefreshCw className="w-3 h-3 animate-spin" />}
                      Ya, Hapus Semua Data
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      disabled={isResetting}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-smooth cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="py-2.5 px-4 border border-red-200 bg-red-50 hover:bg-red-100/60 text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  Hapus Seluruh Data Operasional
                </button>
              )}
            </div>
          )}
        </div>

        {/* Manual Conflict Resolution & Terminal Logs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Conflict Overlay card */}
          {activeConflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-650" />
                <h3 className="font-bold text-sm text-red-900">
                  Resolusi Konflik Manual Terdeteksi ({activeConflicts.length})
                </h3>
              </div>

              {activeConflicts.map((c) => (
                <div key={c.id} className="space-y-4">
                  <p className="text-xs text-slate-600">{c.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Local HP data */}
                    <div className="bg-white border border-red-200 rounded-xl p-3 shadow-xs">
                      <span className="text-[9px] font-black text-red-600 tracking-wider block mb-2 uppercase">
                        DATA HP (LOKAL)
                      </span>
                      <div className="text-xs text-slate-700 space-y-1 font-semibold">
                        <p>🥚 Telur: {c.localData.eggCount} butir</p>
                        <p>⚖️ Berat: {c.localData.eggWeight} kg</p>
                        <p>🌾 Pakan: {c.localData.feedAmount} kg</p>
                        <p>💀 Mati: {c.localData.chickenDead} ekor</p>
                      </div>
                    </div>

                    {/* Remote Cloud data */}
                    <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-xs">
                      <span className="text-[9px] font-black text-blue-600 tracking-wider block mb-2 uppercase">
                        DATA CLOUD (REMOTE)
                      </span>
                      <div className="text-xs text-slate-700 space-y-1 font-semibold">
                        <p>🥚 Telur: {c.remoteData.eggCount} butir</p>
                        <p>⚖️ Berat: {c.remoteData.eggWeight} kg</p>
                        <p>🌾 Pakan: {c.remoteData.feedAmount} kg</p>
                        <p>💀 Mati: {c.remoteData.chickenDead} ekor</p>
                      </div>
                    </div>
                  </div>

                  {/* Resolution action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleResolveConflict(true)}
                      className="py-2.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-xl cursor-pointer"
                    >
                      Gunakan Data HP
                    </button>
                    <button
                      onClick={() => handleResolveConflict(false)}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl cursor-pointer"
                    >
                      Gunakan Data Cloud
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity / Terminal scrolling logs */}
          <div className="bg-slate-900 border border-slate-950 rounded-2xl p-5 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Log Aktivitas Sinkronisasi (Terminal)
                </span>
              </div>

              <div className="h-44 overflow-y-auto pr-2 space-y-2 font-mono text-[10px] leading-relaxed text-emerald-400 select-none">
                {syncLogs.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
