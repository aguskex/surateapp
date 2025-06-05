require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// MercadoPago Configuration
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
  integrator_id: process.env.MP_INTEGRATOR_ID,
});

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/payments', require('./routes/payments'));

// Serve React app for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
