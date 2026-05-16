const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    task:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task',    required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    files: [
      {
        url:          { type: String, required: true },
        originalName: { type: String, required: true },
        resourceType: { type: String, default: 'raw' }, // 'image' or 'raw'
        publicId:     { type: String }, // Cloudinary public_id for deletion
      },
    ],
    note:     { type: String, default: '' },  // optional student note
    status:   { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
    grade:    { type: Number, min: 0, max: 100, default: null },
    feedback: { type: String, default: '' },
    // Track late submissions
    submittedAt: { type: Date, default: Date.now },
    isLate:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One submission per student per task
submissionSchema.index({ task: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);