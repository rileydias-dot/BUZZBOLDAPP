const express = require('express');
const router = express.Router();
const { getMessages, markAsRead, archiveMessage, starMessage } = require('../controllers/message.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/', auth, getMessages);
router.put('/:messageId/read', auth, markAsRead);
router.put('/:messageId/archive', auth, archiveMessage);
router.put('/:messageId/star', auth, starMessage);

module.exports = router;
