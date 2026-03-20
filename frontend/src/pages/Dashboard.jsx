import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, AlertTriangle, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { apiService } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="card relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 rounded-full ${color}`}></div>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
        {trend && (
          <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
            <TrendingUp size={12} /> {trend} desde ayer
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-opacity-10 text-')}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    salesCount: 0,
    lowStock: 0,
    productCount: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      const sales = await apiService.getSales();
      const products = await apiService.getProducts();
      const variants = await apiService.getVariants();
      
      setStats({
        totalSales: sales.reduce((acc, s) => acc + s.total_amount, 0),
        salesCount: sales.length,
        lowStock: variants.filter(v => v.stock < 5).length,
        productCount: products.length
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Panel de Control</h1>
        <p className="text-slate-500">Resumen general de tu tienda Katrix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Ventas Totales" value={`$${stats.totalSales.toFixed(2)}`} icon={DollarSign} color="bg-emerald-500" trend="+12%" />
        <StatCard title="Transacciones" value={stats.salesCount} icon={ShoppingBag} color="bg-primary-500" trend="+5" />
        <StatCard title="Artículos Críticos" value={stats.lowStock} icon={AlertTriangle} color="bg-amber-500" />
        <StatCard title="Productos" value={stats.productCount} icon={Package} color="bg-sky-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Rendimiento Semanal</h3>
            <BarChart3 className="text-slate-300" />
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-4">
             {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <div key={i} className="flex-1 bg-primary-100 rounded-t-lg relative group transition-all hover:bg-primary-800" style={{ height: `${h}%` }}>
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(h * 150).toFixed(0)}
                   </div>
                </div>
             ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Canales de Pago</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-600">Efectivo</span>
                <span className="font-bold text-slate-800">75%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-600">Transferencia</span>
                <span className="font-bold text-slate-800">25%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-10 p-4 bg-primary-50 rounded-2xl">
             <div className="flex items-center gap-3 text-primary-700">
                <TrendingUp size={20} />
                <p className="text-xs font-bold leading-tight">Las ventas de esta semana han subido un 8.5% en comparación con la anterior.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
