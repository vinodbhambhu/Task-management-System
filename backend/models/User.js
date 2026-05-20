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
    // Student-specific: which class they belong to
    class:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    // Teacher-specific: subject they teach
    subject:  { type: String, trim: true, default: '' },
    // Teacher-specific: classes assigned to teach
    classes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
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