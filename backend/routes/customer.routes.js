const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customer.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/', auth, getCustomers);
router.get('/:customerId', auth, getCustomerById);
router.post('/', auth, createCustomer);
router.put('/:customerId', auth, updateCustomer);
router.delete('/:customerId', auth, deleteCustomer);

module.exports = router;
