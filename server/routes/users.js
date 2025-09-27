const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find()
      .populate('role', 'name displayName')
      .populate('assignedProperties', 'name address')
      .select('-password -sessionToken')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/active
// @desc    Get active users only
// @access  Private (Admin only)
router.get('/active', auth, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .populate('role', 'name displayName')
      .populate('assignedProperties', 'name address')
      .select('-password -sessionToken')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/online
// @desc    Get online users
// @access  Private (Admin only)
router.get('/online', auth, authorize(['admin']), async (req, res) => {
  try {
    const users = await User.find({ isOnline: true })
      .populate('role', 'name displayName')
      .select('-password -sessionToken')
      .sort({ lastLogin: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin only)
router.get('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role', 'name displayName permissions')
      .populate('assignedProperties', 'name address')
      .select('-password -sessionToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', auth, authorize(['admin']), [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isMongoId().withMessage('Valid role is required'),
  body('mobile').optional().trim().isLength({ max: 20 }).withMessage('Mobile number cannot exceed 20 characters'),
  body('idCardNumber').optional().trim().isLength({ max: 50 }).withMessage('ID card number cannot exceed 50 characters'),
  body('assignedProperties').optional().isArray().withMessage('Assigned properties must be an array'),
  body('assignedProperties.*').optional().isMongoId().withMessage('Invalid property ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role, mobile, idCardNumber, assignedProperties } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Verify role exists
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const userData = {
      name,
      email,
      password,
      role,
      mobile,
      idCardNumber,
      assignedProperties: assignedProperties || []
    };

    const user = new User(userData);
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('role', 'name displayName')
      .populate('assignedProperties', 'name address')
      .select('-password -sessionToken');

    res.status(201).json({
      success: true,
      data: populatedUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', auth, authorize(['admin']), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').optional().isMongoId().withMessage('Valid role is required'),
  body('mobile').optional().trim().isLength({ max: 20 }).withMessage('Mobile number cannot exceed 20 characters'),
  body('idCardNumber').optional().trim().isLength({ max: 50 }).withMessage('ID card number cannot exceed 50 characters'),
  body('assignedProperties').optional().isArray().withMessage('Assigned properties must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, role, mobile, idCardNumber, assignedProperties, isActive } = req.body;

    // Check if user exists
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it conflicts with existing
    if (email && email !== existingUser.email) {
      const emailConflict = await User.findOne({ 
        email,
        _id: { $ne: req.params.id }
      });

      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Verify role exists if being changed
    if (role && role !== existingUser.role.toString()) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (idCardNumber !== undefined) updateData.idCardNumber = idCardNumber;
    if (assignedProperties !== undefined) updateData.assignedProperties = assignedProperties;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('role', 'name displayName')
     .populate('assignedProperties', 'name address')
     .select('-password -sessionToken');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deletion of self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete by setting isActive to false and ending session
    await User.findByIdAndUpdate(req.params.id, { 
      isActive: false,
      isOnline: false,
      sessionToken: undefined,
      sessionExpires: undefined
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password
// @access  Private (Admin only)
router.post('/:id/reset-password', auth, authorize(['admin']), [
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (Admin only)
router.post('/:id/toggle-status', auth, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deactivating self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const newStatus = !user.isActive;
    await User.findByIdAndUpdate(req.params.id, { 
      isActive: newStatus,
      isOnline: newStatus ? user.isOnline : false,
      sessionToken: newStatus ? user.sessionToken : undefined,
      sessionExpires: newStatus ? user.sessionExpires : undefined
    });

    res.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: newStatus }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/:id/end-session
// @desc    End user session
// @access  Private (Admin only)
router.post('/:id/end-session', auth, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.endSession();
    await user.save();

    res.json({
      success: true,
      message: 'User session ended successfully'
    });
  } catch (error) {
    console.error('End user session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;



