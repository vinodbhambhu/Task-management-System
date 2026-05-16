const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // A task can target multiple sections
    sections:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
    dueDate:     { type: Date, required: true },
    // Allowed file types students can submit
    allowedTypes: {
      type: [String],
      default: ['image', 'pdf', 'doc', 'docx'],
    },
    maxFileSize: { type: Number, default: 10 }, // MB
    isActive:    { type: Boolean, default: true },
    attachments: [
      {
        url:          String,
        originalName: String,
        resourceType: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);