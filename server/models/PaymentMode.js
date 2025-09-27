const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PaymentMode = sequelize.define('PaymentMode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'payment_modes',
  timestamps: true
});

module.exports = PaymentMode;