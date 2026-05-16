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
router.post('/',    authorize('student'), upload.array('files', 5), createSubmission);
router.patch('/:id/grade',  authorize('teacher'), gradeSubmission);
router.delete('/:id',       authorize('student'), deleteSubmission);

module.exports = router;