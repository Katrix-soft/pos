const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const crypto = require('crypto');

// Get all variants (optionally filtered by product)
router.get('/', (req, res) => {
    const productId = req.query.productId;
    let query = `SELECT * FROM variants`;
    let params = [];
    if (productId) {
        query += ` WHERE product_id = ?`;
        params.push(productId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create variant
router.post('/', (req, res) => {
    const { product_id, size, color, stock, sku, barcode } = req.body;
    const id = crypto.randomUUID();
    db.run(`INSERT INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, product_id, size, color, stock, sku, barcode],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, product_id, size, color, stock, sku, barcode });
        }
    );
});

// Bulk create variants
router.post('/bulk', (req, res) => {
    const variants = req.body; // Array of variants
    const stmt = db.prepare(`INSERT INTO variants (id, product_id, size, color, stock, sku, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        variants.forEach(v => {
            stmt.run([crypto.randomUUID(), v.product_id, v.size, v.color, v.stock, v.sku, v.barcode]);
        });
        db.run("COMMIT", (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: `${variants.length} variants created` });
        });
    });
    stmt.finalize();
});

// Update variant
router.put('/:id', (req, res) => {
    const { size, color, stock, sku, barcode } = req.body;
    db.run(`UPDATE variants SET size = ?, color = ?, stock = ?, sku = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [size, color, stock, sku, barcode, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated' });
        }
    );
});

module.exports = router;
