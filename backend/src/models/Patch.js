const mongoose = require('mongoose');

const patchSchema = new mongoose.Schema({
  appid: {
    type: String,
    required: true,
    ref: 'Game'
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  download_url: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: ''
  },
  // Phân loại patch theo gói plan
  patch_type: {
    type: String,
    enum: ['free', 'premium'],
    default: 'premium'
  },
  // Thời gian miễn phí tạm thời (optional)
  free_until: {
    type: Date,
    default: null
  },
  // Thống kê
  stats: {
    downloads: {
      type: Number,
      default: 0
    }
  },
  // Trạng thái
  active: {
    type: Boolean,
    default: true
  },
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
patchSchema.index({ appid: 1, active: 1 });
patchSchema.index({ author: 1 });
patchSchema.index({ updated_at: -1 });
patchSchema.index({ patch_type: 1 });
patchSchema.index({ free_until: 1 });

// Text search
patchSchema.index({ 
  description: 'text',
  author: 'text',
  version: 'text'
});

// Instance methods
patchSchema.methods.isAccessible = function(user) {
  // Nếu patch free thì ai cũng có thể truy cập
  if (this.patch_type === 'free') {
    return true;
  }

  // Nếu có free_until và chưa hết hạn
  if (this.free_until && this.free_until > new Date()) {
    return true;
  }

  // Nếu patch premium, kiểm tra quyền premium của user
  if (this.patch_type === 'premium') {
    if (!user) {
      return false;
    }

    // User phải có quyền premium (VIP hoặc PREMIUM membership)
    return (user.membership === 'VIP' || user.membership === 'PREMIUM') &&
           user.membership_expiry && 
           user.membership_expiry > new Date();
  }

  return false;
};

patchSchema.methods.incrementDownloadCount = function() {
  this.stats.downloads += 1;
  return this.save();
};

// Static methods
patchSchema.statics.findByGameId = function(appid, user = null) {
  const query = {
    appid: appid,
    active: true
  };

  return this.find(query)
    .sort({ sort_order: 1, created_at: -1 })
    .lean();
};

patchSchema.statics.findAccessibleByGameId = function(appid, user = null) {
  const query = {
    appid: appid,
    active: true,
    $or: [
      { patch_type: 'free' },
      { free_until: { $gt: new Date() } }
    ]
  };

  // Nếu user có quyền premium, thêm premium patches vào kết quả
  if (user && (user.membership === 'VIP' || user.membership === 'PREMIUM') && 
      user.membership_expiry && user.membership_expiry > new Date()) {
    query.$or.push({ patch_type: 'premium' });
  }

  return this.find(query)
    .sort({ sort_order: 1, created_at: -1 })
    .lean();
};

// Virtual để backward compatibility
patchSchema.virtual('is_free').get(function() {
  return this.patch_type === 'free';
});

patchSchema.virtual('requires_vip').get(function() {
  return this.patch_type === 'premium';
});

module.exports = mongoose.model('Patch', patchSchema);