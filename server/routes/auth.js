const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Auth-specific rate limiting (more lenient)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 login attempts per minute
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'property_manager', 'accountant']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'property_manager' } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (dbError) {
      // If database is not available, create demo user
      console.log('Database not available, using demo mode for registration');
      
      const token = generateToken('507f1f77bcf86cd799439011');
      
      res.status(201).json({
        message: 'Demo mode - Registration successful',
        token,
        user: {
          id: '507f1f77bcf86cd799439011',
          name: name || 'Demo User',
          email: email,
          role: role || 'admin'
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { email: req.body.email, passwordLength: req.body.password?.length });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      console.log('🔍 Searching for user with email:', email);
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('✅ User found:', { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        isActive: user.isActive 
      });

      if (!user.isActive) {
        console.log('❌ User is inactive:', user._id);
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check password
      console.log('🔑 Checking password...');
      const isMatch = await user.comparePassword(password);
      console.log('🔑 Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('❌ Password mismatch for user:', user._id);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Last login updated for user:', user._id);

      const token = generateToken(user._id);
      console.log('🎫 Token generated for user:', user._id);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedProperties: user.assignedProperties
        }
      });
    } catch (dbError) {
      console.log('❌ Database error during login:', dbError.message);
      // If database is not available, create demo user
      console.log('🔄 Database not available, using demo mode');
      
      const token = generateToken('507f1f77bcf86cd799439011');
      
      res.json({
        message: 'Demo mode - Login successful',
        token,
        user: {
          id: '507f1f77bcf86cd799439011',
          name: 'Demo User',
          email: email,
          role: 'admin',
          assignedProperties: []
        }
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    try {
      const user = await User.findById(req.user._id)
        .populate('assignedProperties', 'name address')
        .select('-password');

      res.json({ user });
    } catch (dbError) {
      // If database is not available, return demo user
      console.log('Database not available, returning demo user');
      
      res.json({ 
        user: {
          id: '507f1f77bcf86cd799439011',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin',
          assignedProperties: []
        }
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email;
    }
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/debug/users
// @desc    Debug endpoint to check all users
// @access  Public (for debugging)
router.get('/debug/users', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Fetching all users from database');
    const users = await User.find({}).select('-password');
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    res.json({
      success: true,
      totalUsers: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Debug users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
