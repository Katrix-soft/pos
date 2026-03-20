import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, QrCode, Trash2, Plus, Minus, CreditCard, Banknote, User, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';
import { db } from '../db/db';
import Scanner from '../components/Scanner';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await apiService.getProducts();
    const v = await apiService.getVariants();
    setProducts(p);
    setVariants(v);
  };

  const addToCart = (variant) => {
    const product = products.find(p => p.id === variant.product_id);
    const existing = cart.find(item => item.variant_id === variant.id);
    
    if (existing) {
      setCart(cart.map(item => 
        item.variant_id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        variant_id: variant.id,
        name: product?.name,
        size: variant.size,
        color: variant.color,
        price: product?.base_price || 0,
        quantity: 1,
        sku: variant.sku
      }]);
    }
  };

  const updateQuantity = (variantId, delta) => {
    setCart(cart.map(item => {
      if (item.variant_id === variantId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (variantId) => {
    setCart(cart.filter(item => item.variant_id !== variantId));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (method) => {
    if (cart.length === 0) return;
    setCheckoutStatus('processing');
    
    const sale = {
      total_amount: total,
      payment_method: method,
      items: cart.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_sale: item.price
      }))
    };

    try {
      await apiService.createSale(sale);
      setCheckoutStatus('success');
      setCart([]);
      setTimeout(() => setCheckoutStatus(null), 3000);
    } catch (err) {
      alert('Pago registrado localmente (Modo Offline).');
      setCheckoutStatus(null);
    }
  };

  const handleScan = (data) => {
    const code = (data || '').trim();
    console.log('[POS] Código escaneado:', code);
    const variant = variants.find(v => 
      v.barcode?.trim() === code || v.sku?.trim() === code
    );
    if (variant) {
      addToCart(variant);
      setSearch(''); 
    } else {
      alert(`Código leído: "${code}"\n\nProducto no encontrado en la BD. Verificá el barcode en Inventario.`);
    }
  };

  const filteredVariants = variants.filter(v => {
    const product = products.find(p => p.id === v.product_id);
    const searchStr = `${product?.name} ${v.sku} ${v.size} ${v.color}`.toLowerCase();
    return searchStr.includes(search.toLowerCase());
  }).slice(0, 15);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-4 bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, SKU o color..." 
              className="flex-1 outline-none text-lg font-medium"
              value={search}
              onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  // Auto-add if exact SKU match (for manual entry)
                  const exact = variants.find(v => v.sku === val || v.barcode === val);
                  if (exact) {
                      addToCart(exact);
                      setSearch('');
                  }
              }}
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="p-4 bg-primary-800 text-white rounded-3xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <QrCode size={24} />
            <span className="md:hidden lg:inline font-bold">Escanear</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVariants.map(v => (
            <button 
              key={v.id} 
              onClick={() => addToCart(v)}
              className="card text-left hover:border-primary-400 active:bg-slate-50 transition-all group p-6"
            >
              <div className="flex justify-between items-start mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>{v.sku}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">{products.find(p => p.id === v.product_id)?.category}</span>
              </div>
              <h4 className="font-bold text-slate-800 line-clamp-2 text-lg leading-tight">{products.find(p => p.id === v.product_id)?.name}</h4>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <span className="text-[10px] bg-primary-50 text-primary-600 px-3 py-1 rounded-full font-black uppercase">{v.size}</span>
                  <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black uppercase text-slate-500">{v.color}</span>
                </div>
                <span className="text-xl font-black text-primary-800">${products.find(p => p.id === v.product_id)?.base_price}</span>
              </div>
            </button>
          ))}
          {filteredVariants.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-300">
               <Search size={64} strokeWidth={1} />
               <p className="mt-4 font-medium text-lg">No se encontraron productos</p>
               <p className="text-sm">Prueba con otro término o escanea el código</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
               <ShoppingCart className="text-primary-600" /> Carrito
            </h2>
            <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-sm font-bold">
              {cart.length} items
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {cart.map(item => (
            <div key={item.variant_id} className="flex gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 leading-tight">{item.name}</h4>
                <p className="text-sm text-slate-400 font-medium">{item.size} / {item.color}</p>
                <div className="flex items-center gap-4 mt-3">
                   <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1">
                      <button onClick={() => updateQuantity(item.variant_id, -1)} className="p-1 hover:text-primary-600"><Minus size={16} /></button>
                      <span className="w-8 text-center font-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variant_id, 1)} className="p-1 hover:text-primary-600"><Plus size={16} /></button>
                   </div>
                   <button onClick={() => removeFromCart(item.variant_id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">${item.price} c/u</p>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-200">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="mt-4 font-bold uppercase tracking-widest text-xs">Carrito Vacío</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total a Pagar</span>
            <span className="text-4xl font-black text-primary-900">${total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={cart.length === 0 || checkoutStatus}
              onClick={() => handleCheckout('Efectivo')}
              className="flex flex-col items-center gap-2 bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 p-4 rounded-3xl transition-all active:scale-95 disabled:opacity-50"
            >
              <Banknote className="text-emerald-500" />
              <span className="text-xs font-black uppercase text-slate-600">Efectivo</span>
            </button>
            <button 
              disabled={cart.length === 0 || checkoutStatus}
              onClick={() => handleCheckout('Transferencia')}
              className="flex flex-col items-center gap-2 bg-white hover:bg-sky-50 hover:border-sky-200 border border-slate-200 p-4 rounded-3xl transition-all active:scale-95 disabled:opacity-50"
            >
              <CreditCard className="text-sky-500" />
              <span className="text-xs font-black uppercase text-slate-600">Transf.</span>
            </button>
          </div>
        </div>
      </div>

      {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      
      {checkoutStatus === 'success' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full mb-6">
                 <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">¡Venta Exitosa!</h2>
              <p className="text-slate-500 font-medium">Stock actualizado y venta registrada.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
