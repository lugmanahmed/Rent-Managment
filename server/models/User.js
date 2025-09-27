const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
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
  mobile: {
    type: String,
    trim: true
  },
  idCardNumber: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  // Keep legacy role field for backward compatibility
  legacyRole: {
    type: String,
    enum: ['admin', 'property_manager', 'accountant'],
    default: 'property_manager'
  },
  assignedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  lastLogout: {
    type: Date
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  sessionToken: {
    type: String
  },
  sessionExpires: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.sessionToken;
  return user;
};

// Session management methods
userSchema.methods.createSession = function() {
  const sessionToken = require('crypto').randomBytes(32).toString('hex');
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  this.sessionToken = sessionToken;
  this.sessionExpires = sessionExpires;
  this.isOnline = true;
  this.lastLogin = new Date();
  
  return sessionToken;
};

userSchema.methods.endSession = function() {
  this.sessionToken = undefined;
  this.sessionExpires = undefined;
  this.isOnline = false;
  this.lastLogout = new Date();
};

userSchema.methods.isSessionValid = function() {
  return this.sessionToken && 
         this.sessionExpires && 
         this.sessionExpires > new Date() &&
         this.isOnline;
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);
