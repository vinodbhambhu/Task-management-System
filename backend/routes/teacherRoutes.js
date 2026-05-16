const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMySections, getStats, getSectionStudents } = require('../controllers/teacherController');

router.use(protect, authorize('teacher'));

router.get('/sections',                    getMySections);
router.get('/stats',                       getStats);
router.get('/sections/:id/students',       getSectionStudents);

module.exports = router;