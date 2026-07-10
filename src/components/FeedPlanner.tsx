import React, { useState } from "react";
import { ArrowRight, Info, Calculator, Sparkles } from "lucide-react";

export default function FeedPlanner() {
  const [chickenPopulation, setChickenPopulation] = useState("3000");
  const [targetFeedPerChickenByGrams, setTargetFeedPerChickenByGrams] = useState("110");

  const population = parseFloat(chickenPopulation) || 0;
  const feedPerChicken = parseFloat(targetFeedPerChickenByGrams) || 0;

  // Calculations
  const totalFeedKg = (population * feedPerChicken) / 1000;
  const totalBagsOf50Kg = totalFeedKg / 50;

  return (
    <div className="space-y-6 animate-fade-in" id="feed-planner-tab">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
          Perencana Pakan (Feed Planner)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Alat hitung cepat kebutuhan pakan harian ayam petelur (estimasi pakan harian).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Fields */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Parameter Kalkulasi</h3>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Jumlah Populasi Ayam (Ekor)
            </label>
            <input
              id="input-population"
              type="number"
              min="0"
              placeholder="Misal: 3000"
              value={chickenPopulation}
              onChange={(e) => setChickenPopulation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-xl text-xs text-slate-800 outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Standar Pemberian Pakan (Gram/Ekor/Hari)
            </label>
            <input
              id="input-feed-per-chicken"
              type="number"
              min="0"
              step="0.1"
              placeholder="Standar: 110"
              value={targetFeedPerChickenByGrams}
              onChange={(e) => setTargetFeedPerChickenByGrams(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white rounded-xl text-xs text-slate-800 outline-none transition-smooth"
            />
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-semibold text-slate-500 leading-relaxed block">
              * Rata-rata standar industri ayam petelur fase layer aktif berkisar antara 110g s.d 120g per ekor per hari.
            </span>
          </div>
        </div>

        {/* Calculations Display Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Estimasi Kebutuhan Pakan Harian
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                Fase Produksi (Layer)
              </span>
            </div>

            {/* Total KG */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Berat Pakan</span>
                <p className="text-xs text-slate-500 mt-1">Kebutuhan pakan riil harian</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {totalFeedKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs text-slate-500 ml-1 font-bold">kg</span>
              </div>
            </div>

            {/* Total Bags (50kg) */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Karung Pakan</span>
                <p className="text-xs text-slate-500 mt-1">Konversi ke kemasan karung standar 50kg</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {totalBagsOf50Kg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs text-slate-500 ml-1 font-bold">Karung</span>
              </div>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed font-medium">
              <span className="text-emerald-800 font-bold">Rekomendasi Distribusi:</span> Pastikan pakan didistribusikan secara merata di seluruh talang pakan otomatis atau manual guna meminimalkan kanibalisme akibat perebutan pakan dan menstabilkan keseragaman berat badan ayam (uniformity).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
