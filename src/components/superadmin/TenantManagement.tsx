import React, { useState, useEffect } from "react";
import { 
  Database, Users, Home, Activity, FileText, CheckSquare, 
  Search, Filter, ChevronRight, Eye, RefreshCw, AlertTriangle, 
  ArrowLeft, Check, Sparkles, Building, Info, AlertCircle, Ban, HelpCircle
} from "lucide-react";

interface TenantManagementProps {
  token: string;
}

interface TenantStat {
  userId: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "petugas";
  createdAt: number;
  isVerified: boolean;
  kandangsCount: number;
  logsCount: number;
  vaccinationsCount: number;
  biosecurityCount: number;
  totalCagesPopulation: number;
  lastActivity: number;
  plan?: "free" | "pro" | "enterprise";
  status?: "active" | "suspended";
  maxKandangs?: number;
  maxLogs?: number;
}

export default function TenantManagement({ token }: TenantManagementProps) {
  const [tenants, setTenants] = useState<TenantStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sub-view detailed states
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantDetails, setTenantDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailSubTab, setDetailSubTab] = useState<"kandang" | "logs" | "vaccinations" | "biosecurity">("kandang");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Inside detail sub-tables search
  const [detailQuery, setDetailQuery] = useState("");

  useEffect(() => {
    fetchTenantsStats();
  }, [token]);

  const fetchTenantsStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/superadmin/tenants-stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      } else {
        throw new Error("Gagal mengambil statistik data kepemilikan tenant.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantDetails = async (userId: string) => {
    setSelectedTenantId(userId);
    setDetailsLoading(true);
    setDetailsError("");
    setTenantDetails(null);
    setDetailQuery("");
    try {
      const res = await fetch(`/api/superadmin/tenants/${userId}/details`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTenantDetails(data);
      } else {
        throw new Error("Gagal mengambil rincian data milik tenant.");
      }
    } catch (err: any) {
      setDetailsError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateTenantSaaS = async (userId: string, plan: "free" | "pro" | "enterprise", status: "active" | "suspended") => {
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/superadmin/tenants/${userId}/saas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ plan, status })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || "Subscription dan status akun tenant berhasil diperbarui!");
        fetchTenantsStats();
        // If we are currently viewing the detail of this tenant, update details too
        if (selectedTenantId === userId) {
          fetchTenantDetails(userId);
        }
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        throw new Error(data.message || "Gagal memperbarui status SaaS.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Filter lists
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = 
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.email.toLowerCase().includes(searchQuery.toLowerCase());

    const planVal = t.plan || "free";
    const matchesPlan = planFilter === "all" || planVal === planFilter;

    const statusVal = t.status || "active";
    const matchesStatus = statusFilter === "all" || statusVal === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate high level metrics
  const totalCages = tenants.reduce((sum, t) => sum + t.kandangsCount, 0);
  const totalPopulation = tenants.reduce((sum, t) => sum + t.totalCagesPopulation, 0);
  const totalLogs = tenants.reduce((sum, t) => sum + t.logsCount + t.vaccinationsCount + t.biosecurityCount, 0);

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2.5 font-semibold animate-fade-in">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DETAILED TENANT VIEW */}
      {selectedTenantId ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedTenantId(null);
                  setTenantDetails(null);
                  setDetailQuery("");
                }}
                className="p-2.5 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                title="Kembali ke Daftar Tenant"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 capitalize">
                    Audit Data Tenant: {tenantDetails?.user?.username || "Memuat..."}
                  </h3>
                  {tenantDetails?.user?.role && (
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                      {tenantDetails.user.role}
                    </span>
                  )}
                  {tenantDetails?.user?.plan && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      tenantDetails.user.plan === "enterprise"
                        ? "bg-violet-50 text-violet-700 border border-violet-200"
                        : tenantDetails.user.plan === "pro"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      Paket {tenantDetails.user.plan}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{tenantDetails?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTenantDetails(selectedTenantId)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${detailsLoading ? "animate-spin" : ""}`} />
                <span>Refresh Data Audit</span>
              </button>
            </div>
          </div>

          {detailsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-bold">Mengaudit rekaman basis data milik tenant...</p>
            </div>
          ) : detailsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Gagal memuat rincian: {detailsError}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stat Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Kandang */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Kandang Operasional</span>
                    <Home className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-black text-slate-900">{tenantDetails?.kandangs?.length || 0} Unit</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {(tenantDetails?.kandangs?.reduce((sum: number, k: any) => sum + (k.population || 0), 0) || 0).toLocaleString("id-ID")} Ekor Terdaftar
                    </p>
                  </div>
                </div>

                {/* Logs */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Entri Log Harian</span>
                    <FileText className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-black text-slate-900">{tenantDetails?.logs?.length || 0} Record</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Historikal rekam harian</p>
                  </div>
                </div>

                {/* Vaccinations */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Jadwal Vaksinasi</span>
                    <Activity className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-black text-slate-900">{tenantDetails?.vaccinations?.length || 0} Jadwal</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {tenantDetails?.vaccinations?.filter((v: any) => v.status === "Pending").length || 0} Status Pending
                    </p>
                  </div>
                </div>

                {/* Biosecurity */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Inspeksi Biosekuriti</span>
                    <CheckSquare className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xl font-black text-slate-900">{tenantDetails?.biosecurity?.length || 0} Laporan</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Skor kepatuhan sanitasi</p>
                  </div>
                </div>
              </div>

              {/* Sub tabs of data details */}
              <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
                <button
                  onClick={() => { setDetailSubTab("kandang"); setDetailQuery(""); }}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    detailSubTab === "kandang"
                      ? "border-emerald-600 text-emerald-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Unit Kandang ({tenantDetails?.kandangs?.length || 0})
                </button>
                <button
                  onClick={() => { setDetailSubTab("logs"); setDetailQuery(""); }}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    detailSubTab === "logs"
                      ? "border-emerald-600 text-emerald-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Laporan Log Harian ({tenantDetails?.logs?.length || 0})
                </button>
                <button
                  onClick={() => { setDetailSubTab("vaccinations"); setDetailQuery(""); }}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    detailSubTab === "vaccinations"
                      ? "border-emerald-600 text-emerald-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Jadwal Vaksinasi ({tenantDetails?.vaccinations?.length || 0})
                </button>
                <button
                  onClick={() => { setDetailSubTab("biosecurity"); setDetailQuery(""); }}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    detailSubTab === "biosecurity"
                      ? "border-emerald-600 text-emerald-700 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Laporan Biosekuriti ({tenantDetails?.biosecurity?.length || 0})
                </button>
              </div>

              {/* Search filter within details tab */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    detailSubTab === "kandang" ? "Cari nama kandang..." :
                    detailSubTab === "logs" ? "Cari tanggal (YYYY-MM-DD) atau kandang..." :
                    detailSubTab === "vaccinations" ? "Cari nama vaksin atau metode..." :
                    "Cari pemeriksa atau catatan..."
                  }
                  value={detailQuery}
                  onChange={(e) => setDetailQuery(e.target.value)}
                  className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              {/* DETAILS CONTENT TABULATION */}
              {detailSubTab === "kandang" && (
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-4">Nama Unit Kandang</th>
                        <th className="py-2.5 px-4 text-center">Populasi (Ekor)</th>
                        <th className="py-2.5 px-4 text-center">Tanggal Dibuat</th>
                        <th className="py-2.5 px-4 text-center">Update Terakhir</th>
                        <th className="py-2.5 px-4">ID Kandang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {(() => {
                        const filtered = (tenantDetails?.kandangs || []).filter((k: any) => 
                          k.name?.toLowerCase().includes(detailQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                                Belum ada unit kandang terdaftar atau tidak ditemukan.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((k: any) => (
                          <tr key={k.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-900">{k.name}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-800">{k.population?.toLocaleString("id-ID")} ekor</td>
                            <td className="py-3 px-4 text-center text-slate-500 font-medium">
                              {new Date(k.createdAt).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-500 font-medium">
                              {new Date(k.lastUpdated).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400 select-all">{k.id}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {detailSubTab === "logs" && (
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-4">Tanggal Log</th>
                        <th className="py-2.5 px-4">Nama Kandang</th>
                        <th className="py-2.5 px-4 text-right">Butir Telur (Egg)</th>
                        <th className="py-2.5 px-4 text-right">Massa Telur</th>
                        <th className="py-2.5 px-4 text-right">Sisa Pakan</th>
                        <th className="py-2.5 px-4 text-center">Mortality (Mati)</th>
                        <th className="py-2.5 px-4">Catatan Entri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {(() => {
                        const sortedLogs = [...(tenantDetails?.logs || [])].sort((a: any, b: any) => b.date.localeCompare(a.date));
                        const filtered = sortedLogs.filter((l: any) => 
                          l.date?.toLowerCase().includes(detailQuery.toLowerCase()) ||
                          l.kandangName?.toLowerCase().includes(detailQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                                Belum ada entri log harian atau tidak ditemukan.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{l.date}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-700">{l.kandangName}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-emerald-700">{l.eggCount?.toLocaleString("id-ID")} btr</td>
                            <td className="py-2.5 px-4 text-right font-mono">{l.eggWeight?.toFixed(1)} kg</td>
                            <td className="py-2.5 px-4 text-right font-mono">{l.feedAmount?.toFixed(1)} kg</td>
                            <td className="py-2.5 px-4 text-center font-mono text-red-600 font-black">{l.chickenDead || 0} ekor</td>
                            <td className="py-2.5 px-4 text-slate-500 font-normal max-w-xs truncate" title={l.notes}>
                              {l.notes || "-"}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {detailSubTab === "vaccinations" && (
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-4">Nama Vaksin</th>
                        <th className="py-2.5 px-4">Nama Kandang</th>
                        <th className="py-2.5 px-4">Metode Pemberian</th>
                        <th className="py-2.5 px-4 text-center">Rencana Jadwal</th>
                        <th className="py-2.5 px-4 text-center">Tanggal Aktual</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {(() => {
                        const filtered = (tenantDetails?.vaccinations || []).filter((v: any) => 
                          v.vaccineName?.toLowerCase().includes(detailQuery.toLowerCase()) ||
                          v.method?.toLowerCase().includes(detailQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                Belum ada jadwal vaksinasi atau tidak ditemukan.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((v: any) => (
                          <tr key={v.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-900">{v.vaccineName}</td>
                            <td className="py-3 px-4 font-bold text-slate-600">{v.kandangName}</td>
                            <td className="py-3 px-4 text-slate-500 font-medium">{v.method}</td>
                            <td className="py-3 px-4 text-center font-mono">{v.plannedDate}</td>
                            <td className="py-3 px-4 text-center font-mono text-slate-500">{v.actualDate || "-"}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                v.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                              }`}>
                                {v.status === "Completed" ? "Selesai" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {detailSubTab === "biosecurity" && (
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-4">Tanggal Pemeriksaan</th>
                        <th className="py-2.5 px-4">Pemeriksa / Inspector</th>
                        <th className="py-2.5 px-4 text-center">Skor Kelayakan</th>
                        <th className="py-2.5 px-4">Catatan Penilaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {(() => {
                        const filtered = (tenantDetails?.biosecurity || []).filter((b: any) => 
                          b.inspectorName?.toLowerCase().includes(detailQuery.toLowerCase()) ||
                          b.notes?.toLowerCase().includes(detailQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                                Belum ada laporan biosekuriti atau tidak ditemukan.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((b: any) => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.date}</td>
                            <td className="py-3 px-4 font-bold text-slate-700">{b.inspectorName}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                b.score >= 80
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : b.score >= 55
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                              }`}>
                                {b.score}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-normal max-w-sm truncate" title={b.notes}>
                              {b.notes || "-"}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD TENANTS OVERVIEW LIST */
        <div className="space-y-6">
          {/* Bento metrics widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Tenants */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tenant Akun</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{tenants.length} Akun</p>
              </div>
            </div>

            {/* Total Cages */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kandang Terpantau</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{totalCages} Kandang</p>
              </div>
            </div>

            {/* Total Population */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Populasi Ayam</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{totalPopulation.toLocaleString("id-ID")} Ekor</p>
              </div>
            </div>

            {/* Total Logs */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Record Data</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{totalLogs.toLocaleString("id-ID")} Entri</p>
              </div>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="bg-slate-50 border border-slate-200/80 p-4.5 rounded-2xl flex items-start gap-3.5">
            <Building className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">SaaS Multi-Tenancy & Segmentasi Data</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Sistem database LayerFarm mempartisi seluruh transaksi operasional berdasarkan identitas <span className="font-mono text-emerald-600 text-xs font-black">userId</span> pemilik. 
                Anda dapat mengontrol masa aktif langganan akun (SaaS Subscription) serta mengaudit rincian data milik masing-masing pelanggan di bawah ini secara terisolasi.
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tenant berdasarkan nama/email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Paket (Plans)</option>
                <option value="free">Free Tier</option>
                <option value="pro">Pro Member</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Ban className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Status Akun</option>
                <option value="active">Active (Normal)</option>
                <option value="suspended">Suspended (Ditangguhkan)</option>
              </select>
            </div>
          </div>

          {/* Tenants grid */}
          {loading && tenants.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-bold">Memasuki dashboard kepemilikan tenant...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/40">
              <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">Tidak ada tenant terdaftar yang cocok dengan filter Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.map((t) => {
                const plan = t.plan || "free";
                const status = t.status || "active";
                const maxKandangs = t.maxKandangs !== undefined ? t.maxKandangs : 2;
                const maxLogs = t.maxLogs !== undefined ? t.maxLogs : 30;

                return (
                  <div 
                    key={t.userId} 
                    className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 font-semibold"
                  >
                    {/* User Profile Info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[10px] uppercase border border-slate-200">
                            {t.username.slice(0, 2)}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 capitalize truncate max-w-[130px]">{t.username}</h4>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                          {t.role}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate mt-0.5">{t.email}</p>
                    </div>

                    {/* SaaS Management Panel */}
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SaaS Subscription</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                          status === "active" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                        }`}>
                          {status === "active" ? "Aktif (Normal)" : "Suspended"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Plan */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paket</label>
                          <select
                            value={plan}
                            onChange={(e) => handleUpdateTenantSaaS(t.userId, e.target.value as any, status)}
                            className="w-full text-[11px] font-bold py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="free">Free Tier</option>
                            <option value="pro">Pro Member</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                        {/* Status */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Akun</label>
                          <select
                            value={status}
                            onChange={(e) => handleUpdateTenantSaaS(t.userId, plan, e.target.value as any)}
                            className="w-full text-[11px] font-bold py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      {/* Quotas */}
                      <div className="pt-2.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400">Kuota Kandang:</span>
                          <span className="font-extrabold text-slate-800 ml-1.5">
                            {t.kandangsCount}/{maxKandangs === 9999 ? "∞" : maxKandangs}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Kuota Log Harian:</span>
                          <span className="font-extrabold text-slate-800 ml-1.5">
                            {t.logsCount}/{maxLogs === 9999 ? "∞" : maxLogs}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Summary */}
                    <div className="border-t border-b border-slate-100 py-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Kandang & Ayam</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {t.kandangsCount} Unit <span className="text-slate-400 text-[10px] font-medium">({t.totalCagesPopulation.toLocaleString("id-ID")})</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Log Entri</p>
                        <p className="font-bold text-slate-800 mt-0.5">{t.logsCount} Record</p>
                      </div>
                      <div className="mt-1">
                        <p className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Vaksinasi</p>
                        <p className="font-bold text-slate-800 mt-0.5">{t.vaccinationsCount} Jadwal</p>
                      </div>
                      <div className="mt-1">
                        <p className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Biosekuriti</p>
                        <p className="font-bold text-slate-800 mt-0.5">{t.biosecurityCount} Laporan</p>
                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>Aktivitas Terakhir</span>
                        <span>
                          {t.lastActivity 
                            ? new Date(t.lastActivity).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "-"
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => fetchTenantDetails(t.userId)}
                        className="w-full py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Eye className="w-4.5 h-4.5" />
                        <span>Audit Data Kepemilikan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
