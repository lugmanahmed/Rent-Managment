const express = require('express');
const { body, validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private (Admin only)
router.get('/', auth, authorize(['admin']), async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/roles/all
// @desc    Get all roles including inactive
// @access  Private (Admin only)
router.get('/all', auth, authorize(['admin']), async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/roles/:id
// @desc    Get single role
// @access  Private (Admin only)
router.get('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/roles
// @desc    Create new role
// @access  Private (Admin only)
router.post('/', auth, authorize(['admin']), [
  body('name').trim().notEmpty().withMessage('Role name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Name can only contain letters, numbers, and underscores'),
  body('displayName').trim().notEmpty().withMessage('Display name is required')
    .isLength({ max: 100 }).withMessage('Display name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*.module').isIn([
    'users', 'properties', 'tenants', 'payments', 'maintenance', 
    'reports', 'settings', 'currencies', 'payment_types', 
    'payment_modes', 'rental_units', 'assets', 'invoices', 'payment_records'
  ]).withMessage('Invalid module'),
  body('permissions.*.actions').isArray().withMessage('Actions must be an array'),
  body('permissions.*.actions.*').isIn(['create', 'read', 'update', 'delete', 'manage'])
    .withMessage('Invalid action')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, displayName, description, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    const roleData = {
      name,
      displayName,
      description,
      permissions,
      createdBy: req.user._id
    };

    const role = new Role(roleData);
    await role.save();

    const populatedRole = await Role.findById(role._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedRole
    });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.code === 'DUPLICATE_ROLE_NAME') {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private (Admin only)
router.put('/:id', auth, authorize(['admin']), [
  body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Name can only contain letters, numbers, and underscores'),
  body('displayName').optional().trim().notEmpty().withMessage('Display name cannot be empty')
    .isLength({ max: 100 }).withMessage('Display name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
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

    const { name, displayName, description, permissions, isActive } = req.body;

    // Check if role exists
    const existingRole = await Role.findById(req.params.id);
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Don't allow modification of system roles
    if (existingRole.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify system roles'
      });
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== existingRole.name) {
      const nameConflict = await Role.findOne({ 
        name,
        _id: { $ne: req.params.id }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    if (error.code === 'DUPLICATE_ROLE_NAME') {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/roles/:id
// @desc    Delete role (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Don't allow deletion of system roles
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }

    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are currently assigned to this role.`
      });
    }

    // Soft delete by setting isActive to false
    await Role.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/roles/:id/users
// @desc    Get users assigned to a role
// @access  Private (Admin only)
router.get('/:id/users', auth, authorize(['admin']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const users = await User.find({ role: req.params.id })
      .populate('role', 'name displayName')
      .select('-password -sessionToken')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get role users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
