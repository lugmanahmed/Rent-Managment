const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalUnit',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentType',
    required: true
  },
  paymentMode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMode',
    required: true
  },
  paidDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paidBy: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  mobileNo: {
    type: String,
    trim: true,
    maxlength: 20
  },
  blazNo: {
    type: String,
    trim: true,
    maxlength: 50
  },
  accountName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  accountNo: {
    type: String,
    trim: true,
    maxlength: 50
  },
  bank: {
    type: String,
    trim: true,
    maxlength: 100
  },
  chequeNo: {
    type: String,
    trim: true,
    maxlength: 50
  },
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
    required: true
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
paymentRecordSchema.index({ unitId: 1 });
paymentRecordSchema.index({ paidDate: -1 });
paymentRecordSchema.index({ paymentType: 1 });
paymentRecordSchema.index({ paymentMode: 1 });
paymentRecordSchema.index({ currency: 1 });
paymentRecordSchema.index({ paidBy: 1 });
paymentRecordSchema.index({ isActive: 1 });

// Virtual for formatted amount with currency
paymentRecordSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(2)} ${this.currency?.code || ''}`;
});

// Virtual for payment details summary
paymentRecordSchema.virtual('paymentSummary').get(function() {
  return `${this.paymentType?.name || ''} - ${this.paymentMode?.name || ''}`;
});

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
