const express = require('express');
const router = express.Router();
const {
  getPlatforms,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  getReviews,
  replyToReview,
  sendReviewRequest,
  getReviewRequests,
  getReviewAnalytics,
} = require('../controllers/review.controller');
const { auth } = require('../middleware/auth.middleware');

// Review platforms
router.get('/platforms', auth, getPlatforms);

// Google Business Profile OAuth
router.get('/google/auth', auth, googleAuth);
router.get('/google/callback', googleCallback);

// Facebook OAuth
router.get('/facebook/auth', auth, facebookAuth);
router.get('/facebook/callback', facebookCallback);

// Reviews
router.get('/', auth, getReviews);
router.post('/:reviewId/reply', auth, replyToReview);

// Review requests
router.post('/requests', auth, sendReviewRequest);
router.get('/requests', auth, getReviewRequests);

// Analytics
router.get('/analytics', auth, getReviewAnalytics);

module.exports = router;
