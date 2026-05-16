const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { Section } = require('../models/Class');

router.use(protect, authorize('student'));

// GET /api/student/my-section
router.get('/my-section', async (req, res) => {
  if (!req.user.section) return res.json(null);
  const section = await Section.findById(req.user.section)
    .populate('class', 'name')
    .populate('teacher', 'name email');
  res.json(section);
});

module.exports = router;