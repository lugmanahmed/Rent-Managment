const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments with filtering
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
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.dueDate = {};
      if (req.query.startDate) {
        filter.dueDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.dueDate.$lte = new Date(req.query.endDate);
      }
    }

    const payments = await Payment.find(filter)
      .populate('tenant', 'personalInfo firstName personalInfo lastName')
      .populate('property', 'name address')
      .populate('createdBy', 'name')
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenant', 'personalInfo firstName personalInfo lastName personalInfo email')
      .populate('property', 'name address')
      .populate('createdBy', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(payment.property._id.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments
// @desc    Create new payment record
// @access  Private (Admin, Property Manager)
router.post('/', auth, authorize('admin', 'property_manager'), [
  body('tenant').isMongoId().withMessage('Valid tenant ID is required'),
  body('property').isMongoId().withMessage('Valid property ID is required'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('paymentMethod').isIn(['bank_transfer', 'cash', 'check', 'online', 'other']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify tenant and property exist and are linked
    const tenant = await Tenant.findById(req.body.tenant);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (tenant.property.toString() !== req.body.property) {
      return res.status(400).json({ message: 'Tenant is not associated with this property' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(req.body.property);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this property' });
      }
    }

    const payment = new Payment({
      ...req.body,
      createdBy: req.user._id
    });

    await payment.save();

    res.status(201).json({ 
      message: 'Payment record created successfully',
      payment 
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment record
// @access  Private (Admin, Property Manager)
router.put('/:id', auth, [
  body('amount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('status').optional().isIn(['pending', 'paid', 'overdue', 'partial', 'cancelled']).withMessage('Invalid status'),
  body('paymentMethod').optional().isIn(['bank_transfer', 'cash', 'check', 'online', 'other']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(payment.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // If marking as paid, set paid date
    if (req.body.status === 'paid' && !payment.paidDate) {
      req.body.paidDate = new Date();
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('tenant', 'personalInfo firstName personalInfo lastName')
     .populate('property', 'name address');

    res.json({ 
      message: 'Payment updated successfully',
      payment: updatedPayment 
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment record
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/:id/mark-paid
// @desc    Mark payment as paid
// @access  Private (Admin, Property Manager)
router.post('/:id/mark-paid', auth, [
  body('paidDate').optional().isISO8601().withMessage('Valid paid date is required'),
  body('reference').optional().trim().isLength({ min: 1 }).withMessage('Reference cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check property access
    if (req.user.role === 'property_manager') {
      const hasAccess = req.user.assignedProperties.includes(payment.property.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    payment.status = 'paid';
    payment.paidDate = req.body.paidDate || new Date();
    if (req.body.reference) {
      payment.reference = req.body.reference;
    }

    await payment.save();

    res.json({ 
      message: 'Payment marked as paid successfully',
      payment 
    });
  } catch (error) {
    console.error('Mark payment as paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/overdue
// @desc    Get overdue payments
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const filter = {
      status: 'overdue',
      dueDate: { $lt: new Date() }
    };
    
    // Role-based filtering
    if (req.user.role === 'property_manager') {
      const userProperties = await Property.find({ assignedManager: req.user._id }).select('_id');
      filter.property = { $in: userProperties.map(p => p._id) };
    }

    const overduePayments = await Payment.find(filter)
      .populate('tenant', 'personalInfo firstName personalInfo lastName personalInfo email personalInfo phone')
      .populate('property', 'name address')
      .sort({ dueDate: 1 });

    res.json({ overduePayments });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
