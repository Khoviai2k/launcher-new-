const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  is_free: {
    type: Boolean,
    default: false
  },
  requires_vip: {
    type: Boolean,
    default: true
  },
  free_until: {
    type: Date,
    default: null
  },
  steam_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  stats: {
    downloads: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
gameSchema.index({ requires_vip: 1, is_free: 1 });
gameSchema.index({ free_until: 1 });
gameSchema.index({ name: 'text' });

module.exports = mongoose.model('Game', gameSchema);