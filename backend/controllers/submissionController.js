const Submission = require('../models/Submission');
const Task = require('../models/Task');
const { cloudinary } = require('../utils/cloudinary');

// POST /api/submissions  (student)
const createSubmission = async (req, res) => {
  try {
    console.log('📨 Submission request received');
    console.log('Files:', req.files?.length || 0);
    console.log('Body:', req.body);

    const { taskId, note } = req.body;
    if (!taskId) {
      console.log('❌ Missing taskId');
      return res.status(400).json({ message: 'taskId required' });
    }
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({ message: 'At least one file required' });
    }

    console.log('🔍 Looking for task:', taskId);
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('❌ Task not found');
      return res.status(404).json({ message: 'Task not found' });
    }
    
    console.log('✅ Task found:', task.title);
    
    if (!task.isActive) {
      console.log('❌ Task not active');
      return res.status(400).json({ message: 'Task is no longer active' });
    }

    console.log('🔍 Student section:', req.user.section);
    console.log('Task sections:', task.sections);
    
    // Check student is in one of the task's sections
    if (!task.sections.some((s) => s.toString() === req.user.section?.toString())) {
      console.log('❌ Section mismatch');
      return res.status(403).json({ message: 'This task is not assigned to your section' });
    }

    console.log('🔍 Checking for existing submission');
    // Check for duplicate submission
    const existing = await Submission.findOne({ task: taskId, student: req.user._id });
    if (existing) {
      console.log('❌ Already submitted');
      return res.status(409).json({ message: 'Already submitted. Use update endpoint.' });
    }

    const isLate = new Date() > new Date(task.dueDate);
    console.log('📅 Is late:', isLate);
    
    const files = req.files.map((f) => ({
      url:          f.path || `/uploads/${f.filename}`, // Local path or Cloudinary URL
      originalName: f.originalname,
      resourceType: f.mimetype.startsWith('image/') ? 'image' : 'raw',
      publicId:     f.filename,
    }));

    console.log('💾 Creating submission in DB');
    const submission = await Submission.create({
      task:     taskId,
      student:  req.user._id,
      section:  req.user.section,
      files,
      note:     note || '',
      isLate,
      submittedAt: new Date(),
    });

    console.log('✅ Submission created:', submission._id);
    
    await submission.populate([
      { path: 'task', select: 'title dueDate' },
      { path: 'student', select: 'name email' },
    ]);

    console.log('✅ Submission response sent');
    res.status(201).json(submission);
  } catch (err) {
    console.error('🚨 Submission error:', err.message);
    res.status(500).json({ message: 'Submission failed', error: err.message });
  }
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