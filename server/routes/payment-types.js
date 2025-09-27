const express = require('express');
const { body, validationResult } = require('express-validator');
const PaymentType = require('../models/PaymentType');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payment-types
// @desc    Get all payment types
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const paymentTypes = await PaymentType.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: paymentTypes
    });
  } catch (error) {
    console.error('Get payment types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-types/all
// @desc    Get all payment types including inactive
// @access  Private (Admin only)
router.get('/all', auth, authorize(['admin']), async (req, res) => {
  try {
    const paymentTypes = await PaymentType.find()
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: paymentTypes
    });
  } catch (error) {
    console.error('Get all payment types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-types/:id
// @desc    Get single payment type
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const paymentType = await PaymentType.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    res.json({
      success: true,
      data: paymentType
    });
  } catch (error) {
    console.error('Get payment type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payment-types
// @desc    Create new payment type
// @access  Private (Admin only)
router.post('/', auth, authorize(['admin']), [
  body('name').trim().notEmpty().withMessage('Payment type name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, sortOrder, description } = req.body;

    // Check if payment type already exists
    const existingPaymentType = await PaymentType.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingPaymentType) {
      return res.status(400).json({
        success: false,
        message: 'Payment type with this name already exists'
      });
    }

    const paymentTypeData = {
      name,
      sortOrder: sortOrder || 0,
      description: description || '',
      createdBy: req.user._id
    };

    const paymentType = new PaymentType(paymentTypeData);
    await paymentType.save();

    const populatedPaymentType = await PaymentType.findById(paymentType._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedPaymentType
    });
  } catch (error) {
    console.error('Create payment type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payment-types/:id
// @desc    Update payment type
// @access  Private (Admin only)
router.put('/:id', auth, authorize(['admin']), [
  body('name').optional().trim().notEmpty().withMessage('Payment type name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
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

    const { name, sortOrder, description, isActive } = req.body;

    // Check if payment type exists
    const existingPaymentType = await PaymentType.findById(req.params.id);
    if (!existingPaymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== existingPaymentType.name) {
      const nameConflict = await PaymentType.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Payment type with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const paymentType = await PaymentType.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: paymentType
    });
  } catch (error) {
    console.error('Update payment type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/payment-types/:id
// @desc    Delete payment type (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const paymentType = await PaymentType.findById(req.params.id);
    
    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Soft delete by setting isActive to false
    await PaymentType.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Payment type deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payment-types/reorder
// @desc    Reorder payment types
// @access  Private (Admin only)
router.post('/reorder', auth, authorize(['admin']), [
  body('paymentTypes').isArray().withMessage('Payment types must be an array'),
  body('paymentTypes.*.id').isMongoId().withMessage('Invalid payment type ID'),
  body('paymentTypes.*.sortOrder').isInt({ min: 0 }).withMessage('Invalid sort order')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { paymentTypes } = req.body;

    // Update sort orders
    const updatePromises = paymentTypes.map(pt => 
      PaymentType.findByIdAndUpdate(pt.id, { sortOrder: pt.sortOrder })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Payment types reordered successfully'
    });
  } catch (error) {
    console.error('Reorder payment types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
