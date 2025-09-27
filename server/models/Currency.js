const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Currency = sequelize.define('Currency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    defaultValue: 1.0000
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'currencies',
  timestamps: true
});

module.exports = Currency;