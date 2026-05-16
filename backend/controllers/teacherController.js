const { Section } = require('../models/Class');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const User = require('../models/User');

// GET /api/teacher/sections  — sections assigned to this teacher
const getMySections = async (req, res) => {
  const sections = await Section.find({ teacher: req.user._id })
    .populate('class', 'name')
    .populate('students', 'name email');
  res.json(sections);
};

// GET /api/teacher/stats
const getStats = async (req, res) => {
  const mySections = await Section.find({ teacher: req.user._id });
  const sectionIds = mySections.map((s) => s._id);

  const [taskCount, totalStudents] = await Promise.all([
    Task.countDocuments({ teacher: req.user._id, isActive: true }),
    Section.aggregate([
      { $match: { teacher: req.user._id } },
      { $project: { count: { $size: '$students' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]),
  ]);

  const myTasks = await Task.find({ teacher: req.user._id }).select('_id');
  const submissionCount = await Submission.countDocuments({
    task: { $in: myTasks.map((t) => t._id) },
  });

  res.json({
    activeTasks:  taskCount,
    totalStudents: totalStudents[0]?.total || 0,
    totalSubmissions: submissionCount,
    totalSections: mySections.length,
  });
};

// GET /api/teacher/sections/:id/students
const getSectionStudents = async (req, res) => {
  const section = await Section.findOne({ _id: req.params.id, teacher: req.user._id })
    .populate('students', 'name email createdAt');
  if (!section) return res.status(404).json({ message: 'Section not found or not yours' });
  res.json(section.students);
};

module.exports = { getMySections, getStats, getSectionStudents };