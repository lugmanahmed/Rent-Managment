const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant'
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'cosmetic', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
    default: 'pending'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
  assignedVendor: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  assignedTechnician: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true }
  },
  photos: [{
    url: { type: String, required: true },
    caption: { type: String }
  }],
  notes: [{
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for days since request
maintenanceRequestSchema.virtual('daysSinceRequest').get(function() {
  const now = new Date();
  const diffTime = now - this.requestedDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
maintenanceRequestSchema.index({ property: 1, status: 1 });
maintenanceRequestSchema.index({ priority: 1, status: 1 });
maintenanceRequestSchema.index({ requestedDate: -1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
