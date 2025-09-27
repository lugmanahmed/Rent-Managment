const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: 3,
    minlength: 3
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10
  },
  sortOrder: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  decimalPlaces: {
    type: Number,
    default: 2,
    min: 0,
    max: 4
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
currencySchema.index({ sortOrder: 1 });
currencySchema.index({ code: 1 });
currencySchema.index({ isActive: 1 });
currencySchema.index({ isDefault: 1 });

// Virtual for display name
currencySchema.virtual('displayName').get(function() {
  return `${this.name} (${this.code})`;
});

// Pre-save middleware to ensure unique sort order and only one default currency
currencySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('sortOrder')) {
    // Check if another currency has the same sort order
    const existing = await this.constructor.findOne({
      sortOrder: this.sortOrder,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      // Increment sort order for the new item
      this.sortOrder = await this.constructor.countDocuments() + 1;
    }
  }

  // Ensure only one default currency
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }

  next();
});

module.exports = mongoose.model('Currency', currencySchema);
