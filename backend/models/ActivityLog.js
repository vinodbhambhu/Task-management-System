const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String },
    action:  { type: String, required: true },
    details: { type: String, default: '' },
    category: {
      type: String,
      enum: ['auth', 'user', 'task', 'submission', 'class'],
      default: 'user',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);