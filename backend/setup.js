const { initDb, db } = require('./db/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function setup() {
    console.log('--- Katrix POS Setup ---');
    
    try {
        await initDb();
        console.log('✓ Database initialized');

        // Check if admin exists
        db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const id = crypto.randomUUID();
                db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)', 
                    [id, 'admin', hashedPassword, 'admin']);
                console.log('✓ Admin user created (admin / admin123)');
            } else {
                console.log('i Admin user already exists');
            }

            // Seed some data
            const seedKiosk = () => {
                const k1Id = crypto.randomUUID();
                const k2Id = crypto.randomUUID();
                const k3Id = crypto.randomUUID();

                db.serialize(() => {
                    // BEBIDAS
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [k1Id, 'Coca-Cola 500ml', 'Bebidas', 1500.00]);
                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), k1Id, '500ml', 'Original', 50, 'COKE-500', '7790200000510']);

                    // SNACKS
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [k2Id, 'Alfajor Havanna', 'Snacks', 2200.00]);
                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), k2Id, '70g', 'Chocolate', 30, 'ALF-HAV-CHO', '7791234567890']);

                    // PRODUCTO REAL DEL USUARIO (Capturado de la captura de pantalla)
                    const u1Id = crypto.randomUUID();
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [u1Id, 'Producto Scanner Test', 'Accesorios', 5500.00]);
                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), u1Id, 'U', 'N/A', 100, 'TEST-SCAN-779', '7798178170368']);

                    // Otros códigos comunes de Retail Argentino
                    const u2Id = crypto.randomUUID();
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [u2Id, 'Remera Oversize V2', 'Shirt', 18500.00]);
                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), u2Id, 'L', 'Beige', 15, 'REM-V2-L', '7798178170369']);

                    // CIGARRILLOS/VARIO
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [k3Id, 'Papas Lay\'s Clásicas', 'Snacks', 1800.00]);
                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), k3Id, '150g', 'Saladas', 25, 'LAYS-150', '7790123456789']);
                });
                console.log('✓ Kiosk & User test products added');
            };

            db.get('SELECT COUNT(*) as count FROM products', [], async (err, row) => {
                console.log(`i Current product count: ${row.count}`);
                
                const p1Id = crypto.randomUUID();
                const p2Id = crypto.randomUUID();

                db.serialize(() => {
                    // ROPA (con IGNORE para evitar errores si ya existen)
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [p1Id, 'Nike Air Max', 'Shoes', 120000.00]);
                    db.run('INSERT OR IGNORE INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)', 
                        [p2Id, 'Remera Essentials Oversized', 'Shirt', 25000.00]);

                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), p1Id, '40', 'Black', 10, 'NIK-40-BLK', '1234567890123']);
                    db.run('INSERT OR IGNORE INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [crypto.randomUUID(), p2Id, 'M', 'Black', 20, 'ESS-M-BLK', '2234567890123']);
                });

                seedKiosk();
            });
        });

    } catch (err) {
        console.error('Error during setup:', err);
    }
}

setup();
