const User = require('../models/User');
const { Class } = require('../models/Class');
const ActivityLog = require('../models/ActivityLog');

// GET /api/admin/stats
const getStats = async (req, res) => {
  const [teachers, students, pendingTeachers] = await Promise.all([
    User.countDocuments({ role: 'teacher', status: 'approved' }),
    User.countDocuments({ role: 'student', status: 'approved' }),
    User.countDocuments({ role: 'teacher', status: 'pending' }),
  ]);
  const Task = require('../models/Task');
  const activeTasks = await Task.countDocuments({ isActive: true });
  res.json({ teachers, students, pendingTeachers, activeTasks });
};

// GET /api/admin/pending-teachers
const getPendingTeachers = async (req, res) => {
  const teachers = await User.find({ role: 'teacher', status: 'pending' }).sort({ createdAt: -1 });
  res.json(teachers);
};

// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['approved', 'rejected', 'inactive', 'pending'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });

  await ActivityLog.create({
    actor: req.user._id, actorName: req.user.name,
    action: `${user.role} ${status}`,
    category: 'user',
    details: `${user.name} (${user.email}) status set to ${status}`,
  });

  res.json(user);
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  const { role, status, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const users = await User.find(filter).populate('class', 'name').sort({ createdAt: -1 });
  res.json(users);
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
};

// ─── Classes ────────────────────────────────────────────────────

// POST /api/admin/classes
const createClass = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name required' });

  const cls = await Class.create({ name, description, createdBy: req.user._id });

  await ActivityLog.create({
    actor: req.user._id, actorName: req.user.name,
    action: 'Class created', category: 'class', details: name,
  });

  res.status(201).json(cls);
};

// GET /api/admin/classes
const getClasses = async (req, res) => {
  const classes = await Class.find().sort({ name: 1 });
  // Attach student counts per class
  const withCounts = await Promise.all(classes.map(async (c) => {
    const studentCount = await User.countDocuments({ class: c._id, role: 'student', status: 'approved' });
    return {
      ...c.toObject(),
      studentCount,
    };
  }));
  res.json(withCounts);
};

// PATCH /api/admin/users/:id/assign-class
const assignClassToStudent = async (req, res) => {
  const { classId } = req.body;
  if (!classId) return res.status(400).json({ message: 'classId required' });

  const cls = await Class.findById(classId);
  if (!cls) return res.status(404).json({ message: 'Class not found' });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { class: classId },
    { new: true }
  ).populate('class', 'name');

  if (!user) return res.status(404).json({ message: 'User not found' });

  await ActivityLog.create({
    actor: req.user._id, actorName: req.user.name,
    action: 'Student assigned to class',
    category: 'user',
    details: `${user.name} assigned to ${cls.name}`,
  });

  res.json(user);
};

// GET /api/admin/logs
const getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(logs);
};

// ─── Teachers ──────────────────────────────────────────────────

// PATCH /api/admin/teachers/:id/subject
const assignTeacherSubject = async (req, res) => {
  const { subject } = req.body;
  if (!subject) return res.status(400).json({ message: 'Subject required' });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { subject },
    { new: true }
  ).populate('classes', 'name subject');

  if (!user) return res.status(404).json({ message: 'Teacher not found' });
  if (user.role !== 'teacher') return res.status(400).json({ message: 'User is not a teacher' });

  await ActivityLog.create({
    actor: req.user._id, actorName: req.user.name,
    action: 'Teacher subject assigned',
    category: 'user',
    details: `${user.name} assigned to teach ${subject}`,
  });

  res.json(user);
};

// PATCH /api/admin/teachers/:id/classes
const assignTeacherClasses = async (req, res) => {
  const { classIds } = req.body;
  if (!Array.isArray(classIds)) return res.status(400).json({ message: 'classIds must be an array' });

  // Verify all classes exist
  const classes = await Class.find({ _id: { $in: classIds } });
  if (classes.length !== classIds.length) {
    return res.status(404).json({ message: 'One or more classes not found' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { classes: classIds },
    { new: true }
  ).populate('classes', 'name subject');

  if (!user) return res.status(404).json({ message: 'Teacher not found' });
  if (user.role !== 'teacher') return res.status(400).json({ message: 'User is not a teacher' });

  await ActivityLog.create({
    actor: req.user._id, actorName: req.user.name,
    action: 'Teacher classes assigned',
    category: 'user',
    details: `${user.name} assigned to ${classIds.length} class(es)`,
  });

  res.json(user);
};

// GET /api/admin/teachers/:id
const getTeacher = async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('classes', 'name subject');

  if (!user) return res.status(404).json({ message: 'Teacher not found' });
  if (user.role !== 'teacher') return res.status(400).json({ message: 'User is not a teacher' });

  res.json(user);
};

module.exports = {
  getStats, getPendingTeachers, updateUserStatus, getAllUsers, deleteUser,
  createClass, getClasses, assignClassToStudent, getActivityLogs,
  assignTeacherSubject, assignTeacherClasses, getTeacher,
};