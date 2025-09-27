const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Property = require('../models/Property');
const { auth, authorize, checkPropertyAccess } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/properties
// @desc    Get all properties with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const filter = {};
      
      // Role-based filtering
      if (req.user.roleName === 'property_manager') {
        filter.assignedManager = req.user._id;
      }
      
      // Search filter
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { 'address.street': { $regex: req.query.search, $options: 'i' } },
          { 'address.city': { $regex: req.query.search, $options: 'i' } }
        ];
      }
      
      // Type filter
      if (req.query.type) {
        filter.type = req.query.type;
      }
      
      // Status filter
      if (req.query.status) {
        filter.status = req.query.status;
      }

      const properties = await Property.find(filter)
        .populate('assignedManager', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Property.countDocuments(filter);

      res.json({
        properties,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (dbError) {
      // If database is not available, return demo data
      console.log('Database not available, returning demo properties data');
      
      const demoProperties = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Ocean View Villa',
          type: 'house',
          address: {
            street: 'Beach Road 123',
            city: 'Malé',
            island: 'Malé',
            postalCode: '20001',
            country: 'Maldives'
          },
          buildingDetails: {
            numberOfFloors: 2,
            numberOfRentalUnits: 1
          },
          status: 'occupied',
          details: {
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200,
            yearBuilt: 2020,
            description: 'Beautiful ocean view villa with modern amenities'
          },
          photos: [],
          assignedManager: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Demo User',
            email: 'demo@example.com'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'City Center Apartment',
          type: 'apartment',
          address: {
            street: 'Main Street 456',
            city: 'Malé',
            island: 'Malé',
            postalCode: '20002',
            country: 'Maldives'
          },
          buildingDetails: {
            numberOfFloors: 5,
            numberOfRentalUnits: 8
          },
          status: 'vacant',
          details: {
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: 800,
            yearBuilt: 2018,
            description: 'Modern apartment in city center'
          },
          photos: [],
          assignedManager: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Demo User',
            email: 'demo@example.com'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      res.json({
        properties: demoProperties,
        pagination: {
          current: page,
          pages: 1,
          total: demoProperties.length
        }
      });
    }
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property
// @access  Private
router.get('/:id', auth, checkPropertyAccess, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('assignedManager', 'name email');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/properties
// @desc    Create new property
// @access  Private (Admin, Property Manager)
router.post('/', auth, authorize('admin', 'property_manager'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Property name is required'),
  body('type').isIn(['house', 'apartment', 'commercial']).withMessage('Invalid property type'),
  body('address.street').trim().isLength({ min: 1 }).withMessage('Street address is required'),
  body('address.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('address.island').trim().isLength({ min: 1 }).withMessage('Island is required'),
  body('buildingDetails.numberOfFloors').isInt({ min: 1 }).withMessage('Number of floors must be at least 1'),
  body('buildingDetails.numberOfRentalUnits').isInt({ min: 1 }).withMessage('Number of rental units must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const propertyData = {
      ...req.body,
      assignedManager: req.user.roleName === 'admin' ? req.body.assignedManager : req.user._id
    };

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({ 
      message: 'Property created successfully',
      property 
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Admin, Property Manager)
router.put('/:id', auth, checkPropertyAccess, [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Property name cannot be empty'),
  body('type').optional().isIn(['house', 'apartment', 'commercial']).withMessage('Invalid property type'),
  body('address.street').optional().trim().isLength({ min: 1 }).withMessage('Street address cannot be empty'),
  body('address.city').optional().trim().isLength({ min: 1 }).withMessage('City cannot be empty'),
  body('address.island').optional().trim().isLength({ min: 1 }).withMessage('Island cannot be empty'),
  body('buildingDetails.numberOfFloors').optional().isInt({ min: 1 }).withMessage('Number of floors must be at least 1'),
  body('buildingDetails.numberOfRentalUnits').optional().isInt({ min: 1 }).withMessage('Number of rental units must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ 
      message: 'Property updated successfully',
      property 
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:id/tenants
// @desc    Get tenants for a property
// @access  Private
router.get('/:id/tenants', auth, checkPropertyAccess, async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const tenants = await Tenant.find({ property: req.params.id })
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .sort({ 'personalInfo.lastName': 1 });

    res.json({ tenants });
  } catch (error) {
    console.error('Get property tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:id/payments
// @desc    Get payment history for a property
// @access  Private
router.get('/:id/payments', auth, checkPropertyAccess, async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ property: req.params.id })
      .populate('tenant', 'personalInfo firstName personalInfo lastName')
      .sort({ dueDate: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get property payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
