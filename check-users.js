const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rent-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({}).select('-password');
    
    console.log(`\nFound ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   ID: ${user._id}`);
      console.log('');
    });
    
    // Check if there are any admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`\nAdmin users: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found! Creating one...');
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers();
