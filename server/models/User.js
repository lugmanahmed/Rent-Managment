const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idCardNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  legacyRole: {
    type: DataTypes.ENUM('admin', 'property_manager', 'accountant'),
    defaultValue: 'property_manager'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogout: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sessionToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sessionExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const user = this.toObject ? this.toObject() : this.get();
  delete user.password;
  delete user.sessionToken;
  return user;
};

User.prototype.createSession = function() {
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  this.sessionToken = sessionToken;
  this.sessionExpires = sessionExpires;
  this.isOnline = true;
  this.lastLogin = new Date();
  
  return sessionToken;
};

User.prototype.endSession = function() {
  this.sessionToken = null;
  this.sessionExpires = null;
  this.isOnline = false;
  this.lastLogout = new Date();
};

User.prototype.isSessionValid = function() {
  return this.sessionToken && 
         this.sessionExpires && 
         this.sessionExpires > new Date() &&
         this.isOnline;
};

User.prototype.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update({
      lockUntil: null,
      loginAttempts: 1
    });
  }
  
  const updates = { loginAttempts: this.loginAttempts + 1 };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }
  
  return this.update(updates);
};

User.prototype.resetLoginAttempts = function() {
  return this.update({
    loginAttempts: 0,
    lockUntil: null
  });
};

// Virtual getter for isLocked
Object.defineProperty(User.prototype, 'isLocked', {
  get: function() {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }
});

module.exports = User;