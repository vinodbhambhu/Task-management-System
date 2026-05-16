const mongoose = require('mongoose');

// A Class is e.g. "Grade 10"
const classSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// A Section is e.g. "Grade 10 – Section A", belonging to a Class
const sectionSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    class:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    students:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Compound unique: same section name can't appear twice in same class
sectionSchema.index({ name: 1, class: 1 }, { unique: true });

const Class   = mongoose.model('Class',   classSchema);
const Section = mongoose.model('Section', sectionSchema);

module.exports = { Class, Section };