const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const RentalUnit = require('../models/RentalUnit');
const { auth, authorize, checkPropertyAccess } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tenants
// @desc    Get all tenants with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      property,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by property
    if (property) {
      query.property = property;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { 'firstName': { $regex: search, $options: 'i' } },
        { 'lastName': { $regex: search, $options: 'i' } },
        { 'email': { $regex: search, $options: 'i' } },
        { 'phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Property manager access control
    if (req.user.role === 'property_manager') {
      query.property = { $in: req.user.assignedProperties };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tenants = await Tenant.find(query)
      .populate('rentalUnits', 'unitNumber floorNumber property financial')
      .populate('rentalUnits.property', 'name address')
      .populate('assignedManager', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Tenant.countDocuments(query);

    res.json({
      tenants,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tenants/new
// @desc    Get tenant creation form data
// @access  Private (Admin, Property Manager)
router.get('/new', auth, authorize('admin', 'property_manager'), async (req, res) => {
  try {
    // Return form data for creating a new tenant
    res.json({
      message: 'Tenant creation form data',
      formData: {
        // Add any default values or dropdown options needed for tenant creation
      }
    });
  } catch (error) {
    console.error('Get tenant form error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tenants/:id
// @desc    Get single tenant
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tenant ID' });
    }

    const tenant = await Tenant.findById(id)
      .populate('rentalUnits', 'unitNumber floorNumber property')
      .populate('rentalUnits.property', 'name address')
      .populate('assignedManager', 'name email')
      .populate('notes.createdBy', 'name');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check property access for property managers
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(tenant.property._id.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tenants
// @desc    Create new tenant
// @access  Private (Admin, Property Manager)
router.post('/', [
  auth,
  authorize('admin', 'property_manager'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('idType').isIn(['passport', 'national_id']).withMessage('ID type must be passport or national_id'),
  body('idNumber').trim().notEmpty().withMessage('ID number is required'),
  body('rentalUnits').isArray().withMessage('Rental units must be an array'),
  body('leaseInfo.startDate').isISO8601().withMessage('Valid start date is required'),
  body('leaseInfo.endDate').isISO8601().withMessage('Valid end date is required'),
  body('leaseInfo.monthlyRent').isNumeric().withMessage('Monthly rent must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify rental units exist and are available
    const RentalUnit = require('../models/RentalUnit');
    const rentalUnits = await RentalUnit.find({ 
      _id: { $in: req.body.rentalUnits },
      tenant: null // Only available units
    });

    if (rentalUnits.length !== req.body.rentalUnits.length) {
      return res.status(400).json({ message: 'Some rental units are not available' });
    }

    // Check property access for property managers
    if (req.user.role === 'property_manager') {
      const propertyIds = [...new Set(rentalUnits.map(unit => unit.property.toString()))];
      const hasAccess = propertyIds.every(propertyId => 
        req.user.assignedProperties.includes(propertyId)
      );
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to some properties' });
      }
    }

    // Check if email already exists
    const existingTenant = await Tenant.findOne({ email: req.body.email });
    if (existingTenant) {
      return res.status(400).json({ message: 'Tenant with this email already exists' });
    }

    const tenant = new Tenant({
      ...req.body,
      status: 'active', // Set tenant status to active when created
      createdBy: req.user._id,
      assignedManager: req.user.roleName === 'admin' ? req.body.assignedManager : req.user._id
    });

    console.log('🔍 Creating tenant with status:', tenant.status);
    await tenant.save();
    console.log('✅ Tenant created successfully with status:', tenant.status);

    // Update rental units to assign them to this tenant and set status to occupied
    await RentalUnit.updateMany(
      { _id: { $in: req.body.rentalUnits } },
      { 
        tenant: tenant._id,
        status: 'occupied'
      }
    );

    // Populate the response
    await tenant.populate([
      { path: 'rentalUnits', select: 'unitNumber floorNumber property' },
      { path: 'rentalUnits.property', select: 'name address' },
      { path: 'assignedManager', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tenants/:id
// @desc    Update tenant
// @access  Private (Admin, Property Manager)
router.put('/:id', [
  auth,
  authorize('admin', 'property_manager'),
  body('personalInfo.firstName').optional().trim().notEmpty(),
  body('personalInfo.lastName').optional().trim().notEmpty(),
  body('personalInfo.email').optional().isEmail().normalizeEmail(),
  body('personalInfo.phone').optional().trim().notEmpty(),
  body('leaseInfo.monthlyRent').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check property access for property managers
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(tenant.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check email uniqueness if email is being updated
    if (req.body.personalInfo?.email && req.body.personalInfo.email !== tenant.personalInfo.email) {
      const existingTenant = await Tenant.findOne({ 'personalInfo.email': req.body.personalInfo.email });
      if (existingTenant) {
        return res.status(400).json({ message: 'Tenant with this email already exists' });
      }
    }

    // Update tenant
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        Object.keys(req.body[key]).forEach(subKey => {
          tenant[key][subKey] = req.body[key][subKey];
        });
      } else {
        tenant[key] = req.body[key];
      }
    });

    await tenant.save();

    // Populate the response
    await tenant.populate([
      { path: 'property', select: 'name address type' },
      { path: 'rentalUnit', select: 'unitNumber floorNumber' },
      { path: 'assignedManager', select: 'name email' }
    ]);

    res.json({
      message: 'Tenant updated successfully',
      tenant
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tenants/:id
// @desc    Delete tenant
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    await Tenant.findByIdAndDelete(req.params.id);

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tenants/:id/notes
// @desc    Add note to tenant
// @access  Private
router.post('/:id/notes', [
  auth,
  body('text').trim().notEmpty().withMessage('Note text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check property access for property managers
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(tenant.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    tenant.notes.push({
      text: req.body.text,
      createdBy: req.user._id
    });

    await tenant.save();

    res.json({
      message: 'Note added successfully',
      note: tenant.notes[tenant.notes.length - 1]
    });
  } catch (error) {
    console.error('Add tenant note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tenants/:id/payments
// @desc    Get tenant payment history
// @access  Private
router.get('/:id/payments', auth, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check property access for property managers
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(tenant.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // This would typically fetch from Payment model
    // For now, return empty array
    res.json({ payments: [] });
  } catch (error) {
    console.error('Get tenant payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tenants/fix-status
// @desc    Fix tenant statuses (set pending tenants to active)
// @access  Private (Admin only)
router.post('/fix-status', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🔧 Fixing tenant statuses...');
    
    // Find all tenants with pending status
    const pendingTenants = await Tenant.find({ status: 'pending' });
    console.log(`📊 Found ${pendingTenants.length} tenants with pending status`);
    
    // Update them to active status
    const result = await Tenant.updateMany(
      { status: 'pending' },
      { status: 'active' }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} tenants from pending to active`);
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} tenants from pending to active status`,
      updatedCount: result.modifiedCount,
      totalPending: pendingTenants.length
    });
  } catch (error) {
    console.error('❌ Fix tenant status error:', error);
    res.status(500).json({ message: 'Server error while fixing tenant statuses' });
  }
});

module.exports = router;
