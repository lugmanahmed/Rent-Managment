const mongoose = require('mongoose');

const rentalUnitSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null // null means unit is available
  },
  unitNumber: {
    type: String,
    required: true,
    trim: true
  },
  floorNumber: {
    type: Number,
    required: true,
    min: 1
  },
  unitDetails: {
    numberOfRooms: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 10 
    },
    numberOfToilets: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    squareFeet: { type: Number, min: 0 },
    description: { type: String, trim: true }
  },
  financial: {
    rentAmount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    depositAmount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    currency: { 
      type: String, 
      enum: ['MVR', 'USD', 'EUR'], 
      default: 'MVR' 
    },
    utilities: {
      included: { type: Boolean, default: false },
      details: { type: String }
    }
  },
  assets: [{
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true
    },
    status: {
      type: String,
      enum: ['Working', 'Faulty', 'Repaired', 'Replaced', 'working', 'faulty'],
      default: 'Working'
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'renovation'],
    default: 'available'
  },
  photos: [{
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for unit display name
rentalUnitSchema.virtual('displayName').get(function() {
  return `Unit ${this.unitNumber} - Floor ${this.floorNumber}`;
});

// Index for efficient queries
rentalUnitSchema.index({ property: 1, unitNumber: 1 });
rentalUnitSchema.index({ status: 1 });

module.exports = mongoose.model('RentalUnit', rentalUnitSchema);
