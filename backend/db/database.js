const { Pool } = require('pg');

// Configuración de conexión desde variables de entorno (Docker)
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'katrix_db',
});

// Helper para convertir sintaxis SQLite (?) a PostgreSQL ($1, $2...)
const sqliteToPg = (query) => {
    let index = 1;
    return query.replace(/\?/g, () => `$${index++}`);
};

// Capa de compatibilidad para el código existente (que usa db.all y db.run)
const db = {
    // db.all(query, params, callback)
    all: (query, params, callback) => {
        const pgQuery = sqliteToPg(query);
        pool.query(pgQuery, params, (err, res) => {
            if (callback) callback(err, res ? res.rows : null);
        });
    },
    // db.run(query, params, callback)
    run: (query, params, callback) => {
        const pgQuery = sqliteToPg(query);
        pool.query(pgQuery, params, (err, res) => {
            if (callback) callback.call({ lastID: null, changes: res ? res.rowCount : 0 }, err);
        });
    },
    // db.get(query, params, callback)
    get: (query, params, callback) => {
        const pgQuery = sqliteToPg(query);
        pool.query(pgQuery, params, (err, res) => {
            if (callback) callback(err, res && res.rows.length > 0 ? res.rows[0] : null);
        });
    }
};

const initDb = async (retries = 5) => {
    while (retries > 0) {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Products
                await client.query(`CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT,
                    base_price REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`);

                // Variants
                await client.query(`CREATE TABLE IF NOT EXISTS variants (
                    id TEXT PRIMARY KEY,
                    product_id TEXT NOT NULL,
                    size TEXT,
                    color TEXT,
                    stock INTEGER DEFAULT 0,
                    sku TEXT UNIQUE,
                    barcode TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
                )`);

                // Sales
                await client.query(`CREATE TABLE IF NOT EXISTS sales (
                    id TEXT PRIMARY KEY,
                    total_amount REAL NOT NULL,
                    payment_method TEXT,
                    status TEXT DEFAULT 'completed',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`);

                // Sale Items
                await client.query(`CREATE TABLE IF NOT EXISTS sale_items (
                    id TEXT PRIMARY KEY,
                    sale_id TEXT NOT NULL,
                    variant_id TEXT NOT NULL,
                    quantity INTEGER DEFAULT 1,
                    price_at_sale REAL NOT NULL,
                    FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                    FOREIGN KEY(variant_id) REFERENCES variants(id)
                )`);

                // Users
                await client.query(`CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'admin'
                )`);

                await client.query('COMMIT');
                console.log('Database initialized successfully');
                client.release();
                break; // Éxito, salir del loop
            } catch (e) {
                await client.query('ROLLBACK');
                client.release();
                throw e;
            }
        } catch (err) {
            retries -= 1;
            console.log(`Waiting for database (retries left: ${retries})...`);
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

module.exports = { db, initDb, pool };
