const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getTrafficAnalytics,
  getSocialAnalytics,
  getRevenueAnalytics,
} = require('../controllers/analytics.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/dashboard', auth, getDashboardMetrics);
router.get('/traffic', auth, getTrafficAnalytics);
router.get('/social', auth, getSocialAnalytics);
router.get('/revenue', auth, getRevenueAnalytics);

module.exports = router;
