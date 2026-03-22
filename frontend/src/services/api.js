import axios from 'axios';
import { db } from '../db/db';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  async getProducts() {
    try {
      const res = await api.get('/products');
      await db.products.bulkPut(res.data);
      return res.data;
    } catch (error) {
      return await db.products.toArray();
    }
  },

  async createProduct(product) {
    try {
      const res = await api.post('/products', product);
      await db.products.put(res.data);
      return res.data;
    } catch (error) {
      const localProduct = { ...product, id: crypto.randomUUID(), status: 'pending' };
      await db.products.add(localProduct);
      return localProduct;
    }
  },

  async updateProduct(id, product) {
    try {
      await api.put(`/products/${id}`, product);
      await db.products.update(id, product);
    } catch (error) {
      await db.products.update(id, { ...product, status: 'pending' });
    }
  },

  async deleteProduct(id) {
    try {
      await api.delete(`/products/${id}`);
      await db.products.delete(id);
    } catch (error) {
      // Handle offline delete if needed
    }
  },

  async getVariants() {
    try {
      const res = await api.get('/variants');
      await db.variants.bulkPut(res.data);
      return res.data;
    } catch (error) {
      return await db.variants.toArray();
    }
  },

  async createVariant(variant) {
    try {
      const res = await api.post('/variants', variant);
      await db.variants.put(res.data);
      return res.data;
    } catch (error) {
      const localVariant = { ...variant, id: crypto.randomUUID(), status: 'pending' };
      await db.variants.add(localVariant);
      return localVariant;
    }
  },

  async updateVariant(id, variant) {
    try {
      await api.put(`/variants/${id}`, variant);
      await db.variants.update(id, variant);
      return { ...variant, id };
    } catch (error) {
      await db.variants.update(id, { ...variant, status: 'pending' });
      return { ...variant, id };
    }
  },

  async deleteVariant(id) {
    try {
      await api.delete(`/variants/${id}`);
      await db.variants.delete(id);
    } catch (error) {
      // Handle offline delete
    }
  },

  async getSales() {
    try {
      const res = await api.get('/sales');
      await db.sales.bulkPut(res.data.map(s => ({ ...s, status: 'synced' })));
      return res.data;
    } catch (error) {
      return await db.sales.toArray();
    }
  },

  async createSale(sale) {
    const localSale = {
      ...sale,
      id: sale.id || crypto.randomUUID(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    await db.sales.add(localSale);
    
    try {
      await api.post('/sales', localSale);
      await db.sales.update(localSale.id, { status: 'synced' });
      return { ...localSale, status: 'synced' };
    } catch (error) {
      return localSale;
    }
  },

  async syncPendingSales() {
    const pendingSales = await db.sales.where({ status: 'pending' }).toArray();
    if (pendingSales.length === 0) return;

    try {
      const res = await api.post('/sales/sync', { sales: pendingSales });
      const syncedIds = res.data.synced;
      
      for (const id of syncedIds) {
        await db.sales.update(id, { status: 'synced' });
      }
      return res.data;
    } catch (error) {
      throw error;
    }
  }
};
