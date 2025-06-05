const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');

// Crear preferencia de pago
router.post('/create_preference', async (req, res) => {
  const { items, shipping, payer } = req.body;

  try {
    const preference = {
      items,
      payer,
      shipments: {
        cost: shipping.cost,
        mode: shipping.mode,
        receiver_address: {
          zip_code: shipping.receiver_address.zip_code,
          street_name: shipping.receiver_address.street_name,
          street_number: shipping.receiver_address.street_number,
        },
      },
      payment_methods: {
        excluded_payment_methods: [
          { id: 'amex' } // Excluir American Express
        ],
        excluded_payment_types: [
          { id: 'atm' } // Excluir pagos en efectivo
        ],
        installments: 6 // Máximo de cuotas
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/api/payments/notifications`,
      external_reference: 'suratemates@gmail.com',
      integrator_id: process.env.MP_INTEGRATOR_ID,
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error creating payment preference' });
  }
});

// Notificaciones de pago
router.post('/notifications', (req, res) => {
  console.log('Payment notification:', req.body);
  res.status(200).send('OK');
});

module.exports = router;
