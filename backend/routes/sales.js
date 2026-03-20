const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const crypto = require('crypto');

// Get all sales
router.get('/', (req, res) => {
    db.all(`SELECT * FROM sales ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Process a single sale
const processSale = (sale, callback) => {
    const { id, total_amount, payment_method, items, created_at } = sale;
    const saleId = id || crypto.randomUUID();
    const timestamp = created_at || new Date().toISOString();

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Insert sale
        db.run(`INSERT INTO sales (id, total_amount, payment_method, created_at) VALUES (?, ?, ?, ?)`,
            [saleId, total_amount, payment_method, timestamp],
            function(err) {
                if (err) {
                    db.run("ROLLBACK");
                    return callback(err);
                }

                // Insert items and update stock
                const itemStmt = db.prepare(`INSERT INTO sale_items (id, sale_id, variant_id, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?)`);
                const stockStmt = db.prepare(`UPDATE variants SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);

                items.forEach(item => {
                    itemStmt.run([crypto.randomUUID(), saleId, item.variant_id, item.quantity, item.price_at_sale]);
                    stockStmt.run([item.quantity, item.variant_id]);
                });

                itemStmt.finalize();
                stockStmt.finalize();

                db.run("COMMIT", (err) => {
                    if (err) return callback(err);
                    callback(null, { saleId });
                });
            }
        );
    });
};

// Create a sale
router.post('/', (req, res) => {
    processSale(req.body, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(result);
    });
});

// Sync multiple sales
router.post('/sync', async (req, res) => {
    const { sales } = req.body; // Array of sales
    if (!sales || !Array.isArray(sales)) return res.status(400).json({ error: 'Invalid data' });

    const results = [];
    const errors = [];

    for (const sale of sales) {
        try {
            await new Promise((resolve, reject) => {
                processSale(sale, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            results.push(sale.id);
        } catch (err) {
            errors.push({ id: sale.id, error: err.message });
        }
    }

    res.json({ synced: results, failed: errors });
});

module.exports = router;
