const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    island: { type: String, required: true },
    postalCode: { type: String },
    country: { type: String, default: 'Maldives' }
  },
  gstTin: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contactInfo: {
    telephone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    website: { type: String },
    mobile: { type: String }
  },
  settings: {
    defaultCurrency: { 
      type: String, 
      enum: ['MVR', 'USD', 'EUR'], 
      default: 'MVR' 
    },
    leaseDurationPresets: [{
      name: { type: String, required: true },
      months: { type: Number, required: true }
    }],
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      rentReminderDays: { type: Number, default: 7 },
      maintenanceReminderDays: { type: Number, default: 3 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for full address
companySchema.virtual('fullAddress').get(function() {
  return `${this.companyAddress.street}, ${this.companyAddress.city}, ${this.companyAddress.island}`;
});

module.exports = mongoose.model('Company', companySchema);
