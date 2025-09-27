const mongoose = require('mongoose');
const PaymentMode = require('./models/PaymentMode');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rent-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultPaymentModes = [
  {
    name: 'Cash',
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Cheque',
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Card',
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Transfer',
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Account Deposit',
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Bank Transfer',
    sortOrder: 6,
    isActive: true
  },
  {
    name: 'Mobile Payment',
    sortOrder: 7,
    isActive: true
  },
  {
    name: 'Online Payment',
    sortOrder: 8,
    isActive: true
  },
  {
    name: 'Cryptocurrency',
    sortOrder: 9,
    isActive: true
  },
  {
    name: 'Other',
    sortOrder: 10,
    isActive: true
  }
];

async function seedPaymentModes() {
  try {
    console.log('🌱 Starting payment modes seeding...');

    // Clear existing payment modes
    await PaymentMode.deleteMany({});
    console.log('🗑️ Cleared existing payment modes');

    // Create a default user ID for seeding (you might want to use a real user ID)
    const defaultUserId = new mongoose.Types.ObjectId();

    // Add createdBy field to each payment mode
    const paymentModesWithUser = defaultPaymentModes.map(paymentMode => ({
      ...paymentMode,
      createdBy: defaultUserId
    }));

    // Insert default payment modes
    const insertedPaymentModes = await PaymentMode.insertMany(paymentModesWithUser);
    console.log(`✅ Successfully seeded ${insertedPaymentModes.length} payment modes`);

    // Display seeded payment modes
    console.log('\n📋 Seeded Payment Modes:');
    insertedPaymentModes.forEach(paymentMode => {
      console.log(`  ${paymentMode.sortOrder}. ${paymentMode.name}`);
    });

    console.log('\n🎉 Payment modes seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding payment modes:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedPaymentModes();
