import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Tag, Ruler, Palette, Database, Trash2, Edit2, AlertCircle, QrCode } from 'lucide-react';
import { apiService } from '../services/api';
import { db } from '../db/db';
import Scanner from '../components/Scanner';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [search, setSearch] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [scanningIdx, setScanningIdx] = useState(null);
  
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Remera', base_price: '' });
  const [newVariants, setNewVariants] = useState([{ size: '', color: '', stock: 0, sku: '', barcode: '' }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const p = await apiService.getProducts();
        const v = await apiService.getVariants();
        setProducts(p);
        setVariants(v);
    } catch (err) {
        console.error("Error loading inventory:", err);
    }
  };

  const addVariantRow = () => {
    setNewVariants([...newVariants, { size: '', color: '', stock: 0, sku: '', barcode: '' }]);
  };

  const removeVariantRow = (index) => {
    if (newVariants.length > 1) {
      setNewVariants(newVariants.filter((_, i) => i !== index));
    }
  };

  const updateVariantValue = (index, field, value) => {
    const updated = [...newVariants];
    updated[index][field] = value;
    setNewVariants(updated);
  };

  const handleInventoryScan = (data) => {
    if (scanningIdx !== null) {
      updateVariantValue(scanningIdx, 'sku', data);
      updateVariantValue(scanningIdx, 'barcode', data);
      setScanningIdx(null);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
        const productData = {
            ...newProduct,
            base_price: parseFloat(newProduct.base_price) || 0
        };
        const savedProduct = await apiService.createProduct(productData);
        
        for (const v of newVariants) {
            await apiService.createVariant({
                ...v,
                product_id: savedProduct.id,
                stock: parseInt(v.stock) || 0
            });
        }
        
        alert("¡Producto y variantes guardados con éxito!");
        setIsAddingProduct(false);
        setNewProduct({ name: '', category: 'Remera', base_price: '' });
        setNewVariants([{ size: '', color: '', stock: 0, sku: '', barcode: '' }]);
        loadData();
    } catch (err) {
        alert("Error al guardar: " + err.message);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Inventario</h1>
          <p className="text-slate-500 font-medium">Gestiona tus productos y variantes</p>
        </div>
        <button onClick={() => setIsAddingProduct(true)} className="btn-primary flex items-center gap-2 px-8 shadow-lg shadow-primary-200">
          <Plus size={20} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar productos por nombre..." 
          className="flex-1 outline-none text-slate-700 font-medium text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-primary-100 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary-50 text-primary-600 rounded-3xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Package size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{product.category}</span>
                    <span className="text-sm font-bold text-primary-600">${product.base_price}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-slate-50 text-slate-400 hover:text-primary-600 rounded-2xl transition-colors"><Edit2 size={18} /></button>
                <button className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-50">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                    <th className="px-4 py-3">Variante</th>
                    <th className="px-4 py-3">SKU / Barcode</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {variants.filter(v => v.product_id === product.id).map(variant => (
                    <tr key={variant.id} className="text-sm text-slate-600 hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800">{variant.size}</span> / <span className="opacity-60">{variant.color}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black font-mono bg-slate-100 px-2 py-1 rounded">{variant.sku || variant.barcode || '-'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${variant.stock < 10 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {variant.stock} unid.
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="text-primary-600 font-black text-xs uppercase hover:underline tracking-tighter">Ajustar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {isAddingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[50px] w-full max-w-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Nuevo Producto</h2>
                <div className="p-3 bg-primary-50 text-primary-600 rounded-3xl"><Database size={24}/></div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nombre del Producto</label>
                    <input type="text" placeholder="ej. Camisa Oxford Slim" className="input-field" required 
                      value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Categoría</label>
                    <select className="input-field cursor-pointer" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                      <option>Remera</option>
                      <option>Pantalon</option>
                      <option>Calzado</option>
                      <option>Accesorios</option>
                      <option>Gabanes</option>
                    </select>
                </div>
                <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Precio Base ($)</label>
                   <input type="number" step="0.01" placeholder="0.00" className="input-field" required
                     value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-black text-slate-800 text-lg">Variantes (Talles/Colores)</h3>
                  <button type="button" onClick={addVariantRow} className="bg-slate-50 text-primary-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-50 transition-colors">
                    <Plus size={16} /> Agregar Variante
                  </button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4">
                    {newVariants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end bg-slate-50/50 p-6 rounded-[30px] border border-slate-100 relative group">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Talle</label>
                            <input type="text" placeholder="M, 42, etc" className="input-field py-3 text-sm" value={v.size} onChange={e => updateVariantValue(idx, 'size', e.target.value)} />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Color</label>
                            <input type="text" placeholder="Negro" className="input-field py-3 text-sm" value={v.color} onChange={e => updateVariantValue(idx, 'color', e.target.value)} />
                        </div>
                        <div className="md:col-span-1 relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">SKU / Barcode</label>
                            <div className="relative">
                                <input type="text" placeholder="Código" className="input-field py-3 text-sm pr-10" value={v.sku} onChange={e => updateVariantValue(idx, 'sku', e.target.value)} />
                                <button 
                                  type="button"
                                  onClick={() => setScanningIdx(idx)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 p-1.5 hover:bg-primary-50 rounded-xl transition-colors"
                                >
                                    <QrCode size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Stock Inicial</label>
                            <input type="number" className="input-field py-3 text-sm" value={v.stock} onChange={e => updateVariantValue(idx, 'stock', e.target.value)} />
                        </div>
                        <div className="md:col-span-1 flex justify-end">
                            <button type="button" onClick={() => removeVariantRow(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingProduct(false)} className="btn-secondary flex-1 py-4 rounded-3xl font-black uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary-200">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scanningIdx !== null && (
        <Scanner onScan={handleInventoryScan} onClose={() => setScanningIdx(null)} />
      )}
    </div>
  );
};

export default Inventory;
