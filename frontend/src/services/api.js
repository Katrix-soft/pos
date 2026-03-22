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

  async getVariants() {
    try {
      const res = await api.get('/variants');
      await db.variants.bulkPut(res.data);
      return res.data;
    } catch (error) {
      return await db.variants.toArray();
    }
  },

  async getSales() {
    try {
      const res = await api.get('/sales');
      // Update local synced sales
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
