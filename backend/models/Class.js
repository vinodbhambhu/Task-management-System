const mongoose = require('mongoose');

// A Class is e.g. "Grade 10"
const classSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    subject:     { type: String, trim: true, default: '' }, // e.g. "Mathematics", "English"
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Class = mongoose.model('Class', classSchema);

module.exports = { Class };