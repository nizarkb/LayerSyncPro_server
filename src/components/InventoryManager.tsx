import React, { useState, useEffect } from "react";
import { 
  Package, Plus, Edit, Trash2, ArrowUpRight, ArrowDownLeft, 
  AlertTriangle, Search, Filter, History, Loader2, X, Check, ShoppingBag, Coins, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockItem, StockTransaction } from "../types.ts";

interface InventoryManagerProps {
  token: string;
}

export default function InventoryManager({ token }: InventoryManagerProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"current" | "history">("current");
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [txTypeFilter, setTxTypeFilter] = useState("all");

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // New Item Form State
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<"feed" | "egg" | "vaccine" | "other">("feed");
  const [itemQuantity, setItemQuantity] = useState(0);
  const [itemUnit, setItemUnit] = useState("kg");
  const [itemMinStock, setItemMinStock] = useState(0);

  // New Transaction Form State
  const [selectedItemId, setSelectedItemId] = useState("");
  const [txType, setTxType] = useState<"in" | "out">("in");
  const [txQuantity, setTxQuantity] = useState(0);
  const [txNotes, setTxNotes] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  // Toast status feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      const [stockRes, txRes] = await Promise.all([
        fetch("/api/stock", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/stock/transactions", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStockItems(stockData);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }
    } catch (error) {
      console.error("Gagal memuat data inventaris:", error);
      showToast("Gagal memuat data inventaris dari server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [token]);

  // Handle Create or Edit Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemUnit.trim()) {
      showToast("Nama item dan satuan wajib diisi.", "error");
      return;
    }

    const payload = {
      name: itemName,
      category: itemCategory,
      quantity: Number(itemQuantity),
      unit: itemUnit,
      minStock: Number(itemMinStock),
    };

    try {
      const url = editingItem ? `/api/stock/${editingItem.id}` : "/api/stock";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingItem ? "Data item stok berhasil diperbarui." : "Item stok baru berhasil ditambahkan.");
        setIsItemModalOpen(false);
        setEditingItem(null);
        resetItemForm();
        fetchStockData();
      } else {
        const data = await res.json();
        showToast(data.message || "Gagal menyimpan item stok.", "error");
      }
    } catch (error) {
      console.error("Error saving stock item:", error);
      showToast("Terjadi kesalahan jaringan.", "error");
    }
  };

  // Open Edit Item Modal
  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQuantity(item.quantity);
    setItemUnit(item.unit);
    setItemMinStock(item.minStock);
    setIsItemModalOpen(true);
  };

  // Handle Delete Stock Item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus item stok ini? Seluruh riwayat transaksi terkait juga akan dihapus.")) {
      return;
    }

    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Item stok berhasil dihapus.");
        fetchStockData();
      } else {
        showToast("Gagal menghapus item stok.", "error");
      }
    } catch (error) {
      console.error("Error deleting stock item:", error);
      showToast("Terjadi kesalahan jaringan.", "error");
    }
  };

  // Handle Create Transaction Manually
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || txQuantity <= 0 || !txNotes.trim() || !txDate) {
      showToast("Harap isi semua parameter transaksi dengan benar.", "error");
      return;
    }

    const payload = {
      itemId: selectedItemId,
      type: txType,
      quantity: Number(txQuantity),
      notes: txNotes,
      date: txDate
    };

    try {
      const res = await fetch("/api/stock/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Transaksi stok berhasil dicatat.");
        setIsTxModalOpen(false);
        resetTxForm();
        fetchStockData();
      } else {
        const data = await res.json();
        showToast(data.message || "Gagal mencatat transaksi stok.", "error");
      }
    } catch (error) {
      console.error("Error saving stock transaction:", error);
      showToast("Terjadi kesalahan jaringan.", "error");
    }
  };

  // Quick transaction triggers
  const triggerQuickTransaction = (itemId: string, defaultType: "in" | "out") => {
    setSelectedItemId(itemId);
    setTxType(defaultType);
    setTxQuantity(0);
    setTxNotes(defaultType === "in" ? "Penambahan / Pengadaan Stok" : "Penjualan / Pengurangan Stok");
    setTxDate(new Date().toISOString().split("T")[0]);
    setIsTxModalOpen(true);
  };

  const resetItemForm = () => {
    setItemName("");
    setItemCategory("feed");
    setItemQuantity(0);
    setItemUnit("kg");
    setItemMinStock(0);
  };

  const resetTxForm = () => {
    setSelectedItemId("");
    setTxType("in");
    setTxQuantity(0);
    setTxNotes("");
    setTxDate(new Date().toISOString().split("T")[0]);
  };

  // Filter & Search Logic
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;
    const matchesType = txTypeFilter === "all" || tx.type === txTypeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Calculate stats
  const feedStockTotal = stockItems
    .filter(i => i.category === "feed")
    .reduce((sum, item) => sum + item.quantity, 0);

  const eggStockTotal = stockItems
    .filter(i => i.category === "egg")
    .reduce((sum, item) => sum + item.quantity, 0);

  const lowStockItems = stockItems.filter(i => i.quantity <= i.minStock);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Stok & Inventaris</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            Pantau dan kelola stok pakan, telur hasil panen, vaksin, dan logistik peternakan terintegrasi operasional.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingItem(null);
              resetItemForm();
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-smooth cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Stok</span>
          </button>
          <button
            onClick={() => {
              resetTxForm();
              if (stockItems.length > 0) setSelectedItemId(stockItems[0].id);
              setIsTxModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-600/10 transition-smooth cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Log Transaksi Manual</span>
          </button>
        </div>
      </div>

      {/* METRICS DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Pakan Meter */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Stok Pakan (Feed)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{feedStockTotal.toLocaleString("id-ID")}</span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Pengurangan otomatis via log harian</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Eggs Meter */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Stok Telur Ayam</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{eggStockTotal.toLocaleString("id-ID")}</span>
              <span className="text-xs font-bold text-slate-500">butir</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Penambahan otomatis via panen log harian</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Threshold Alert Meter */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status & Ambang Batas</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black ${lowStockItems.length > 0 ? "text-red-600 animate-pulse" : "text-emerald-700"}`}>
                {lowStockItems.length === 0 ? "Normal" : `${lowStockItems.length} Menipis`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">
              {lowStockItems.length > 0 
                ? "Sangat direkomendasikan pengadaan barang!" 
                : "Semua persediaan di atas batas aman."}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockItems.length > 0 ? "bg-red-50 text-red-600 animate-bounce" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* LOW STOCK ALERT BANNER PANEL */}
      {lowStockItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-red-800">PERINGATAN: Stok Item Berikut Menipis di Bawah Batas Minimum!</h4>
              <p className="text-[11px] text-red-600 font-semibold mt-1">
                {lowStockItems.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(", ")}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedItemId(lowStockItems[0].id);
              setTxType("in");
              setTxQuantity(100);
              setTxNotes(`Pengadaan darurat stok ${lowStockItems[0].name}`);
              setIsTxModalOpen(true);
            }}
            className="self-start md:self-auto bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl transition-smooth whitespace-nowrap cursor-pointer"
          >
            Isi Ulang Stok Sekarang
          </button>
        </motion.div>
      )}

      {/* SEARCH, FILTER & TAB CONTROLS */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        
        {/* TABS SELECTOR */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveSubTab("current")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-smooth cursor-pointer ${
              activeSubTab === "current" 
                ? "bg-white text-slate-900 shadow-sm font-extrabold" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stok Saat Ini ({stockItems.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-smooth cursor-pointer ${
              activeSubTab === "history" 
                ? "bg-white text-slate-900 shadow-sm font-extrabold" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Transaksi ({transactions.length})</span>
          </button>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari item atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-smooth"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Semua Kategori</option>
              <option value="feed">Pakan (Feed)</option>
              <option value="egg">Telur (Egg)</option>
              <option value="vaccine">Vaksin (Vaccine)</option>
              <option value="other">Lain-lain (Other)</option>
            </select>
          </div>

          {/* Transaction Type Filter (Only active on History Tab) */}
          {activeSubTab === "history" && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-xs font-bold text-slate-600">
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">Semua Alur</option>
                <option value="in">Stok Masuk (IN)</option>
                <option value="out">Stok Keluar (OUT)</option>
              </select>
            </div>
          )}
        </div>

      </div>

      {/* MAIN DATA RENDERING */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Sinkronisasi data stok...</p>
        </div>
      ) : activeSubTab === "current" ? (
        
        /* CURRENT STOCK GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStockItems.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-sm font-black text-slate-900">Belum Ada Item Stok</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                  Tidak ditemukan item stok yang cocok. Silakan tambahkan item baru untuk melacak persediaan.
                </p>
              </div>
            </div>
          ) : (
            filteredStockItems.map((item) => {
              const isLow = item.quantity <= item.minStock;
              const categoryLabels: Record<string, string> = {
                feed: "Pakan Ayam",
                egg: "Hasil Panen Telur",
                vaccine: "Vaksin / Obat",
                other: "Logistik Lainnya"
              };
              const categoryColors: Record<string, string> = {
                feed: "bg-amber-50 text-amber-700 border-amber-200/40",
                egg: "bg-emerald-50 text-emerald-700 border-emerald-200/40",
                vaccine: "bg-purple-50 text-purple-700 border-purple-200/40",
                other: "bg-blue-50 text-blue-700 border-blue-200/40"
              };

              return (
                <motion.div
                  layout
                  key={item.id}
                  className={`bg-white border ${isLow ? "border-red-300 shadow-md shadow-red-50" : "border-slate-200"} rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-smooth relative`}
                >
                  <div className="space-y-4">
                    {/* Header Item */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${categoryColors[item.category] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {categoryLabels[item.category] || "Lain-lain"}
                        </span>
                        <h3 className="font-extrabold text-slate-950 text-sm truncate" title={item.name}>
                          {item.name}
                        </h3>
                      </div>

                      {/* Low Stock Warning Icon */}
                      {isLow && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg shrink-0">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>LOW</span>
                        </span>
                      )}
                    </div>

                    {/* Stock Value */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400">JUMLAH STOK</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black ${isLow ? "text-red-600" : "text-slate-900"}`}>
                            {item.quantity.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400">BATAS AMAN</span>
                        <p className="text-xs font-extrabold text-slate-700">
                          {item.minStock} {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold border-b border-slate-100 pb-2">
                      <span>Update Terakhir</span>
                      <span className="text-slate-600">
                        {new Date(item.lastUpdated).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center justify-between mt-4 pt-1 gap-2">
                    {/* Quick Add/Subtract adjustments */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => triggerQuickTransaction(item.id, "in")}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg border border-emerald-200/30 transition-smooth cursor-pointer"
                        title="Tambah Stok / Pengadaan"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerQuickTransaction(item.id, "out")}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg border border-rose-200/30 transition-smooth cursor-pointer"
                        title="Kurangi Stok / Penjualan"
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Edit/Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-smooth cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-smooth cursor-pointer"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })
          )}
        </div>

      ) : (
        
        /* TRANSACTION HISTORY LIST */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Nama Item</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-center">Alur / Aksi</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                  <th className="px-6 py-4">Keterangan / Catatan Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 space-y-2">
                      <History className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-500">Belum ada riwayat transaksi tercatat.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const categoryLabels: Record<string, string> = {
                      feed: "Pakan",
                      egg: "Telur Ayam",
                      vaccine: "Vaksin",
                      other: "Lain-lain"
                    };

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-smooth">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                          {tx.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-900">
                          {tx.itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                          {categoryLabels[tx.category] || tx.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {tx.type === "in" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/40 text-[9px] font-black px-2.5 py-0.5 rounded-lg">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>MASUK (IN)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200/40 text-[9px] font-black px-2.5 py-0.5 rounded-lg">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>KELUAR (OUT)</span>
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right font-extrabold ${tx.type === "in" ? "text-emerald-700" : "text-slate-900"}`}>
                          {tx.type === "in" ? "+" : "-"}{tx.quantity.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium max-w-xs truncate" title={tx.notes}>
                          {tx.notes}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT STOCK ITEM */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsItemModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-10 relative"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {editingItem ? "Edit Item Stok" : "Tambah Item Stok Baru"}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-smooth cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nama Item Stok</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pakan Layer Fase Produksi, Vaksin ND-IB"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Kategori</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white cursor-pointer"
                    >
                      <option value="feed">Pakan (Feed)</option>
                      <option value="egg">Telur (Egg)</option>
                      <option value="vaccine">Vaksin (Vaccine)</option>
                      <option value="other">Lain-lain (Other)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Satuan (Unit)</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: kg, butir, vial, zak"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Quantity & Threshold */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Jumlah Stok Awal</label>
                    <input
                      type="number"
                      required
                      min="0"
                      disabled={!!editingItem} // Disable directly editing qty on item edit modal (forces using transactions for accurate tracking)
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ambang Batas Minimum</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Peringatan low-stock"
                      value={itemMinStock}
                      onChange={(e) => setItemMinStock(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                {editingItem && (
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    *Untuk mengubah nilai kuantitas saat ini, harap gunakan aksi penambahan (+) atau pengurangan (-) stok di dashboard utama agar tercatat di audit riwayat transaksi.
                  </p>
                )}

                <div className="pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-smooth cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-smooth cursor-pointer"
                  >
                    {editingItem ? "Perbarui" : "Simpan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: LOG NEW TRANSACTION */}
      <AnimatePresence>
        {isTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTxModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden z-10 relative"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Catat Transaksi Stok (In / Out)
                </h3>
                <button
                  onClick={() => setIsTxModalOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-smooth cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
                {/* Select Item */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pilih Item Stok</label>
                  <select
                    required
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white cursor-pointer"
                  >
                    {stockItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Stok Saat Ini: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type (IN / OUT) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Arah Alur Stok</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTxType("in")}
                      className={`py-2 text-xs font-bold rounded-lg transition-smooth cursor-pointer flex items-center justify-center gap-1.5 ${
                        txType === "in"
                          ? "bg-white text-emerald-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Masuk (Tambah)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType("out")}
                      className={`py-2 text-xs font-bold rounded-lg transition-smooth cursor-pointer flex items-center justify-center gap-1.5 ${
                        txType === "out"
                          ? "bg-white text-rose-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Keluar (Gunakan/Jual)</span>
                    </button>
                  </div>
                </div>

                {/* Quantity & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Jumlah Kuantitas</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Min 1"
                      value={txQuantity || ""}
                      onChange={(e) => setTxQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tanggal Transaksi</label>
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Catatan / Keterangan Operasional</label>
                  <textarea
                    required
                    placeholder="Contoh: Pengadaan pakan puyuh 20 sak, penjualan telur gred A ke agen..."
                    rows={2}
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTxModalOpen(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-smooth cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-smooth cursor-pointer"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION FEEDBACK */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl border shadow-lg text-xs font-extrabold ${
              toastMessage.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toastMessage.type === "success" ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <X className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
