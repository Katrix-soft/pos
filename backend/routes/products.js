const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const crypto = require('crypto');

// Get all products
router.get('/', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create product
router.post('/', (req, res) => {
    const { name, category, base_price } = req.body;
    const id = crypto.randomUUID();
    db.run(`INSERT INTO products (id, name, category, base_price) VALUES (?, ?, ?, ?)`,
        [id, name, category, base_price],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, name, category, base_price });
        }
    );
});

// Update product
router.put('/:id', (req, res) => {
    const { name, category, base_price } = req.body;
    db.run(`UPDATE products SET name = ?, category = ?, base_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, category, base_price, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Updated' });
        }
    );
});

// Delete product
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

module.exports = router;
