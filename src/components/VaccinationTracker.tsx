import React, { useState, useEffect } from "react";
import { Plus, Check, Calendar, Trash2, X, ShieldAlert, BadgeInfo, Info } from "lucide-react";
import { VaccinationSchedule } from "../types";

interface VaccinationTrackerProps {
  token: string;
  userRole: string;
}

export default function VaccinationTracker({ token, userRole }: VaccinationTrackerProps) {
  const [vaccinations, setVaccinations] = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formKandang, setFormKandang] = useState("Semua Kandang");
  const [formVaccineName, setFormVaccineName] = useState("");
  const [formPlannedDate, setFormPlannedDate] = useState("");
  const [formMethod, setFormMethod] = useState("Air Minum");
  const [formAgeWeeks, setFormAgeWeeks] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  const fetchVaccinations = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/vaccinations";
      if (filterStatus) url += `?status=${filterStatus}`;

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal mengambil jadwal vaksinasi.");
      const data = await res.json();
      setVaccinations(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat jadwal vaksinasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
  }, [filterStatus]);

  const handleOpenModal = () => {
    setFormKandang("Semua Kandang");
    setFormVaccineName("");
    setFormPlannedDate(new Date().toISOString().split("T")[0]);
    setFormMethod("Air Minum");
    setFormAgeWeeks("");
    setFormNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCompleteVaccination = async (vac: VaccinationSchedule) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const confirmDone = window.confirm(`Apakah Anda ingin menandai vaksinasi ${vac.vaccineName} untuk ${vac.kandangName} sebagai SELESAI hari ini (${todayStr})?`);
    if (!confirmDone) return;

    try {
      const res = await fetch(`/api/vaccinations/${vac.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "Completed",
          actualDate: todayStr,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menyelesaikan vaksinasi.");
      }

      fetchVaccinations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteVaccination = async (id: string) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus jadwal vaksinasi ini?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/vaccinations/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menghapus jadwal.");
      }

      fetchVaccinations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSubmitLoading(true);

    if (!formVaccineName || !formPlannedDate || !formMethod || !formAgeWeeks) {
      setFormError("Semua field wajib diisi.");
      setFormSubmitLoading(false);
      return;
    }

    const payload = {
      kandangName: formKandang,
      vaccineName: formVaccineName,
      plannedDate: formPlannedDate,
      method: formMethod,
      ageWeeks: parseInt(formAgeWeeks, 10),
      notes: formNotes,
    };

    try {
      const res = await fetch("/api/vaccinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan jadwal vaksinasi.");
      }

      setIsModalOpen(false);
      fetchVaccinations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="vaccination-tab">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Jadwal & Kalender Vaksinasi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau dan buat jadwal imunisasi ayam secara berkala untuk menjaga ketahanan biosekuriti kelompok.
          </p>
        </div>

        <button
          id="add-vax-btn"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-smooth cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Jadwal Baru
        </button>
      </div>

      {/* FILTER BUTTONS & STATE */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex-wrap gap-3" id="vax-filters">
        <div className="flex items-center gap-1.5">
          <button
            id="vax-filter-all"
            onClick={() => setFilterStatus("")}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-smooth ${
              filterStatus === "" 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-50 hover:bg-slate-100 text-slate-600"
            }`}
          >
            Semua Jadwal
          </button>
          
          <button
            id="vax-filter-pending"
            onClick={() => setFilterStatus("Pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-smooth flex items-center gap-1.5 ${
              filterStatus === "Pending" 
                ? "bg-amber-500 text-white shadow-sm" 
                : "bg-slate-50 hover:bg-slate-100 text-slate-600"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            Belum Selesai (Pending)
          </button>

          <button
            id="vax-filter-completed"
            onClick={() => setFilterStatus("Completed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-smooth flex items-center gap-1.5 ${
              filterStatus === "Completed" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "bg-slate-50 hover:bg-slate-100 text-slate-600"
            }`}
          >
            Selesai (Completed)
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Total: {vaccinations.length} jadwal terdaftar
        </div>
      </div>

      {/* INFORMATIVE TIP */}
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 flex gap-3 text-xs text-amber-800">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <span className="font-bold">Penting:</span> Vaksinasi ayam petelur (Layer) yang tepat waktu (seperti ND-IB Clone, Coryza, dan AI) mencegah penurunan produksi telur harian yang drastis akibat serangan patogen. Pastikan dosis dan peralatan steril.
        </div>
      </div>

      {/* VACCINATIONS LIST CONTAINER */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 font-medium text-xs">Memuat daftar imunisasi...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 font-medium text-xs bg-white rounded-2xl border border-slate-100">{error}</div>
      ) : vaccinations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="text-4xl">💉</span>
          <p className="text-slate-400 font-semibold text-xs mt-3">Tidak ada jadwal vaksinasi yang terdaftar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="vax-grid">
          {vaccinations.map((vac) => {
            const isCompleted = vac.status === "Completed";
            
            return (
              <div 
                key={vac.id} 
                className={`p-5 bg-white rounded-2xl border transition-smooth relative overflow-hidden flex flex-col justify-between ${
                  isCompleted 
                    ? "border-slate-100 bg-slate-50/20" 
                    : "border-slate-200 hover:border-amber-300 shadow-sm"
                }`}
                id={`vax-card-${vac.id}`}
              >
                {/* Decorative status strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isCompleted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}></div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {vac.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isCompleted 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                        : "bg-amber-50 text-amber-800 border-amber-100"
                    }`}>
                      {vac.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-950 text-sm mt-3">{vac.vaccineName}</h3>
                  
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Kandang:</span>
                      <span className="font-bold text-slate-800">{vac.kandangName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Metode Vaksin:</span>
                      <span className="font-bold text-slate-800">{vac.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Umur Ayam:</span>
                      <span className="font-bold text-slate-800">{vac.ageWeeks} Minggu</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-50 pt-1.5">
                      <span className="text-slate-400 font-medium">Rencana Tanggal:</span>
                      <span className="font-mono font-bold text-slate-800">{vac.plannedDate}</span>
                    </div>
                    {isCompleted && (
                      <div className="flex justify-between text-emerald-700 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/30 mt-1">
                        <span className="font-semibold">Realisasi Selesai:</span>
                        <span className="font-mono font-black">{vac.actualDate}</span>
                      </div>
                    )}
                  </div>

                  {vac.notes && (
                    <div className="mt-4 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 italic leading-relaxed">
                      Catatan: {vac.notes}
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    id={`delete-vax-btn-${vac.id}`}
                    onClick={() => handleDeleteVaccination(vac.id)}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-smooth cursor-pointer"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {!isCompleted && (
                    <button
                      id={`complete-vax-btn-${vac.id}`}
                      onClick={() => handleCompleteVaccination(vac)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-smooth cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Tandai Selesai
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* FORM DIALOG MODAL */}
      {isModalOpen && (
        <div id="vax-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Buat Jadwal Imunisasi Baru</h3>
              <button
                id="close-vax-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div id="vax-modal-error-alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Kandang */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Kandang</label>
                  <select
                    id="form-vax-kandang"
                    value={formKandang}
                    onChange={(e) => setFormKandang(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Semua Kandang">Semua Kandang</option>
                    <option value="Kandang A">Kandang A</option>
                    <option value="Kandang B">Kandang B</option>
                    <option value="Kandang C">Kandang C</option>
                  </select>
                </div>

                {/* Age in weeks */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Umur Ayam (Minggu)</label>
                  <input
                    id="form-vax-age"
                    type="number"
                    min="1"
                    placeholder="Contoh: 14"
                    required
                    value={formAgeWeeks}
                    onChange={(e) => setFormAgeWeeks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Vaccine Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama / Merk Vaksin</label>
                <input
                  id="form-vax-name"
                  type="text"
                  required
                  placeholder="Contoh: ND-IB Clone / Gumboro"
                  value={formVaccineName}
                  onChange={(e) => setFormVaccineName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Planned Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Direncana</label>
                  <input
                    id="form-vax-date"
                    type="date"
                    required
                    value={formPlannedDate}
                    onChange={(e) => setFormPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Method */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Metode Pemberian</label>
                  <select
                    id="form-vax-method"
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Air Minum">Air Minum</option>
                    <option value="Suntik">Suntik</option>
                    <option value="Tetes Mata">Tetes Mata</option>
                    <option value="Tetes Hidung">Tetes Hidung</option>
                    <option value="Spray">Spray</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Instruksi</label>
                <textarea
                  id="form-vax-notes"
                  rows={2}
                  placeholder="Instruksi tambahan: Puasakan ayam 2 jam sebelum pemberian, dsb."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  id="cancel-vax-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="submit-vax-btn"
                  type="submit"
                  disabled={formSubmitLoading}
                  className="flex-1 py-2.5 bg-emerald-600 text-xs font-bold text-white rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-smooth cursor-pointer flex items-center justify-center"
                >
                  {formSubmitLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Simpan Jadwal"
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
