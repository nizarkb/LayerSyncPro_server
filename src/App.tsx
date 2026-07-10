import { useState, useEffect } from "react";
import { 
  LayoutDashboard, FileText, CalendarCheck2, ShieldCheck, 
  LogOut, User, Menu, X, ArrowDownUp, RefreshCw, Calculator, TrendingUp, Home, Package, ShoppingCart, Sun, Moon,
  ChevronLeft, ChevronRight
} from "lucide-react";

import Login from "./components/Login.tsx";
import Dashboard from "./components/Dashboard.tsx";
import DailyLogs from "./components/DailyLogs.tsx";
import KandangManager from "./components/KandangManager.tsx";
import FeedPlanner from "./components/FeedPlanner.tsx";
import Reports from "./components/Reports.tsx";
import SyncManager from "./components/SyncManager.tsx";
import SuperAdminPanel from "./components/SuperAdminPanel.tsx";
import SaaSPlanWidget from "./components/SaaSPlanWidget.tsx";
import InventoryManager from "./components/InventoryManager.tsx";
import SalesManager from "./components/SalesManager.tsx";
import Logo from "./components/Logo.tsx";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "petugas";
  plan?: "free" | "pro" | "enterprise";
  status?: "active" | "suspended";
  maxKandangs?: number;
  maxLogs?: number;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [kandangSubTab, setKandangSubTab] = useState<"kandang" | "vaccination" | "biosecurity">("kandang");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Terhubung (Online)");

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Attempt to restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");
    
    if (storedToken && storedUserStr) {
      try {
        const parsedUser = JSON.parse(storedUserStr);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success === false && data.isSuspended) {
          alert("Akun Anda telah ditangguhkan. Silakan hubungi administrator atau selesaikan tagihan Anda.");
          handleLogout();
          return;
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } else if (res.status === 403) {
        const errData = await res.json();
        if (errData.isSuspended) {
          alert("Akun Anda telah ditangguhkan. Silakan hubungi administrator atau selesaikan tagihan Anda.");
          handleLogout();
        }
      }
    } catch (e) {
      console.error("Gagal menyegarkan profil user:", e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
      const interval = setInterval(fetchProfile, 10000); // Polling every 10 seconds for instant sync
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setActiveTab("overview");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsMobileMenuOpen(false);
  };

  // Trigger manual sync simulation to confirm connection with Mobile Server
  const handleSimulateSync = () => {
    setIsSyncing(true);
    setSyncStatus("Menghubungkan...");
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus("Sukses disinkronkan (" + new Date().toLocaleTimeString("id-ID") + ")");
      setTimeout(() => setSyncStatus("Terhubung (Online)"), 4000);
    }, 1500);
  };

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Sidebar navigation options
  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "logs", label: "Catat Data (Produksi)", icon: FileText },
    { id: "inventory", label: "Manajemen Stok", icon: Package },
    { id: "sales", label: "Catatan Penjualan", icon: ShoppingCart },
    { id: "kandang", label: "Kandang (Cages)", icon: Home },
    { id: "feed-planner", label: "Perencana Pakan", icon: Calculator },
    { id: "reports", label: "Laporan & Grafis", icon: TrendingUp },
    { id: "billing", label: "SaaS Plan & Quota", icon: User },
    { id: "sync", label: "Konektivitas & Sync", icon: RefreshCw },
  ];

  if (user?.role === "superadmin") {
    navItems.push({ id: "superadmin", label: "Super Admin Panel", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between z-40 sticky top-0 transition-colors duration-300">
        <Logo variant="horizontal" size="sm" />
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-smooth cursor-pointer"
            title={theme === "light" ? "Mode Gelap (Malam)" : "Mode Terang (Siang)"}
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>
          <button 
            onClick={handleSimulateSync}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-smooth"
            title="Simulasikan Sinkronisasi Mobile"
          >
            <ArrowDownUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 transition-smooth cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
      <aside 
        id="sidebar-navigation"
        className={`fixed md:sticky top-0 left-0 bottom-0 ${isSidebarCollapsed ? "md:w-20 md:p-4" : "md:w-64 md:p-6"} w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 p-6 flex flex-col justify-between transition-all duration-300 transform md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } h-screen transition-colors duration-300`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className={`flex ${isSidebarCollapsed ? "flex-col gap-4 items-center" : "items-center justify-between"}`}>
            {isSidebarCollapsed ? (
              <Logo variant="icon" size="sm" />
            ) : (
              <Logo variant="horizontal" size="sm" />
            )}
            <div className={`flex ${isSidebarCollapsed ? "flex-col gap-2.5 items-center" : "items-center gap-1"}`}>
              <button 
                onClick={toggleTheme}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-smooth cursor-pointer"
                title={theme === "light" ? "Mode Gelap (Malam)" : "Mode Terang (Siang)"}
              >
                {theme === "light" ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </button>
              
              {/* Collapse/Expand toggle for desktop */}
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:block p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-smooth cursor-pointer"
                title={isSidebarCollapsed ? "Perluas Sidebar" : "Sembunyikan Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <button 
                className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === "kandang") {
                      setKandangSubTab("kandang");
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  title={item.label}
                  className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"} py-2.5 rounded-lg text-xs font-semibold transition-smooth cursor-pointer text-left ${
                    isActive 
                      ? "bg-brand-light dark:bg-brand-secondary/30 text-brand-primary dark:text-brand-accent font-bold border-l-2 border-brand-primary dark:border-brand-accent pl-3.5" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sync Connection Widget */}
          {!isSidebarCollapsed ? (
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sync Server</span>
                <span className={`inline-flex items-center gap-1 ${isSyncing ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? "bg-amber-500 animate-spin" : "bg-emerald-600 dark:bg-emerald-400"}`}></span>
                  {isSyncing ? "Syncing..." : "Online"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Status: <span className="text-slate-700 dark:text-slate-300">{syncStatus}</span>
              </p>
              <button
                onClick={handleSimulateSync}
                disabled={isSyncing}
                className="w-full py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg transition-smooth flex items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                Simulasikan Sync
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleSimulateSync}
                disabled={isSyncing}
                title={`Sync Server: ${syncStatus}`}
                className="p-2 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-smooth cursor-pointer flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
          {isSidebarCollapsed ? (
            <div 
              className="w-9 h-9 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 uppercase border border-emerald-200 dark:border-emerald-800 mb-3 cursor-help"
              title={`${user.username} (${user.role})`}
            >
              {user.username.slice(0, 2)}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 mb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 uppercase border border-emerald-200 dark:border-emerald-800">
                {user.username.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-950 dark:text-slate-50 text-xs truncate capitalize">{user.username}</p>
                <span className="inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 mt-0.5 border border-emerald-200/30 dark:border-emerald-800/30">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            id="logout-button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center ${isSidebarCollapsed ? "p-2.5" : "gap-2 px-4 py-2.5"} border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold text-red-600 dark:text-red-400 rounded-xl transition-smooth cursor-pointer`}
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden"
        ></div>
      )}

      {/* MAIN VIEW CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === "overview" && (
          <Dashboard 
            token={token} 
            onNavigate={(targetTab) => {
              if (targetTab === "vaccination") {
                setKandangSubTab("vaccination");
                setActiveTab("kandang");
              } else if (targetTab === "biosecurity") {
                setKandangSubTab("biosecurity");
                setActiveTab("kandang");
              } else {
                setActiveTab(targetTab);
              }
            }} 
          />
        )}
        {activeTab === "logs" && <DailyLogs token={token} userRole={user.role} />}
        {activeTab === "inventory" && <InventoryManager token={token} />}
        {activeTab === "sales" && <SalesManager token={token} />}
        {activeTab === "kandang" && (
          <KandangManager 
            token={token} 
            userRole={user.role} 
            activeSubTab={kandangSubTab}
            setActiveSubTab={setKandangSubTab}
          />
        )}
        {activeTab === "feed-planner" && <FeedPlanner />}
        {activeTab === "reports" && <Reports token={token} />}
        {activeTab === "sync" && <SyncManager />}
        {activeTab === "billing" && (
          <SaaSPlanWidget 
            token={token} 
            user={user} 
            onPlanUpdated={fetchProfile} 
          />
        )}
        {activeTab === "superadmin" && user.role === "superadmin" && <SuperAdminPanel token={token} />}
      </main>

    </div>
  );
}
