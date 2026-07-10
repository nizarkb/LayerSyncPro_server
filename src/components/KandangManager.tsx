import React, { useState, useEffect } from "react";
import { 
  Home, ShieldCheck, CalendarCheck2, Plus, Pencil, Trash2, 
  RefreshCw, AlertCircle, TrendingUp, Users, Check, X, Bird
} from "lucide-react";
import VaccinationTracker from "./VaccinationTracker.tsx";
import BiosecurityChecklist from "./BiosecurityChecklist.tsx";
import { Kandang, LayerFarmLog, Flock } from "../types.ts";

interface KandangManagerProps {
  token: string;
  userRole: "admin" | "petugas";
  activeSubTab?: "kandang" | "flock" | "vaccination" | "biosecurity";
  setActiveSubTab?: (tab: "kandang" | "flock" | "vaccination" | "biosecurity") => void;
}

export default function KandangManager({ token, userRole, activeSubTab: externalTab, setActiveSubTab: setExternalTab }: KandangManagerProps) {
  const [internalTab, setInternalTab] = useState<"kandang" | "flock" | "vaccination" | "biosecurity">("kandang");
  const activeSubTab = externalTab !== undefined ? externalTab : internalTab;
  const setActiveSubTab = setExternalTab !== undefined ? setExternalTab : setInternalTab;

  const [kandangs, setKandangs] = useState<Kandang[]>([]);
  const [logs, setLogs] = useState<LayerFarmLog[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedKandang, setSelectedKandang] = useState<Kandang | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formPopulation, setFormPopulation] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Kandangs, Logs and Flocks
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [kRes, lRes, fRes] = await Promise.all([
        fetch("/api/kandangs", { headers }),
        fetch("/api/logs", { headers }),
        fetch("/api/flocks", { headers })
      ]);

      if (!kRes.ok || !lRes.ok || !fRes.ok) {
        throw new Error("Gagal mengambil data dari server.");
      }

      const kData = await kRes.json();
      const lData = await lRes.json();
      const fData = await fRes.json();

      setKandangs(kData);
      setLogs(lData);
      setFlocks(fData);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Quick Adjuster
  const handleQuickAdjust = async (kandang: Kandang, amount: number) => {
    const newPopulation = Math.max(0, kandang.population + amount);
    
    // Optimistic Update
    setKandangs(prev => prev.map(k => k.id === kandang.id ? { ...k, population: newPopulation } : k));

    try {
      const response = await fetch(`/api/kandangs/${kandang.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ population: newPopulation })
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan penyesuaian populasi.");
      }
      
      const updated = await response.json();
      // Sync state with server response
      setKandangs(prev => prev.map(k => k.id === kandang.id ? updated.kandang : k));
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui populasi.");
      // Rollback on failure
      fetchData();
    }
  };

  // Add Kandang
  const handleAddKandang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/kandangs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          population: formPopulation
        })
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal menambahkan kandang baru.");
      }

      setShowAddModal(false);
      setFormName("");
      setFormPopulation(500);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Kandang
  const handleEditKandang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKandang || !formName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/kandangs/${selectedKandang.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          population: formPopulation
        })
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal memperbarui kandang.");
      }

      setShowEditModal(false);
      setSelectedKandang(null);
      setFormName("");
      setFormPopulation(500);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Kandang
  const handleDeleteKandang = async (id: string) => {
    if (userRole !== "admin") {
      alert("Hanya admin yang memiliki izin untuk menghapus kandang.");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus kandang ini? Semua data terkait di visualisasi mungkin terdampak.")) {
      return;
    }

    try {
      const response = await fetch(`/api/kandangs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus kandang.");
      }

      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openAddModal = () => {
    setFormName("");
    setFormPopulation(500);
    setShowAddModal(true);
  };

  const openEditModal = (kandang: Kandang) => {
    setSelectedKandang(kandang);
    setFormName(kandang.name);
    setFormPopulation(kandang.population);
    setShowEditModal(true);
  };

  // ==========================================
  // FLOCK STATE & ACTIONS
  // ==========================================
  const [showAddFlockModal, setShowAddFlockModal] = useState(false);
  const [showEditFlockModal, setShowEditFlockModal] = useState(false);
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);

  const [flockName, setFlockName] = useState("");
  const [flockKandangId, setFlockKandangId] = useState("");
  const [flockBreed, setFlockBreed] = useState("Lohmann Brown");
  const [flockInitialPop, setFlockInitialPop] = useState<number>(1000);
  const [flockCurrentPop, setFlockCurrentPop] = useState<number>(1000);
  const [flockEntryDate, setFlockEntryDate] = useState("");
  const [flockHatchDate, setFlockHatchDate] = useState("");
  const [flockAgeAtEntry, setFlockAgeAtEntry] = useState<number>(18);
  const [flockStatus, setFlockStatus] = useState<"active" | "depopulated">("active");
  const [flockNotes, setFlockNotes] = useState("");

  const resetFlockForm = () => {
    setFlockName("");
    setFlockKandangId(kandangs[0]?.id || "");
    setFlockBreed("Lohmann Brown");
    setFlockInitialPop(1000);
    setFlockCurrentPop(1000);
    setFlockEntryDate(new Date().toISOString().split("T")[0]);
    setFlockHatchDate("");
    setFlockAgeAtEntry(18);
    setFlockStatus("active");
    setFlockNotes("");
  };

  const openAddFlockModal = () => {
    resetFlockForm();
    setShowAddFlockModal(true);
  };

  const openEditFlockModal = (flock: Flock) => {
    setSelectedFlock(flock);
    setFlockName(flock.name);
    setFlockKandangId(flock.kandangId);
    setFlockBreed(flock.breed);
    setFlockInitialPop(flock.initialPopulation);
    setFlockCurrentPop(flock.currentPopulation);
    setFlockEntryDate(flock.entryDate);
    setFlockHatchDate(flock.hatchDate);
    setFlockAgeAtEntry(flock.ageWeeksAtEntry);
    setFlockStatus(flock.status);
    setFlockNotes(flock.notes || "");
    setShowEditFlockModal(true);
  };

  const getFlockAgeWeeks = (f: Flock) => {
    const entryTime = new Date(f.entryDate).getTime();
    const nowTime = Date.now();
    const diffMs = nowTime - entryTime;
    const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    return f.ageWeeksAtEntry + Math.max(0, diffWeeks);
  };

  const handleAddFlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flockName.trim() || !flockKandangId || !flockBreed) return;

    const selectedK = kandangs.find(k => k.id === flockKandangId);
    const kandangName = selectedK ? selectedK.name : "Kandang";

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/flocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          kandangId: flockKandangId,
          kandangName,
          name: flockName,
          breed: flockBreed,
          initialPopulation: flockInitialPop,
          currentPopulation: flockCurrentPop,
          entryDate: flockEntryDate || new Date().toISOString().split("T")[0],
          hatchDate: flockHatchDate || new Date(Date.now() - flockAgeAtEntry * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          ageWeeksAtEntry: flockAgeAtEntry,
          status: flockStatus,
          notes: flockNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal menambahkan flock baru.");
      }

      setShowAddFlockModal(false);
      resetFlockForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlock || !flockName.trim() || !flockKandangId || !flockBreed) return;

    const selectedK = kandangs.find(k => k.id === flockKandangId);
    const kandangName = selectedK ? selectedK.name : "Kandang";

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/flocks/${selectedFlock.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          kandangId: flockKandangId,
          kandangName,
          name: flockName,
          breed: flockBreed,
          initialPopulation: flockInitialPop,
          currentPopulation: flockCurrentPop,
          entryDate: flockEntryDate,
          hatchDate: flockHatchDate,
          ageWeeksAtEntry: flockAgeAtEntry,
          status: flockStatus,
          notes: flockNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui flock.");
      }

      setShowEditFlockModal(false);
      setSelectedFlock(null);
      resetFlockForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFlock = async (id: string) => {
    if (userRole !== "admin") {
      alert("Hanya admin yang memiliki izin untuk menghapus flock.");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan flock ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/flocks/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus flock.");
      }

      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Calculations for KPI Cards
  const totalPopulation = kandangs.reduce((sum, k) => sum + k.population, 0);
  const activeCagesCount = kandangs.length;
  const totalEggsCollected = logs.reduce((sum, l) => sum + l.eggCount, 0);

  // Cumulative production per cage for contribution stats
  const cageProductionMap = logs.reduce((acc, log) => {
    acc[log.kandangName] = (acc[log.kandangName] || 0) + log.eggCount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Manajemen Kandang
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau sebaran kandang layer, jadwal vaksinasi berkala, dan checklist biosekuriti harian hulu-hilir
          </p>
        </div>
        
        {/* SUB-TAB NAVIGATOR (NATIVE APP FEEL) */}
        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl max-w-md w-full sm:w-auto shadow-xs">
          <button
            onClick={() => setActiveSubTab("kandang")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "kandang" 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-650/10" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kandang</span>
          </button>
          <button
            onClick={() => setActiveSubTab("flock")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "flock" 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-650/10" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Bird className="w-3.5 h-3.5" />
            <span>Flock Ayam</span>
          </button>
          <button
            onClick={() => setActiveSubTab("vaccination")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "vaccination" 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-655/10" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Vaksinasi</span>
          </button>
          <button
            onClick={() => setActiveSubTab("biosecurity")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === "biosecurity" 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-655/10" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Biosekuriti</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-red-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">Tutup</button>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === "kandang" && (
        <div className="space-y-6">
          
          {/* KPI CARDS GRID (MATCHING SCREENSHOT 5) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Populasi Layer</h3>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {isLoading ? "..." : `${totalPopulation.toLocaleString("id-ID")} ekor`}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Home className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kandang Aktif</h3>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {isLoading ? "..." : `${activeCagesCount} Unit`}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Kontribusi Produksi</h3>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {isLoading ? "..." : `${totalEggsCollected.toLocaleString("id-ID")} btr`}
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-slate-800">Daftar Kandang & Kepadatan Populasi</span>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/10 transition-smooth cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Kandang</span>
            </button>
          </div>

          {/* LIST OF CAGES (MATCHING SCREENSHOT 5) */}
          {isLoading && kandangs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-xs">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-semibold mt-3">Sedang memuat data kandang...</p>
            </div>
          ) : kandangs.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
              <span className="text-4xl">🛖</span>
              <h3 className="font-bold text-slate-900 text-sm">Belum Ada Kandang</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Silakan tambahkan unit kandang untuk memulai pencatatan populasi & performa layer harian.</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-smooth cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kandangs.map((kandang) => {
                const cageEggs = cageProductionMap[kandang.name] || 0;
                const contributionPct = totalEggsCollected > 0 
                  ? parseFloat(((cageEggs / totalEggsCollected) * 100).toFixed(1)) 
                  : 0;

                return (
                  <div 
                    key={kandang.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4 hover:border-emerald-500/30 transition-smooth"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🛖</span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm font-sans">{kandang.name}</h4>
                          <p className="text-[10px] text-slate-550 font-medium">
                            Kontribusi Produksi: <span className="text-emerald-600 font-bold">{contributionPct}%</span>
                          </p>
                          {(() => {
                            const activeFlockForCage = flocks.find(f => f.kandangId === kandang.id && f.status === "active");
                            if (activeFlockForCage) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold border border-emerald-100 mt-1">
                                  🐔 {activeFlockForCage.name} ({getFlockAgeWeeks(activeFlockForCage)} mgg)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(kandang)}
                          className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-smooth cursor-pointer"
                          title="Ubah Rincian"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKandang(kandang.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-smooth cursor-pointer"
                          title="Hapus Kandang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Population & Quick Adjusters (Match Android Screen 5) */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kepadatan Populasi</span>
                        <span className="text-xs font-bold text-slate-800">
                          {kandang.population.toLocaleString("id-ID")} <span className="text-[10px] font-normal text-slate-500">ekor</span>
                        </span>
                      </div>
                      
                      {/* Interactive adjusters */}
                      <div className="grid grid-cols-5 gap-1 items-center">
                        <button
                          onClick={() => handleQuickAdjust(kandang, -50)}
                          className="py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-250 text-[10px] font-bold text-red-600 rounded-lg transition-smooth cursor-pointer"
                        >
                          -50
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(kandang, -10)}
                          className="py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-250 text-[10px] font-bold text-red-600 rounded-lg transition-smooth cursor-pointer"
                        >
                          -10
                        </button>
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold text-center py-1.5 rounded-lg truncate">
                          {kandang.population} ekor
                        </div>
                        <button
                          onClick={() => handleQuickAdjust(kandang, 10)}
                          className="py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-250 text-[10px] font-bold text-emerald-600 rounded-lg transition-smooth cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(kandang, 50)}
                          className="py-1.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-250 text-[10px] font-bold text-emerald-600 rounded-lg transition-smooth cursor-pointer"
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ADD KANDANG MODAL */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-smooth cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🛖</span>
                  <h3 className="text-base font-bold text-slate-900 font-sans">Tambah Unit Kandang</h3>
                </div>
                
                <form onSubmit={handleAddKandang} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Kandang</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Kandang D, Baterai 4, dll."
                      className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Populasi Layer Awal (Ekor)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formPopulation}
                      onChange={(e) => setFormPopulation(Number(e.target.value))}
                      placeholder="Contoh: 1000"
                      className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-smooth shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Simpan Kandang</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT KANDANG MODAL */}
          {showEditModal && (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-smooth cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🛖</span>
                  <h3 className="text-base font-bold text-slate-900 font-sans">Ubah Rincian Kandang</h3>
                </div>
                
                <form onSubmit={handleEditKandang} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Kandang</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Kandang D"
                      className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Populasi Layer (Ekor)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formPopulation}
                      onChange={(e) => setFormPopulation(Number(e.target.value))}
                      placeholder="Contoh: 1000"
                      className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedKandang(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-smooth shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {activeSubTab === "flock" && (
        <div className="space-y-6">
          {/* Flock KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Bird className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flock Aktif</h3>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {isLoading ? "..." : `${flocks.filter(f => f.status === "active").length} Kelompok`}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Populasi Aktif</h3>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {isLoading ? "..." : `${flocks.filter(f => f.status === "active").reduce((sum, f) => sum + f.currentPopulation, 0).toLocaleString("id-ID")} ekor`}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rata-Rata Umur Flock</h3>
                <p className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {isLoading ? "..." : (() => {
                    const activeFlocks = flocks.filter(f => f.status === "active");
                    if (activeFlocks.length === 0) return "0 mgg";
                    const sum = activeFlocks.reduce((acc, f) => acc + getFlockAgeWeeks(f), 0);
                    return `${Math.round(sum / activeFlocks.length)} mgg`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-slate-800">Daftar Kelompok (Flock) Layer aktif & afkir</span>
            <button
              onClick={openAddFlockModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/10 transition-smooth cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Flock</span>
            </button>
          </div>

          {/* List of Flocks */}
          {isLoading && flocks.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-xs">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-semibold mt-3">Sedang memuat data flock...</p>
            </div>
          ) : flocks.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
              <span className="text-4xl">🐔</span>
              <h3 className="font-bold text-slate-900 text-sm">Belum Ada Flock</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Silakan tambahkan flock ayam pertama Anda untuk melacak umur, strain breed, dan penyusutan populasi.</p>
              <button
                onClick={openAddFlockModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-smooth cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flocks.map((flockItem) => {
                const ageWeeks = getFlockAgeWeeks(flockItem);
                const isStatusActive = flockItem.status === "active";
                const depletionQty = flockItem.initialPopulation - flockItem.currentPopulation;
                const depletionPct = flockItem.initialPopulation > 0 
                  ? parseFloat(((depletionQty / flockItem.initialPopulation) * 100).toFixed(1)) 
                  : 0;

                return (
                  <div 
                    key={flockItem.id}
                    className={`bg-white border rounded-xl shadow-xs p-5 space-y-4 hover:border-emerald-500/30 transition-smooth ${
                      isStatusActive ? "border-slate-200" : "border-slate-100 opacity-75"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">🐔</span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm font-sans flex items-center gap-1.5">
                            {flockItem.name}
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              isStatusActive ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-slate-100 border border-slate-250 text-slate-600"
                            }`}>
                              {isStatusActive ? "Aktif" : "Sudah Afkir"}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-550 font-medium">
                            Strain: <span className="font-bold text-slate-700">{flockItem.breed}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditFlockModal(flockItem)}
                          className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-smooth cursor-pointer"
                          title="Ubah Rincian"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlock(flockItem.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-smooth cursor-pointer"
                          title="Hapus Flock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3.5 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lokasi Kandang</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">🛖 {flockItem.kandangName}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Umur Saat Ini</span>
                        <span className="font-bold text-slate-800">{ageWeeks} Minggu <span className="text-[10px] text-slate-500 font-normal">({Math.round(ageWeeks * 7 / 30)} bln)</span></span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tanggal Masuk</span>
                        <span className="font-medium text-slate-600">{flockItem.entryDate}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Penyusutan (Mati/Afkir)</span>
                        <span className="font-bold text-red-600">{depletionQty} ekor <span className="text-[10px] font-normal text-slate-500">({depletionPct}%)</span></span>
                      </div>
                    </div>

                    {/* Population bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sisa Populasi</span>
                        <span className="font-bold text-slate-800">
                          {flockItem.currentPopulation.toLocaleString("id-ID")} <span className="text-[10px] font-normal text-slate-500">dari {flockItem.initialPopulation.toLocaleString("id-ID")} ekor</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all" 
                          style={{ width: `${Math.min(100, Math.max(0, (flockItem.currentPopulation / flockItem.initialPopulation) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {flockItem.notes && (
                      <p className="text-[11px] bg-slate-50 text-slate-500 italic p-2.5 rounded-lg border border-slate-100">
                        &ldquo;{flockItem.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ADD FLOCK MODAL */}
          {showAddFlockModal && (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
                <button 
                  onClick={() => setShowAddFlockModal(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-smooth cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🐔</span>
                  <h3 className="text-base font-bold text-slate-900 font-sans">Tambah Kelompok (Flock) Baru</h3>
                </div>
                
                <form onSubmit={handleAddFlock} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama / Kode Flock</label>
                      <input
                        type="text"
                        required
                        value={flockName}
                        onChange={(e) => setFlockName(e.target.value)}
                        placeholder="Contoh: Lohmann Batch 12"
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kandang Penempatan</label>
                      <select
                        value={flockKandangId}
                        onChange={(e) => setFlockKandangId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      >
                        {kandangs.map(k => (
                          <option key={k.id} value={k.id}>{k.name} ({k.population} ekor)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Strain / Ras Ayam</label>
                      <select
                        value={flockBreed}
                        onChange={(e) => setFlockBreed(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      >
                        <option value="Lohmann Brown">Lohmann Brown</option>
                        <option value="Hy-Line Brown">Hy-Line Brown</option>
                        <option value="Isa Brown">Isa Brown</option>
                        <option value="Dekalb Amberlink">Dekalb Amberlink</option>
                        <option value="Lainnya">Strain Lainnya</option>
                      </select>
                    </div>

                    {flockBreed === "Lainnya" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ketik Nama Strain</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Hisex Brown"
                          onChange={(e) => setFlockBreed(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Populasi Awal (Ekor)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={flockInitialPop}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFlockInitialPop(val);
                          setFlockCurrentPop(val);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Umur Saat Masuk (Minggu)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={flockAgeAtEntry}
                        onChange={(e) => setFlockAgeAtEntry(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Masuk Kandang</label>
                      <input
                        type="date"
                        required
                        value={flockEntryDate}
                        onChange={(e) => setFlockEntryDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={flockStatus}
                        onChange={(e) => setFlockStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      >
                        <option value="active">Aktif</option>
                        <option value="depopulated">Sudah Afkir (Depopulated)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catatan Tambahan</label>
                    <textarea
                      value={flockNotes}
                      onChange={(e) => setFlockNotes(e.target.value)}
                      placeholder="Informasi tambahan, e.g. riwayat kesehatan bibit pullet..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddFlockModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-smooth shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Simpan Flock</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT FLOCK MODAL */}
          {showEditFlockModal && (
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
                <button 
                  onClick={() => {
                    setShowEditFlockModal(false);
                    setSelectedFlock(null);
                  }}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-smooth cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🐔</span>
                  <h3 className="text-base font-bold text-slate-900 font-sans">Ubah Rincian Kelompok (Flock)</h3>
                </div>
                
                <form onSubmit={handleEditFlock} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama / Kode Flock</label>
                      <input
                        type="text"
                        required
                        value={flockName}
                        onChange={(e) => setFlockName(e.target.value)}
                        placeholder="Contoh: Lohmann Batch 12"
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kandang Penempatan</label>
                      <select
                        value={flockKandangId}
                        onChange={(e) => setFlockKandangId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      >
                        {kandangs.map(k => (
                          <option key={k.id} value={k.id}>{k.name} ({k.population} ekor)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Strain / Ras Ayam</label>
                      <select
                        value={flockBreed}
                        onChange={(e) => setFlockBreed(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      >
                        <option value="Lohmann Brown">Lohmann Brown</option>
                        <option value="Hy-Line Brown">Hy-Line Brown</option>
                        <option value="Isa Brown">Isa Brown</option>
                        <option value="Dekalb Amberlink">Dekalb Amberlink</option>
                        <option value="Lainnya">Strain Lainnya</option>
                      </select>
                    </div>

                    {flockBreed === "Lainnya" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ketik Nama Strain</label>
                        <input
                          type="text"
                          required
                          value={flockBreed}
                          onChange={(e) => setFlockBreed(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Populasi Awal (Ekor)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={flockInitialPop}
                        onChange={(e) => setFlockInitialPop(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Populasi Saat Ini (Ekor)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={flockCurrentPop}
                        onChange={(e) => setFlockCurrentPop(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal Masuk Kandang</label>
                      <input
                        type="date"
                        required
                        value={flockEntryDate}
                        onChange={(e) => setFlockEntryDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={flockStatus}
                        onChange={(e) => setFlockStatus(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 outline-none transition-smooth"
                      >
                        <option value="active">Aktif</option>
                        <option value="depopulated">Sudah Afkir (Depopulated)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catatan Tambahan</label>
                    <textarea
                      value={flockNotes}
                      onChange={(e) => setFlockNotes(e.target.value)}
                      placeholder="Informasi tambahan, e.g. riwayat kesehatan bibit pullet..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-400 outline-none transition-smooth resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditFlockModal(false);
                        setSelectedFlock(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg transition-smooth cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-smooth shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "vaccination" && (
        <VaccinationTracker token={token} userRole={userRole} />
      )}

      {activeSubTab === "biosecurity" && (
        <BiosecurityChecklist token={token} userRole={userRole} />
      )}

    </div>
  );
}
