const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');
const { createTask, getTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);

router.get('/',     authorize('teacher', 'student'), getTasks);
router.get('/:id',  authorize('teacher', 'student'), getTask);
router.post('/',    authorize('teacher'), upload.array('attachments', 5), createTask);
router.patch('/:id', authorize('teacher'), updateTask);
router.delete('/:id', authorize('teacher'), deleteTask);

module.exports = router;