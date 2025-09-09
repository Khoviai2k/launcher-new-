const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: ['payment', 'vip_purchase', 'gift_redeem', 'points_conversion', 'item_purchase'],
    required: true
  },
  
  amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'VND'
  },
  
  // SePay specific fields
  sepay_id: {
    type: Number,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  
  gateway: {
    type: String // e.g., 'Vietcombank', 'MBBank'
  },
  
  reference_code: {
    type: String
  },
  
  transfer_content: {
    type: String // Contains username for parsing
  },
  
  // Transaction status with idempotency support
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    required: true
  },
  
  // Balance tracking
  balance_before: {
    type: Number
  },
  
  balance_after: {
    type: Number
  },
  
  points_before: {
    type: Number
  },
  
  points_after: {
    type: Number
  },
  
  // Metadata for various transaction types
  metadata: {
    vip_package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VipPackage'
    },
    gift_code_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiftCode'
    },
    item_id: String,
    conversion_rate: Number,
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    error_message: String,
    webhook_data: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  transaction_date: {
    type: Date // SePay provided timestamp
  },
  
  // For idempotency tracking
  idempotency_key: {
    type: String,
    unique: true,
    sparse: true
  },
  
  processed_at: {
    type: Date
  },
  
  // For webhook retry handling
  webhook_attempts: {
    type: Number,
    default: 0
  },
  
  last_webhook_at: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes
transactionSchema.index({ sepay_id: 1 }, { unique: true, sparse: true });
transactionSchema.index({ user_id: 1, created_at: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ reference_code: 1 });
transactionSchema.index({ transaction_date: -1 });
transactionSchema.index({ idempotency_key: 1 }, { unique: true, sparse: true });

// Methods
transactionSchema.methods.isProcessing = function() {
  return this.status === 'processing';
};

transactionSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

transactionSchema.methods.isFailed = function() {
  return this.status === 'failed';
};

transactionSchema.methods.canProcess = function() {
  return this.status === 'pending';
};

transactionSchema.methods.markAsProcessing = function() {
  if (this.canProcess()) {
    this.status = 'processing';
    this.processed_at = new Date();
    return true;
  }
  return false;
};

transactionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.processed_at = this.processed_at || new Date();
  return true;
};

transactionSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  if (errorMessage) {
    this.metadata = this.metadata || {};
    this.metadata.error_message = errorMessage;
  }
  return true;
};

transactionSchema.methods.incrementWebhookAttempt = function() {
  this.webhook_attempts++;
  this.last_webhook_at = new Date();
};

// Statics
transactionSchema.statics.findBySepayId = function(sepayId) {
  return this.findOne({ sepay_id: sepayId });
};

transactionSchema.statics.findByIdempotencyKey = function(key) {
  return this.findOne({ idempotency_key: key });
};

transactionSchema.statics.findUserTransactions = function(userId, options = {}) {
  const query = { user_id: userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  let mongoQuery = this.find(query);
  
  if (options.startDate || options.endDate) {
    query.created_at = {};
    if (options.startDate) {
      query.created_at.$gte = options.startDate;
    }
    if (options.endDate) {
      query.created_at.$lte = options.endDate;
    }
  }
  
  if (options.limit) {
    mongoQuery = mongoQuery.limit(options.limit);
  }
  
  if (options.skip) {
    mongoQuery = mongoQuery.skip(options.skip);
  }
  
  return mongoQuery.sort({ created_at: -1 });
};

transactionSchema.statics.createPaymentTransaction = async function(data) {
  const transaction = new this({
    user_id: data.user_id,
    type: 'payment',
    amount: data.amount,
    currency: data.currency || 'VND',
    sepay_id: data.sepay_id,
    gateway: data.gateway,
    reference_code: data.reference_code,
    transfer_content: data.transfer_content,
    status: 'pending',
    transaction_date: data.transaction_date,
    idempotency_key: data.sepay_id ? `sepay_${data.sepay_id}` : undefined
  });
  
  return transaction.save();
};

// Virtual for formatted amount
transactionSchema.virtual('formatted_amount').get(function() {
  if (this.currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(this.amount);
  }
  return `${this.amount} ${this.currency}`;
});

// Ensure virtual fields are included in JSON
transactionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
