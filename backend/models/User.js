const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['admin', 'teacher', 'student'], required: true },
    // 'pending' → waiting for admin approval (teachers only)
    // 'approved' → active user
    // 'rejected' / 'inactive' → blocked
    status:   { type: String, enum: ['pending', 'approved', 'rejected', 'inactive'], default: 'pending' },
    // Student-specific: which section they belong to
    section:  { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
    // Teacher-specific: profile info
    subject:  { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Don't return password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);