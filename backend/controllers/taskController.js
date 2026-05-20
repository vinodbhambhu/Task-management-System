const Task = require('../models/Task');
const { Class } = require('../models/Class');
const Submission = require('../models/Submission');

// POST /api/tasks  (teacher)
const createTask = async (req, res) => {
  const { title, description, classIds, dueDate, allowedTypes, maxFileSize } = req.body;

  if (!title || !description || !classIds || !dueDate) {
    return res.status(400).json({ message: 'title, description, classIds, dueDate required' });
  }

  const classes = Array.isArray(classIds) ? classIds : JSON.parse(classIds);

  // Verify classes exist
  const validClasses = await Class.find({
    _id: { $in: classes },
  });
  if (validClasses.length === 0) {
    return res.status(404).json({ message: 'No valid classes found' });
  }

  const attachments = req.files ? req.files.map((f) => ({
    url:          f.path || `/uploads/${f.filename}`, // Local path or Cloudinary URL
    originalName: f.originalname,
    resourceType: f.mimetype.startsWith('image/') ? 'image' : 'raw',
  })) : [];

  const task = await Task.create({
    title,
    description,
    teacher:      req.user._id,
    classes:      validClasses.map((c) => c._id),
    dueDate:      new Date(dueDate),
    allowedTypes: allowedTypes ? JSON.parse(allowedTypes) : ['image', 'pdf', 'doc', 'docx'],
    maxFileSize:  maxFileSize || 10,
    attachments,
  });

  await task.populate([
    { path: 'teacher', select: 'name email' },
    { path: 'classes', select: 'name' },
  ]);

  res.status(201).json(task);
};

// GET /api/tasks  (teacher sees their own; student sees tasks for their class)
const getTasks = async (req, res) => {
  const { user } = req;
  let tasks;

  if (user.role === 'teacher') {
    tasks = await Task.find({ teacher: user._id })
      .populate('classes', 'name')
      .sort({ createdAt: -1 });

    // Add submission counts
    tasks = await Promise.all(tasks.map(async (t) => {
      const submissionCount = await Submission.countDocuments({ task: t._id });
      return { ...t.toObject(), submissionCount };
    }));
  } else if (user.role === 'student') {
    if (!user.class) return res.json([]);
    tasks = await Task.find({ classes: user.class, isActive: true })
      .populate('teacher', 'name')
      .populate('classes', 'name')
      .sort({ dueDate: 1 });

    // Add submission status for this student
    tasks = await Promise.all(tasks.map(async (t) => {
      const submission = await Submission.findOne({ task: t._id, student: user._id });
      return {
        ...t.toObject(),
        mySubmission: submission || null,
        isLate: new Date() > new Date(t.dueDate),
      };
    }));
  }

  res.json(tasks);
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('teacher', 'name email')
    .populate('classes', 'name');

  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
};

// PATCH /api/tasks/:id  (teacher only)
const updateTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found or not yours' });

  const { title, description, dueDate, isActive, allowedTypes } = req.body;
  if (title)        task.title = title;
  if (description)  task.description = description;
  if (dueDate)      task.dueDate = new Date(dueDate);
  if (isActive !== undefined) task.isActive = isActive;
  if (allowedTypes) task.allowedTypes = allowedTypes;

  await task.save();
  res.json(task);
};

// DELETE /api/tasks/:id  (teacher only)
const deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found or not yours' });
  res.json({ message: 'Task deleted' });
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask };