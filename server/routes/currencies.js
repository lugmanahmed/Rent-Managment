const express = require('express');
const { body, validationResult } = require('express-validator');
const Currency = require('../models/Currency');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/currencies
// @desc    Get all currencies
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const currencies = await Currency.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/currencies/all
// @desc    Get all currencies including inactive
// @access  Private (Admin only)
router.get('/all', auth, authorize(['admin']), async (req, res) => {
  try {
    const currencies = await Currency.find()
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get all currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/currencies/default
// @desc    Get default currency
// @access  Private
router.get('/default', auth, async (req, res) => {
  try {
    const defaultCurrency = await Currency.findOne({ isDefault: true, isActive: true });

    if (!defaultCurrency) {
      return res.status(404).json({
        success: false,
        message: 'No default currency found'
      });
    }

    res.json({
      success: true,
      data: defaultCurrency
    });
  } catch (error) {
    console.error('Get default currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/currencies/:id
// @desc    Get single currency
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    res.json({
      success: true,
      data: currency
    });
  } catch (error) {
    console.error('Get currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/currencies
// @desc    Create new currency
// @access  Private (Admin only)
router.post('/', auth, authorize(['admin']), [
  body('code').trim().notEmpty().withMessage('Currency code is required')
    .isLength({ min: 3, max: 3 }).withMessage('Currency code must be exactly 3 characters')
    .matches(/^[A-Z]{3}$/).withMessage('Currency code must be 3 uppercase letters'),
  body('name').trim().notEmpty().withMessage('Currency name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('symbol').trim().notEmpty().withMessage('Currency symbol is required')
    .isLength({ max: 10 }).withMessage('Symbol cannot exceed 10 characters'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('decimalPlaces').optional().isInt({ min: 0, max: 4 }).withMessage('Decimal places must be between 0 and 4')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code, name, symbol, sortOrder, decimalPlaces, isDefault } = req.body;

    // Check if currency already exists
    const existingCurrency = await Currency.findOne({ 
      code: code.toUpperCase() 
    });

    if (existingCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Currency with this code already exists'
      });
    }

    const currencyData = {
      code: code.toUpperCase(),
      name,
      symbol,
      sortOrder: sortOrder || 0,
      decimalPlaces: decimalPlaces || 2,
      isDefault: isDefault || false,
      createdBy: req.user._id
    };

    const currency = new Currency(currencyData);
    await currency.save();

    const populatedCurrency = await Currency.findById(currency._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedCurrency
    });
  } catch (error) {
    console.error('Create currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/currencies/:id
// @desc    Update currency
// @access  Private (Admin only)
router.put('/:id', auth, authorize(['admin']), [
  body('code').optional().trim().notEmpty().withMessage('Currency code cannot be empty')
    .isLength({ min: 3, max: 3 }).withMessage('Currency code must be exactly 3 characters')
    .matches(/^[A-Z]{3}$/).withMessage('Currency code must be 3 uppercase letters'),
  body('name').optional().trim().notEmpty().withMessage('Currency name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('symbol').optional().trim().notEmpty().withMessage('Currency symbol cannot be empty')
    .isLength({ max: 10 }).withMessage('Symbol cannot exceed 10 characters'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('decimalPlaces').optional().isInt({ min: 0, max: 4 }).withMessage('Decimal places must be between 0 and 4'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code, name, symbol, sortOrder, decimalPlaces, isActive, isDefault } = req.body;

    // Check if currency exists
    const existingCurrency = await Currency.findById(req.params.id);
    if (!existingCurrency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    // Check if code is being changed and if it conflicts with existing
    if (code && code.toUpperCase() !== existingCurrency.code) {
      const codeConflict = await Currency.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (codeConflict) {
        return res.status(400).json({
          success: false,
          message: 'Currency with this code already exists'
        });
      }
    }

    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (symbol !== undefined) updateData.symbol = symbol;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (decimalPlaces !== undefined) updateData.decimalPlaces = decimalPlaces;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const currency = await Currency.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: currency
    });
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/currencies/:id
// @desc    Delete currency (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    // Don't allow deletion of default currency
    if (currency.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default currency'
      });
    }

    // Soft delete by setting isActive to false
    await Currency.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Currency deleted successfully'
    });
  } catch (error) {
    console.error('Delete currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/currencies/reorder
// @desc    Reorder currencies
// @access  Private (Admin only)
router.post('/reorder', auth, authorize(['admin']), [
  body('currencies').isArray().withMessage('Currencies must be an array'),
  body('currencies.*.id').isMongoId().withMessage('Invalid currency ID'),
  body('currencies.*.sortOrder').isInt({ min: 0 }).withMessage('Invalid sort order')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currencies } = req.body;

    // Update sort orders
    const updatePromises = currencies.map(currency => 
      Currency.findByIdAndUpdate(currency.id, { sortOrder: currency.sortOrder })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Currencies reordered successfully'
    });
  } catch (error) {
    console.error('Reorder currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/currencies/:id/set-default
// @desc    Set currency as default
// @access  Private (Admin only)
router.post('/:id/set-default', auth, authorize(['admin']), async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    // Remove default from all currencies
    await Currency.updateMany({}, { isDefault: false });
    
    // Set this currency as default
    await Currency.findByIdAndUpdate(req.params.id, { isDefault: true });

    res.json({
      success: true,
      message: 'Default currency updated successfully'
    });
  } catch (error) {
    console.error('Set default currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
