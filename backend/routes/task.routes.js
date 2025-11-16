const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/task.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/', auth, getTasks);
router.post('/', auth, createTask);
router.put('/:taskId', auth, updateTask);
router.delete('/:taskId', auth, deleteTask);

module.exports = router;
