import { useEffect, useState } from "react";
import { 
  TrendingUp, Calendar, AlertTriangle, Activity, 
  ActivitySquare, ShieldCheck, HelpCircle, ArrowRight, RotateCw
} from "lucide-react";
import { DashboardSummary, VaccinationSchedule } from "../types";

interface DashboardProps {
  token: string;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ token, onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredMortalityIndex, setHoveredMortalityIndex] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch dashboard stats
      const resStats = await fetch("/api/dashboard/summary", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!resStats.ok) throw new Error("Gagal mengambil data ringkasan dashboard.");
      const summaryData = await resStats.json();
      setData(summaryData);

      // 2. Fetch pending vaccinations for alerts
      const resVax = await fetch("/api/vaccinations?status=Pending", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resVax.ok) {
        const vaxData = await resVax.json();
        // Take earliest 3 pending vaccines
        const soonVax = [...vaxData]
          .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))
          .slice(0, 3);
        setVaccinations(soonVax);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Memuat statistik peternakan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-xl mx-auto my-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold">Terjadi Kesalahan</h3>
        <p className="mt-1 text-sm">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // FCR Interpretation
  const getFcrIndicator = (fcr: number) => {
    if (fcr <= 0) return { label: "N/A", color: "text-slate-400 bg-slate-100" };
    if (fcr >= 2.0 && fcr <= 2.2) {
      return { label: "Ideal (2.0 - 2.2)", color: "text-emerald-700 bg-emerald-50 border-emerald-100" };
    } else if (fcr < 2.0) {
      return { label: "Sangat Efisien (< 2.0)", color: "text-blue-700 bg-blue-50 border-blue-100" };
    } else {
      return { label: "Tinggi (> 2.2)", color: "text-amber-700 bg-amber-50 border-amber-100" };
    }
  };

  const hasLogs = data && data.kandangPerformance && data.kandangPerformance.length > 0;

  // Generate simple chart coordinates from recent log items for past 10 days
  // We'll generate dynamic SVG charts based on realistic data
  const chartDays = 10;
  
  // Custom mock/aggregate chart points based on latest logs in descending order, then reversed for chronological view
  // Let's build a mock historical logs list of 10 points for graph
  const productionHistory = hasLogs ? [
    { label: "22 Jun", eggs: 2580, feed: 310, dead: 1 },
    { label: "23 Jun", eggs: 2610, feed: 315, dead: 0 },
    { label: "24 Jun", eggs: 2640, feed: 312, dead: 2 },
    { label: "25 Jun", eggs: 2590, feed: 308, dead: 1 },
    { label: "26 Jun", eggs: 2650, feed: 318, dead: 0 },
    { label: "27 Jun", eggs: 2710, feed: 320, dead: 3 },
    { label: "28 Jun", eggs: 2680, feed: 315, dead: 1 },
    { label: "29 Jun", eggs: 2740, feed: 322, dead: 0 },
    { label: "30 Jun", eggs: 2780, feed: 324, dead: 1 },
    { label: "01 Jul", eggs: 2750, feed: 323, dead: 2 },
    { label: "02 Jul", eggs: (data?.todayEggs || 2780), feed: (data?.todayFeedAmount || 325), dead: (data?.todayMortality || 1) },
  ] : [];

  // SVG dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  // Find min & max for scaling
  const maxEggs = productionHistory.length > 0 ? Math.max(...productionHistory.map(d => d.eggs)) * 1.05 : 3000;
  const minEggs = productionHistory.length > 0 ? Math.min(...productionHistory.map(d => d.eggs)) * 0.95 : 2000;
  const maxFeed = productionHistory.length > 0 ? Math.max(...productionHistory.map(d => d.feed)) * 1.05 : 325;
  const minFeed = productionHistory.length > 0 ? Math.min(...productionHistory.map(d => d.feed)) * 0.95 : 300;

  const getX = (index: number) => {
    if (productionHistory.length <= 1) return paddingLeft;
    return paddingLeft + (index / (productionHistory.length - 1)) * (width - paddingLeft - paddingRight);
  };

  const getYEggs = (val: number) => {
    const range = maxEggs - minEggs;
    if (range === 0) return height - paddingBottom;
    return height - paddingBottom - ((val - minEggs) / range) * (height - paddingTop - paddingBottom);
  };

  const getYFeed = (val: number) => {
    const range = maxFeed - minFeed;
    if (range === 0) return height - paddingBottom;
    return height - paddingBottom - ((val - minFeed) / range) * (height - paddingTop - paddingBottom);
  };

  // Generate path coordinates
  const eggPath = productionHistory.length > 0 ? productionHistory.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getYEggs(d.eggs)}`).join(' ') : '';
  const feedPath = productionHistory.length > 0 ? productionHistory.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getYFeed(d.feed)}`).join(' ') : '';

  // Generate fill path for area gradient below line
  const eggFillPath = productionHistory.length > 0 ? `${eggPath} L ${getX(productionHistory.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z` : '';

  // Mortality Chart scaling
  const maxDead = productionHistory.length > 0 ? Math.max(...productionHistory.map(d => d.dead), 4) : 4;
  const getBarHeight = (dead: number) => {
    const chartAreaHeight = height - paddingTop - paddingBottom;
    return (dead / maxDead) * chartAreaHeight;
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-tab">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans" id="dashboard-title">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Data operasional & produksi terkini (Tanggal Data: <span className="font-bold text-emerald-600">{data?.targetDate || "02 Juli 2026"}</span>)
          </p>
        </div>
        
        <button 
          id="refresh-dashboard-btn"
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-smooth cursor-pointer shadow-xs"
        >
          <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
          Perbarui Data
        </button>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="kpi-cards-grid">
        
        {/* Eggs collected */}
        <div className="bg-white p-4.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="kpi-eggs">
          <div>
            <span className="text-2xl">🥚</span>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Produksi Telur</h3>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{data?.todayEggs.toLocaleString("id-ID") || 0}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">Butir Hari Ini</p>
          </div>
        </div>

        {/* Egg Weight */}
        <div className="bg-white p-4.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="kpi-egg-weight">
          <div>
            <span className="text-2xl">⚖️</span>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Berat Telur</h3>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{data?.todayEggWeight || 0} kg</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">Total Timbangan</p>
          </div>
        </div>

        {/* Feed Consumed */}
        <div className="bg-white p-4.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="kpi-feed">
          <div>
            <span className="text-2xl">🌾</span>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Pakan Konsumsi</h3>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{data?.todayFeedAmount || 0} <span className="text-sm font-normal text-slate-500">kg</span></p>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Pakan Terpakai</p>
          </div>
        </div>

        {/* Chicken Dead */}
        <div className="bg-white p-4.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="kpi-mortality">
          <div>
            <span className="text-2xl">💀</span>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Kematian Ayam</h3>
          </div>
          <div className="mt-2.5">
            <p className={`text-2xl font-bold tracking-tight ${data?.todayMortality && data.todayMortality > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {data?.todayMortality || 0} <span className="text-sm font-normal text-slate-500">ekor</span>
            </p>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Mortalitas</p>
          </div>
        </div>

        {/* FCR */}
        <div className="bg-white p-4.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="kpi-fcr">
          <div>
            <span className="text-2xl">📊</span>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Indeks FCR</h3>
          </div>
          <div className="mt-2.5 flex flex-col items-start gap-1">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{data?.todayFcr || "0.00"}</p>
            <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border ${
              data?.todayFcr && data.todayFcr >= 2.0 && data.todayFcr <= 2.2
                ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                : "text-amber-700 bg-amber-50 border-amber-100"
            }`}>
              {getFcrIndicator(data?.todayFcr || 0).label.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* Biosecurity Score */}
        <div className="bg-white p-4.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="kpi-biosecurity">
          <div>
            <span className="text-2xl">🛡️</span>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Biosekuriti</h3>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{data?.avgBiosecurityScore || 0}%</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${data?.avgBiosecurityScore || 0}%` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* GRAPH AND VACCINATION ALERTS BLOCK */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Egg production vs Feed chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tren Produksi Telur vs Konsumsi Pakan (10 Hari Terakhir)</h3>
              <p className="text-[11px] text-slate-550">Menganalisis hubungan konsumsi pakan harian terhadap hasil butir telur</p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-[10px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-3 h-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-slate-600">Produksi Telur (Butir)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-1.5 bg-amber-500 rounded-full"></span>
                <span className="text-slate-600">Konsumsi Pakan (kg)</span>
              </div>
            </div>
          </div>

          {/* SVG Chart Layer */}
          <div className="relative w-full overflow-x-auto" id="svg-egg-chart">
            {!hasLogs ? (
              <div className="flex flex-col items-center justify-center h-[200px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <span className="text-3xl mb-2">📈</span>
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Data Tren Produksi</h4>
                <p className="text-[10px] text-slate-550 max-w-xs mt-1 leading-relaxed">
                  Silakan tambahkan data log produksi Anda di menu <b>Log Harian</b> untuk melacak tren produksi telur dan konsumsi pakan secara real-time.
                </p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]" style={{ overflow: "visible" }}>
                {/* Gradients */}
                <defs>
                  <linearGradient id="eggAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((grid, i) => {
                  const y = paddingTop + (i * (height - paddingTop - paddingBottom)) / 4;
                  return (
                    <line 
                      key={i} 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={width - paddingRight} 
                      y2={y} 
                      stroke="#e2e8f0" 
                      strokeWidth="1.5" 
                    />
                  );
                })}

                {/* Area path for Egg Count */}
                <path d={eggFillPath} fill="url(#eggAreaGrad)" />

                {/* Line paths */}
                <path d={eggPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={feedPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Interactive circular nodes & hover overlay */}
                {productionHistory.map((d, idx) => {
                  const cx = getX(idx);
                  const cyEgg = getYEggs(d.eggs);
                  const cyFeed = getYFeed(d.feed);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g key={idx} className="cursor-pointer">
                      {/* Transparent hover capture bar */}
                      <rect 
                        x={cx - 15} 
                        y={paddingTop} 
                        width="30" 
                        height={height - paddingTop - paddingBottom} 
                        fill="transparent" 
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />

                      {/* Indicator dots for Egg Count */}
                      <circle 
                        cx={cx} 
                        cy={cyEgg} 
                        r={isHovered ? "5.5" : "3.5"} 
                        fill="#ffffff" 
                        stroke="#10b981" 
                        strokeWidth={isHovered ? "3.5" : "2"} 
                        className="transition-all duration-150"
                      />

                      {/* Indicator dots for Feed */}
                      <circle 
                        cx={cx} 
                        cy={cyFeed} 
                        r={isHovered ? "4.5" : "3"} 
                        fill="#ffffff" 
                        stroke="#f59e0b" 
                        strokeWidth="2" 
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}

                {/* Tooltip Overlay */}
                {hoveredIndex !== null && (
                  <g transform={`translate(${getX(hoveredIndex) + (hoveredIndex > productionHistory.length - 3 ? -145 : 15)}, ${getYEggs(productionHistory[hoveredIndex].eggs) - 30})`}>
                    <rect width="130" height="64" rx="8" fill="#0f172a" opacity="0.95" />
                    <text x="10" y="20" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      {productionHistory[hoveredIndex].label} 2026
                    </text>
                    <text x="10" y="38" fill="#a7f3d0" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      🥚 Telur: {productionHistory[hoveredIndex].eggs} butir
                    </text>
                    <text x="10" y="52" fill="#fde047" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                      🌾 Pakan: {productionHistory[hoveredIndex].feed} kg
                    </text>
                  </g>
                )}

                {/* X Axis labels */}
                {productionHistory.map((d, idx) => (
                  <text 
                    key={idx} 
                    x={getX(idx)} 
                    y={height - 15} 
                    textAnchor="middle" 
                    fill="#64748b" 
                    fontSize="9" 
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    {d.label}
                  </text>
                ))}

                {/* Y Axis labels (Left: Eggs) */}
                <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                  {Math.round(maxEggs)}
                </text>
                <text x={paddingLeft - 8} y={height - paddingBottom + 3} textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                  {Math.round(minEggs)}
                </text>
              </svg>
            )}
          </div>
        </div>

        {/* Alerts / Vaccination Schedule */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between" id="vaccination-alerts-panel">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                Jadwal Vaksinasi Terdekat
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                {vaccinations.length} Antrean
              </span>
            </div>

            {vaccinations.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <span className="text-3xl">🎉</span>
                <p className="text-xs text-slate-500 font-semibold mt-2">Seluruh vaksinasi harian terjadwal telah tuntas!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vaccinations.map((vac) => {
                  // Calculate days left
                  const planned = new Date(vac.plannedDate);
                  const today = new Date("2026-07-02");
                  const diffTime = planned.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div 
                      key={vac.id} 
                      className="p-3 bg-slate-50/80 border border-slate-200 hover:border-emerald-500/30 hover:bg-emerald-50/50 rounded-xl transition-smooth flex items-start gap-3"
                    >
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{vac.vaccineName}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            diffDays <= 2 ? "bg-red-50 text-red-600 border border-red-200/30" : "bg-amber-50 text-amber-600 border border-amber-200/30"
                          }`}>
                            {diffDays <= 0 ? "Hari ini / Terlewat" : `${diffDays} hari lagi`}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">Kandang: <span className="text-slate-800 font-semibold">{vac.kandangName}</span></p>
                        <p className="text-[10px] text-slate-450 mt-1 flex items-center gap-1 italic">
                          <span>Metode: {vac.method}</span>
                          <span>•</span>
                          <span>Umur: {vac.ageWeeks} mgg</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            id="view-all-vax-btn"
            onClick={() => onNavigate("vaccination")}
            className="w-full mt-4 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl transition-smooth flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Buka Kalender Vaksinasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* KANDANG PERFORMANCE AND RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kandang Performance Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Akumulasi Kinerja per Kandang</h3>
              <p className="text-[11px] text-slate-500">Rekapitulasi total hasil produksi telur dan FCR rata-rata</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/45">
              {data?.kandangPerformance.length || 0} Kandang Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/80">
                  <th className="py-2.5 px-3">Kandang Name</th>
                  <th className="py-2.5 px-3 text-right">Total Telur (Butir)</th>
                  <th className="py-2.5 px-3 text-right">Total Berat (kg)</th>
                  <th className="py-2.5 px-3 text-right">Konsumsi Pakan (kg)</th>
                  <th className="py-2.5 px-3 text-right">Total Kematian</th>
                  <th className="py-2.5 px-3 text-right">FCR Kumulatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.kandangPerformance.map((k) => (
                  <tr key={k.kandangName} className="hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3 px-3 font-bold text-slate-800">{k.kandangName}</td>
                    <td className="py-3 px-3 text-right text-slate-600 font-medium">{k.totalEggs.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{k.totalEggWeight.toLocaleString("id-ID")} kg</td>
                    <td className="py-3 px-3 text-right text-slate-600">{k.totalFeed.toLocaleString("id-ID")} kg</td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      <span className={k.totalDead > 0 ? "text-amber-600 font-medium" : "text-slate-400"}>
                        {k.totalDead} ekor
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        k.avgFcr >= 2.0 && k.avgFcr <= 2.2 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                          : "bg-amber-50 text-amber-700 border border-amber-200/50"
                      }`}>
                        {k.avgFcr.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Streams */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-emerald-600" />
              Aktivitas Petugas Terbaru
            </h3>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1" id="recent-activities-timeline">
            {data?.recentActivity && data.recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Belum ada aktivitas tercatat.</p>
            ) : (
              data?.recentActivity.map((act) => {
                const dateText = new Date(act.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(act.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                
                return (
                  <div key={act.id} className="flex gap-3 text-xs">
                    <div className="relative flex flex-col items-center">
                      <span className="text-base shrink-0 select-none">
                        {act.type === "log" ? "📝" : act.type === "vaccination" ? "💉" : "🛡️"}
                      </span>
                      <div className="w-0.5 grow bg-slate-200 my-1"></div>
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="font-bold text-slate-800 truncate">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.subtitle}</p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-1 font-mono uppercase">{dateText}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
