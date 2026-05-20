const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role, subject } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Role must be teacher or student' });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const status = role === 'teacher' ? 'pending' : 'approved';

  const user = await User.create({ name, email, password: hashed, role, status, subject });

  await ActivityLog.create({
    actor: user._id, actorName: user.name,
    action: `${role} registered`,
    category: 'auth',
    details: role === 'teacher' ? 'Awaiting admin approval' : 'Auto-approved',
  });

  if (role === 'teacher') {
    return res.status(201).json({
      message: 'Registration successful. Awaiting admin approval.',
      user,
    });
  }

  const token = generateToken(user._id);
  console.log('✅ Student registered:', email);
  console.log('🔐 Generated token:', token.substring(0, 20) + '...');
  
  res.status(201).json({ token, user });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.status === 'pending') {
    return res.status(403).json({ message: 'Account pending admin approval' });
  }
  if (user.status === 'rejected') {
    return res.status(403).json({ message: 'Account has been rejected' });
  }
  if (user.status === 'inactive') {
    return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
  }

  const token = generateToken(user._id);
  console.log('✅ Login successful:', email);
  console.log('🔐 Generated token:', token.substring(0, 20) + '...');
  
  res.json({ token, user });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, getMe };