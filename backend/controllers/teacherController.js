const { Class } = require('../models/Class');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const User = require('../models/User');

// GET /api/teacher/stats
const getStats = async (req, res) => {
  const [taskCount, totalStudents] = await Promise.all([
    Task.countDocuments({ teacher: req.user._id, isActive: true }),
    User.countDocuments({ role: 'student', status: 'approved' }),
  ]);

  const myTasks = await Task.find({ teacher: req.user._id }).select('_id');
  const submissionCount = await Submission.countDocuments({
    task: { $in: myTasks.map((t) => t._id) },
  });

  res.json({
    activeTasks:  taskCount,
    totalStudents,
    totalSubmissions: submissionCount,
  });
};

module.exports = { getStats };