import React, { useState, useEffect } from 'react';
import { History, Calendar, DollarSign, ChevronRight, Search, Download, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

const Ventas = () => {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const data = await apiService.getSales();
    setSales(data);
    setLoading(false);
  };

  const filteredSales = sales.filter(s => s.id.toLowerCase().includes(filter.toLowerCase()) || s.payment_method.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Historial de Ventas</h1>
          <p className="text-slate-500">Consulta y gestiona las transacciones realizadas</p>
        </div>
        <button onClick={loadSales} className="btn-secondary flex items-center gap-2">
          <Clock size={20} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por ID de venta o método de pago..." 
          className="flex-1 outline-none text-slate-700 font-medium"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-tight">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">ID Transacción</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} />
                      <span className="text-sm">{new Date(sale.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-slate-400">#{sale.id.slice(0,8)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{sale.payment_method}</span>
                  </td>
                  <td className="px-6 py-4">
                    {sale.status === 'synced' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={12} /> Sincronizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
                        <AlertCircle size={12} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-primary-800">${sale.total_amount.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && !loading && (
                 <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-300 italic">No se encontraron ventas</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ventas;
