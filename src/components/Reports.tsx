import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Info, 
  FileDown, 
  Filter, 
  RefreshCw, 
  Egg, 
  Activity, 
  Skull, 
  HeartPulse, 
  Award,
  Zap
} from "lucide-react";
import { LayerFarmLog } from "../types";
import { exportProductionToPDF } from "../utils/pdfExport";

interface ReportsProps {
  token: string;
}

export default function Reports({ token }: ReportsProps) {
  const [logs, setLogs] = useState<LayerFarmLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering States
  const [selectedKandang, setSelectedKandang] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Sub-reports/chart view tab
  const [activeChartTab, setActiveChartTab] = useState<"production" | "fcr" | "mortality">("production");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal mengambil data log produksi.");
      const data = await res.json();
      // Sort ascending by date for chronological charts
      const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
      setLogs(sorted);
    } catch (err: any) {
      setError(err.message || "Gagal memuat analitik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  // List of unique Kandang names for filtering
  const kandangList = Array.from(new Set(logs.map((log) => log.kandangName))).filter(Boolean);

  // Apply filters to logs
  const getFilteredLogs = () => {
    let filtered = [...logs];
    
    if (selectedKandang !== "all") {
      filtered = filtered.filter((log) => log.kandangName === selectedKandang);
    }
    
    if (startDate) {
      filtered = filtered.filter((log) => log.date >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter((log) => log.date <= endDate);
    }
    
    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  // Fallback data if no custom logs exist
  const getFallbackData = () => {
    return [
      { id: "1", date: "2026-06-23", eggCount: 2580, eggWeight: 154, feedAmount: 310, chickenDead: 1, deathReason: "Penyakit / Sakit", notes: "Kondisi stabil", lastUpdated: 0, createdAt: 0, kandangName: "Kandang A" },
      { id: "2", date: "2026-06-24", eggCount: 2610, eggWeight: 156, feedAmount: 315, chickenDead: 0, deathReason: "", notes: "Nafsu makan baik", lastUpdated: 0, createdAt: 0, kandangName: "Kandang A" },
      { id: "3", date: "2026-06-25", eggCount: 2640, eggWeight: 158, feedAmount: 312, chickenDead: 2, deathReason: "Stres Panas / Heatstroke", notes: "Suhu siang hari sangat panas", lastUpdated: 0, createdAt: 0, kandangName: "Kandang B" },
      { id: "4", date: "2026-06-26", eggCount: 2590, eggWeight: 155, feedAmount: 308, chickenDead: 1, deathReason: "Cedera / Kanibalisme", notes: "Perlu pemisahan agresif", lastUpdated: 0, createdAt: 0, kandangName: "Kandang A" },
      { id: "5", date: "2026-06-27", eggCount: 2650, eggWeight: 159, feedAmount: 318, chickenDead: 0, deathReason: "", notes: "Pemberian vitamin rutin", lastUpdated: 0, createdAt: 0, kandangName: "Kandang C" },
      { id: "6", date: "2026-06-28", eggCount: 2710, eggWeight: 162, feedAmount: 320, chickenDead: 3, deathReason: "Penyakit / Sakit", notes: "Pengecekan dokter hewan", lastUpdated: 0, createdAt: 0, kandangName: "Kandang A" },
      { id: "7", date: "2026-06-29", eggCount: 2680, eggWeight: 160, feedAmount: 315, chickenDead: 1, deathReason: "Predator / Hama", notes: "Sela kawat diperbaiki", lastUpdated: 0, createdAt: 0, kandangName: "Kandang B" },
      { id: "8", date: "2026-06-30", eggCount: 2740, eggWeight: 164, feedAmount: 322, chickenDead: 0, deathReason: "", notes: "Kondisi optimal", lastUpdated: 0, createdAt: 0, kandangName: "Kandang A" },
      { id: "9", date: "2026-07-01", eggCount: 2780, eggWeight: 166, feedAmount: 324, chickenDead: 1, deathReason: "Faktor Usia", notes: "Kelompok ayam tua", lastUpdated: 0, createdAt: 0, kandangName: "Kandang C" },
      { id: "10", date: "2026-07-02", eggCount: 2750, eggWeight: 165, feedAmount: 323, chickenDead: 2, deathReason: "Penyakit / Sakit", notes: "Dosis obat ditambah", lastUpdated: 0, createdAt: 0, kandangName: "Kandang A" },
    ];
  };

  const isUsingFallback = logs.length < 2;
  const activeLogs = isUsingFallback ? getFallbackData() : filteredLogs;

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedKandang("all");
    setStartDate("");
    setEndDate("");
  };

  // KPI Calculations
  const totalEggs = activeLogs.reduce((sum, log) => sum + log.eggCount, 0);
  const totalWeight = activeLogs.reduce((sum, log) => sum + log.eggWeight, 0);
  const totalFeed = activeLogs.reduce((sum, log) => sum + log.feedAmount, 0);
  const totalDeaths = activeLogs.reduce((sum, log) => sum + log.chickenDead, 0);
  const avgEggs = activeLogs.length > 0 ? Math.round(totalEggs / activeLogs.length) : 0;
  const avgWeight = activeLogs.length > 0 ? parseFloat((totalWeight / activeLogs.length).toFixed(1)) : 0;
  const overallFCR = totalWeight > 0 ? parseFloat((totalFeed / totalWeight).toFixed(2)) : 0;

  // Mortality rate calculation
  const mortalityLogs = activeLogs.filter((log) => log.chickenDead > 0);
  
  // Mortality breakdown
  const reasonBreakdown: Record<string, number> = {};
  mortalityLogs.forEach((log) => {
    const reason = log.deathReason || "Penyakit / Sakit";
    reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + log.chickenDead;
  });

  const sortedReasons = Object.entries(reasonBreakdown)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalDeaths > 0 ? Math.round((count / totalDeaths) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Download PDF
  const handleDownloadPDF = () => {
    const userStr = localStorage.getItem("user");
    let username = "Peternak";
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        username = user.username || "Peternak";
      } catch (e) {
        // fallback
      }
    }
    // Export either custom filtered logs or the active fallback set
    exportProductionToPDF(activeLogs, username);
  };

  // SVG Chart Scaling & Configurations
  const width = 600;
  const height = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const getX = (index: number, totalPoints: number) => {
    if (totalPoints <= 1) return paddingLeft + graphWidth / 2;
    return paddingLeft + (index / (totalPoints - 1)) * graphWidth;
  };

  // Helper to get FCR for a single log
  const getFCRValue = (feed: number, eggW: number) => {
    if (!feed || !eggW) return 0;
    return parseFloat((feed / eggW).toFixed(2));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 dark:text-slate-500 font-medium text-xs">Memuat laporan analitik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="reports-tab">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-sans">
              Laporan Grafis & Analitik
            </h1>
            {isUsingFallback && (
              <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Mode Simulasi
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Visualisasi performa produksi telur, FCR harian, dan tren rincian kematian ayam.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto uppercase tracking-wider"
          title="Unduh Laporan PDF"
        >
          <FileDown className="w-4.5 h-4.5" />
          <span>Unduh PDF</span>
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-end justify-between gap-4" id="reports-filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          {/* Kandang filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Pilih Kandang</label>
            <div className="relative">
              <select
                id="report-filter-kandang"
                value={selectedKandang}
                onChange={(e) => setSelectedKandang(e.target.value)}
                disabled={isUsingFallback}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-700 dark:text-slate-100 font-medium cursor-pointer disabled:opacity-50"
              >
                <option value="all">Semua Kandang</option>
                {kandangList.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-sans">Tanggal Mulai</label>
            <input
              id="report-filter-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isUsingFallback}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-700 dark:text-slate-100 disabled:opacity-50"
            />
          </div>

          {/* End Date filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-sans">Tanggal Selesai</label>
            <input
              id="report-filter-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isUsingFallback}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-700 dark:text-slate-100 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleResetFilters}
            disabled={isUsingFallback}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {isUsingFallback && (
        <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 text-xs text-amber-850 dark:text-amber-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-semibold">
            <span className="font-extrabold uppercase block mb-0.5">Perhatian: Mode Simulasi Aktif</span>
            Anda membutuhkan minimal 2 log harian asli di dalam sistem untuk membuat analitik yang akurat. Grafik di bawah ini sedang menampilkan data demonstrasi untuk memberikan gambaran lengkap fitur laporan. Silakan isi data di tab <b>Log Harian</b>!
          </div>
        </div>
      )}

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="reports-kpi-grid">
        
        {/* KPI 1: Total Eggs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Produksi Telur</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {totalEggs.toLocaleString("id-ID")} <span className="text-xs font-semibold text-slate-400">butir</span>
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              Rerata: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{avgEggs} butir / hari</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <Egg className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Feed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Pakan Konsumsi</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {totalFeed.toLocaleString("id-ID")} <span className="text-xs font-semibold text-slate-400">kg</span>
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              Rerata Berat Telur: <span className="text-slate-800 dark:text-slate-200 font-bold">{avgWeight} kg</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Average FCR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rasio Konversi FCR</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {overallFCR} <span className="text-xs font-semibold text-slate-400">kg/kg</span>
            </span>
            <p className="text-[10px] mt-1">
              {overallFCR >= 2.0 && overallFCR <= 2.2 ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded text-[9px] border border-emerald-100 dark:border-emerald-900/20">
                  <Award className="w-2.5 h-2.5" /> Sangat Ideal (2.0-2.2)
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded text-[9px] border border-amber-100 dark:border-amber-900/20">
                  ⚠️ Perlu Penyesuaian
                </span>
              )}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Mortality */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jumlah Mortalitas (Mati)</span>
            <span className="text-2xl font-extrabold text-red-650 dark:text-red-400 tracking-tight">
              {totalDeaths} <span className="text-xs font-semibold text-slate-400">ekor</span>
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[150px]">
              Faktor utama: <span className="text-red-600 dark:text-red-400 font-bold">{sortedReasons[0]?.reason || "Tidak Ada"}</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            <Skull className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* CHART VIEW NAVIGATION SUB-TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-xl" id="reports-subtabs">
        <button
          onClick={() => setActiveChartTab("production")}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${
            activeChartTab === "production"
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          📈 Tren Produksi Telur
        </button>
        <button
          onClick={() => setActiveChartTab("fcr")}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${
            activeChartTab === "fcr"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          📊 Analisis Efisiensi FCR
        </button>
        <button
          onClick={() => setActiveChartTab("mortality")}
          className={`flex-1 text-center py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${
            activeChartTab === "mortality"
              ? "bg-white dark:bg-slate-800 text-red-650 dark:text-red-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          💀 Pola & Sebab Kematian
        </button>
      </div>

      {/* RENDERED CHARTS */}
      <div className="grid grid-cols-1 gap-6" id="reports-charts-container">
        
        {/* TAB 1: PRODUCTION TREND */}
        {activeChartTab === "production" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs animate-fade-in">
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="text-emerald-600">🥚</span>
                Grafik Hasil Panen Telur (Butir) & Konsumsi Pakan (kg)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Membandingkan fluktuasi panen telur harian dengan porsi pemberian pakan dari kawanan terpilih.
              </p>
            </div>

            {activeLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs font-bold">
                Tidak ada data log dalam rentang filter ini.
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto mt-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map((grid, i) => {
                    const y = paddingTop + (i * graphHeight) / 4;
                    return (
                      <line 
                        key={i} 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={width - paddingRight} 
                        y2={y} 
                        className="stroke-slate-100 dark:stroke-slate-800" 
                        strokeWidth="1.5" 
                      />
                    );
                  })}

                  {/* Scalings */}
                  {(() => {
                    const eggVals = activeLogs.map((l) => l.eggCount);
                    const maxE = Math.max(...eggVals, 3000) * 1.05;
                    const minE = Math.min(...eggVals, 1000) * 0.95;

                    const getYEgg = (val: number) => {
                      return paddingTop + graphHeight - ((val - minE) / (maxE - minE)) * graphHeight;
                    };

                    // Draw line paths
                    const pathD = activeLogs.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, activeLogs.length)} ${getYEgg(d.eggCount)}`).join(' ');
                    const fillD = `${pathD} L ${getX(activeLogs.length - 1, activeLogs.length)} ${paddingTop + graphHeight} L ${getX(0, activeLogs.length)} ${paddingTop + graphHeight} Z`;

                    return (
                      <>
                        <path d={fillD} fill="url(#eggGrad)" />
                        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        
                        {/* Circle Nodes & Value Labels */}
                        {activeLogs.map((p, idx) => {
                          const cx = getX(idx, activeLogs.length);
                          const cy = getYEgg(p.eggCount);
                          return (
                            <g key={idx} className="group cursor-pointer">
                              <circle 
                                cx={cx}
                                cy={cy}
                                r="5"
                                className="fill-white dark:fill-slate-900 stroke-emerald-500 dark:stroke-emerald-400"
                                strokeWidth="3"
                              />
                              {activeLogs.length <= 15 && (
                                <text 
                                  x={cx} 
                                  y={cy - 10} 
                                  textAnchor="middle" 
                                  className="fill-emerald-700 dark:fill-emerald-400 text-[8px] font-black font-sans"
                                >
                                  {p.eggCount}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Y Axis Labels (Left) */}
                        <text x={paddingLeft - 8} y={paddingTop + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold">
                          {Math.round(maxE)} btr
                        </text>
                        <text x={paddingLeft - 8} y={paddingTop + graphHeight + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold">
                          {Math.round(minE)} btr
                        </text>
                      </>
                    );
                  })()}

                  {/* X Axis Date Labels */}
                  {activeLogs.map((p, idx) => {
                    if (activeLogs.length > 10 && idx % 2 !== 0 && idx !== activeLogs.length - 1) return null;
                    const dateFormatted = p.date.substring(5, 10).replace("-", "/");
                    return (
                      <text 
                        key={idx} 
                        x={getX(idx, activeLogs.length)} 
                        y={height - 15} 
                        textAnchor="middle" 
                        className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold"
                      >
                        {dateFormatted}
                      </text>
                    );
                  })}
                </svg>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-semibold justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5">
              <span>Rata-rata telur: {avgEggs} butir / hari</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Hasil Panen</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950"></span> Area Produksi</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FCR EFFICIENCY */}
        {activeChartTab === "fcr" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs animate-fade-in">
            <div className="mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="text-indigo-600">📊</span>
                Grafik Tren Indeks FCR (Feed Conversion Ratio)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Memantau efisiensi pakan secara visual. Zona hijau mewakili standard industri FCR ideal antara <b>2.00</b> hingga <b>2.20</b>.
              </p>
            </div>

            {activeLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs font-bold">
                Tidak ada data log untuk analitik FCR.
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto mt-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]" style={{ overflow: "visible" }}>
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map((grid, i) => {
                    const y = paddingTop + (i * graphHeight) / 4;
                    return (
                      <line 
                        key={i} 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={width - paddingRight} 
                        y2={y} 
                        className="stroke-slate-100 dark:stroke-slate-800" 
                        strokeWidth="1.5" 
                      />
                    );
                  })}

                  {/* Scales */}
                  {(() => {
                    const fcrVals = activeLogs.map((l) => getFCRValue(l.feedAmount, l.eggWeight)).filter(f => f > 0);
                    const maxF = Math.max(...fcrVals, 3.0);
                    const minF = Math.min(...fcrVals, 1.5);

                    const getYFcr = (val: number) => {
                      return paddingTop + graphHeight - ((val - minF) / (maxF - minF)) * graphHeight;
                    };

                    // Draw IDEAL BAND (FCR 2.0 - 2.2)
                    const idealTopY = getYFcr(2.2);
                    const idealBottomY = getYFcr(2.0);
                    const idealHeight = idealBottomY - idealTopY;

                    const fcrLinePath = activeLogs
                      .map((d, idx) => {
                        const f = getFCRValue(d.feedAmount, d.eggWeight);
                        if (f === 0) return "";
                        return `${idx === 0 ? 'M' : 'L'} ${getX(idx, activeLogs.length)} ${getYFcr(f)}`;
                      })
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <>
                        {/* Shaded ideal green band */}
                        <rect 
                          x={paddingLeft} 
                          y={idealTopY} 
                          width={graphWidth} 
                          height={idealHeight} 
                          fill="#10b981" 
                          fillOpacity="0.08" 
                        />
                        <line 
                          x1={paddingLeft} 
                          y1={idealTopY} 
                          x2={width - paddingRight} 
                          y2={idealTopY} 
                          stroke="#10b981" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />
                        <line 
                          x1={paddingLeft} 
                          y1={idealBottomY} 
                          x2={width - paddingRight} 
                          y2={idealBottomY} 
                          stroke="#10b981" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />

                        {/* Ideal Band Text */}
                        <text x={width - paddingRight - 8} y={idealTopY + 12} textAnchor="end" className="fill-emerald-700 dark:fill-emerald-400 text-[8px] font-black">
                          ZONA FCR IDEAL (2.0 - 2.2)
                        </text>

                        {/* FCR Trend line */}
                        {fcrLinePath && (
                          <path d={fcrLinePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Nodes */}
                        {activeLogs.map((p, idx) => {
                          const f = getFCRValue(p.feedAmount, p.eggWeight);
                          if (f === 0) return null;
                          const cx = getX(idx, activeLogs.length);
                          const cy = getYFcr(f);
                          const isIdeal = f >= 2.0 && f <= 2.2;
                          return (
                            <g key={idx}>
                              <circle 
                                cx={cx}
                                cy={cy}
                                r="4"
                                fill={isIdeal ? "#10b981" : "#e11d48"}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                            </g>
                          );
                        })}

                        {/* Y Axis Labels (Left) */}
                        <text x={paddingLeft - 8} y={paddingTop + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold">
                          {maxF.toFixed(2)}
                        </text>
                        <text x={paddingLeft - 8} y={paddingTop + graphHeight + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold">
                          {minF.toFixed(2)}
                        </text>
                      </>
                    );
                  })()}

                  {/* X Axis Labels */}
                  {activeLogs.map((p, idx) => {
                    if (activeLogs.length > 10 && idx % 2 !== 0 && idx !== activeLogs.length - 1) return null;
                    const dateFormatted = p.date.substring(5, 10).replace("-", "/");
                    return (
                      <text 
                        key={idx} 
                        x={getX(idx, activeLogs.length)} 
                        y={height - 15} 
                        textAnchor="middle" 
                        className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold"
                      >
                        {dateFormatted}
                      </text>
                    );
                  })}
                </svg>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-semibold justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5">
              <span>Indeks FCR Kumulatif Periode Ini: <span className="font-bold text-indigo-600 dark:text-indigo-400">{overallFCR}</span></span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> FCR Baik</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> FCR Kurang Baik</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Garis Tren</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MORTALITY & DECAY FACTORS */}
        {activeChartTab === "mortality" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* 3a: DAILY DEATH BARS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-2">
              <div className="mb-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="text-red-650">💀</span>
                  Grafik Sebaran Angka Kematian Harian (Ekor)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Grafik batang harian mendeteksi adanya lonjakan mortalitas secara tiba-tiba (mortality spike).
                </p>
              </div>

              {activeLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs font-bold">
                  Tidak ada data untuk grafik kematian.
                </div>
              ) : (
                <div className="relative w-full overflow-x-auto mt-4">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]" style={{ overflow: "visible" }}>
                    {/* Grid Lines */}
                    {[0, 1, 2, 3].map((grid, i) => {
                      const y = paddingTop + (i * graphHeight) / 3;
                      return (
                        <line 
                          key={i} 
                          x1={paddingLeft} 
                          y1={y} 
                          x2={width - paddingRight} 
                          y2={y} 
                          className="stroke-slate-100 dark:stroke-slate-800" 
                          strokeWidth="1.5" 
                        />
                      );
                    })}

                    {/* Bars */}
                    {(() => {
                      const deadCounts = activeLogs.map((l) => l.chickenDead);
                      const maxD = Math.max(...deadCounts, 4);

                      return activeLogs.map((p, idx) => {
                        const totalPoints = activeLogs.length;
                        const barWidth = (graphWidth / totalPoints) * 0.55;
                        const gap = (graphWidth / totalPoints) * 0.45;
                        const x = paddingLeft + (idx * (barWidth + gap)) + gap / 2;
                        const barH = (p.chickenDead / maxD) * graphHeight;
                        const y = paddingTop + graphHeight - barH;

                        return (
                          <g key={idx}>
                            <rect 
                              x={x}
                              y={y}
                              width={barWidth}
                              height={Math.max(barH, 3)} // at least 3px so we can see 0 rows
                              rx="2"
                              className={
                                p.chickenDead > 2 
                                  ? "fill-red-650 dark:fill-red-500" 
                                  : p.chickenDead > 0 
                                    ? "fill-amber-500" 
                                    : "fill-slate-200 dark:fill-slate-800"
                              }
                            />
                            {p.chickenDead > 0 && (
                              <text 
                                x={x + barWidth / 2} 
                                y={y - 5} 
                                textAnchor="middle" 
                                className="fill-red-650 dark:fill-red-400 text-[8px] font-black"
                              >
                                {p.chickenDead}
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}

                    {/* Y Axis Labels */}
                    {(() => {
                      const maxD = Math.max(...activeLogs.map((l) => l.chickenDead), 4);
                      return (
                        <>
                          <text x={paddingLeft - 8} y={paddingTop + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold">
                            {maxD} ekor
                          </text>
                          <text x={paddingLeft - 8} y={paddingTop + graphHeight + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[8px] font-bold">
                            0 ekor
                          </text>
                        </>
                      );
                    })()}

                    {/* X Axis Labels */}
                    {activeLogs.map((p, idx) => {
                      if (activeLogs.length > 10 && idx % 2 !== 0 && idx !== activeLogs.length - 1) return null;
                      const dateFormatted = p.date.substring(5, 10).replace("-", "/");
                      return (
                        <text 
                          key={idx} 
                          x={paddingLeft + (idx * (graphWidth / activeLogs.length)) + (graphWidth / activeLogs.length) / 2} 
                          y={height - 15} 
                          textAnchor="middle" 
                          className="fill-slate-500 dark:fill-slate-400 text-[9px] font-bold"
                        >
                          {dateFormatted}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* 3b: DISTRIBUTIONS AND REASONS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-1 space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="text-amber-500">🛡️</span>
                  Sebab Kematian Terbanyak
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Distribusi dan persentase alasan kematian ayam yang dicatat oleh petugas kandang.
                </p>
              </div>

              {sortedReasons.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed">
                  🍀 Sangat Bagus!<br />Belum ada data kematian ayam yang tercatat dalam periode ini.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {sortedReasons.map((item) => (
                    <div key={item.reason} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={item.reason}>
                          {item.reason}
                        </span>
                        <span className="text-slate-950 dark:text-slate-100 font-bold">
                          {item.count} ekor ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.reason.startsWith("Penyakit") ? "bg-red-500" :
                            item.reason.startsWith("Stres") ? "bg-amber-500" :
                            item.reason.startsWith("Cedera") ? "bg-orange-500" :
                            item.reason.startsWith("Afkir") ? "bg-indigo-500" :
                            item.reason.startsWith("Predator") ? "bg-purple-500" :
                            item.reason.startsWith("Faktor") ? "bg-sky-500" : "bg-slate-450"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* HEALTH INTERPRETATION GUIDELINE ALERT BOX */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0">
          💡
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold space-y-1.5">
          <span className="text-emerald-800 dark:text-emerald-400 font-black text-sm block">Panduan Interpretasi Grafis Multi-Variabel:</span>
          <p>
            Penurunan kurva produksi telur secara tiba-tiba (<b>Egg Drop</b>) yang disertai naiknya bar grafik kematian harian (<b>Mortality Spike</b>) merupakan indikator kuat adanya serangan penyakit klinis atau stress pakan akut.
          </p>
          <p>
            Pastikan klorinasi air minum terpenuhi, periksa sela kawat kandang untuk mencegah luka, dan pastikan kepatuhan biosekuriti serta jadwal vaksinasi dipenuhi oleh petugas kandang.
          </p>
        </div>
      </div>

    </div>
  );
}

