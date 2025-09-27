const express = require('express');
const { body, validationResult } = require('express-validator');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/Property');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/maintenance
// @desc    Get all maintenance requests with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'property_manager') {
      const userProperties = await Property.find({ assignedManager: req.user._id }).select('_id');
      filter.property = { $in: userProperties.map(p => p._id) };
    }
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Priority filter
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const maintenanceRequests = await MaintenanceRequest.find(filter)
      .populate('property', 'name address type')
      .populate('tenant', 'firstName lastName email phone')
      .populate('asset', 'name category brand model')
      .populate('createdBy', 'name')
      .sort({ requestedDate: -1 })
      .skip(skip)
      .limit(limit);

    // Add rental unit information for each request
    const enhancedRequests = await Promise.all(
      maintenanceRequests.map(async (request) => {
        // Find the rental unit that contains this asset
        const RentalUnit = require('../models/RentalUnit');
        const rentalUnit = await RentalUnit.findOne({
          'assets.asset': request.asset._id
        }).populate('tenant', 'personalInfo firstName personalInfo lastName personalInfo email personalInfo phone');

        return {
          ...request.toObject(),
          rentalUnit: rentalUnit ? {
            unitNumber: rentalUnit.unitNumber,
            floorNumber: rentalUnit.floorNumber,
            tenant: rentalUnit.tenant
          } : null
        };
      })
    );

    const total = await MaintenanceRequest.countDocuments(filter);

    res.json({
      maintenanceRequests: enhancedRequests,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/maintenance/:id
// @desc    Get single maintenance request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const maintenanceRequest = await MaintenanceRequest.findById(req.params.id)
      .populate('property', 'name address type')
      .populate('tenant', 'firstName lastName email phone')
      .populate('asset', 'name category brand model')
      .populate('createdBy', 'name')
      .populate('notes.createdBy', 'name');

    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(maintenanceRequest.property._id.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ maintenanceRequest });
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/maintenance
// @desc    Create new maintenance request
// @access  Private (Admin, Property Manager)
router.post('/', auth, authorize('admin', 'property_manager'), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('category').isIn(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'cosmetic', 'other']).withMessage('Invalid category'),
  body('property').isMongoId().withMessage('Valid property ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'emergency']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(req.body.property);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this property' });
      }
    }

    // Verify property exists
    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const maintenanceRequest = new MaintenanceRequest({
      ...req.body,
      createdBy: req.user._id
    });

    await maintenanceRequest.save();

    res.status(201).json({ 
      message: 'Maintenance request created successfully',
      maintenanceRequest 
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance request
// @access  Private (Admin, Property Manager)
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'emergency']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenanceRequest = await MaintenanceRequest.findById(req.params.id);
    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(maintenanceRequest.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // If marking as completed, set completed date
    if (req.body.status === 'completed' && !maintenanceRequest.completedDate) {
      req.body.completedDate = new Date();
    }

    const updatedMaintenanceRequest = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('property', 'name address type')
     .populate('tenant', 'personalInfo firstName personalInfo lastName')
     .populate('asset', 'name category');

    res.json({ 
      message: 'Maintenance request updated successfully',
      maintenanceRequest: updatedMaintenanceRequest 
    });
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/maintenance/:id
// @desc    Delete maintenance request
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const maintenanceRequest = await MaintenanceRequest.findByIdAndDelete(req.params.id);

    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/maintenance/:id/notes
// @desc    Add note to maintenance request
// @access  Private
router.post('/:id/notes', auth, [
  body('text').trim().isLength({ min: 1 }).withMessage('Note text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const maintenanceRequest = await MaintenanceRequest.findById(req.params.id);
    if (!maintenanceRequest) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(maintenanceRequest.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    maintenanceRequest.notes.push({
      text: req.body.text,
      createdBy: req.user._id
    });

    await maintenanceRequest.save();

    res.json({ message: 'Note added successfully' });
  } catch (error) {
    console.error('Add maintenance note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/maintenance/urgent
// @desc    Get urgent maintenance requests
// @access  Private
router.get('/urgent', auth, async (req, res) => {
  try {
    const filter = {
      priority: { $in: ['high', 'emergency'] },
      status: { $in: ['pending', 'in_progress'] }
    };
    
    // Role-based filtering
    if (req.user.role === 'property_manager') {
      const userProperties = await Property.find({ assignedManager: req.user._id }).select('_id');
      filter.property = { $in: userProperties.map(p => p._id) };
    }

    const urgentRequests = await MaintenanceRequest.find(filter)
      .populate('property', 'name address type')
      .populate('tenant', 'personalInfo firstName personalInfo lastName personalInfo phone')
      .populate('asset', 'name category')
      .sort({ priority: 1, requestedDate: 1 });

    res.json({ urgentRequests });
  } catch (error) {
    console.error('Get urgent maintenance requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/maintenance/property/:propertyId
// @desc    Get maintenance requests for a specific property
// @access  Private
router.get('/property/:propertyId', auth, async (req, res) => {
  try {
    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(req.params.propertyId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const maintenanceRequests = await MaintenanceRequest.find({ property: req.params.propertyId })
      .populate('tenant', 'personalInfo firstName personalInfo lastName')
      .populate('asset', 'name category')
      .populate('createdBy', 'name')
      .sort({ requestedDate: -1 });

    res.json({ maintenanceRequests });
  } catch (error) {
    console.error('Get property maintenance requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
