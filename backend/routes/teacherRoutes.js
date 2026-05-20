const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/teacherController');

router.use(protect, authorize('teacher'));

router.get('/stats', getStats);

module.exports = router;