import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Plus, Edit, Trash2, Search, Filter, 
  X, Check, Coins, User, Calendar, CreditCard, AlertCircle, ShoppingCart, Loader2, FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SalesRecord } from "../types.ts";
import { exportSalesToPDF } from "../utils/pdfExport.ts";

interface SalesManagerProps {
  token: string;
}

export default function SalesManager({ token }: SalesManagerProps) {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null);

  // Form State
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [saleCategory, setSaleCategory] = useState<"egg" | "chicken" | "manure" | "other">("egg");
  const [saleQuantity, setSaleQuantity] = useState<number>(0);
  const [saleUnit, setSaleUnit] = useState("butir");
  const [saleUnitPrice, setSaleUnitPrice] = useState<number>(0);
  const [saleBuyerName, setSaleBuyerName] = useState("");
  const [salePaymentStatus, setSalePaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [saleNotes, setSaleNotes] = useState("");

  // Toast status feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/sales", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      } else {
        showToast("Gagal memuat catatan penjualan dari server.", "error");
      }
    } catch (error) {
      console.error("Gagal mengambil data penjualan:", error);
      showToast("Gagal memuat data penjualan.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [token]);

  // Handle category changes to pre-populate smart default units
  useEffect(() => {
    if (!editingSale) {
      if (saleCategory === "egg") {
        setSaleUnit("butir");
      } else if (saleCategory === "chicken") {
        setSaleUnit("ekor");
      } else if (saleCategory === "manure") {
        setSaleUnit("karung");
      } else {
        setSaleUnit("kg");
      }
    }
  }, [saleCategory, editingSale]);

  const handleOpenAddModal = () => {
    setEditingSale(null);
    setSaleDate(new Date().toISOString().split("T")[0]);
    setSaleCategory("egg");
    setSaleQuantity(0);
    setSaleUnit("butir");
    setSaleUnitPrice(0);
    setSaleBuyerName("");
    setSalePaymentStatus("paid");
    setSaleNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sale: SalesRecord) => {
    setEditingSale(sale);
    setSaleDate(sale.date);
    setSaleCategory(sale.category);
    setSaleQuantity(sale.quantity);
    setSaleUnit(sale.unit);
    setSaleUnitPrice(sale.unitPrice);
    setSaleBuyerName(sale.buyerName);
    setSalePaymentStatus(sale.paymentStatus);
    setSaleNotes(sale.notes);
    setIsModalOpen(true);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleQuantity <= 0 || saleUnitPrice <= 0) {
      showToast("Jumlah dan harga satuan harus lebih besar dari 0.", "error");
      return;
    }

    const payload = {
      date: saleDate,
      category: saleCategory,
      quantity: Number(saleQuantity),
      unit: saleUnit,
      unitPrice: Number(saleUnitPrice),
      buyerName: saleBuyerName.trim() || "Umum",
      paymentStatus: salePaymentStatus,
      notes: saleNotes.trim()
    };

    try {
      const url = editingSale ? `/api/sales/${editingSale.id}` : "/api/sales";
      const method = editingSale ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok && result.success !== false) {
        showToast(editingSale ? "Catatan penjualan diperbarui." : "Catatan penjualan berhasil disimpan.");
        setIsModalOpen(false);
        fetchSalesData();
      } else {
        showToast(result.message || "Gagal menyimpan penjualan.", "error");
      }
    } catch (err) {
      console.error("Gagal menyimpan penjualan:", err);
      showToast("Koneksi gagal atau kesalahan server.", "error");
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan penjualan ini? Stok yang berkurang (jika penjualan telur) akan otomatis dikembalikan ke gudang.")) {
      return;
    }

    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        showToast("Catatan penjualan berhasil dihapus.");
        fetchSalesData();
      } else {
        showToast(result.message || "Gagal menghapus catatan penjualan.", "error");
      }
    } catch (err) {
      console.error("Gagal menghapus penjualan:", err);
      showToast("Koneksi gagal atau kesalahan server.", "error");
    }
  };

  // KPI Calculations
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const unpaidRevenue = sales.filter(s => s.paymentStatus === "unpaid").reduce((sum, s) => sum + s.totalPrice, 0);
  const paidRevenue = sales.filter(s => s.paymentStatus === "paid").reduce((sum, s) => sum + s.totalPrice, 0);
  const eggsSold = sales.filter(s => s.category === "egg").reduce((sum, s) => sum + s.quantity, 0);

  // Filter & Search Logic
  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      s.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    const matchesPayment = paymentFilter === "all" || s.paymentStatus === paymentFilter;
    return matchesSearch && matchesCategory && matchesPayment;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "egg": return "🥚 Telur";
      case "chicken": return "🐔 Ayam Afkir";
      case "manure": return "💩 Pupuk Kascing";
      default: return "📦 Lainnya";
    }
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "egg": return "bg-amber-100 text-amber-800 border-amber-200";
      case "chicken": return "bg-red-100 text-red-800 border-red-200";
      case "manure": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

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
    exportSalesToPDF(filteredSales, username, {
      searchTerm,
      category: categoryFilter,
      payment: paymentFilter
    });
  };

  return (
    <div className="space-y-6" id="sales-manager-container">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 font-semibold text-xs ${
              toastMessage.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toastMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">Catatan Penjualan</h1>
              <p className="text-xs text-slate-500 font-semibold">Pantau hasil panen, penjualan telur, pupuk, dan ayam afkir terintegrasi stok</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
            title="Unduh Laporan Penjualan PDF"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Unduh PDF</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penjualan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendapatan</span>
            <p className="text-base font-black text-slate-900 truncate mt-0.5">{formatIDR(totalRevenue)}</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sudah Dibayar</span>
            <p className="text-base font-black text-emerald-600 truncate mt-0.5">{formatIDR(paidRevenue)}</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Belum Lunas</span>
            <p className="text-base font-black text-amber-600 truncate mt-0.5">{formatIDR(unpaidRevenue)}</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center shrink-0 text-xl font-bold">
            🥚
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Telur Terjual</span>
            <p className="text-base font-black text-slate-900 truncate mt-0.5">{new Intl.NumberFormat("id-ID").format(eggsSold)} butir</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pembeli atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-hidden text-xs font-bold cursor-pointer pr-1"
            >
              <option value="all">Semua Kategori</option>
              <option value="egg">🥚 Telur</option>
              <option value="chicken">🐔 Ayam Afkir</option>
              <option value="manure">💩 Pupuk Kascing</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent focus:outline-hidden text-xs font-bold cursor-pointer pr-1"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="paid">Lunas (Paid)</option>
              <option value="unpaid">Belum Lunas (Unpaid)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Memuat transaksi penjualan...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto text-xl">
              📝
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada catatan penjualan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              Mulai catat transaksi penjualan hasil peternakan Anda untuk memantau performa keuangan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-semibold">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Pelanggan / Pembeli</th>
                  <th className="px-5 py-3.5 text-right">Jumlah / Qty</th>
                  <th className="px-5 py-3.5 text-right">Harga Satuan</th>
                  <th className="px-5 py-3.5 text-right">Total Nilai</th>
                  <th className="px-5 py-3.5 text-center">Pembayaran</th>
                  <th className="px-5 py-3.5 max-w-xs">Catatan</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-smooth group">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sale.date}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-[10px] font-extrabold ${getCategoryBadgeColor(sale.category)}`}>
                        {getCategoryLabel(sale.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-800 font-extrabold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                          👤
                        </div>
                        <span className="truncate max-w-[120px]" title={sale.buyerName}>{sale.buyerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-slate-800 font-bold">
                      {new Intl.NumberFormat("id-ID").format(sale.quantity)}{" "}
                      <span className="text-[10px] text-slate-400 font-semibold">{sale.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-slate-600 font-bold">
                      {formatIDR(sale.unitPrice)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-slate-900 font-black text-sm">
                      {formatIDR(sale.totalPrice)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        sale.paymentStatus === "paid" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sale.paymentStatus === "paid" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                        {sale.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-500 font-medium" title={sale.notes}>
                      {sale.notes || "-"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(sale)}
                          className="p-1.5 hover:bg-slate-100 hover:text-blue-600 rounded-lg text-slate-400 transition-smooth cursor-pointer"
                          title="Edit Catatan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-smooth cursor-pointer"
                          title="Hapus Catatan"
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

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="sales-form-modal">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative transform overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl transition-all w-full max-w-md p-6"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      {editingSale ? "Edit Catatan Penjualan" : "Tambah Penjualan Baru"}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleSaveSale} className="space-y-4">
                  {/* Date Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      required
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-xs font-bold text-slate-800 rounded-xl focus:outline-hidden focus:bg-white transition-all"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Kategori Barang</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "egg", label: "🥚 Telur" },
                        { id: "chicken", label: "🐔 Ayam Afkir" },
                        { id: "manure", label: "💩 Pupuk" },
                        { id: "other", label: "📦 Lainnya" }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSaleCategory(cat.id as any)}
                          className={`py-2 px-3 text-left rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            saleCategory === cat.id 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs" 
                              : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100/50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${saleCategory === cat.id ? "bg-emerald-600" : "bg-transparent"}`}></span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Jumlah (Qty)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={saleQuantity || ""}
                        placeholder="Contoh: 1500"
                        onChange={(e) => setSaleQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-xs font-bold text-slate-800 rounded-xl focus:outline-hidden focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Satuan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: butir, kg, ekor"
                        value={saleUnit}
                        onChange={(e) => setSaleUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-xs font-bold text-slate-800 rounded-xl focus:outline-hidden focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Unit Price & Automated Total Price */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Harga Satuan (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          required
                          min="1"
                          value={saleUnitPrice || ""}
                          placeholder="Contoh: 1500"
                          onChange={(e) => setSaleUnitPrice(Number(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-xs font-bold text-slate-800 rounded-xl focus:outline-hidden focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Smart auto-deduct notice */}
                  {saleCategory === "egg" && (
                    <div className={`p-3 border rounded-xl flex items-start gap-2 text-[11px] font-semibold leading-relaxed ${
                      saleUnit.toLowerCase() === "butir" 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}>
                      <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        saleUnit.toLowerCase() === "butir" ? "text-emerald-600" : "text-amber-600"
                      }`} />
                      {saleUnit.toLowerCase() === "butir" ? (
                        <p>
                          <strong>Peringatan Stok Otomatis:</strong> Menyimpan penjualan telur ini akan otomatis <strong>memotong stok telur segar</strong> di gudang sebanyak <span className="font-extrabold underline">{saleQuantity} butir</span>.
                        </p>
                      ) : (
                        <p>
                          <strong>Catatan Stok Manual:</strong> Karena Anda menjual dalam satuan <span className="font-extrabold text-amber-950">"{saleUnit}"</span> (bukan 'butir'), sistem <strong>tidak memotong stok secara otomatis</strong> untuk menghindari anomali data. Silakan lakukan penyesuaian stok manual di menu <strong>Manajemen Stok</strong> jika diperlukan.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Calculated Estimated Total */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Penjualan:</span>
                    <span className="text-base font-black text-emerald-700">{formatIDR(saleQuantity * saleUnitPrice)}</span>
                  </div>

                  {/* Buyer Name */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Pembeli / Pelanggan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Agen Pak Joko, Pasar Induk"
                      value={saleBuyerName}
                      onChange={(e) => setSaleBuyerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-xs font-bold text-slate-800 rounded-xl focus:outline-hidden focus:bg-white transition-all"
                    />
                  </div>

                  {/* Payment Status Selection */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Status Pembayaran</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSalePaymentStatus("paid")}
                        className={`py-2 px-3 text-center rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          salePaymentStatus === "paid" 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs" 
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/50"
                        }`}
                      >
                        ✅ Lunas (Paid)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSalePaymentStatus("unpaid")}
                        className={`py-2 px-3 text-center rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          salePaymentStatus === "unpaid" 
                            ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs" 
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/50"
                        }`}
                      >
                        ⏳ Belum Lunas (Unpaid)
                      </button>
                    </div>
                  </div>

                  {/* Notes / Catatan */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                    <textarea
                      placeholder="Contoh: Pembayaran tempo 1 minggu, telur size sedang."
                      rows={2}
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 text-xs font-bold text-slate-800 rounded-xl focus:outline-hidden focus:bg-white transition-all resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all hover:shadow-md cursor-pointer uppercase tracking-wider"
                    >
                      {editingSale ? "Simpan Perubahan" : "Simpan Transaksi"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
