import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, Menu, X, Wifi, WifiOff, History, BarChart3 } from 'lucide-react';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Ventas from './pages/Ventas';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { apiService } from './services/api';

const SidebarLink = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-primary-800 text-white shadow-lg shadow-primary-900/20' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      apiService.syncPendingSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar para Escritorio */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 fixed h-full z-30">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold text-primary-800 tracking-tight">Katrix<span className="text-accent">POS</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarLink to="/pos" icon={ShoppingCart} label="Ventas (POS)" active={location.pathname === '/pos'} />
          <SidebarLink to="/inventory" icon={Package} label="Inventario" active={location.pathname === '/inventory'} />
          <SidebarLink to="/historial" icon={History} label="Historial" active={location.pathname === '/historial'} />
          <SidebarLink to="/dashboard" icon={BarChart3} label="Tablero" active={location.pathname === '/dashboard'} />
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'En Línea' : 'Modo Offline'}
          </div>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {/* Encabezado Móvil */}
        <header className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-primary-800">Katrix<span className="text-accent">POS</span></h1>
          <div className={isOnline ? 'text-emerald-500' : 'text-red-500'}>
            {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
        </header>
        
        {children}
      </main>

      {/* Sidebar Móvil */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
               <h1 className="text-2xl font-bold text-primary-800">Katrix</h1>
               <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
            </div>
            <nav className="flex-1 space-y-2">
              <Link to="/pos" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-600 active:bg-slate-100"><ShoppingCart /> Ventas</Link>
              <Link to="/inventory" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-600 active:bg-slate-100"><Package /> Inventario</Link>
              <Link to="/historial" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-600 active:bg-slate-100"><History /> Historial</Link>
              <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-600 active:bg-slate-100"><BarChart3 /> Tablero</Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <AppLayout>
            <Routes>
              <Route path="/pos" element={<POS />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/historial" element={<Ventas />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/pos" replace />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </Router>
  );
};

export default App;
