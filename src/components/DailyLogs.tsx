import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar, Filter, Trash2, Edit3, X, FileSpreadsheet, Info, Skull, AlertTriangle, Activity } from "lucide-react";
import { LayerFarmLog } from "../types";

interface DailyLogsProps {
  token: string;
  userRole: string;
}

export default function DailyLogs({ token, userRole }: DailyLogsProps) {
  const [logs, setLogs] = useState<LayerFarmLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [filterKandang, setFilterKandang] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Form State (for both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  const [formKandang, setFormKandang] = useState("Kandang A");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEggCount, setFormEggCount] = useState("");
  const [formEggWeight, setFormEggWeight] = useState("");
  const [formFeedAmount, setFormFeedAmount] = useState("");
  const [formChickenDead, setFormChickenDead] = useState("0");
  const [formDeathReason, setFormDeathReason] = useState("Penyakit / Sakit");
  const [formCustomDeathReason, setFormCustomDeathReason] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [activeSubTab, setActiveSubTab] = useState<"production" | "mortality">("production");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/logs?";
      if (filterKandang) url += `kandangName=${encodeURIComponent(filterKandang)}&`;
      if (filterStartDate) url += `startDate=${filterStartDate}&`;
      if (filterEndDate) url += `endDate=${filterEndDate}&`;

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal memuat log produksi harian.");
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterKandang, filterStartDate, filterEndDate]);

  const handleOpenAddModal = () => {
    setEditingLogId(null);
    setFormKandang("Kandang A");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormEggCount("");
    setFormEggWeight("");
    setFormFeedAmount("");
    setFormChickenDead("0");
    setFormDeathReason("Penyakit / Sakit");
    setFormCustomDeathReason("");
    setFormNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: LayerFarmLog) => {
    setEditingLogId(log.id);
    setFormKandang(log.kandangName);
    setFormDate(log.date);
    setFormEggCount(log.eggCount.toString());
    setFormEggWeight(log.eggWeight.toString());
    setFormFeedAmount(log.feedAmount.toString());
    setFormChickenDead(log.chickenDead.toString());
    
    const knownReasons = [
      "Penyakit / Sakit",
      "Stres Panas / Heatstroke",
      "Cedera / Kanibalisme",
      "Afkir Selektif",
      "Predator / Hama",
      "Faktor Usia"
    ];
    if (log.deathReason) {
      if (knownReasons.includes(log.deathReason)) {
        setFormDeathReason(log.deathReason);
        setFormCustomDeathReason("");
      } else {
        setFormDeathReason("Lain-lain");
        setFormCustomDeathReason(log.deathReason);
      }
    } else {
      setFormDeathReason("Penyakit / Sakit");
      setFormCustomDeathReason("");
    }

    setFormNotes(log.notes);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data log harian ini?")) return;
    
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        let errMsg = "Gagal menghapus log.";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } else {
          const rawText = await res.text();
          errMsg = rawText || errMsg;
        }
        throw new Error(errMsg);
      }
      // Refresh
      fetchLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitLoading(true);

    if (!formKandang || !formDate || !formEggCount || !formEggWeight || !formFeedAmount) {
      setFormError("Semua field utama wajib diisi.");
      setFormSubmitLoading(false);
      return;
    }

    const finalDeathReason = parseInt(formChickenDead, 10) > 0 
      ? (formDeathReason === "Lain-lain" ? formCustomDeathReason : formDeathReason)
      : "";

    const payload = {
      kandangName: formKandang,
      date: formDate,
      eggCount: parseInt(formEggCount, 10),
      eggWeight: parseFloat(formEggWeight),
      feedAmount: parseFloat(formFeedAmount),
      chickenDead: parseInt(formChickenDead, 10),
      deathReason: finalDeathReason,
      notes: formNotes,
    };

    try {
      const url = editingLogId ? `/api/logs/${editingLogId}` : "/api/logs";
      const method = editingLogId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      let responseText = "";
      try {
        responseText = await res.text();
      } catch (e) {}

      if (!res.ok) {
        let serverMessage = "";
        try {
          const parsed = JSON.parse(responseText);
          serverMessage = parsed.message || parsed.error || "";
        } catch (e) {
          // Fallback to raw text if it is short and simple
          if (responseText && responseText.length < 300) {
            serverMessage = responseText;
          }
        }
        throw new Error(serverMessage || `Error ${res.status}: Gagal memproses pengiriman data.`);
      }

      // Check if response contains success: false or quotaExceeded: true
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.success === false) {
          throw new Error(parsed.message || "Batas kuota log harian terlampaui.");
        }
      } catch (e: any) {
        if (e.message && e.message !== "Unexpected end of JSON input") {
          throw e; // rethrow the quota error
        }
      }

      setIsModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Helper for FCR calculation
  const getFCR = (feed: number, eggW: number) => {
    if (eggW <= 0) return 0;
    return parseFloat((feed / eggW).toFixed(2));
  };

  // Mortality calculations and logic
  const mortalityLogs = logs.filter((l) => l.chickenDead > 0);
  const totalDeaths = mortalityLogs.reduce((sum, log) => sum + log.chickenDead, 0);

  // Top death reason calculation
  let topReason = "Tidak Ada";
  let topReasonCount = 0;
  const reasonCounts: Record<string, number> = {};
  mortalityLogs.forEach((log) => {
    const r = log.deathReason || "Penyakit / Sakit";
    reasonCounts[r] = (reasonCounts[r] || 0) + log.chickenDead;
  });
  Object.entries(reasonCounts).forEach(([r, count]) => {
    if (count > topReasonCount) {
      topReason = r;
      topReasonCount = count;
    }
  });

  // Top cage for mortality
  let topCage = "Tidak Ada";
  let topCageCount = 0;
  const cageCounts: Record<string, number> = {};
  mortalityLogs.forEach((log) => {
    cageCounts[log.kandangName] = (cageCounts[log.kandangName] || 0) + log.chickenDead;
  });
  Object.entries(cageCounts).forEach(([c, count]) => {
    if (count > topCageCount) {
      topCage = c;
      topCageCount = count;
    }
  });

  // Breakdown counts for progress bars
  const knownReasonsList = [
    "Penyakit / Sakit",
    "Stres Panas / Heatstroke",
    "Cedera / Kanibalisme",
    "Afkir Selektif",
    "Predator / Hama",
    "Faktor Usia",
    "Lain-lain"
  ];
  const reasonBreakdown = knownReasonsList.map((reason) => {
    let count = 0;
    mortalityLogs.forEach((log) => {
      const logR = log.deathReason || "Penyakit / Sakit";
      if (reason === "Lain-lain") {
        if (logR && !knownReasonsList.slice(0, 6).includes(logR)) {
          count += log.chickenDead;
        }
      } else if (logR === reason) {
        count += log.chickenDead;
      }
    });
    return {
      reason,
      count,
      percentage: totalDeaths > 0 ? Math.round((count / totalDeaths) * 100) : 0
    };
  }).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);

  const getReasonBadgeClass = (reason: string | undefined) => {
    const r = reason || "Penyakit / Sakit";
    if (r.startsWith("Penyakit")) {
      return "bg-red-50 text-red-800 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40 text-[10px] font-bold px-2 py-0.5 rounded";
    }
    if (r.startsWith("Stres Panas")) {
      return "bg-amber-50 text-amber-800 border border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40 text-[10px] font-bold px-2 py-0.5 rounded";
    }
    if (r.startsWith("Cedera")) {
      return "bg-orange-50 text-orange-800 border border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/40 text-[10px] font-bold px-2 py-0.5 rounded";
    }
    if (r.startsWith("Afkir")) {
      return "bg-indigo-50 text-indigo-800 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40 text-[10px] font-bold px-2 py-0.5 rounded";
    }
    if (r.startsWith("Predator")) {
      return "bg-purple-50 text-purple-800 border border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40 text-[10px] font-bold px-2 py-0.5 rounded";
    }
    if (r.startsWith("Faktor Usia")) {
      return "bg-sky-50 text-sky-800 border border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/40 text-[10px] font-bold px-2 py-0.5 rounded";
    }
    return "bg-slate-50 text-slate-800 border border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded";
  };

  return (
    <div className="space-y-6 animate-fade-in" id="logs-tab">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
            Log Harian & Mortalitas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Catat hasil panen telur, konsumsi pakan, dan kelola rincian tingkat kematian ayam per kandang.
          </p>
        </div>

        <button
          id="add-log-btn"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-smooth cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Log Baru
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800" id="logs-subtabs">
        <button
          onClick={() => setActiveSubTab("production")}
          className={`px-5 py-3 text-xs font-bold transition-all relative ${
            activeSubTab === "production"
              ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          Produksi & Konsumsi Pakan
        </button>
        <button
          onClick={() => setActiveSubTab("mortality")}
          className={`px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeSubTab === "mortality"
              ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Skull className="w-3.5 h-3.5 text-red-500" />
          Log Mortalitas (Kematian)
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4" id="logs-filters">
        
        {/* Kandang filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Pilih Kandang</label>
          <div className="relative">
            <select
              id="filter-kandang-select"
              value={filterKandang}
              onChange={(e) => setFilterKandang(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-700 cursor-pointer"
            >
              <option value="">Semua Kandang</option>
              <option value="Kandang A">Kandang A</option>
              <option value="Kandang B">Kandang B</option>
              <option value="Kandang C">Kandang C</option>
            </select>
          </div>
        </div>

        {/* Start Date filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tanggal Mulai</label>
          <input
            id="filter-start-date"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-700"
          />
        </div>

        {/* End Date filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tanggal Selesai</label>
          <input
            id="filter-end-date"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-700"
          />
        </div>

        {/* Quick Reset filters */}
        <div className="flex items-end">
          <button
            id="reset-logs-filters-btn"
            onClick={() => {
              setFilterKandang("");
              setFilterStartDate("");
              setFilterEndDate("");
            }}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl transition-smooth cursor-pointer"
          >
            Bersihkan Filter
          </button>
        </div>

      </div>

      {activeSubTab === "production" ? (
        <>
          {/* SYNC NOTIFICATION AND HELP BOX */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Pengisian log ini <strong>secara otomatis memotong stok pakan</strong> dan <strong>menambah stok telur</strong> di gudang inventaris Anda secara real-time.</span>
            </div>
            <span className="text-[10px] font-bold text-slate-450 shrink-0">Android Mobile App Terhubung</span>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden" id="logs-table-container">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-400 font-medium text-xs">Memuat data log...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 font-medium text-xs">{error}</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl">📁</span>
                <p className="text-slate-400 font-semibold text-xs mt-3">Tidak ada data log yang cocok dengan filter pencarian.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="py-3 px-4">Tanggal Log</th>
                      <th className="py-3 px-4">Kandang</th>
                      <th className="py-3 px-4 text-right">Telur (Butir)</th>
                      <th className="py-3 px-4 text-right">Berat Telur (kg)</th>
                      <th className="py-3 px-4 text-right">Pakan (kg)</th>
                      <th className="py-3 px-4 text-right">Kematian (Ekor)</th>
                      <th className="py-3 px-4 text-right">Indeks FCR</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {logs.map((log) => {
                      const fcr = getFCR(log.feedAmount, log.eggWeight);
                      const isFcrIdeal = fcr >= 2.0 && fcr <= 2.2;
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-smooth">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{log.date}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {log.kandangName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{log.eggCount.toLocaleString("id-ID")}</td>
                          <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{log.eggWeight} kg</td>
                          <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{log.feedAmount} kg</td>
                          <td className="py-3 px-4 text-right">
                            <span className={log.chickenDead > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-400 dark:text-slate-500"}>
                              {log.chickenDead} ekor
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              isFcrIdeal ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" : "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                            }`}>
                              {fcr > 0 ? fcr.toFixed(2) : "0.00"}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-[180px] truncate text-slate-500 dark:text-slate-400" title={log.notes}>
                            {log.notes || "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                id={`edit-log-btn-${log.id}`}
                                onClick={() => handleOpenEditModal(log)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 text-slate-400 rounded-lg transition-smooth cursor-pointer"
                                title="Edit Data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                id={`delete-log-btn-${log.id}`}
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 text-slate-400 rounded-lg transition-smooth cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6" id="mortality-subtab-view">
          {/* SUMMARY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: TOTAL DEATHS */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Ayam Mati</span>
                <span className="text-3xl font-extrabold text-red-650 dark:text-red-400 font-sans tracking-tight">{totalDeaths} <span className="text-xs font-semibold text-slate-500">ekor</span></span>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">Tercatat dari {mortalityLogs.length} kejadian kematian</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/40">
                <Skull className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* CARD 2: DOMINANT CAUSE */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Penyebab Kematian Dominan</span>
                <span className="text-lg font-bold text-slate-850 dark:text-slate-200 block truncate max-w-[200px]" title={topReason}>
                  {topReason}
                </span>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1.5 font-semibold">
                  Memicu <span className="font-bold text-red-600">{topReasonCount} ekor</span> kematian
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 border border-amber-100 dark:border-amber-900/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 3: HIGHEST CAGE DEATHS */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tingkat Kerugian Tertinggi</span>
                <span className="text-lg font-bold text-slate-850 dark:text-slate-200 block">{topCage}</span>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1.5 font-semibold">
                  Kehilangan <span className="font-bold text-red-600">{topCageCount} ekor</span> ayam aktif
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Activity className="w-6 h-6" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* DISTRIBUTION BREAKDOWN */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-1 space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider mb-1">Faktor & Distribusi Penyebab</h4>
                <p className="text-slate-450 dark:text-slate-450 text-[10px] font-semibold">Persentase rincian alasan kematian yang dilaporkan petugas.</p>
              </div>

              {reasonBreakdown.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  Belum ada alasan kematian tercatat.
                </div>
              ) : (
                <div className="space-y-3.5 pt-2">
                  {reasonBreakdown.map((item) => (
                    <div key={item.reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.reason}</span>
                        <span className="text-slate-950 dark:text-slate-100 font-bold">{item.count} ekor ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.reason.startsWith("Penyakit") ? "bg-red-500" :
                            item.reason.startsWith("Stres") ? "bg-amber-500" :
                            item.reason.startsWith("Cedera") ? "bg-orange-500" :
                            item.reason.startsWith("Afkir") ? "bg-indigo-500" :
                            item.reason.startsWith("Predator") ? "bg-purple-500" :
                            item.reason.startsWith("Faktor") ? "bg-sky-500" : "bg-slate-400"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MORTALITY LOGS LIST */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="font-extrabold text-slate-950 dark:text-slate-50 text-xs uppercase tracking-wider">Daftar Kejadian Mortalitas</h4>
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-2 py-0.5 rounded-full">
                  Populasi Otomatis Berkurang
                </span>
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-400 font-medium text-xs">Memuat data...</p>
                </div>
              ) : mortalityLogs.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-4xl">💚</span>
                  <p className="text-slate-450 dark:text-slate-500 font-bold text-xs mt-3">Luar biasa! Tidak ada kematian ayam tercatat.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="py-3 px-4">Tanggal Kejadian</th>
                        <th className="py-3 px-4">Kandang</th>
                        <th className="py-3 px-4 text-center">Jumlah Kematian</th>
                        <th className="py-3 px-4">Faktor Penyebab</th>
                        <th className="py-3 px-4">Catatan Petugas</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {mortalityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-smooth">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{log.date}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {log.kandangName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold text-red-650 dark:text-red-400">
                            💀 {log.chickenDead} ekor
                          </td>
                          <td className="py-3 px-4">
                            <span className={getReasonBadgeClass(log.deathReason)}>
                              {log.deathReason || "Penyakit / Sakit"}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-[160px] truncate text-slate-500 dark:text-slate-400" title={log.notes}>
                            {log.notes || "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                id={`edit-log-btn-${log.id}`}
                                onClick={() => handleOpenEditModal(log)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 text-slate-400 rounded-lg transition-smooth cursor-pointer"
                                title="Edit Data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                id={`delete-log-btn-${log.id}`}
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 text-slate-400 rounded-lg transition-smooth cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FORM MODAL DIALOG */}
      {isModalOpen && (
        <div id="logs-form-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingLogId ? "Edit Log Harian" : "Tambah Log Baru"}
              </h3>
              <button
                id="close-logs-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-smooth cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {formError && (
                <div id="logs-modal-error-alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Kandang Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kandang</label>
                  <select
                    id="form-kandang-select"
                    value={formKandang}
                    onChange={(e) => setFormKandang(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800"
                  >
                    <option value="Kandang A">Kandang A</option>
                    <option value="Kandang B">Kandang B</option>
                    <option value="Kandang C">Kandang C</option>
                  </select>
                </div>

                {/* Log Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    id="form-date-input"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Egg count */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Produksi Telur (Butir)</label>
                  <input
                    id="form-eggcount-input"
                    type="number"
                    min="0"
                    placeholder="Contoh: 950"
                    required
                    value={formEggCount}
                    onChange={(e) => setFormEggCount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800"
                  />
                </div>

                {/* Egg weight */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Berat Telur (kg)</label>
                  <input
                    id="form-eggweight-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Contoh: 56.4"
                    required
                    value={formEggWeight}
                    onChange={(e) => setFormEggWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Feed Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pakan Konsumsi (kg)</label>
                  <input
                    id="form-feedamount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Contoh: 115"
                    required
                    value={formFeedAmount}
                    onChange={(e) => setFormFeedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800"
                  />
                </div>

                {/* Chicken dead */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kematian Ayam (Ekor)</label>
                  <input
                    id="form-chickendead-input"
                    type="number"
                    min="0"
                    placeholder="Contoh: 0"
                    required
                    value={formChickenDead}
                    onChange={(e) => setFormChickenDead(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Conditionally show death reasons in modal */}
              {parseInt(formChickenDead, 10) > 0 && (
                <div className="bg-red-50/50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/40 p-4 rounded-xl space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-1">
                      Penyebab Kematian
                    </label>
                    <select
                      id="form-deathreason-select"
                      value={formDeathReason}
                      onChange={(e) => setFormDeathReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-xs text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Penyakit / Sakit">Penyakit / Sakit</option>
                      <option value="Stres Panas / Heatstroke">Stres Panas / Heatstroke</option>
                      <option value="Cedera / Kanibalisme">Cedera / Kanibalisme</option>
                      <option value="Afkir Selektif">Afkir Selektif</option>
                      <option value="Predator / Hama">Predator / Hama</option>
                      <option value="Faktor Usia">Faktor Usia</option>
                      <option value="Lain-lain">Lain-lain (Tulis Kustom)</option>
                    </select>
                  </div>
                  {formDeathReason === "Lain-lain" && (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-1">
                        Penyebab Kustom
                      </label>
                      <input
                        id="form-custom-deathreason-input"
                        type="text"
                        required
                        placeholder="Contoh: Terjepit kawat sekat"
                        value={formCustomDeathReason}
                        onChange={(e) => setFormCustomDeathReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Live FCR Preview */}
              {formEggWeight && formFeedAmount && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-semibold">Estimasi Indeks FCR:</span>
                  <span className="font-mono font-black text-emerald-950">
                    {getFCR(parseFloat(formFeedAmount), parseFloat(formEggWeight))}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                <textarea
                  id="form-notes-input"
                  rows={2}
                  placeholder="Kondisi cuaca, penggantian sekam, atau kejadian penting lainnya..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs text-slate-800 resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  id="cancel-form-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="submit-form-btn"
                  type="submit"
                  disabled={formSubmitLoading}
                  className="flex-1 py-2.5 bg-emerald-600 text-xs font-bold text-white rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-smooth cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {formSubmitLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Simpan Data"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
