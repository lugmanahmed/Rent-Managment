const express = require('express');
const { body, validationResult } = require('express-validator');
const PaymentMode = require('../models/PaymentMode');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payment-modes
// @desc    Get all payment modes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const paymentModes = await PaymentMode.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: paymentModes
    });
  } catch (error) {
    console.error('Get payment modes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-modes/all
// @desc    Get all payment modes including inactive
// @access  Private (Admin only)
router.get('/all', auth, authorize(['admin']), async (req, res) => {
  try {
    const paymentModes = await PaymentMode.find()
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: paymentModes
    });
  } catch (error) {
    console.error('Get all payment modes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-modes/:id
// @desc    Get single payment mode
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const paymentMode = await PaymentMode.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    res.json({
      success: true,
      data: paymentMode
    });
  } catch (error) {
    console.error('Get payment mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payment-modes
// @desc    Create new payment mode
// @access  Private (Admin only)
router.post('/', auth, authorize(['admin']), [
  body('name').trim().notEmpty().withMessage('Payment mode name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, sortOrder } = req.body;

    // Check if payment mode already exists
    const existingPaymentMode = await PaymentMode.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingPaymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode with this name already exists'
      });
    }

    const paymentModeData = {
      name,
      sortOrder: sortOrder || 0,
      createdBy: req.user._id
    };

    const paymentMode = new PaymentMode(paymentModeData);
    await paymentMode.save();

    const populatedPaymentMode = await PaymentMode.findById(paymentMode._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedPaymentMode
    });
  } catch (error) {
    console.error('Create payment mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payment-modes/:id
// @desc    Update payment mode
// @access  Private (Admin only)
router.put('/:id', auth, authorize(['admin']), [
  body('name').optional().trim().notEmpty().withMessage('Payment mode name cannot be empty')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
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

    const { name, sortOrder, isActive } = req.body;

    // Check if payment mode exists
    const existingPaymentMode = await PaymentMode.findById(req.params.id);
    if (!existingPaymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name.toLowerCase() !== existingPaymentMode.name.toLowerCase()) {
      const nameConflict = await PaymentMode.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Payment mode with this name already exists'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const paymentMode = await PaymentMode.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      data: paymentMode
    });
  } catch (error) {
    console.error('Update payment mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/payment-modes/:id
// @desc    Delete payment mode (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const paymentMode = await PaymentMode.findById(req.params.id);
    
    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Soft delete by setting isActive to false
    await PaymentMode.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Payment mode deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payment-modes/reorder
// @desc    Reorder payment modes
// @access  Private (Admin only)
router.post('/reorder', auth, authorize(['admin']), [
  body('paymentModes').isArray().withMessage('Payment modes must be an array'),
  body('paymentModes.*.id').isMongoId().withMessage('Invalid payment mode ID'),
  body('paymentModes.*.sortOrder').isInt({ min: 0 }).withMessage('Invalid sort order')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { paymentModes } = req.body;

    // Update sort orders
    const updatePromises = paymentModes.map(paymentMode => 
      PaymentMode.findByIdAndUpdate(paymentMode.id, { sortOrder: paymentMode.sortOrder })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Payment modes reordered successfully'
    });
  } catch (error) {
    console.error('Reorder payment modes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
