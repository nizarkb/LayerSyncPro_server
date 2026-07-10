import React, { useState } from "react";
import { Shield, Server, Users, Database } from "lucide-react";
import SmtpSettings from "./superadmin/SmtpSettings.tsx";
import UserManagement from "./superadmin/UserManagement.tsx";
import TenantManagement from "./superadmin/TenantManagement.tsx";

interface SuperAdminPanelProps {
  token: string;
}

export default function SuperAdminPanel({ token }: SuperAdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"smtp" | "users" | "tenants">("smtp");

  return (
    <div className="space-y-6">
      {/* Title Block Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Decorative background visual elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl translate-y-12 -translate-x-12 pointer-events-none"></div>

        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Sistem Administrasi Terpusat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans flex items-center gap-2.5">
            Super Admin Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl leading-relaxed">
            Selamat datang di Konsol Layanan Eksekutif LayerFarm. Gunakan panel ini untuk mengonfigurasi integrasi SMTP transaksional mandiri, mengawasi autentikasi pengguna secara global, serta memonitor alokasi data multi-tenant secara real-time.
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {/* Tab SMTP */}
        <button
          onClick={() => setActiveSubTab("smtp")}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === "smtp"
              ? "border-emerald-600 text-emerald-700 font-black bg-emerald-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Konfigurasi SMTP & Gateways</span>
        </button>

        {/* Tab Users */}
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === "users"
              ? "border-emerald-600 text-emerald-700 font-black bg-emerald-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Katalog Pengguna & Akun</span>
        </button>

        {/* Tab Tenants */}
        <button
          onClick={() => setActiveSubTab("tenants")}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeSubTab === "tenants"
              ? "border-emerald-600 text-emerald-700 font-black bg-emerald-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Pengawasan Multi-Tenant Data</span>
        </button>
      </div>

      {/* SUB-TABS INTERFACES */}
      <div className="transition-all duration-200">
        {activeSubTab === "smtp" && <SmtpSettings token={token} />}
        {activeSubTab === "users" && <UserManagement token={token} />}
        {activeSubTab === "tenants" && <TenantManagement token={token} />}
      </div>
    </div>
  );
}
