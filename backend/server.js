const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDb } = require('./db/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes placeholders
app.use('/api/auth', require('./routes/auth'));
app.use('/api/webauthn', require('./routes/webauthn'));
app.use('/api/products', require('./routes/products'));
app.use('/api/variants', require('./routes/variants'));
app.use('/api/sales', require('./routes/sales'));

// Initialize Database and Start Server
initDb().then(() => {
    console.log('Database initialized successfully');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
