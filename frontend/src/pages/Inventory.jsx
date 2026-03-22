import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Search, Tag, Ruler, Palette, Database, Trash2, Edit2, AlertCircle, QrCode, ChevronDown, ChevronRight, Hash, Layers, Filter, MoreHorizontal, LayoutGrid, List as ListIcon, Info, Boxes, ArrowUpDown } from 'lucide-react';
import { apiService } from '../services/api';
import Scanner from '../components/Scanner';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [scanningIdx, setScanningIdx] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Remera', base_price: '' });
  const [newVariants, setNewVariants] = useState([{ size: '', color: '', stock: 0, sku: '', barcode: '' }]);

  const categories = ['Todas', 'Remera', 'Pantalon', 'Calzado', 'Accesorios', 'Gabanes'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const p = await apiService.getProducts();
        const v = await apiService.getVariants();
        setProducts(p || []);
        setVariants(v || []);
    } catch (err) {
        console.error("Error loading inventory:", err);
    }
  };

  const toggleProduct = (id) => {
    const next = new Set(expandedProducts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProducts(next);
  };

  const toggleAll = () => {
    if (expandedProducts.size === products.length) {
      setExpandedProducts(new Set());
    } else {
      setExpandedProducts(new Set(products.map(p => p.id)));
    }
  };

  const updateStock = async (variantId, newStock) => {
    try {
      setIsUpdating(true);
      const variant = variants.find(v => v.id === variantId);
      if (!variant) return;
      
      const updatedVariant = { ...variant, stock: Math.max(0, newStock) };
      await apiService.updateVariant(variantId, updatedVariant);
      setVariants(prev => prev.map(v => v.id === variantId ? updatedVariant : v));
    } catch (err) {
      console.error("Error updating stock:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteVariant = async (id) => {
    if (!window.confirm("¿Eliminar esta variante?")) return;
    try {
      await apiService.deleteVariant(id);
      setVariants(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error("Error deleting variant:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Eliminar producto y todas sus variantes?")) return;
    try {
      await apiService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setVariants(prev => prev.filter(v => v.product_id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
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
        
        setIsAddingProduct(false);
        setNewProduct({ name: '', category: 'Remera', base_price: '' });
        setNewVariants([{ size: '', color: '', stock: 0, sku: '', barcode: '' }]);
        loadData();
    } catch (err) {
        alert("Error al guardar: " + err.message);
    }
  };

  const stats = useMemo(() => {
    const totalStock = variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0);
    const lowStock = variants.filter(v => parseInt(v.stock) < 5).length;
    return { totalItems: products.length, totalStock, lowStock };
  }, [products, variants]);

  const filteredProducts = products.filter(p => {
    const pVariants = variants.filter(v => v.product_id === p.id);
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                         pVariants.some(v => v.sku?.toLowerCase().includes(search.toLowerCase()) || 
                                           v.barcode?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    
    if (lowStockOnly) {
      const hasLowStock = pVariants.some(v => (parseInt(v.stock) || 0) < 5);
      return matchesSearch && matchesCategory && hasLowStock;
    }
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header with Glass Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest">
            <Boxes size={12} /> Gestión de Stock Pro
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-none">Inventario</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
               <span className="text-sm font-black text-slate-700">{stats.totalItems} <span className="text-slate-400 font-bold uppercase text-[10px] ml-1">Productos</span></span>
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-sm font-black text-slate-700">{stats.totalStock} <span className="text-slate-400 font-bold uppercase text-[10px] ml-1">Unidades</span></span>
            </div>
            {stats.lowStock > 0 && (
              <button 
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-3 transition-all ${lowStockOnly ? 'bg-amber-600 border-amber-500 text-white' : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'}`}
              >
                 <div className={`w-2 h-2 rounded-full ${lowStockOnly ? 'bg-white animate-pulse' : 'bg-amber-500'}`}></div>
                 <span className="text-sm font-black">{stats.lowStock} <span className={`${lowStockOnly ? 'text-white/60' : 'text-amber-400'} font-bold uppercase text-[10px] ml-1`}>Alertas</span></span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary-800 hover:border-primary-200 transition-all shadow-sm">
            {viewMode === 'grid' ? <ListIcon size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button onClick={() => setIsAddingProduct(true)} className="btn-primary group flex items-center gap-3 px-8 py-5 rounded-[2rem] bg-slate-900 border-b-4 border-slate-700 hover:bg-black text-white shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 active:border-b-0">
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-black text-sm uppercase tracking-[0.15em]">Cargar Producto</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Categories */}
      <div className="bg-white/50 backdrop-blur-xl p-3 rounded-[2.5rem] border border-white shadow-xl flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o descripción..." 
              className="w-full pl-16 pr-6 py-5 bg-white rounded-3xl border border-slate-100 outline-none text-slate-700 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-primary-900/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={toggleAll}
            title={expandedProducts.size === products.length ? "Contraer todo" : "Expandir todo"}
            className="hidden md:flex items-center gap-2 px-6 py-5 bg-white border border-slate-100 rounded-3xl text-slate-400 hover:text-primary-800 hover:border-primary-100 transition-all shadow-sm font-black text-[10px] uppercase tracking-widest"
          >
            {expandedProducts.size === products.length ? <Layers size={18} className="text-primary-500" /> : <Layers size={18} />}
            {expandedProducts.size === products.length ? 'Cerrar' : 'Ver todo'}
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-4 md:px-0 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-primary-800 text-white shadow-xl shadow-primary-900/20' 
                : 'bg-white text-slate-400 hover:text-primary-800 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
          {filteredProducts.map(product => {
            const productVariants = variants.filter(v => v.product_id === product.id);
            const totalProdStock = productVariants.reduce((a, v) => a + (parseInt(v.stock) || 0), 0);
            const isExpanded = expandedProducts.has(product.id);

            return (
              <div key={product.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                <div className="p-8 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${totalProdStock > 0 ? 'bg-slate-50 text-slate-400 group-hover:bg-primary-800 group-hover:text-white' : 'bg-red-50 text-red-400'}`}>
                      <Package size={28} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-800 rounded-xl transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 opacity-60">{product.category}</span>
                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary-800 transition-colors leading-tight">{product.name}</h3>
                    <div className="flex items-center gap-3">
                       <span className="text-3xl font-black text-slate-900 tracking-tighter">${product.base_price}</span>
                       {totalProdStock < 10 && totalProdStock > 0 && <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">Stock Bajo</span>}
                       {totalProdStock === 0 && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">Sin Stock</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50">
                    <div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Stock</span>
                      <span className="text-lg font-black text-slate-700">{totalProdStock} <span className="text-xs text-slate-400 font-bold uppercase">Unid</span></span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Variantes</span>
                      <span className="text-lg font-black text-slate-700">{productVariants.length} <span className="text-xs text-slate-400 font-bold uppercase">Ops</span></span>
                    </div>
                  </div>
                </div>

                <div className="px-8 pb-8">
                  <button 
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${
                      isExpanded ? 'bg-primary-900 text-white shadow-xl' : 'bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-800'
                    }`}
                  >
                    {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                    {isExpanded ? 'Cerrar Detalles' : 'Ver Inventario'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-8 pb-10 bg-slate-50/50 rounded-b-[3rem] animate-in slide-in-from-top duration-300">
                    <div className="space-y-2 pt-2">
                       {productVariants.map(v => (
                         <div key={v.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group/var">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-800 opacity-0 group-hover/var:opacity-100 transition-opacity"></div>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-700 uppercase shadow-inner">{v.size}</div>
                              <div>
                                <div className="font-black text-slate-800 text-sm leading-none mb-1">{v.color}</div>
                                <div className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-tighter">{v.sku || 'N/A'}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-right flex items-center gap-3 bg-slate-50/10 group-hover/var:bg-white px-2 py-1 rounded-xl border border-transparent transition-all">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); updateStock(v.id, (parseInt(v.stock) || 0) - 1); }}
                                   disabled={isUpdating}
                                   className="w-8 h-8 flex items-center justify-center bg-white/80 border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 transition-all active:scale-90"
                                 >
                                   -
                                 </button>
                                 <div className="min-w-[2.5rem] text-center">
                                    <div className={`text-lg font-black leading-none ${v.stock < 5 ? 'text-red-500' : 'text-slate-800'}`}>{v.stock}</div>
                                    <div className="text-[8px] font-black text-slate-300 uppercase">Stock</div>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); updateStock(v.id, (parseInt(v.stock) || 0) + 1); }}
                                   disabled={isUpdating}
                                   className="w-8 h-8 flex items-center justify-center bg-white/80 border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all active:scale-90"
                                 >
                                   +
                                 </button>
                              </div>
                              <div className="flex gap-1">
                                <button className="p-2 hover:bg-primary-50 text-slate-300 hover:text-primary-800 rounded-lg transition-colors"><Edit2 size={14}/></button>
                                <button onClick={() => handleDeleteVariant(v.id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="md:col-span-3 py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 dashed">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">No se encontraron productos</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">{search ? `Para "${search}"` : 'Intenta con otro filtro'}</p>
              {lowStockOnly && (
                <button onClick={() => setLowStockOnly(false)} className="mt-6 text-primary-800 font-black text-[10px] uppercase tracking-widest hover:underline">Ver todo el inventario</button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden mb-32">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] border-b border-slate-50">
                <th className="px-10 py-6">Producto / Referencia</th>
                <th className="px-6 py-6 text-center">Talles</th>
                <th className="px-6 py-6">Total Stock</th>
                <th className="px-6 py-6">Valor Base</th>
                <th className="px-10 py-6 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map(product => {
                const pVariants = variants.filter(v => v.product_id === product.id);
                const totalStock = pVariants.reduce((a, v) => a + (parseInt(v.stock) || 0), 0);
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-primary-800 group-hover:text-white transition-all">
                          <Package size={24} />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-xl group-hover:text-primary-800 transition-colors leading-none mb-1">{product.name}</div>
                          <div className="text-[10px] font-black text-primary-500/50 uppercase tracking-widest">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-1">
                        {pVariants.map(v => (
                          <div key={v.id} className="group/v relative">
                            <span title={`${v.color} - Stock: ${v.stock}`} className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center transition-all ${v.stock < 5 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                              <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{v.size}</span>
                              <span className="text-[8px] font-bold opacity-50">{v.stock}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black ring-1 ring-inset ${totalStock < 10 ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'}`}>
                          {totalStock} <span className="opacity-40 ml-1">UNID</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => updateStock(pVariants[0]?.id, (pVariants[0]?.stock || 0) + 1)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all cursor-pointer">+</button>
                           <button onClick={() => updateStock(pVariants[0]?.id, (pVariants[0]?.stock || 0) - 1)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all cursor-pointer">-</button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black text-slate-800 text-xl tracking-tighter">${product.base_price}</td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary-600 shadow-sm transition-all"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-500 shadow-sm transition-all"><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setIsAddingProduct(false)}></div>
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col transform animate-in zoom-in-95 duration-500">
            {/* Modal Glass Header */}
            <div className="p-10 pb-6 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary-800 text-white rounded-[1.75rem] flex items-center justify-center shadow-xl shadow-primary-900/30">
                    <Database size={32}/>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">Cargar Nuevo Ítem</h2>
                    <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Sincronización con base de datos en tiempo real</p>
                  </div>
                </div>
                <button onClick={() => setIsAddingProduct(false)} className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-400 transition-all active:scale-90">
                  <Trash2 size={24}/>
                </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-12 pt-8 space-y-12 custom-scrollbar">
              {/* Product Info Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-4">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-primary-800 rounded-full"></div>
                      Información Base
                   </h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">Define el nombre comercial, la categoría para filtros y el precio de lista para todas las variantes.</p>
                </div>
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div className="md:col-span-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nombre del Artículo</label>
                      <input type="text" placeholder="ej. Campera Parka 'Katrix' Waterproof" className="input-field h-16 text-lg font-bold" required 
                        value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div className="md:col-span-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Categoría de Filtro</label>
                      <div className="relative">
                        <select className="input-field h-16 appearance-none cursor-pointer pr-12 font-bold" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                          {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300" size={20} />
                      </div>
                  </div>
                  <div className="md:col-span-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Precio de Lista ($)</label>
                     <div className="relative">
                        <input type="number" step="0.01" placeholder="0" className="input-field h-16 font-black text-center text-xl pl-12" required
                          value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: e.target.value})} />
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-primary-800 rounded-full"></div>
                      Gestión de Variantes
                   </h3>
                   <button type="button" onClick={addVariantRow} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-primary-900/10 active:scale-95">
                    <Plus size={18} /> Agregar Variante
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {newVariants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-2 md:grid-cols-12 gap-6 items-end bg-slate-50/50 p-8 rounded-[2.5rem] border border-transparent hover:border-primary-100 hover:bg-white hover:shadow-2xl transition-all duration-300 group">
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-2 block text-center">Talle</label>
                            <input type="text" placeholder="L / 44" className="input-field text-center font-black h-14 bg-white" value={v.size} onChange={e => updateVariantValue(idx, 'size', e.target.value)} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-2 block">Color</label>
                            <input type="text" placeholder="Negro Carbono" className="input-field h-14 font-bold bg-white" value={v.color} onChange={e => updateVariantValue(idx, 'color', e.target.value)} />
                        </div>
                        <div className="md:col-span-4 relative">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-2 block">Barras / SKU</label>
                            <div className="relative group/scan">
                                <input type="text" placeholder="ESCANEABLE" className="input-field h-14 pr-12 font-mono text-sm bg-white uppercase" value={v.sku} onChange={e => updateVariantValue(idx, 'sku', e.target.value)} />
                                <button type="button" onClick={() => setScanningIdx(idx)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary-800 text-white rounded-xl hover:bg-black transition-all shadow-lg active:scale-90">
                                    <QrCode size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1 mb-2 block text-center">Stock Activo</label>
                            <input type="number" className="input-field h-14 text-center font-black bg-white" value={v.stock} onChange={e => updateVariantValue(idx, 'stock', e.target.value)} />
                        </div>
                        <div className="md:col-span-1 flex justify-end pb-2">
                            <button type="button" onClick={() => removeVariantRow(idx)} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90">
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
              </div>
            </form>

            <div className="p-10 flex gap-4 bg-slate-50/50 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 py-6 rounded-3xl bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleSaveProduct} className="flex-[2] py-6 rounded-3xl bg-primary-800 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary-900/30 hover:bg-black transition-all transform hover:-translate-y-1 active:translate-y-0">Guardar en Inventario</button>
            </div>
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
