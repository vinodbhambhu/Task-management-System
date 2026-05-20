const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { Class } = require('../models/Class');

router.use(protect, authorize('student'));

// GET /api/student/my-class
router.get('/my-class', async (req, res) => {
  if (!req.user.class) return res.json(null);
  const cls = await Class.findById(req.user.class);
  res.json(cls);
});

module.exports = router;