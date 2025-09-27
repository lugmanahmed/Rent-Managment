const mongoose = require('mongoose');

const paymentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  sortOrder: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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
paymentTypeSchema.index({ sortOrder: 1 });
paymentTypeSchema.index({ name: 1 });
paymentTypeSchema.index({ isActive: 1 });

// Virtual for display name
paymentTypeSchema.virtual('displayName').get(function() {
  return this.name;
});

// Pre-save middleware to ensure unique sort order
paymentTypeSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('sortOrder')) {
    // Check if another payment type has the same sort order
    const existing = await this.constructor.findOne({
      sortOrder: this.sortOrder,
      _id: { $ne: this._id }
    });
    
    if (existing) {
      // Increment sort order for the new item
      this.sortOrder = await this.constructor.countDocuments() + 1;
    }
  }
  next();
});

module.exports = mongoose.model('PaymentType', paymentTypeSchema);
