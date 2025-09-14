const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password_hash: {
    type: String,
    required: true
  },
  
  // Balance & Points
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // VIP/Membership Information
  membership: {
    type: String,
    enum: ['FREE', 'VIP', 'PREMIUM'],
    default: 'FREE'
  },
  membership_expiry: {
    type: Date
  },
  vip_status: {
    type: String,
    enum: ['active', 'expired', 'never'],
    default: 'never'
  },
  vip_expiry: {
    type: Date
  },
  vip_package_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VipPackage'
  },
  vip_history: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VipPackage'
  }],
  
  // Item Owned System (NEW)
  items: {
    type: [String],
    default: []
  },
  item_sources: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Legacy fields (optional, for backward compatibility)
  owned_games: {
    type: [String],
    default: []
  },
  owned_avatars: {
    type: [String],
    default: []
  },
  owned_frames: {
    type: [String],
    default: []
  },
  
  // Profile Information
  display_name: {
    type: String,
    maxlength: 100
  },
  avatar_url: {
    type: String
  },
  frame_id: {
    type: String
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'banned', 'suspended'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['user', 'vip', 'admin', 'moderator'],
    default: 'user'
  },
  
  // Session & Security
  last_login: {
    type: Date
  },
  last_device: {
    type: String
  },
  failed_login_attempts: {
    type: Number,
    default: 0
  },
  locked_until: {
    type: Date
  },
  
  // Refresh tokens for tracking
  refresh_tokens: [{
    token: String,
    created_at: Date,
    expires_at: Date,
    device_info: String
  }]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ vip_status: 1, vip_expiry: 1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ created_at: -1 });
userSchema.index({ items: 1 });

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  } catch (error) {
    return false;
  }
};

userSchema.methods.hashPassword = async function(password) {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  this.password_hash = await bcrypt.hash(password, saltRounds);
};

userSchema.methods.isVipActive = function() {
  return this.vip_status === 'active' && 
         this.vip_expiry && 
         this.vip_expiry > new Date();
};

userSchema.methods.checkVipExpiry = function() {
  if (this.vip_status === 'active' && this.vip_expiry) {
    if (this.vip_expiry <= new Date()) {
      this.vip_status = 'expired';
      return true; // Changed
    }
  }
  return false; // No change
};

userSchema.methods.checkMembershipExpiry = function() {
  if (this.membership !== 'FREE' && this.membership_expiry) {
    if (this.membership_expiry <= new Date()) {
      this.membership = 'FREE';
      this.membership_expiry = null;
      return true; // Changed
    }
  }
  return false; // No change
};

userSchema.methods.hasItem = function(itemId) {
  return this.items.includes(itemId);
};

userSchema.methods.getItemSource = function(itemId) {
  return this.item_sources.get(itemId);
};

userSchema.methods.addItem = function(itemId, source) {
  if (!this.items.includes(itemId)) {
    this.items.push(itemId);
    this.item_sources.set(itemId, source);
    return true;
  }
  return false;
};

userSchema.methods.removeItem = function(itemId) {
  const index = this.items.indexOf(itemId);
  if (index > -1) {
    this.items.splice(index, 1);
    this.item_sources.delete(itemId);
    return true;
  }
  return false;
};

userSchema.methods.getActiveItems = function() {
  // Filter items based on VIP status for vip_sub sourced items
  if (this.vip_status !== 'active') {
    return this.items.filter(itemId => {
      const source = this.item_sources.get(itemId);
      return source !== 'vip_sub';
    });
  }
  return this.items;
};

userSchema.methods.incrementFailedLogin = function() {
  this.failed_login_attempts++;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failed_login_attempts >= 5) {
    const lockDuration = 30 * 60 * 1000; // 30 minutes
    this.locked_until = new Date(Date.now() + lockDuration);
  }
};

userSchema.methods.resetFailedLogin = function() {
  this.failed_login_attempts = 0;
  this.locked_until = null;
};

userSchema.methods.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.refresh_tokens;
  delete obj.__v;
  
  // Convert Map to Object for JSON serialization
  if (obj.item_sources instanceof Map) {
    obj.item_sources = Object.fromEntries(obj.item_sources);
  }
  
  return obj;
};

// Statics
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

userSchema.statics.findVipUsers = function() {
  return this.find({ 
    vip_status: 'active',
    vip_expiry: { $gt: new Date() }
  });
};

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Check and update VIP expiry
  if (this.checkVipExpiry()) {
    // VIP expired, update role if needed
    if (this.role === 'vip') {
      this.role = 'user';
    }
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
