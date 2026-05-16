const Submission = require('../models/Submission');
const Task = require('../models/Task');
const { cloudinary } = require('../utils/cloudinary');

// POST /api/submissions  (student)
const createSubmission = async (req, res) => {
  const { taskId, note } = req.body;
  if (!taskId) return res.status(400).json({ message: 'taskId required' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'At least one file required' });

  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!task.isActive) return res.status(400).json({ message: 'Task is no longer active' });

  // Check student is in one of the task's sections
  if (!task.sections.some((s) => s.toString() === req.user.section?.toString())) {
    return res.status(403).json({ message: 'This task is not assigned to your section' });
  }

  // Check for duplicate submission
  const existing = await Submission.findOne({ task: taskId, student: req.user._id });
  if (existing) return res.status(409).json({ message: 'Already submitted. Use update endpoint.' });

  const isLate = new Date() > new Date(task.dueDate);
  const files = req.files.map((f) => ({
    url:          f.path,
    originalName: f.originalname,
    resourceType: f.mimetype.startsWith('image/') ? 'image' : 'raw',
    publicId:     f.filename,
  }));

  const submission = await Submission.create({
    task:     taskId,
    student:  req.user._id,
    section:  req.user.section,
    files,
    note:     note || '',
    isLate,
    submittedAt: new Date(),
  });

  await submission.populate([
    { path: 'task', select: 'title dueDate' },
    { path: 'student', select: 'name email' },
  ]);

  res.status(201).json(submission);
};

// GET /api/submissions  (teacher: filter by task; student: own submissions)
const getSubmissions = async (req, res) => {
  const { taskId, studentId } = req.query;
  const { user } = req;

  let filter = {};

  if (user.role === 'teacher') {
    // Verify task belongs to this teacher
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, teacher: user._id });
      if (!task) return res.status(403).json({ message: 'Not your task' });
      filter.task = taskId;
    } else {
      // All submissions for all teacher's tasks
      const myTasks = await Task.find({ teacher: user._id }).select('_id');
      filter.task = { $in: myTasks.map((t) => t._id) };
    }
    if (studentId) filter.student = studentId;
  } else if (user.role === 'student') {
    filter.student = user._id;
    if (taskId) filter.task = taskId;
  }

  const submissions = await Submission.find(filter)
    .populate('task', 'title dueDate')
    .populate('student', 'name email')
    .populate('section', 'name')
    .sort({ createdAt: -1 });

  res.json(submissions);
};

// GET /api/submissions/:id
const getSubmission = async (req, res) => {
  const sub = await Submission.findById(req.params.id)
    .populate('task')
    .populate('student', 'name email')
    .populate('section', 'name');

  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  // Auth check: student can only see their own
  if (req.user.role === 'student' && sub.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your submission' });
  }

  res.json(sub);
};

// PATCH /api/submissions/:id/grade  (teacher)
const gradeSubmission = async (req, res) => {
  const { grade, feedback } = req.body;
  if (grade === undefined) return res.status(400).json({ message: 'grade required' });
  if (grade < 0 || grade > 100) return res.status(400).json({ message: 'grade must be 0-100' });

  const sub = await Submission.findById(req.params.id).populate('task');
  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  // Verify teacher owns the task
  if (sub.task.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your task' });
  }

  sub.grade    = grade;
  sub.feedback = feedback || '';
  sub.status   = 'graded';
  await sub.save();

  res.json(sub);
};

// DELETE /api/submissions/:id  (student can retract before due date)
const deleteSubmission = async (req, res) => {
  const sub = await Submission.findById(req.params.id).populate('task');
  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  if (sub.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your submission' });
  }
  if (new Date() > new Date(sub.task.dueDate)) {
    return res.status(400).json({ message: 'Cannot delete after due date' });
  }

  // Delete files from Cloudinary
  await Promise.all(
    sub.files.map((f) => f.publicId ? cloudinary.uploader.destroy(f.publicId) : Promise.resolve())
  );

  await sub.deleteOne();
  res.json({ message: 'Submission deleted' });
};

module.exports = { createSubmission, getSubmissions, getSubmission, gradeSubmission, deleteSubmission };