const User = require('../models/User');
const { Class, Section } = require('../models/Class');
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
  const users = await User.find(filter).populate('section', 'name').sort({ createdAt: -1 });
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
  // Attach section counts
  const withCounts = await Promise.all(classes.map(async (c) => {
    const sectionCount = await Section.countDocuments({ class: c._id });
    const studentCount = await Section.aggregate([
      { $match: { class: c._id } },
      { $project: { count: { $size: '$students' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);
    return {
      ...c.toObject(),
      sectionCount,
      studentCount: studentCount[0]?.total || 0,
    };
  }));
  res.json(withCounts);
};

// POST /api/admin/sections
const createSection = async (req, res) => {
  const { name, classId, teacherId } = req.body;
  if (!name || !classId) return res.status(400).json({ message: 'Name and classId required' });

  const cls = await Class.findById(classId);
  if (!cls) return res.status(404).json({ message: 'Class not found' });

  const section = await Section.create({ name, class: classId, teacher: teacherId || null });

  // If teacher assigned, update their section reference (optional back-ref)
  if (teacherId) {
    await ActivityLog.create({
      actor: req.user._id, actorName: req.user.name,
      action: 'Section created', category: 'class',
      details: `${cls.name} – ${name}`,
    });
  }

  await section.populate(['class', { path: 'teacher', select: 'name email' }]);
  res.status(201).json(section);
};

// GET /api/admin/sections
const getSections = async (req, res) => {
  const { classId } = req.query;
  const filter = classId ? { class: classId } : {};
  const sections = await Section.find(filter)
    .populate('class', 'name')
    .populate('teacher', 'name email')
    .sort({ createdAt: -1 });
  res.json(sections);
};

// PATCH /api/admin/sections/:id/assign-teacher
const assignTeacher = async (req, res) => {
  const { teacherId } = req.body;
  const section = await Section.findByIdAndUpdate(
    req.params.id,
    { teacher: teacherId },
    { new: true }
  ).populate('teacher', 'name email').populate('class', 'name');

  if (!section) return res.status(404).json({ message: 'Section not found' });
  res.json(section);
};

// PATCH /api/admin/sections/:id/add-student
const addStudentToSection = async (req, res) => {
  const { studentId } = req.body;
  const student = await User.findById(studentId);
  if (!student || student.role !== 'student') return res.status(400).json({ message: 'Invalid student' });

  const section = await Section.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { students: studentId } },
    { new: true }
  );
  if (!section) return res.status(404).json({ message: 'Section not found' });

  // Update student's section reference
  await User.findByIdAndUpdate(studentId, { section: req.params.id });

  res.json(section);
};

// GET /api/admin/logs
const getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(logs);
};

module.exports = {
  getStats, getPendingTeachers, updateUserStatus, getAllUsers, deleteUser,
  createClass, getClasses, createSection, getSections, assignTeacher,
  addStudentToSection, getActivityLogs,
};