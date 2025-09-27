const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const RentalUnit = require('../models/RentalUnit');
const Property = require('../models/Property');
const Asset = require('../models/Asset');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { auth, authorize, checkPropertyAccess } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rental-units
// @desc    Get all rental units with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Property filter
    if (req.query.property) {
      filter.property = req.query.property;
    }
    
    // Tenant filter
    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }
    
    // Status filter
    if (req.query.status) {
      if (req.query.status === 'available') {
        filter.tenant = null;
        filter.status = 'available'; // Also check the status field
      } else if (req.query.status === 'occupied') {
        filter.tenant = { $ne: null };
        filter.status = 'occupied'; // Also check the status field
      } else {
        filter.status = req.query.status;
      }
    }
    
    // Floor filter
    if (req.query.floor) {
      filter.floorNumber = parseInt(req.query.floor);
    }

    // Role-based filtering
    if (req.user.role === 'property_manager') {
      const userProperties = await Property.find({ assignedManager: req.user._id }).select('_id');
      filter.property = { $in: userProperties.map(p => p._id) };
    }

    console.log('🔍 Rental Units Query Filter:', JSON.stringify(filter, null, 2));
    
    const rentalUnits = await RentalUnit.find(filter)
      .populate('property', 'name address type')
      .populate('tenant', 'firstName lastName email phone')
      .sort({ property: 1, floorNumber: 1, unitNumber: 1 })
      .skip(skip)
      .limit(limit);
      
    console.log(`📊 Found ${rentalUnits.length} rental units matching filter`);

    const total = await RentalUnit.countDocuments(filter);

    res.json({
      rentalUnits,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get rental units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint
router.get('/test', auth, (req, res) => {
  console.log('=== TEST ENDPOINT CALLED ===');
  res.json({ message: 'Test endpoint working', timestamp: new Date() });
});

// Get faulty assets from all rental units
router.get('/faulty-assets', auth, async (req, res) => {
  try {
    console.log('=== FAULTY ASSETS API CALLED ===');
    console.log('User:', req.user);
    console.log('Fetching faulty assets...');
    console.log('About to query database...');
    
    const rentalUnits = await RentalUnit.find({
      'assets.status': { $in: ['Faulty', 'faulty', 'Repaired', 'Replaced'] }
    })
    .populate('property', 'name address')
    .populate('tenant', 'firstName lastName email phone')
    .populate('assets.asset', 'name category brand model');

    // Extract faulty assets with unit information
    const faultyAssets = [];
    
    rentalUnits.forEach(unit => {
      unit.assets.forEach(unitAsset => {
        if (['Faulty', 'faulty', 'Repaired', 'Replaced'].includes(unitAsset.status)) {
          faultyAssets.push({
            _id: unitAsset._id,
            asset: unitAsset.asset,
            status: unitAsset.status,
            quantity: unitAsset.quantity,
            notes: unitAsset.notes,
            addedDate: unitAsset.addedDate,
            // Unit information
            unitNumber: unit.unitNumber,
            floorNumber: unit.floorNumber,
            property: unit.property,
            tenant: unit.tenant,
            rentalUnitId: unit._id
          });
        }
      });
    });

    // Sort by addedDate (most recent first)
    faultyAssets.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));

    console.log(`Found ${faultyAssets.length} faulty assets`);

    res.json({
      success: true,
      data: faultyAssets
    });
  } catch (error) {
    console.error('Get faulty assets error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        code: error.code
      } : undefined
    });
  }
});

