const mongoose = require('mongoose');
const Currency = require('./models/Currency');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rent-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultCurrencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    sortOrder: 1,
    decimalPlaces: 2,
    isActive: true,
    isDefault: true
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    sortOrder: 2,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'MVR',
    name: 'Maldivian Rufiyaa',
    symbol: 'Rf',
    sortOrder: 3,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    sortOrder: 4,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    sortOrder: 5,
    decimalPlaces: 0,
    isActive: true,
    isDefault: false
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    sortOrder: 6,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    sortOrder: 7,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    sortOrder: 8,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    sortOrder: 9,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    sortOrder: 10,
    decimalPlaces: 2,
    isActive: true,
    isDefault: false
  }
];

async function seedCurrencies() {
  try {
    console.log('🌱 Starting currency seeding...');

    // Clear existing currencies
    await Currency.deleteMany({});
    console.log('🗑️ Cleared existing currencies');

    // Create a default user ID for seeding (you might want to use a real user ID)
    const defaultUserId = new mongoose.Types.ObjectId();

    // Add createdBy field to each currency
    const currenciesWithUser = defaultCurrencies.map(currency => ({
      ...currency,
      createdBy: defaultUserId
    }));

    // Insert default currencies
    const insertedCurrencies = await Currency.insertMany(currenciesWithUser);
    console.log(`✅ Successfully seeded ${insertedCurrencies.length} currencies`);

    // Display seeded currencies
    console.log('\n📋 Seeded Currencies:');
    insertedCurrencies.forEach(currency => {
      console.log(`  ${currency.code} - ${currency.name} (${currency.symbol}) - Order: ${currency.sortOrder} ${currency.isDefault ? '- DEFAULT' : ''}`);
    });

    console.log('\n🎉 Currency seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedCurrencies();
