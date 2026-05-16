const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStats, getPendingTeachers, updateUserStatus, getAllUsers, deleteUser,
  createClass, getClasses, createSection, getSections, assignTeacher,
  addStudentToSection, getActivityLogs,
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats',              getStats);
router.get('/pending-teachers',   getPendingTeachers);
router.get('/users',              getAllUsers);
router.delete('/users/:id',       deleteUser);
router.patch('/users/:id/status', updateUserStatus);
router.get('/classes',            getClasses);
router.post('/classes',           createClass);
router.get('/sections',           getSections);
router.post('/sections',          createSection);
router.patch('/sections/:id/assign-teacher',  assignTeacher);
router.patch('/sections/:id/add-student',     addStudentToSection);
router.get('/logs',               getActivityLogs);

module.exports = router;