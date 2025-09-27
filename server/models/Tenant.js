const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Personal Information
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  idType: {
    type: DataTypes.ENUM('passport', 'national_id'),
    allowNull: false
  },
  idNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING,
    defaultValue: 'Maldives'
  },
  // Lease Information
  leaseStartDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  leaseEndDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  monthlyRent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'MVR'
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  agreementFileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  agreementFilePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  agreementUploadedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Emergency Contact
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactRelationship: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  // Status and Notes
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated', 'pending'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // Additional Information
  occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employerContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pets: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  documents: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  // System Fields
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'tenants',
  timestamps: true
});

// Virtual for full name
Tenant.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Virtual for lease duration in months
Tenant.prototype.getLeaseDuration = function() {
  if (this.leaseStartDate && this.leaseEndDate) {
    const diffTime = Math.abs(new Date(this.leaseEndDate) - new Date(this.leaseStartDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }
  return 0;
};

module.exports = Tenant;