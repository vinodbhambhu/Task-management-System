const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ role: 'admin' });
    if (exists) return;

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
    await User.create({
      name:     process.env.ADMIN_NAME     || 'Super Admin',
      email:    process.env.ADMIN_EMAIL    || 'admin@school.edu',
      password: hashed,
      role:     'admin',
      status:   'approved',
    });
    console.log('Default admin created:', process.env.ADMIN_EMAIL);
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

module.exports = seedAdmin;