// @route   GET /api/rental-units/:id
// @desc    Get single rental unit
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const rentalUnit = await RentalUnit.findById(req.params.id)
      .populate('property', 'name address type buildingDetails')
      .populate('tenant', 'firstName lastName email phone idType idNumber')
      .populate('assets.asset');

    if (!rentalUnit) {
      return res.status(404).json({ message: 'Rental unit not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(rentalUnit.property._id.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ rentalUnit });
  } catch (error) {
    console.error('Get rental unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rental-units
// @desc    Create new rental unit
// @access  Private (Admin, Property Manager)
router.post('/', auth, authorize('admin', 'property_manager'), [
  body('property').isMongoId().withMessage('Valid property ID is required'),
  body('unitNumber').trim().isLength({ min: 1 }).withMessage('Unit number is required'),
  body('floorNumber').isInt({ min: 1 }).withMessage('Floor number must be a positive integer'),
  body('unitDetails.numberOfRooms').isInt({ min: 1, max: 10 }).withMessage('Number of rooms must be between 1 and 10'),
  body('unitDetails.numberOfToilets').isInt({ min: 1, max: 5 }).withMessage('Number of toilets must be between 1 and 5'),
  body('financial.rentAmount').isNumeric().isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('financial.depositAmount').isNumeric().isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('financial.currency').isIn(['MVR', 'USD', 'EUR']).withMessage('Invalid currency')
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

    // Verify property exists and check floor number
    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (req.body.floorNumber > property.buildingDetails.numberOfFloors) {
      return res.status(400).json({ 
        message: `Floor number cannot exceed ${property.buildingDetails.numberOfFloors}` 
      });
    }

    // Check if unit number already exists for this property
    const existingUnit = await RentalUnit.findOne({
      property: req.body.property,
      unitNumber: req.body.unitNumber
    });

    if (existingUnit) {
      return res.status(400).json({ 
        message: 'Unit number already exists for this property' 
      });
    }

    // Check room capacity limits
    const { numberOfRooms, numberOfToilets } = req.body.unitDetails;
    
    // Get current total rooms and toilets for this property
    const existingUnits = await RentalUnit.find({ property: req.body.property });
    const currentTotalRooms = existingUnits.reduce((sum, unit) => sum + unit.unitDetails.numberOfRooms, 0);
    const currentTotalToilets = existingUnits.reduce((sum, unit) => sum + unit.unitDetails.numberOfToilets, 0);
    
    // Check if adding this unit would exceed property capacity
    const propertyBedrooms = property.details.bedrooms || 0;
    const propertyBathrooms = property.details.bathrooms || 0;
    
    if (propertyBedrooms > 0 && (currentTotalRooms + numberOfRooms) > propertyBedrooms) {
      return res.status(400).json({ 
        message: `Cannot add unit: Property has only ${propertyBedrooms} bedrooms, but would have ${currentTotalRooms + numberOfRooms} total rooms across all units`,
        details: {
          propertyBedrooms,
          currentTotalRooms,
          newUnitRooms: numberOfRooms,
          totalAfterAdd: currentTotalRooms + numberOfRooms
        }
      });
    }
    
    if (propertyBathrooms > 0 && (currentTotalToilets + numberOfToilets) > propertyBathrooms) {
      return res.status(400).json({ 
        message: `Cannot add unit: Property has only ${propertyBathrooms} bathrooms, but would have ${currentTotalToilets + numberOfToilets} total toilets across all units`,
        details: {
          propertyBathrooms,
          currentTotalToilets,
          newUnitToilets: numberOfToilets,
          totalAfterAdd: currentTotalToilets + numberOfToilets
        }
      });
    }

    // Check if adding this unit would exceed the maximum number of rental units
    const maxUnits = property.buildingDetails.numberOfRentalUnits;
    if (existingUnits.length >= maxUnits) {
      return res.status(400).json({ 
        message: `Cannot add unit: Property is configured for maximum ${maxUnits} rental units, and ${existingUnits.length} units already exist`,
        details: {
          maxUnits,
          currentUnits: existingUnits.length,
          propertyName: property.name
        }
      });
    }

    const rentalUnit = new RentalUnit(req.body);
    await rentalUnit.save();

    res.status(201).json({ 
      message: 'Rental unit created successfully',
      rentalUnit 
    });
  } catch (error) {
    console.error('Create rental unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rental-units/:id
// @desc    Update rental unit
// @access  Private (Admin, Property Manager)
router.put('/:id', auth, [
  body('unitNumber').optional().trim().isLength({ min: 1 }).withMessage('Unit number cannot be empty'),
  body('floorNumber').optional().isInt({ min: 1 }).withMessage('Floor number must be a positive integer'),
  body('unitDetails.numberOfRooms').optional().isInt({ min: 1, max: 10 }).withMessage('Number of rooms must be between 1 and 10'),
  body('unitDetails.numberOfToilets').optional().isInt({ min: 1, max: 5 }).withMessage('Number of toilets must be between 1 and 5'),
  body('financial.rentAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('financial.depositAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Deposit amount must be a positive number'),
  body('status').optional().isIn(['available', 'occupied', 'maintenance', 'renovation']).withMessage('Invalid status')
], async (req, res) => {
  try {
    console.log('🔄 Update rental unit request:', {
      id: req.params.id,
      body: req.body,
      user: req.user._id
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const rentalUnit = await RentalUnit.findById(req.params.id);
    if (!rentalUnit) {
      return res.status(404).json({ message: 'Rental unit not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(rentalUnit.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updatedRentalUnit = await RentalUnit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('property', 'name address type');

    console.log('✅ Rental unit updated successfully:', updatedRentalUnit._id);
    res.json({ 
      message: 'Rental unit updated successfully',
      rentalUnit: updatedRentalUnit 
    });
  } catch (error) {
    console.error('❌ Update rental unit error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/rental-units/:id
// @desc    Delete rental unit
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const rentalUnit = await RentalUnit.findByIdAndDelete(req.params.id);

    if (!rentalUnit) {
      return res.status(404).json({ message: 'Rental unit not found' });
    }

    res.json({ message: 'Rental unit deleted successfully' });
  } catch (error) {
    console.error('Delete rental unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rental-units/property/:propertyId
// @desc    Get rental units for a specific property
// @access  Private
router.get('/property/:propertyId', auth, checkPropertyAccess, async (req, res) => {
  try {
    console.log('🔍 Getting rental units for property:', req.params.propertyId);
    
    // First, let's check if the property exists
    const property = await Property.findById(req.params.propertyId);
    console.log('🏠 Property found:', property ? `${property.name} (${property._id})` : 'NOT FOUND');
    
    // Check all rental units in the database
    const allUnits = await RentalUnit.find({});
    console.log(`📊 Total rental units in database: ${allUnits.length}`);
    
    // Check units for this specific property
    const rentalUnits = await RentalUnit.find({ property: req.params.propertyId })
      .populate('property', 'name address type')
      .sort({ floorNumber: 1, unitNumber: 1 });

    console.log(`📋 Found ${rentalUnits.length} rental units for property ${req.params.propertyId}`);
    
    // Debug: Show details of each unit found
    rentalUnits.forEach((unit, index) => {
      console.log(`   Unit ${index + 1}: ${unit.unitNumber} (Floor ${unit.floorNumber}) - Status: ${unit.status}`);
    });
    
    // Debug: Check if there are units with different property references
    const unitsWithDifferentProperty = await RentalUnit.find({ 
      property: { $ne: req.params.propertyId } 
    });
    console.log(`🔍 Units with different property references: ${unitsWithDifferentProperty.length}`);
    
    res.json({ rentalUnits });
  } catch (dbError) {
    // If database is not available, return demo data
    console.log('Database not available, returning demo rental units data');
    
    const demoRentalUnits = [];
    
    // Add demo rental units for the demo properties
    if (req.params.propertyId === '507f1f77bcf86cd799439012') {
      // Ocean View Villa - 1 unit
      demoRentalUnits.push({
        _id: '507f1f77bcf86cd799439020',
        property: '507f1f77bcf86cd799439012',
        unitNumber: 'A1',
        floorNumber: 1,
        unitDetails: {
          numberOfRooms: 3,
          numberOfToilets: 2,
          squareFeet: 1200,
          description: 'Spacious villa with ocean view'
        },
        financial: {
          rentAmount: 15000,
          depositAmount: 30000,
          currency: 'MVR'
        },
        status: 'occupied',
        tenant: '507f1f77bcf86cd799439021',
        assets: [
          { name: 'AC', type: 'AC', condition: 'good' },
          { name: 'Fridge', type: 'Fridge', condition: 'excellent' }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (req.params.propertyId === '507f1f77bcf86cd799439013') {
      // City Center Apartment - 2 units (out of 8)
      demoRentalUnits.push(
        {
          _id: '507f1f77bcf86cd799439022',
          property: '507f1f77bcf86cd799439013',
          unitNumber: '101',
          floorNumber: 1,
          unitDetails: {
            numberOfRooms: 2,
            numberOfToilets: 1,
            squareFeet: 800,
            description: 'Modern apartment unit'
          },
          financial: {
            rentAmount: 8000,
            depositAmount: 16000,
            currency: 'MVR'
          },
          status: 'available',
          tenant: null,
          assets: [
            { name: 'AC', type: 'AC', condition: 'good' },
            { name: 'Sofa', type: 'Sofa', condition: 'fair' }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439023',
          property: '507f1f77bcf86cd799439013',
          unitNumber: '201',
          floorNumber: 2,
          unitDetails: {
            numberOfRooms: 2,
            numberOfToilets: 1,
            squareFeet: 800,
            description: 'Modern apartment unit'
          },
          financial: {
            rentAmount: 8500,
            depositAmount: 17000,
            currency: 'MVR'
          },
          status: 'occupied',
          tenant: '507f1f77bcf86cd799439024',
          assets: [
            { name: 'AC', type: 'AC', condition: 'excellent' },
            { name: 'TV', type: 'TV', condition: 'good' }
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }
    
    console.log(`Returning ${demoRentalUnits.length} demo rental units for property ${req.params.propertyId}`);
    res.json({ rentalUnits: demoRentalUnits });
  }
});

// @route   POST /api/rental-units/:id/assets
// @desc    Add asset to rental unit
// @access  Private
router.post('/:id/assets', auth, async (req, res) => {
  try {
    const { assetId } = req.body;
    
    
    if (!assetId) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID is required'
      });
    }

    const rentalUnit = await RentalUnit.findById(req.params.id);
    if (!rentalUnit) {
      return res.status(404).json({
        success: false,
        message: 'Rental unit not found'
      });
    }

    // Check if asset is already assigned to this unit - handle corrupted data structure
    const existingAsset = rentalUnit.assets.find(asset => {
      if (asset.asset) {
        return asset.asset.toString() === assetId;
      }
      if (asset.buffer) {
        const assetIdFromBuffer = new mongoose.Types.ObjectId(asset.buffer);
        return assetIdFromBuffer.toString() === assetId;
      }
      return asset.toString() === assetId;
    });
    
    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: 'Asset is already assigned to this unit'
      });
    }

    // Add asset to unit with default status
    rentalUnit.assets.push({
      asset: new mongoose.Types.ObjectId(assetId),
      status: 'Working',
      quantity: 1,
      notes: '',
      addedDate: new Date()
    });
    await rentalUnit.save();

    // Populate the updated unit with asset details
    const updatedUnit = await RentalUnit.findById(req.params.id)
      .populate('assets.asset')
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Asset added to rental unit successfully',
      data: { rentalUnit: updatedUnit }
    });
  } catch (error) {
    console.error('Error adding asset to rental unit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding asset to rental unit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/rental-units/:id/assets/:assetId
// @desc    Remove asset from rental unit
// @access  Private
router.delete('/:id/assets/:assetId', auth, async (req, res) => {
  try {
    const rentalUnit = await RentalUnit.findById(req.params.id);
    if (!rentalUnit) {
      return res.status(404).json({
        success: false,
        message: 'Rental unit not found'
      });
    }

    // Remove asset from unit - handle both old and new data structures
    const originalLength = rentalUnit.assets.length;
    rentalUnit.assets = rentalUnit.assets.filter(asset => {
      // Handle new structure: asset.asset (ObjectId)
      if (asset.asset) {
        return asset.asset.toString() !== req.params.assetId;
      }
      // Handle corrupted structure: asset with buffer field
      if (asset.buffer) {
        // Convert buffer back to ObjectId for comparison
        const assetIdFromBuffer = new mongoose.Types.ObjectId(asset.buffer);
        return assetIdFromBuffer.toString() !== req.params.assetId;
      }
      // Handle old structure: asset (ObjectId directly)
      return asset.toString() !== req.params.assetId;
    });


    if (rentalUnit.assets.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found in this rental unit'
      });
    }

    await rentalUnit.save();

    // Populate the updated unit with asset details
    const updatedUnit = await RentalUnit.findById(req.params.id)
      .populate('assets.asset')
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Asset removed from rental unit successfully',
      data: { rentalUnit: updatedUnit }
    });
  } catch (error) {
    console.error('Error removing asset from rental unit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing asset from rental unit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/rental-units/:id/assets/:assetId/status
// @desc    Update asset status in rental unit
// @access  Private
router.put('/:id/assets/:assetId/status', auth, [
  body('status').isIn(['Working', 'Faulty', 'Repaired', 'Replaced']).withMessage('Status must be Working, Faulty, Repaired, or Replaced'),
  body('issueNotes').optional().trim().isLength({ max: 500 }).withMessage('Issue notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { status, issueNotes } = req.body;

    const rentalUnit = await RentalUnit.findById(req.params.id);
    if (!rentalUnit) {
      return res.status(404).json({
        success: false,
        message: 'Rental unit not found'
      });
    }

    // Find the asset in the unit - handle corrupted data structure
    const assetIndex = rentalUnit.assets.findIndex(asset => {
      if (asset.asset) {
        return asset.asset.toString() === req.params.assetId;
      }
      if (asset.buffer) {
        const assetIdFromBuffer = new mongoose.Types.ObjectId(asset.buffer);
        return assetIdFromBuffer.toString() === req.params.assetId;
      }
      return asset.toString() === req.params.assetId;
    });

    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found in this rental unit'
      });
    }

    // Update asset status and issue notes
    rentalUnit.assets[assetIndex].status = status;
    rentalUnit.assets[assetIndex].notes = status === 'Faulty' ? (issueNotes || '') : '';

    await rentalUnit.save();

    // Populate the updated unit with asset details
    const updatedUnit = await RentalUnit.findById(req.params.id)
      .populate('assets.asset')
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Asset status updated successfully',
      data: { rentalUnit: updatedUnit }
    });
  } catch (error) {
    console.error('Error updating asset status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating asset status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/rental-units/:id/assets/:assetId
// @desc    Update asset in rental unit
// @access  Private
router.put('/:id/assets/:assetId', auth, [
  body('quantity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('status').optional({ nullable: true }).isIn(['Working', 'Faulty', 'Repaired', 'Replaced', 'working', 'faulty']).withMessage('Status must be Working, Faulty, Repaired, or Replaced'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    console.log('Update asset request:', req.params);
    console.log('Update asset body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { quantity, status, notes } = req.body;

    const rentalUnit = await RentalUnit.findById(req.params.id);
    if (!rentalUnit) {
      return res.status(404).json({
        success: false,
        message: 'Rental unit not found'
      });
    }

    // Find the asset in the unit - handle corrupted data structure
    const assetIndex = rentalUnit.assets.findIndex(asset => {
      if (asset.asset) {
        return asset.asset.toString() === req.params.assetId;
      }
      if (asset.buffer) {
        const assetIdFromBuffer = new mongoose.Types.ObjectId(asset.buffer);
        return assetIdFromBuffer.toString() === req.params.assetId;
      }
      return asset.toString() === req.params.assetId;
    });

    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found in this rental unit'
      });
    }

    // Check if status is changing to Faulty
    const previousStatus = rentalUnit.assets[assetIndex].status;
    const isChangingToFaulty = (status === 'Faulty' || status === 'faulty') && (previousStatus !== 'Faulty' && previousStatus !== 'faulty');

    // Update asset fields (only fields that exist in RentalUnit assets schema)
    if (quantity !== undefined && quantity !== null && quantity > 0) {
      rentalUnit.assets[assetIndex].quantity = quantity;
    }
    if (status !== undefined && status !== null && status !== '') {
      // Normalize status values to new format
      const normalizedStatus = status === 'working' ? 'Working' : 
                             status === 'faulty' ? 'Faulty' : 
                             status;
      rentalUnit.assets[assetIndex].status = normalizedStatus;
    }
    if (notes !== undefined && notes !== null) {
      rentalUnit.assets[assetIndex].notes = notes || '';
    }

    await rentalUnit.save();

    // Create maintenance request if status changed to Faulty
    if (isChangingToFaulty) {
      try {
        console.log('Creating maintenance request for faulty asset...');
        console.log('User object:', req.user);
        console.log('Property ID:', rentalUnit.property);
        console.log('Tenant ID:', rentalUnit.tenant);
        
        const asset = await Asset.findById(req.params.assetId);
        console.log('Asset found:', asset?.name);
        
        const maintenanceRequest = new MaintenanceRequest({
          property: rentalUnit.property,
          tenant: rentalUnit.tenant,
          asset: req.params.assetId,
          title: `Asset Maintenance Required: ${asset?.name || 'Unknown Asset'}`,
          description: notes || `Asset "${asset?.name || 'Unknown Asset'}" in Unit ${rentalUnit.unitNumber}, Floor ${rentalUnit.floorNumber} has been marked as faulty and requires maintenance.`,
          priority: 'medium',
          category: 'appliance',
          status: 'pending',
          createdBy: req.user._id || req.user.id
        });

        console.log('Maintenance request object:', maintenanceRequest);
        await maintenanceRequest.save();
        console.log(`Maintenance request created for faulty asset: ${req.params.assetId}`);
      } catch (maintenanceError) {
        console.error('Error creating maintenance request:', maintenanceError);
        console.error('Maintenance error details:', maintenanceError.message);
        console.error('Maintenance error stack:', maintenanceError.stack);
        // Don't fail the asset update if maintenance request creation fails
      }
    }

    // Populate the updated unit with asset details
    const updatedUnit = await RentalUnit.findById(req.params.id)
      .populate('assets.asset')
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: { rentalUnit: updatedUnit }
    });
  } catch (error) {
    console.error('Update asset error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/rental-units/property/:propertyId/capacity
// @desc    Get capacity information for a property
// @access  Private
router.get('/property/:propertyId/capacity', auth, checkPropertyAccess, async (req, res) => {
  try {
    console.log('🔍 Getting capacity info for property:', req.params.propertyId);
    
    const property = await Property.findById(req.params.propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const existingUnits = await RentalUnit.find({ property: req.params.propertyId });
    
    const currentTotalRooms = existingUnits.reduce((sum, unit) => sum + unit.unitDetails.numberOfRooms, 0);
    const currentTotalToilets = existingUnits.reduce((sum, unit) => sum + unit.unitDetails.numberOfToilets, 0);
    
    const capacityInfo = {
      property: {
        id: property._id,
        name: property.name,
        bedrooms: property.details.bedrooms || 0,
        bathrooms: property.details.bathrooms || 0,
        maxUnits: property.buildingDetails.numberOfRentalUnits
      },
      current: {
        totalUnits: existingUnits.length,
        totalRooms: currentTotalRooms,
        totalToilets: currentTotalToilets
      },
      remaining: {
        units: Math.max(0, property.buildingDetails.numberOfRentalUnits - existingUnits.length),
        rooms: Math.max(0, (property.details.bedrooms || 0) - currentTotalRooms),
        toilets: Math.max(0, (property.details.bathrooms || 0) - currentTotalToilets)
      },
      canAddMore: {
        units: existingUnits.length < property.buildingDetails.numberOfRentalUnits,
        rooms: property.details.bedrooms ? currentTotalRooms < property.details.bedrooms : true,
        toilets: property.details.bathrooms ? currentTotalToilets < property.details.bathrooms : true
      }
    };
    
    console.log('📊 Capacity info:', capacityInfo);
    res.json({ success: true, capacityInfo });
  } catch (error) {
    console.error('❌ Get capacity info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/rental-units/debug/all
// @desc    Debug endpoint to check all rental units
// @access  Private (Admin only)
router.get('/debug/all', auth, authorize('admin'), async (req, res) => {
  try {
    const allUnits = await RentalUnit.find({})
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName');
    
    console.log('🔍 DEBUG: All rental units in database:');
    allUnits.forEach((unit, index) => {
      console.log(`   ${index + 1}. Unit ${unit.unitNumber} - Property: ${unit.property?.name || 'NO PROPERTY'} - Tenant: ${unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : 'NONE'}`);
    });
    
    res.json({
      success: true,
      totalUnits: allUnits.length,
      units: allUnits.map(unit => ({
        id: unit._id,
        unitNumber: unit.unitNumber,
        floorNumber: unit.floorNumber,
        property: unit.property?.name || 'NO PROPERTY',
        propertyId: unit.property?._id || 'NO PROPERTY ID',
        tenant: unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : 'NONE',
        status: unit.status
      }))
    });
  } catch (error) {
    console.error('Debug all units error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/rental-units/fix-status
// @desc    Fix rental unit statuses - set occupied for units with tenants
// @access  Private (Admin only)
router.post('/fix-status', auth, authorize('admin'), async (req, res) => {
  try {
    // Find units that have tenants but status is not 'occupied'
    const unitsToFix = await RentalUnit.find({
      tenant: { $ne: null },
      status: { $ne: 'occupied' }
    });

    if (unitsToFix.length === 0) {
      return res.json({
        success: true,
        message: 'No rental units need status fixing',
        fixed: 0
      });
    }

    // Update their status to 'occupied'
    const result = await RentalUnit.updateMany(
      { tenant: { $ne: null }, status: { $ne: 'occupied' } },
      { status: 'occupied' }
    );

    res.json({
      success: true,
      message: `Fixed status for ${result.modifiedCount} rental units`,
      fixed: result.modifiedCount
    });
  } catch (error) {
    console.error('Fix rental unit status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
