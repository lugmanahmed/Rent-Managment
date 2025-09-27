const { sequelize } = require('./config/database');
const { User, Role, Property, Tenant, RentalUnit, Payment, PaymentType, PaymentMode, Currency } = require('./models');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up MySQL database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false }); // Set to true to drop and recreate tables
    console.log('✅ Database tables synchronized');
    
    // Seed initial data
    await seedInitialData();
    console.log('✅ Initial data seeded');
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function seedInitialData() {
  try {
    // Check if data already exists
    const roleCount = await Role.count();
    if (roleCount > 0) {
      console.log('📋 Initial data already exists, skipping seed...');
      return;
    }
    
    console.log('🌱 Seeding initial data...');
    
    // Create default roles
    const adminRole = await Role.create({
      name: 'admin',
      description: 'System Administrator',
      permissions: ['all']
    });
    
    const managerRole = await Role.create({
      name: 'property_manager',
      description: 'Property Manager',
      permissions: ['properties', 'tenants', 'payments', 'reports']
    });
    
    const accountantRole = await Role.create({
      name: 'accountant',
      description: 'Accountant',
      permissions: ['payments', 'reports']
    });
    
    // Create default admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@rentmanagement.com',
      password: 'admin123',
      roleId: adminRole.id,
      legacyRole: 'admin',
      isActive: true
    });
    
    // Create default payment types
    await PaymentType.bulkCreate([
      { name: 'Rent', description: 'Monthly rent payment' },
      { name: 'Security Deposit', description: 'Security deposit payment' },
      { name: 'Late Fee', description: 'Late payment fee' },
      { name: 'Maintenance Fee', description: 'Maintenance and repair fee' },
      { name: 'Utility Fee', description: 'Utility bill payment' }
    ]);
    
    // Create default payment modes
    await PaymentMode.bulkCreate([
      { name: 'Cash', description: 'Cash payment' },
      { name: 'Bank Transfer', description: 'Bank transfer payment' },
      { name: 'Check', description: 'Check payment' },
      { name: 'Credit Card', description: 'Credit card payment' },
      { name: 'Mobile Payment', description: 'Mobile payment (M-Paisa, etc.)' }
    ]);
    
    // Create default currencies
    await Currency.bulkCreate([
      { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', isDefault: true, exchangeRate: 1.0000 },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 15.42 },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 16.85 }
    ]);
    
    console.log('✅ Initial data seeded successfully');
    
  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Setup completed! You can now start your server.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase, seedInitialData };
