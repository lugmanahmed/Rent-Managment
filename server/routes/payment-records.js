const express = require('express');
const { body, validationResult } = require('express-validator');
const PaymentRecord = require('../models/PaymentRecord');
const RentalUnit = require('../models/RentalUnit');
const PaymentType = require('../models/PaymentType');
const PaymentMode = require('../models/PaymentMode');
const Currency = require('../models/Currency');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payment-records
// @desc    Get all payment records with pagination and filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.unitId) {
      filter.unitId = req.query.unitId;
    }
    
    if (req.query.paymentType) {
      filter.paymentType = req.query.paymentType;
    }
    
    if (req.query.paymentMode) {
      filter.paymentMode = req.query.paymentMode;
    }
    
    if (req.query.currency) {
      filter.currency = req.query.currency;
    }
    
    if (req.query.paidBy) {
      filter.paidBy = { $regex: req.query.paidBy, $options: 'i' };
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.paidDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const paymentRecords = await PaymentRecord.find(filter)
      .populate('unitId', 'unitNumber propertyId')
      .populate('unitId.propertyId', 'name address')
      .populate('paymentType', 'name')
      .populate('paymentMode', 'name')
      .populate('currency', 'code symbol name')
      .populate('createdBy', 'name email')
      .sort({ paidDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PaymentRecord.countDocuments(filter);

    res.json({
      success: true,
      data: {
        paymentRecords,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get payment records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-records/:id
// @desc    Get single payment record
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const paymentRecord = await PaymentRecord.findById(req.params.id)
      .populate('unitId', 'unitNumber propertyId')
      .populate('unitId.propertyId', 'name address')
      .populate('paymentType', 'name')
      .populate('paymentMode', 'name')
      .populate('currency', 'code symbol name')
      .populate('createdBy', 'name email');

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      data: paymentRecord
    });
  } catch (error) {
    console.error('Get payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payment-records
// @desc    Create new payment record
// @access  Private
router.post('/', auth, [
  body('unitId').isMongoId().withMessage('Valid unit ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('paymentType').isMongoId().withMessage('Valid payment type is required'),
  body('paymentMode').isMongoId().withMessage('Valid payment mode is required'),
  body('currency').isMongoId().withMessage('Valid currency is required'),
  body('paidBy').trim().notEmpty().withMessage('Paid by is required')
    .isLength({ max: 100 }).withMessage('Paid by cannot exceed 100 characters'),
  body('paidDate').optional().isISO8601().withMessage('Invalid date format'),
  body('mobileNo').optional().isLength({ max: 20 }).withMessage('Mobile number cannot exceed 20 characters'),
  body('blazNo').optional().isLength({ max: 50 }).withMessage('BLAZ number cannot exceed 50 characters'),
  body('accountName').optional().isLength({ max: 100 }).withMessage('Account name cannot exceed 100 characters'),
  body('accountNo').optional().isLength({ max: 50 }).withMessage('Account number cannot exceed 50 characters'),
  body('bank').optional().isLength({ max: 100 }).withMessage('Bank name cannot exceed 100 characters'),
  body('chequeNo').optional().isLength({ max: 50 }).withMessage('Cheque number cannot exceed 50 characters'),
  body('remarks').optional().isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      unitId,
      amount,
      paymentType,
      paymentMode,
      currency,
      paidBy,
      paidDate,
      mobileNo,
      blazNo,
      accountName,
      accountNo,
      bank,
      chequeNo,
      remarks
    } = req.body;

    // Verify that the rental unit exists
    const rentalUnit = await RentalUnit.findById(unitId);
    if (!rentalUnit) {
      return res.status(400).json({
        success: false,
        message: 'Rental unit not found'
      });
    }

    // Verify that payment type exists
    const paymentTypeDoc = await PaymentType.findById(paymentType);
    if (!paymentTypeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Verify that payment mode exists
    const paymentModeDoc = await PaymentMode.findById(paymentMode);
    if (!paymentModeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Verify that currency exists
    const currencyDoc = await Currency.findById(currency);
    if (!currencyDoc) {
      return res.status(400).json({
        success: false,
        message: 'Currency not found'
      });
    }

    const paymentRecordData = {
      unitId,
      amount,
      paymentType,
      paymentMode,
      currency,
      paidBy,
      paidDate: paidDate ? new Date(paidDate) : new Date(),
      mobileNo,
      blazNo,
      accountName,
      accountNo,
      bank,
      chequeNo,
      remarks,
      createdBy: req.user._id
    };

    const paymentRecord = new PaymentRecord(paymentRecordData);
    await paymentRecord.save();

    const populatedPaymentRecord = await PaymentRecord.findById(paymentRecord._id)
      .populate('unitId', 'unitNumber propertyId')
      .populate('unitId.propertyId', 'name address')
      .populate('paymentType', 'name')
      .populate('paymentMode', 'name')
      .populate('currency', 'code symbol name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedPaymentRecord
    });
  } catch (error) {
    console.error('Create payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payment-records/:id
// @desc    Update payment record
// @access  Private
router.put('/:id', auth, [
  body('unitId').optional().isMongoId().withMessage('Valid unit ID is required'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('paymentType').optional().isMongoId().withMessage('Valid payment type is required'),
  body('paymentMode').optional().isMongoId().withMessage('Valid payment mode is required'),
  body('currency').optional().isMongoId().withMessage('Valid currency is required'),
  body('paidBy').optional().trim().notEmpty().withMessage('Paid by cannot be empty')
    .isLength({ max: 100 }).withMessage('Paid by cannot exceed 100 characters'),
  body('paidDate').optional().isISO8601().withMessage('Invalid date format'),
  body('mobileNo').optional().isLength({ max: 20 }).withMessage('Mobile number cannot exceed 20 characters'),
  body('blazNo').optional().isLength({ max: 50 }).withMessage('BLAZ number cannot exceed 50 characters'),
  body('accountName').optional().isLength({ max: 100 }).withMessage('Account name cannot exceed 100 characters'),
  body('accountNo').optional().isLength({ max: 50 }).withMessage('Account number cannot exceed 50 characters'),
  body('bank').optional().isLength({ max: 100 }).withMessage('Bank name cannot exceed 100 characters'),
  body('chequeNo').optional().isLength({ max: 50 }).withMessage('Cheque number cannot exceed 50 characters'),
  body('remarks').optional().isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const paymentRecord = await PaymentRecord.findById(req.params.id);
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Check if user has permission to update (admin or creator)
    if (req.user.roleName !== 'admin' && paymentRecord.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this payment record'
      });
    }

    const updateData = {};
    const allowedFields = [
      'unitId', 'amount', 'paymentType', 'paymentMode', 'currency',
      'paidBy', 'paidDate', 'mobileNo', 'blazNo', 'accountName',
      'accountNo', 'bank', 'chequeNo', 'remarks'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'paidDate') {
          updateData[field] = new Date(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const updatedPaymentRecord = await PaymentRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('unitId', 'unitNumber propertyId')
      .populate('unitId.propertyId', 'name address')
      .populate('paymentType', 'name')
      .populate('paymentMode', 'name')
      .populate('currency', 'code symbol name')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: updatedPaymentRecord
    });
  } catch (error) {
    console.error('Update payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/payment-records/:id
// @desc    Delete payment record (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const paymentRecord = await PaymentRecord.findById(req.params.id);
    
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Check if user has permission to delete (admin or creator)
    if (req.user.roleName !== 'admin' && paymentRecord.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this payment record'
      });
    }

    // Soft delete by setting isActive to false
    await PaymentRecord.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Payment record deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-records/unit/:unitId
// @desc    Get payment records for a specific unit
// @access  Private
router.get('/unit/:unitId', auth, async (req, res) => {
  try {
    const paymentRecords = await PaymentRecord.find({ 
      unitId: req.params.unitId, 
      isActive: true 
    })
      .populate('paymentType', 'name')
      .populate('paymentMode', 'name')
      .populate('currency', 'code symbol name')
      .populate('createdBy', 'name email')
      .sort({ paidDate: -1 });

    res.json({
      success: true,
      data: paymentRecords
    });
  } catch (error) {
    console.error('Get unit payment records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/payment-records/summary
// @desc    Get payment summary statistics
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const totalAmount = await PaymentRecord.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentByType = await PaymentRecord.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$paymentType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'paymenttypes', localField: '_id', foreignField: '_id', as: 'paymentType' } },
      { $unwind: '$paymentType' },
      { $project: { name: '$paymentType.name', total: 1, count: 1 } }
    ]);

    const paymentByMode = await PaymentRecord.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$paymentMode', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'paymentmodes', localField: '_id', foreignField: '_id', as: 'paymentMode' } },
      { $unwind: '$paymentMode' },
      { $project: { name: '$paymentMode.name', total: 1, count: 1 } }
    ]);

    const recentPayments = await PaymentRecord.find({ isActive: true })
      .populate('unitId', 'unitNumber')
      .populate('paymentType', 'name')
      .populate('paymentMode', 'name')
      .populate('currency', 'code symbol')
      .sort({ paidDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalAmount: totalAmount[0]?.total || 0,
        paymentByType,
        paymentByMode,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
