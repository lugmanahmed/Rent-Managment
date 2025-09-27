const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'partial', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check', 'online', 'other'],
    required: true
  },
  reference: {
    type: String, // Transaction reference, check number, etc.
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  lateFee: {
    amount: { type: Number, default: 0 },
    appliedDate: { type: Date }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String } // receipt, check_image, etc.
  }]
}, {
  timestamps: true
});

// Virtual for days overdue
paymentSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'overdue') return 0;
  const now = new Date();
  const diffTime = now - this.dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
paymentSchema.index({ tenant: 1, dueDate: -1 });
paymentSchema.index({ property: 1, dueDate: -1 });
paymentSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
