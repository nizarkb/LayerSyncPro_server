import React, { useState, useEffect } from "react";
import { ClipboardList, Plus, History, Trash2, Calendar, User, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { BiosecurityCheck } from "../types";

interface BiosecurityChecklistProps {
  token: string;
  userRole: string;
}

export default function BiosecurityChecklist({ token, userRole }: BiosecurityChecklistProps) {
  const [history, setHistory] = useState<BiosecurityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [inspectorName, setInspectorName] = useState("");
  const [footBathActive, setFootBathActive] = useState(false);
  const [vehicleSpray, setVehicleSpray] = useState(false);
  const [feedWarehouseClean, setFeedWarehouseClean] = useState(false);
  const [cageWalkwayClean, setCageWalkwayClean] = useState(false);
  const [safeMortalityDisposal, setSafeMortalityDisposal] = useState(false);
  const [eggTrayDisinfected, setEggTrayDisinfected] = useState(false);
  const [waterSanitization, setWaterSanitization] = useState(false);
  const [wildBirdControl, setWildBirdControl] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/biosecurity", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal mengambil riwayat inspeksi biosekuriti.");
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat riwayat biosekuriti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Dynamic score calculator
  const checkItems = [
    footBathActive,
    vehicleSpray,
    feedWarehouseClean,
    cageWalkwayClean,
    safeMortalityDisposal,
    eggTrayDisinfected,
    waterSanitization,
    wildBirdControl
  ];
  const checkedCount = checkItems.filter(Boolean).length;
  const liveScore = Math.round((checkedCount / 8) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitLoading(true);

    if (!inspectorName) {
      setSubmitError("Nama inspektur/pengawas wajib diisi.");
      setSubmitLoading(false);
      return;
    }

    const payload = {
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
    };

    try {
      const res = await fetch("/api/biosecurity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan laporan.");

      setSubmitSuccess("Laporan biosekuriti harian berhasil disimpan!");
      
      // Reset checklist points
      setFootBathActive(false);
      setVehicleSpray(false);
      setFeedWarehouseClean(false);
      setCageWalkwayClean(false);
      setSafeMortalityDisposal(false);
      setEggTrayDisinfected(false);
      setWaterSanitization(false);
      setWildBirdControl(false);
      setNotes("");

      // Refresh history
      fetchHistory();
      
      // Clear success alert after 3 seconds
      setTimeout(() => setSubmitSuccess(""), 4000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus laporan biosekuriti ini?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/biosecurity/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal menghapus laporan.");
      fetchHistory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="biosecurity-tab">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
          Checklist Kepatuhan Biosekuriti
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Lakukan inspeksi harian terhadap parameter sanitasi, disinfeksi, dan keamanan fisik kandang ayam.
        </p>
      </div>

      {/* Grid of Checklist Form and Compliance Live Indicator */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* checklist form */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            Laporan Kepatuhan Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {submitError && (
              <div id="bio-submit-error" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div id="bio-submit-success" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold animate-pulse">
                {submitSuccess}
              </div>
            )}

            {/* Input Meta Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Laporan</label>
                <div className="relative">
                  <input
                    id="bio-form-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Petugas Pemeriksa</label>
                <div className="relative">
                  <input
                    id="bio-form-inspector"
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 8 Compliance Switches Grid */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">8 Parameter Keamanan Hayati (Biosekuriti):</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="biosecurity-checkboxes-grid">
                
                {/* 1 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  footBathActive ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>👞</span> Foot Bath Sanitizer
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sanitasi alas kaki petugas sebelum masuk kandang</p>
                  </div>
                  <input
                    id="chk-footbath"
                    type="checkbox"
                    checked={footBathActive}
                    onChange={(e) => setFootBathActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 2 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  vehicleSpray ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🚚</span> Semprot Disinfektan Kendaraan
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Penyemprotan disinfektan roda & bodi mobil operasional</p>
                  </div>
                  <input
                    id="chk-vehiclespray"
                    type="checkbox"
                    checked={vehicleSpray}
                    onChange={(e) => setVehicleSpray(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 3 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  feedWarehouseClean ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🌾</span> Gudang Pakan Bersih
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Kebersihan gudang penyimpanan pakan aman dari tikus</p>
                  </div>
                  <input
                    id="chk-warehouse"
                    type="checkbox"
                    checked={feedWarehouseClean}
                    onChange={(e) => setFeedWarehouseClean(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 4 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  cageWalkwayClean ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🧹</span> Sela Kandang Steril
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Penyapuan jalan sela luar & dalam kandang bersih</p>
                  </div>
                  <input
                    id="chk-walkway"
                    type="checkbox"
                    checked={cageWalkwayClean}
                    onChange={(e) => setCageWalkwayClean(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 5 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  safeMortalityDisposal ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🕳️</span> Pembuangan Bangkai Aman
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pembakaran atau penguburan bangkai ayam dengan benar</p>
                  </div>
                  <input
                    id="chk-mortality"
                    type="checkbox"
                    checked={safeMortalityDisposal}
                    onChange={(e) => setSafeMortalityDisposal(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 6 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  eggTrayDisinfected ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🧺</span> Disinfeksi Tray Telur
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pensterilan tray telur plastik sebelum digunakan ulang</p>
                  </div>
                  <input
                    id="chk-eggtray"
                    type="checkbox"
                    checked={eggTrayDisinfected}
                    onChange={(e) => setEggTrayDisinfected(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 7 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  waterSanitization ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🚰</span> Klorinisasi Air Minum
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pemberian disinfektan/klorin dosis aman pada air ayam</p>
                  </div>
                  <input
                    id="chk-water"
                    type="checkbox"
                    checked={waterSanitization}
                    onChange={(e) => setWaterSanitization(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 8 */}
                <label className={`p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-smooth ${
                  wildBirdControl ? "border-emerald-200 bg-emerald-50/10" : "border-slate-200 hover:bg-slate-50/50"
                }`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🕸️</span> Net Burung Liar Utuh
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Kondisi jaring penutup kandang dari burung liar utuh</p>
                  </div>
                  <input
                    id="chk-bird"
                    type="checkbox"
                    checked={wildBirdControl}
                    onChange={(e) => setWildBirdControl(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Inspeksi Tambahan</label>
              <textarea
                id="bio-form-notes"
                rows={2}
                placeholder="Tulis kendala jika ada poin yang belum terpenuhi, atau catatan koreksi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Form submit */}
            <button
              id="bio-submit-btn"
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-smooth cursor-pointer flex items-center justify-center"
            >
              {submitLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Simpan Laporan Biosekuriti"
              )}
            </button>

          </form>
        </div>

        {/* Live Score Percentage circular dial widget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between" id="bio-live-compliance-score">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Persentase Kepatuhan</h3>
            <p className="text-[11px] text-slate-500">Nilai kepatuhan biosekuriti harian dihitung secara otomatis</p>
          </div>

          <div className="flex flex-col items-center justify-center my-8">
            {/* SVG Circle score gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle 
                  cx="72" 
                  cy="72" 
                  r="62" 
                  fill="none" 
                  stroke="#f1f5f9" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="62" 
                  fill="none" 
                  stroke={liveScore >= 80 ? "#10b981" : liveScore >= 50 ? "#f59e0b" : "#ef4444"} 
                  strokeWidth="10" 
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - liveScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="text-center">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tighter">{liveScore}%</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Compliance</p>
              </div>
            </div>

            {/* Score interpretation */}
            <div className="mt-6 text-center">
              {liveScore === 100 ? (
                <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Sangat Aman (100%)
                </div>
              ) : liveScore >= 75 ? (
                <div className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  Kondisi Cukup Aman
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                  Risiko Kontaminasi!
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-slate-500 text-center italic">
            Centang parameter di sebelah kiri untuk menghitung kepatuhan real-time.
          </div>
        </div>

      </div>

      {/* HISTORICAL COMPLIANCE LOG TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
          <History className="w-4.5 h-4.5 text-emerald-600" />
          Riwayat Laporan Inspeksi Biosekuriti
        </h2>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-400 text-xs">Memuat riwayat...</p>
          </div>
        ) : error ? (
          <p className="text-xs text-red-500 font-semibold">{error}</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">Belum ada laporan riwayat biosekuriti harian.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" id="biosecurity-history-table">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                  <th className="py-2.5 px-3">Tanggal Inspeksi</th>
                  <th className="py-2.5 px-3">Pengawas (Inspector)</th>
                  <th className="py-2.5 px-3 text-center">Foot Bath</th>
                  <th className="py-2.5 px-3 text-center">Semprot Mobil</th>
                  <th className="py-2.5 px-3 text-center">Gudang Bersih</th>
                  <th className="py-2.5 px-3 text-center">Sela Kandang</th>
                  <th className="py-2.5 px-3 text-center">Bangkai Aman</th>
                  <th className="py-2.5 px-3 text-center">Disinfeksi Tray</th>
                  <th className="py-2.5 px-3 text-center">Sanitasi Air</th>
                  <th className="py-2.5 px-3 text-center">Net Burung</th>
                  <th className="py-2.5 px-3 text-center">Skor Kepatuhan</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((bio) => (
                  <tr key={bio.id} className="hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3 px-3 font-semibold text-slate-800">{bio.date}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{bio.inspectorName}</td>
                    
                    {/* Items check columns */}
                    <td className="py-3 px-3 text-center">{bio.footBathActive ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.vehicleSpray ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.feedWarehouseClean ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.cageWalkwayClean ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.safeMortalityDisposal ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.eggTrayDisinfected ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.waterSanitization ? "✅" : "❌"}</td>
                    <td className="py-3 px-3 text-center">{bio.wildBirdControl ? "✅" : "❌"}</td>
                    
                    {/* Score */}
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        bio.score === 100 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                          : bio.score >= 75 
                            ? "bg-blue-50 text-blue-800 border border-blue-100" 
                            : "bg-red-50 text-red-800 border border-red-100"
                      }`}>
                        {bio.score}%
                      </span>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        id={`delete-bio-btn-${bio.id}`}
                        onClick={() => handleDeleteHistory(bio.id)}
                        className="p-1 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded transition-smooth cursor-pointer"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
