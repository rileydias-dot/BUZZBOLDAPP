const express = require('express');
const router = express.Router();
const {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
} = require('../controllers/subscription.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/plans', getPlans);
router.get('/current', auth, getCurrentSubscription);
router.post('/', auth, createSubscription);
router.delete('/', auth, cancelSubscription);

module.exports = router;
