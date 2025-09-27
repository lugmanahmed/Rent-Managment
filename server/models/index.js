const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Role = require('./Role');
const Property = require('./Property');
const Tenant = require('./Tenant');
const RentalUnit = require('./RentalUnit');
const Payment = require('./Payment');
const PaymentType = require('./PaymentType');
const PaymentMode = require('./PaymentMode');
const Currency = require('./Currency');

// Define associations
// User associations
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

// Property associations
Property.belongsTo(User, { foreignKey: 'assignedManagerId', as: 'assignedManager' });
User.hasMany(Property, { foreignKey: 'assignedManagerId', as: 'assignedProperties' });

Property.hasMany(RentalUnit, { foreignKey: 'propertyId', as: 'rentalUnits' });
RentalUnit.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// Tenant associations
Tenant.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
Tenant.belongsTo(User, { foreignKey: 'assignedManagerId', as: 'assignedManager' });

User.hasMany(Tenant, { foreignKey: 'createdById', as: 'createdTenants' });
User.hasMany(Tenant, { foreignKey: 'assignedManagerId', as: 'managedTenants' });

// Payment associations
Payment.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Payment.belongsTo(RentalUnit, { foreignKey: 'rentalUnitId', as: 'rentalUnit' });
Payment.belongsTo(PaymentType, { foreignKey: 'paymentTypeId', as: 'paymentType' });
Payment.belongsTo(PaymentMode, { foreignKey: 'paymentModeId', as: 'paymentMode' });
Payment.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

Tenant.hasMany(Payment, { foreignKey: 'tenantId', as: 'payments' });
RentalUnit.hasMany(Payment, { foreignKey: 'rentalUnitId', as: 'payments' });
PaymentType.hasMany(Payment, { foreignKey: 'paymentTypeId', as: 'payments' });
PaymentMode.hasMany(Payment, { foreignKey: 'paymentModeId', as: 'payments' });
User.hasMany(Payment, { foreignKey: 'createdById', as: 'createdPayments' });

// Export all models
module.exports = {
  sequelize,
  User,
  Role,
  Property,
  Tenant,
  RentalUnit,
  Payment,
  PaymentType,
  PaymentMode,
  Currency
};
