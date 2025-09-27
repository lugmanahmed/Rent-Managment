const mongoose = require('mongoose');
const PaymentType = require('./models/PaymentType');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rent-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultPaymentTypes = [
  {
    name: 'Rent',
    sortOrder: 1,
    description: 'Monthly rent payment',
    isActive: true
  },
  {
    name: 'Advance',
    sortOrder: 2,
    description: 'Advance payment for rent',
    isActive: true
  },
  {
    name: 'Deposit',
    sortOrder: 3,
    description: 'Security deposit payment',
    isActive: true
  },
  {
    name: 'Partial Payment',
    sortOrder: 4,
    description: 'Partial payment towards rent or other charges',
    isActive: true
  },
  {
    name: 'Late Fine',
    sortOrder: 5,
    description: 'Late payment penalty',
    isActive: true
  },
  {
    name: 'Maintenance',
    sortOrder: 6,
    description: 'Maintenance and repair charges',
    isActive: true
  },
  {
    name: 'Utilities',
    sortOrder: 7,
    description: 'Electricity, water, and other utility charges',
    isActive: true
  },
  {
    name: 'Pet Deposit',
    sortOrder: 8,
    description: 'Additional deposit for pet owners',
    isActive: true
  },
  {
    name: 'Cleaning Fee',
    sortOrder: 9,
    description: 'Cleaning and maintenance fee',
    isActive: true
  },
  {
    name: 'Other',
    sortOrder: 10,
    description: 'Other miscellaneous charges',
    isActive: true
  }
];

async function seedPaymentTypes() {
  try {
    console.log('🌱 Starting payment types seeding...');
    
    // Find admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    
    // Clear existing payment types
    await PaymentType.deleteMany({});
    console.log('🗑️  Cleared existing payment types');
    
    // Create default payment types
    const paymentTypesWithCreator = defaultPaymentTypes.map(pt => ({
      ...pt,
      createdBy: adminUser._id
    }));
    
    const createdPaymentTypes = await PaymentType.insertMany(paymentTypesWithCreator);
    
    console.log(`✅ Successfully created ${createdPaymentTypes.length} payment types:`);
    createdPaymentTypes.forEach(pt => {
      console.log(`   - ${pt.name} (Order: ${pt.sortOrder})`);
    });
    
    console.log('🎉 Payment types seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding payment types:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedPaymentTypes();
