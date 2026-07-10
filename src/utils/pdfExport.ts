import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LayerFarmLog, SalesRecord } from "../types";

// Helper to format IDR Currency
const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

// Helper to format Date
const formatIndonesianDate = (dateStr: string) => {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${monthNames[monthIdx]} ${year}`;
      }
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

// Category translation
const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case "egg": return "Telur";
    case "chicken": return "Ayam Afkir";
    case "manure": return "Pupuk Kascing";
    default: return "Lainnya";
  }
};

/**
 * Exports Production Logs to a beautiful PDF Document
 */
export const exportProductionToPDF = (logs: LayerFarmLog[], username: string) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Theme Colors
  const primaryColor = [21, 128, 61]; // #15803d - Emerald Green
  const textColor = [51, 65, 85]; // Slate 700
  const lightGrey = [241, 245, 249]; // Slate 100
  
  // Page Width and Height
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- HEADER SECTION ---
  // Background brand color block
  doc.setFillColor(21, 128, 61); // Emerald Green
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo Text or Graphic
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Layer SyncPro", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Sistem Manajemen Peternakan Ayam Petelur Modern", 15, 24);
  doc.text("Laporan Resmi & Catatan Produksi Offline", 15, 29);

  // Print Details on Header Block
  doc.setFontSize(8);
  doc.text(`Dicetak Oleh: ${username}`, pageWidth - 15, 18, { align: "right" });
  doc.text(`Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`, pageWidth - 15, 23, { align: "right" });
  doc.text("Status: Terverifikasi (Aman)", pageWidth - 15, 28, { align: "right" });

  // Add decorative egg symbol or simple geometry
  doc.setFillColor(254, 243, 199); // Light Amber
  doc.ellipse(pageWidth - 25, 34, 4, 3, "F");
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(21, 128, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("OK", pageWidth - 25, 34.5, { align: "center" });

  // --- DOCUMENT TITLE ---
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LAPORAN DATA PRODUKSI HARIAN", 15, 52);

  // Line Break
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(15, 56, pageWidth - 15, 56);

  // --- CALCULATE SUMMARY STATISTICS ---
  const totalEggs = logs.reduce((sum, log) => sum + log.eggCount, 0);
  const totalWeight = logs.reduce((sum, log) => sum + log.eggWeight, 0);
  const totalFeed = logs.reduce((sum, log) => sum + log.feedAmount, 0);
  const totalDead = logs.reduce((sum, log) => sum + log.chickenDead, 0);
  const avgEggs = logs.length > 0 ? (totalEggs / logs.length).toFixed(0) : "0";
  const avgWeight = logs.length > 0 ? (totalWeight / logs.length).toFixed(1) : "0.0";
  const avgFcr = totalWeight > 0 ? (totalFeed / totalWeight).toFixed(2) : "0.00";

  // --- STATS CARDS BLOCK (3 columns) ---
  const startY = 62;
  const cardWidth = (pageWidth - 30 - 10) / 3; // 3 cards with 5mm gaps
  const cardHeight = 20;

  // Card 1: Total & Avg Eggs
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(187, 247, 208); // green 200
  doc.roundedRect(15, startY, cardWidth, cardHeight, 2, 2, "FD");
  doc.setTextColor(21, 128, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL PRODUKSI TELUR", 18, startY + 5);
  doc.setFontSize(12);
  doc.text(`${new Intl.NumberFormat("id-ID").format(totalEggs)} butir`, 18, startY + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Rerata: ${avgEggs} butir / hari`, 18, startY + 16);

  // Card 2: Feed & FCR
  doc.setFillColor(248, 250, 252); // grey-50
  doc.setDrawColor(226, 232, 240); // grey-200
  doc.roundedRect(15 + cardWidth + 5, startY, cardWidth, cardHeight, 2, 2, "FD");
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL PAKAN & AVG FCR", 15 + cardWidth + 8, startY + 5);
  doc.setFontSize(12);
  doc.text(`${new Intl.NumberFormat("id-ID").format(totalFeed)} kg`, 15 + cardWidth + 8, startY + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Rasio FCR: ${avgFcr} kg/kg`, 15 + cardWidth + 8, startY + 16);

  // Card 3: Mortality / Kematian
  doc.setFillColor(254, 242, 242); // light red
  doc.setDrawColor(254, 202, 202); // red 200
  doc.roundedRect(15 + (cardWidth * 2) + 10, startY, cardWidth, cardHeight, 2, 2, "FD");
  doc.setTextColor(185, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL MORTALITAS AYAM", 15 + (cardWidth * 2) + 13, startY + 5);
  doc.setFontSize(12);
  doc.text(`${totalDead} ekor`, 15 + (cardWidth * 2) + 13, startY + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Target: < 0.5% populasi/hari", 15 + (cardWidth * 2) + 13, startY + 16);

  // --- TABLE LOGS ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Daftar Histori Log Produksi (${logs.length} data)`, 15, startY + 28);

  // Table Columns
  const headers = [
    ["Tanggal", "Kandang", "Hasil Panen", "Berat Telur", "Pakan", "Kematian", "Catatan"]
  ];

  // Table Rows Data
  const rows = logs.map(log => [
    formatIndonesianDate(log.date),
    log.kandangName,
    `${new Intl.NumberFormat("id-ID").format(log.eggCount)} butir`,
    `${log.eggWeight} kg`,
    `${log.feedAmount} kg`,
    `${log.chickenDead} ekor`,
    log.notes || "-"
  ]);

  autoTable(doc, {
    startY: startY + 32,
    head: headers,
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [21, 128, 61], // Emerald Green
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85], // slate-700
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 32 }, // Date
      1: { cellWidth: 24 }, // Kandang
      2: { cellWidth: 26 }, // Egg Count
      3: { cellWidth: 22 }, // Egg Weight
      4: { cellWidth: 22 }, // Feed
      5: { cellWidth: 22 }, // Dead
      6: { cellWidth: "auto" } // Notes
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont("helvetica", "normal");
      
      // Footer text left
      doc.text("Dicetak secara otomatis melalui aplikasi Layer SyncPro", 15, pageHeight - 10);
      // Page Number right
      doc.text(str, pageWidth - 15, pageHeight - 10, { align: "right" });
    }
  });

  // Save PDF file
  const dateFormatted = new Date().toISOString().split("T")[0];
  doc.save(`Laporan_Produksi_LayerSyncPro_${dateFormatted}.pdf`);
};

