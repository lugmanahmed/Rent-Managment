const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  rentalUnitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rental_units',
      key: 'id'
    }
  },
  amount: {
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
  paymentTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'payment_types',
      key: 'id'
    }
  },
  paymentModeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'payment_modes',
      key: 'id'
    }
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'pending'
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiptPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;