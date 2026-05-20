const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStats, getPendingTeachers, updateUserStatus, getAllUsers, deleteUser,
  createClass, getClasses, assignClassToStudent, getActivityLogs,
  assignTeacherSubject, assignTeacherClasses, getTeacher,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats',              getStats);
router.get('/pending-teachers',   getPendingTeachers);
router.get('/users',              getAllUsers);
router.delete('/users/:id',       deleteUser);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/assign-class', assignClassToStudent);
router.get('/classes',            getClasses);
router.post('/classes',           createClass);
router.get('/logs',               getActivityLogs);

// Teacher management
router.get('/teachers/:id',           getTeacher);
router.patch('/teachers/:id/subject', assignTeacherSubject);
router.patch('/teachers/:id/classes', assignTeacherClasses);

module.exports = router;