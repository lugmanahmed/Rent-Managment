const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  idType: {
    type: String,
    enum: ['passport', 'national_id'],
    required: true
  },
  idNumber: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  nationality: {
    type: String,
    default: 'Maldives'
  },

  // Rental Units (one tenant can rent multiple units)
  rentalUnits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalUnit'
  }],

  // Lease Information
  leaseInfo: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'MVR'
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: 0
    },
    agreementAttachment: {
      fileName: String,
      filePath: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  },

  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },

  // Status and Notes
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'pending'],
    default: 'pending'
  },
  notes: [{
    text: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Additional Information
  occupation: {
    type: String,
    trim: true
  },
  employer: {
    type: String,
    trim: true
  },
  employerContact: {
    type: String,
    trim: true
  },
  pets: [{
    type: {
      type: String,
      enum: ['dog', 'cat', 'bird', 'other']
    },
    name: String,
    breed: String,
    size: {
      type: String,
      enum: ['small', 'medium', 'large']
    }
  }],

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['id_copy', 'employment_letter', 'bank_statement', 'lease_agreement', 'other']
    },
    name: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for full name
tenantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for lease duration in months
tenantSchema.virtual('leaseDuration').get(function() {
  if (this.leaseInfo.startDate && this.leaseInfo.endDate) {
    const diffTime = Math.abs(this.leaseInfo.endDate - this.leaseInfo.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }
  return 0;
});

// Index for search
tenantSchema.index({
  'firstName': 'text',
  'lastName': 'text',
  'email': 'text',
  'phone': 'text'
});

// Index for property and status
tenantSchema.index({ property: 1, status: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