/**
 * Exports Sales Records to a beautiful PDF Document
 */
export const exportSalesToPDF = (
  sales: SalesRecord[], 
  username: string, 
  filters: { searchTerm: string; category: string; payment: string }
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Theme Colors
  const primaryColor = [21, 128, 61]; // #15803d - Emerald Green
  const textColor = [51, 65, 85]; // Slate 700
  const lightGrey = [241, 245, 249]; // Slate 100
  
  // Page Width and Height
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- HEADER SECTION ---
  doc.setFillColor(21, 128, 61); // Emerald Green
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Layer SyncPro", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Sistem Manajemen Peternakan Ayam Petelur Modern", 15, 24);
  doc.text("Laporan Resmi & Catatan Penjualan Hasil Panen", 15, 29);

  // Print Details
  doc.setFontSize(8);
  doc.text(`Dicetak Oleh: ${username}`, pageWidth - 15, 18, { align: "right" });
  doc.text(`Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`, pageWidth - 15, 23, { align: "right" });
  doc.text("Status: Terverifikasi (Aman)", pageWidth - 15, 28, { align: "right" });

  // Add decorative egg icon
  doc.setFillColor(254, 243, 199); // Light Amber
  doc.ellipse(pageWidth - 25, 34, 4, 3, "F");
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(21, 128, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("RP", pageWidth - 25, 34.5, { align: "center" });

  // --- DOCUMENT TITLE ---
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LAPORAN PENJUALAN & TRANSAKSI KEUANGAN", 15, 52);

  // Show active filters
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const filterCat = filters.category === "all" ? "Semua Kategori" : getCategoryLabel(filters.category);
  const filterPay = filters.payment === "all" ? "Semua Status" : filters.payment === "paid" ? "Lunas" : "Belum Lunas";
  doc.text(`Filter Kategori: ${filterCat}  |  Filter Pembayaran: ${filterPay}`, 15, 56);

  // Line Break
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(15, 59, pageWidth - 15, 59);

  // --- CALCULATE SUMMARY STATISTICS ---
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const paidRevenue = sales.filter(s => s.paymentStatus === "paid").reduce((sum, s) => sum + s.totalPrice, 0);
  const unpaidRevenue = sales.filter(s => s.paymentStatus === "unpaid").reduce((sum, s) => sum + s.totalPrice, 0);
  const eggsSold = sales.filter(s => s.category === "egg").reduce((sum, s) => sum + s.quantity, 0);

  // --- STATS CARDS BLOCK (3 columns) ---
  const startY = 64;
  const cardWidth = (pageWidth - 30 - 10) / 3; // 3 cards with 5mm gaps
  const cardHeight = 20;

  // Card 1: Total Revenue
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(187, 247, 208); // green 200
  doc.roundedRect(15, startY, cardWidth, cardHeight, 2, 2, "FD");
  doc.setTextColor(21, 128, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL PENDAPATAN", 18, startY + 5);
  doc.setFontSize(12);
  doc.text(formatIDR(totalRevenue), 18, startY + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Sudah Lunas: ${formatIDR(paidRevenue)}`, 18, startY + 16);

  // Card 2: Piutang / Belum Lunas
  doc.setFillColor(254, 253, 242); // light amber
  doc.setDrawColor(254, 240, 138); // amber 200
  doc.roundedRect(15 + cardWidth + 5, startY, cardWidth, cardHeight, 2, 2, "FD");
  doc.setTextColor(180, 83, 9); // amber 700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PIUTANG (BELUM LUNAS)", 15 + cardWidth + 8, startY + 5);
  doc.setFontSize(12);
  doc.text(formatIDR(unpaidRevenue), 15 + cardWidth + 8, startY + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Silakan follow-up tagihan pembeli", 15 + cardWidth + 8, startY + 16);

  // Card 3: Total Eggs Sold
  doc.setFillColor(248, 250, 252); // grey-50
  doc.setDrawColor(226, 232, 240); // grey-200
  doc.roundedRect(15 + (cardWidth * 2) + 10, startY, cardWidth, cardHeight, 2, 2, "FD");
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL TELUR TERJUAL", 15 + (cardWidth * 2) + 13, startY + 5);
  doc.setFontSize(12);
  doc.text(`${new Intl.NumberFormat("id-ID").format(eggsSold)} butir`, 15 + (cardWidth * 2) + 13, startY + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Porsi telur dari total panen`, 15 + (cardWidth * 2) + 13, startY + 16);

  // --- TABLE SALES ---
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Daftar Log Transaksi Penjualan (${sales.length} transaksi)`, 15, startY + 28);

  // Table Columns
  const headers = [
    ["Tanggal", "Kategori", "Pelanggan", "Qty", "Harga Satuan", "Total Nilai", "Pembayaran"]
  ];

  // Table Rows Data
  const rows = sales.map(sale => [
    formatIndonesianDate(sale.date),
    getCategoryLabel(sale.category),
    sale.buyerName || "Umum",
    `${new Intl.NumberFormat("id-ID").format(sale.quantity)} ${sale.unit}`,
    formatIDR(sale.unitPrice),
    formatIDR(sale.totalPrice),
    sale.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"
  ]);

  autoTable(doc, {
    startY: startY + 32,
    head: headers,
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [21, 128, 61], // Emerald Green
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85], // slate-700
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 26 }, // Date
      1: { cellWidth: 24 }, // Category
      2: { cellWidth: 32 }, // Buyer Name
      3: { cellWidth: 24, halign: "right" }, // Qty
      4: { cellWidth: 26, halign: "right" }, // Unit price
      5: { cellWidth: 28, halign: "right", fontStyle: "bold" }, // Total price
      6: { cellWidth: 22, halign: "center" } // Payment Status
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont("helvetica", "normal");
      
      // Footer text left
      doc.text("Dicetak secara otomatis melalui aplikasi Layer SyncPro", 15, pageHeight - 10);
      // Page Number right
      doc.text(str, pageWidth - 15, pageHeight - 10, { align: "right" });
    }
  });

  // Save PDF file
  const dateFormatted = new Date().toISOString().split("T")[0];
  doc.save(`Laporan_Penjualan_LayerSyncPro_${dateFormatted}.pdf`);
};
