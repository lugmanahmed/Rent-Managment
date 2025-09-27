const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: [
      'AC',
      'Fridge',
      'Sofa',
      'TV',
      'Washing Machine',
      'Microwave',
      'Dining Table',
      'Bed',
      'Wardrobe',
      'Chair',
      'Fan',
      'Water Heater',
      'Stove',
      'Dishwasher',
      'Coffee Maker',
      'Other'
    ],
    default: 'Other'
  },
  icon: {
    type: String,
    default: '📦',
    trim: true
  },
  type: {
    type: String,
    enum: ['fixed', 'movable'],
    default: 'movable'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Cost Information
  purchaseCost: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    enum: ['MVR', 'USD', 'EUR'],
    default: 'MVR'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: 100
  },
  warrantyPeriod: {
    type: Number, // in months
    min: 0,
    default: 0
  },
  // Depreciation Information
  depreciationMethod: {
    type: String,
    enum: ['straight_line', 'declining_balance', 'none'],
    default: 'straight_line'
  },
  usefulLife: {
    type: Number, // in years
    min: 1,
    default: 5
  },
  salvageValue: {
    type: Number,
    min: 0,
    default: 0
  },
  currentValue: {
    type: Number,
    min: 0,
    default: function() {
      return this.purchaseCost || 0;
    }
  },
  // Status and Condition
  status: {
    type: String,
    enum: ['Working', 'Faulty', 'Repaired', 'Replaced'],
    default: 'Working'
  },
  quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  maintenanceCost: {
    type: Number,
    min: 0,
    default: 0
  },
  // Additional Information
  serialNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  model: {
    type: String,
    trim: true,
    maxlength: 100
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for depreciation calculation
assetSchema.virtual('depreciationPerYear').get(function() {
  if (this.depreciationMethod === 'none') return 0;
  return (this.purchaseCost - this.salvageValue) / this.usefulLife;
});

// Virtual for depreciation per month
assetSchema.virtual('depreciationPerMonth').get(function() {
  return this.depreciationPerYear / 12;
});

// Virtual for age in years
assetSchema.virtual('ageInYears').get(function() {
  const now = new Date();
  const purchase = new Date(this.purchaseDate);
  return Math.floor((now - purchase) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for remaining useful life
assetSchema.virtual('remainingUsefulLife').get(function() {
  return Math.max(0, this.usefulLife - this.ageInYears);
});

// Virtual for calculated current value based on depreciation
assetSchema.virtual('calculatedCurrentValue').get(function() {
  if (this.depreciationMethod === 'none') return this.purchaseCost;
  
  const yearsDepreciated = this.ageInYears;
  const totalDepreciation = this.depreciationPerYear * yearsDepreciated;
  return Math.max(this.salvageValue, this.purchaseCost - totalDepreciation);
});

// Virtual for warranty status
assetSchema.virtual('warrantyStatus').get(function() {
  if (this.warrantyPeriod === 0) return 'no_warranty';
  
  const now = new Date();
  const warrantyEnd = new Date(this.purchaseDate);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + this.warrantyPeriod);
  
  if (now > warrantyEnd) return 'expired';
  return 'active';
});

// Indexes for better performance
assetSchema.index({ name: 'text', description: 'text', brand: 'text', model: 'text' });
assetSchema.index({ type: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ condition: 1 });
assetSchema.index({ createdBy: 1 });

// Pre-save middleware to update current value based on depreciation
assetSchema.pre('save', function(next) {
  // Always ensure currentValue is set
  if (!this.currentValue) {
    this.currentValue = this.purchaseCost || 0;
  }
  
  if (this.isModified('purchaseCost') || this.isModified('purchaseDate') || 
      this.isModified('depreciationMethod') || this.isModified('usefulLife') || 
      this.isModified('salvageValue')) {
    this.currentValue = this.calculatedCurrentValue;
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);