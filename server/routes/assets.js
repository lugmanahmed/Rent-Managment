const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Asset = require('../models/Asset');
const { auth } = require('../middleware/auth');

// @route   GET /api/assets
// @desc    Get all assets with search, filter, and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching assets with query:', req.query);
    
    // Check if MongoDB is available
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo data');
      return res.json({
        success: true,
        data: {
          assets: [
            {
              _id: 'demo-asset-1',
              name: 'Air Condition',
              brand: 'Hitachi',
              quantity: 1,
              purchaseCost: 15000,
              currency: 'MVR',
              type: 'fixed',
              category: 'appliance',
              status: 'active',
              condition: 'good',
              icon: '📦',
              createdAt: new Date(),
              createdBy: { _id: '507f1f77bcf86cd799439011', name: 'Demo User', email: 'demo@example.com' }
            },
            {
              _id: 'demo-asset-2',
              name: 'Sofa Set',
              brand: 'IKEA',
              quantity: 2,
              purchaseCost: 8000,
              currency: 'MVR',
              type: 'movable',
              category: 'furniture',
              status: 'active',
              condition: 'good',
              icon: '📦',
              createdAt: new Date(),
              createdBy: { _id: '507f1f77bcf86cd799439011', name: 'Demo User', email: 'demo@example.com' }
            }
          ],
          pagination: {
            current: 1,
            pages: 1,
            total: 2,
            limit: 10
          }
        }
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    console.log('Initial filter object:', filter);
    
    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
        { model: { $regex: req.query.search, $options: 'i' } },
        { serialNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Filter by type
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    // Filter by brand
    if (req.query.brand) {
      filter.brand = { $regex: req.query.brand, $options: 'i' };
    }
    
    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Filter by condition
    if (req.query.condition) {
      filter.condition = req.query.condition;
    }
    
    // Filter by currency
    if (req.query.currency) {
      filter.currency = req.query.currency;
    }
    
    console.log('Final filter object:', filter);
    
    // Sort options
    let sort = {};
    if (req.query.sortBy) {
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[req.query.sortBy] = sortOrder;
    } else {
      sort = { createdAt: -1 }; // Default sort by creation date
    }
    
    console.log('Filter object:', filter);
    const assets = await Asset.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Asset.countDocuments(filter);
    console.log(`Found ${assets.length} assets out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        assets,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching assets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/assets/categories
// @desc    Get asset categories with counts
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$currentValue' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching asset categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/assets/stats
// @desc    Get asset statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Check if MongoDB is available
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo stats');
      return res.json({
        success: true,
        data: {
          overview: {
            totalAssets: 2,
            totalValue: 23000,
            totalPurchaseCost: 23000,
            avgValue: 11500,
            avgPurchaseCost: 11500
          },
          byType: [
            { _id: 'fixed', count: 1, totalValue: 15000 },
            { _id: 'movable', count: 1, totalValue: 8000 }
          ],
          byCategory: [
            { _id: 'appliance', count: 1, totalValue: 15000 },
            { _id: 'furniture', count: 1, totalValue: 8000 }
          ],
          byStatus: [
            { _id: 'active', count: 2, totalValue: 23000 }
          ]
        }
      });
    }
    
    const stats = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalValue: { $sum: '$currentValue' },
          totalPurchaseCost: { $sum: '$purchaseCost' },
          avgValue: { $avg: '$currentValue' },
          avgPurchaseCost: { $avg: '$purchaseCost' }
        }
      }
    ]);
    
    const typeStats = await Asset.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalValue: { $sum: '$currentValue' }
        }
      }
    ]);
    
    const statusStats = await Asset.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$currentValue' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAssets: 0,
          totalValue: 0,
          totalPurchaseCost: 0,
          avgValue: 0,
          avgPurchaseCost: 0
        },
        byType: typeStats,
        byStatus: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching asset stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching asset statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/assets/:id
// @desc    Get single asset
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      data: { asset }
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/assets
// @desc    Create new asset
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating asset with data:', req.body);
    const assetData = {
      ...req.body,
      createdBy: req.user._id || req.user.id
    };
    
    console.log('Final asset data:', assetData);
    const asset = new Asset(assetData);
    await asset.save();
    
    await asset.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: { asset }
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Serial number already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update asset
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating asset:', req.params.id);
    console.log('Update data:', req.body);
    console.log('User ID:', req.user._id || req.user.id);
    
    const updateData = {
      ...req.body,
      updatedBy: req.user._id || req.user.id
    };
    
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').populate('updatedBy', 'name email');
    
    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: { asset }
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Serial number already exists'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete asset
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/assets/:id/maintenance
// @desc    Record maintenance for asset
// @access  Private
router.post('/:id/maintenance', auth, async (req, res) => {
  try {
    const { maintenanceCost, maintenanceDate, notes } = req.body;
    
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      {
        lastMaintenanceDate: maintenanceDate || new Date(),
        maintenanceCost: (asset?.maintenanceCost || 0) + (maintenanceCost || 0),
        notes: notes ? `${asset?.notes || ''}\n${new Date().toISOString()}: ${notes}`.trim() : asset?.notes,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').populate('updatedBy', 'name email');
    
    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Maintenance recorded successfully',
      data: { asset }
    });
  } catch (error) {
    console.error('Error recording maintenance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while recording maintenance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;