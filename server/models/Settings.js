const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  globalSettings: {
    defaultCurrency: { 
      type: String, 
      enum: ['MVR', 'USD', 'EUR'], 
      default: 'MVR' 
    },
    dateFormat: { 
      type: String, 
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], 
      default: 'DD/MM/YYYY' 
    },
    timezone: { 
      type: String, 
      default: 'Indian/Maldives' 
    },
    language: { 
      type: String, 
      enum: ['en', 'dv'], 
      default: 'en' 
    }
  },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    rentReminderDays: { type: Number, default: 7, min: 1, max: 30 },
    maintenanceReminderDays: { type: Number, default: 3, min: 1, max: 30 },
    overdueReminderDays: { type: Number, default: 3, min: 1, max: 30 },
    leaseExpiryReminderDays: { type: Number, default: 30, min: 1, max: 90 }
  },
  leaseSettings: {
    defaultLeaseDuration: { type: Number, default: 12, min: 1 }, // months
    leaseDurationPresets: [{
      name: { type: String, required: true },
      months: { type: Number, required: true, min: 1 }
    }],
    autoRenewal: { type: Boolean, default: false },
    gracePeriodDays: { type: Number, default: 5, min: 0, max: 30 }
  },
  financialSettings: {
    lateFeePercentage: { type: Number, default: 5, min: 0, max: 20 },
    lateFeeFixedAmount: { type: Number, default: 0, min: 0 },
    securityDepositMonths: { type: Number, default: 1, min: 0, max: 12 },
    petDepositAmount: { type: Number, default: 0, min: 0 }
  },
  systemSettings: {
    maxFileUploadSize: { type: Number, default: 10485760 }, // 10MB
    allowedFileTypes: [{ type: String }],
    backupFrequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      default: 'weekly' 
    },
    sessionTimeout: { type: Number, default: 480, min: 30 } // minutes
  },
  rentSettings: {
    autoGenerateRent: { type: Boolean, default: false },
    rentGenerationDay: { type: Number, default: 1, min: 1, max: 31 },
    rentDueDays: { type: Number, default: 7, min: 1, max: 30 },
    includeUtilities: { type: Boolean, default: false },
    utilitiesPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Default lease duration presets
settingsSchema.pre('save', function(next) {
  if (this.isNew && this.leaseSettings.leaseDurationPresets.length === 0) {
    this.leaseSettings.leaseDurationPresets = [
      { name: '6 Months', months: 6 },
      { name: '1 Year', months: 12 },
      { name: '2 Years', months: 24 },
      { name: '3 Years', months: 36 }
    ];
  }
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
