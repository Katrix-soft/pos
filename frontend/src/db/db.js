import Dexie from 'dexie';

export const db = new Dexie('KatrixDB');

db.version(1).stores({
  products: 'id, name, category',
  variants: 'id, product_id, size, color, sku, barcode',
  sales: 'id, total_amount, payment_method, created_at, status', // status: 'pending' | 'synced'
  sale_items: 'id, sale_id, variant_id'
});

export const initLocalDb = async () => {
  await db.open();
};
