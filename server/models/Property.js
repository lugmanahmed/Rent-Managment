const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['house', 'apartment', 'commercial'],
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    island: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, default: 'Maldives' }
  },
  buildingDetails: {
    numberOfFloors: { type: Number, required: true, min: 1 },
    numberOfRentalUnits: { type: Number, required: true, min: 1 }
  },
  details: {
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    squareFeet: { type: Number, min: 0 },
    yearBuilt: { type: Number },
    description: { type: String }
  },
  status: {
    type: String,
    enum: ['occupied', 'vacant', 'maintenance', 'renovation'],
    default: 'vacant'
  },
  photos: [{
    url: { type: String, required: true },
    caption: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  amenities: [{
    type: String
  }],
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for full address
propertySchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.island}`;
});

// Index for search functionality
propertySchema.index({ 
  name: 'text', 
  'address.street': 'text', 
  'address.city': 'text' 
});

module.exports = mongoose.model('Property', propertySchema);
