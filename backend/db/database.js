const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// En Docker: DB_PATH=/data/katrix.db (volumen persistente)
// En local:  ../../katrix.db (raíz del proyecto)
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../katrix.db');
const db = new sqlite3.Database(dbPath);


const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT,
                base_price REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Variants table
            db.run(`CREATE TABLE IF NOT EXISTS variants (
                id TEXT PRIMARY KEY,
                product_id TEXT NOT NULL,
                size TEXT,
                color TEXT,
                stock INTEGER DEFAULT 0,
                sku TEXT UNIQUE,
                barcode TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
            )`);

            // Sales table
            db.run(`CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                total_amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'completed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Sale Items table
            db.run(`CREATE TABLE IF NOT EXISTS sale_items (
                id TEXT PRIMARY KEY,
                sale_id TEXT NOT NULL,
                variant_id TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                price_at_sale REAL NOT NULL,
                FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY(variant_id) REFERENCES variants(id)
            )`);

            // Users table (basic auth)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin'
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};

module.exports = { db, initDb };
