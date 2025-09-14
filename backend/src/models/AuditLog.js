const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ip_address: {
    type: String,
    required: false
  },
  user_agent: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true
  },
  resource_type: {
    type: String,
    required: true
  },
  resource_id: {
    type: String,
    required: false
  },
  old_values: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  new_values: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, resource_type: 1 });

// Static methods
auditLogSchema.statics.logUserAction = async function(userId, action, resourceType, resourceId, metadata = {}) {
  try {
    const log = new this({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata
    });
    await log.save();
  } catch (error) {
    console.error('Error logging user action:', error);
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);