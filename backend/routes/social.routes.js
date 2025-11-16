const express = require('express');
const router = express.Router();
const {
  getAccounts,
  instagramAuth,
  instagramCallback,
  tiktokAuth,
  tiktokCallback,
  linkedinAuth,
  linkedinCallback,
  xAuth,
  xCallback,
  createPost,
  getPosts,
  getComments,
  replyToComment,
  getAnalytics,
} = require('../controllers/social.controller');
const { auth } = require('../middleware/auth.middleware');

// Social accounts
router.get('/accounts', auth, getAccounts);

// Instagram OAuth
router.get('/instagram/auth', auth, instagramAuth);
router.get('/instagram/callback', instagramCallback);

// TikTok OAuth
router.get('/tiktok/auth', auth, tiktokAuth);
router.get('/tiktok/callback', tiktokCallback);

// LinkedIn OAuth
router.get('/linkedin/auth', auth, linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);

// X (Twitter) OAuth
router.get('/x/auth', auth, xAuth);
router.get('/x/callback', xCallback);

// Posts
router.post('/posts', auth, createPost);
router.get('/posts', auth, getPosts);
router.get('/posts/:postId/comments', auth, getComments);
router.post('/comments/:commentId/reply', auth, replyToComment);

// Analytics
router.get('/analytics', auth, getAnalytics);

module.exports = router;
