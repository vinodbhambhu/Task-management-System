const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');
const {
  createSubmission, getSubmissions, getSubmission, gradeSubmission, deleteSubmission,
} = require('../controllers/submissionController');

router.use(protect);

router.get('/',     authorize('teacher', 'student'), getSubmissions);
router.get('/:id',  authorize('teacher', 'student'), getSubmission);

// Upload middleware with timeout and error handling
router.post('/', authorize('student'), (req, res, next) => {
  console.log('📤 POST /submissions route hit');
  
  // Set request timeout to 2 minutes for Cloudinary uploads
  const timeout = setTimeout(() => {
    console.error('⏱️  Upload timeout - Cloudinary took too long');
    res.status(408).json({ message: 'File upload timeout. Please try again.' });
  }, 120000);

  upload.array('files', 5)(req, res, (err) => {
    clearTimeout(timeout);
    
    if (err) {
      console.error('❌ Upload error:', err.message);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    
    console.log('✅ Files uploaded to Cloudinary:', req.files?.length || 0);
    if (req.files && req.files.length > 0) {
      console.log('📍 First file path:', req.files[0].path);
    }
    next();
  });
}, createSubmission);

router.patch('/:id/grade',  authorize('teacher'), gradeSubmission);
router.delete('/:id',       authorize('student'), deleteSubmission);

module.exports = router;