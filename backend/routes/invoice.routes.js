const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  sendInvoice,
  createPaymentIntent,
  stripeWebhook,
} = require('../controllers/invoice.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/', auth, createInvoice);
router.get('/', auth, getInvoices);
router.get('/:invoiceId', auth, getInvoiceById);
router.post('/:invoiceId/send', auth, sendInvoice);
router.post('/:invoiceId/payment-intent', auth, createPaymentIntent);

// Stripe webhook (no auth required)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
