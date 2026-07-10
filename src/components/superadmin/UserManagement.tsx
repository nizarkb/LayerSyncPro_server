import React, { useState, useEffect } from "react";
import { 
  Users, Search, Filter, Shield, CheckCircle2, XCircle, 
  Trash2, RefreshCw, AlertTriangle, ShieldAlert, UserCheck, Calendar
} from "lucide-react";

interface UserManagementProps {
  token: string;
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "petugas";
  createdAt: number;
  isVerified?: boolean;
}

export default function UserManagement({ token }: UserManagementProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/superadmin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        throw new Error("Gagal mengambil data pengguna dari API.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "superadmin" | "admin" | "petugas") => {
    setActionSuccess("");
    try {
      const res = await fetch(`/api/superadmin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui peran.");
      
      setActionSuccess(`Peran pengguna berhasil diubah menjadi ${newRole.toUpperCase()}.`);
      fetchUsers();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
    setActionSuccess("");
    try {
      const res = await fetch(`/api/superadmin/users/${userId}/verified`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah status verifikasi.");
      
      setActionSuccess(`Status verifikasi pengguna berhasil diperbarui.`);
      fetchUsers();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${name}" secara permanen? Seluruh data yang berafiliasi dengan akun ini akan terpengaruh.`)) {
      return;
    }
    setActionSuccess("");
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus pengguna.");
      
      setActionSuccess(`Akun "${name}" berhasil dihapus dari sistem.`);
      fetchUsers();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter and search logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    
    const isVerifiedVal = !!u.isVerified;
    const matchesVerification = 
      verificationFilter === "all" || 
      (verificationFilter === "verified" && isVerifiedVal) || 
      (verificationFilter === "unverified" && !isVerifiedVal);

    return matchesSearch && matchesRole && matchesVerification;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Tab Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Katalog Seluruh Pengguna ({filteredUsers.length} / {users.length})</span>
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Kelola hak akses role operasional, lakukan verifikasi mandiri, atau hapus akun pengguna yang tidak aktif.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="self-start px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Pengguna</span>
        </button>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2.5 font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Terjadi kesalahan: {error}</span>
        </div>
      )}

      {/* Filter Bento Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
          <Shield className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Peran (Roles)</option>
            <option value="petugas">Petugas Lapangan</option>
            <option value="admin">Admin Utama</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>

        {/* Verification Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Status Verifikasi</option>
            <option value="verified">Terverifikasi (Verified)</option>
            <option value="unverified">Belum Verifikasi</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading && users.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-bold">Mengambil data pengguna terbaru...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/40">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">Tidak ada pengguna yang memenuhi kriteria pencarian.</p>
          <button 
            onClick={() => { setSearchQuery(""); setRoleFilter("all"); setVerificationFilter("all"); }}
            className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Kontak / Email</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4">Hak Akses (Role)</th>
                <th className="py-3 px-4">Waktu Pendaftaran</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => {
                const isVerified = !!u.isVerified;
                
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-all font-semibold">
                    {/* Username Avatar info */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black uppercase">
                        {u.username.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block capitalize">{u.username}</span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {u.id.substring(0, 8)}...</span>
                      </div>
                    </td>

                    {/* Contact email */}
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{u.email}</td>

                    {/* Verification toggle button */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleVerified(u.id, isVerified)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-all duration-100 ${
                          isVerified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 animate-pulse"
                        }`}
                        title={isVerified ? "Klik untuk membatalkan verifikasi" : "Klik untuk memverifikasi akun ini"}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{isVerified ? "Terverifikasi" : "Belum Verifikasi"}</span>
                      </button>
                    </td>

                    {/* Role select */}
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="petugas">Petugas Lapangan</option>
                        <option value="admin">Admin Utama</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </td>

                    {/* Registration date */}
                    <td className="py-3 px-4 text-slate-500 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(u.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </span>
                    </td>

                    {/* Account Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700 border border-transparent hover:border-red-200 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Hapus Akun Pengguna Secara Permanen"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
