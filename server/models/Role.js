const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  permissions: [{
    module: {
      type: String,
      required: true,
      enum: [
        'users', 'properties', 'tenants', 'payments', 'maintenance', 
        'reports', 'settings', 'currencies', 'payment_types', 
        'payment_modes', 'rental_units', 'assets', 'invoices', 'payment_records'
      ]
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage']
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false // System roles cannot be deleted
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
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

// Pre-save middleware to ensure unique name
roleSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingRole = await this.constructor.findOne({ 
      name: this.name,
      _id: { $ne: this._id }
    });
    
    if (existingRole) {
      const error = new Error('Role name already exists');
      error.code = 'DUPLICATE_ROLE_NAME';
      return next(error);
    }
  }
  next();
});

// Virtual for permission summary
roleSchema.virtual('permissionSummary').get(function() {
  return this.permissions.map(p => `${p.module}: ${p.actions.join(', ')}`).join('; ');
});

module.exports = mongoose.model('Role', roleSchema);
