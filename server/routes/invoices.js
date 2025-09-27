const express = require('express');
const { body, validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const RentalUnit = require('../models/RentalUnit');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const { auth, authorize } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const path = require('path');

const router = express.Router();

// Generate unique invoice number
const generateInvoiceNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Find the last invoice for this month
  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^INV-${year}${month}` }
  }).sort({ invoiceNumber: -1 });
  
  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `INV-${year}${month}-${String(sequence).padStart(3, '0')}`;
};

// @route   GET /api/invoices
// @desc    Get all invoices with filtering and pagination
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
    
    // Property filter
    if (req.query.property) {
      filter.property = req.query.property;
    }
    
    // Tenant filter
    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.invoiceDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Search by invoice number
    if (req.query.search) {
      filter.invoiceNumber = { $regex: req.query.search, $options: 'i' };
    }

    const invoices = await Invoice.find(filter)
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/invoices/occupied-units-count
// @desc    Get count of occupied rental units
// @access  Private
router.get('/occupied-units-count', auth, async (req, res) => {
  try {
    // First try strict criteria
    let occupiedUnitsCount = await RentalUnit.countDocuments({ 
      status: 'occupied',
      tenant: { $ne: null }
    });
    
    // If no units found, try with just tenant assignment
    if (occupiedUnitsCount === 0) {
      const unitsWithTenants = await RentalUnit.countDocuments({ 
        tenant: { $ne: null }
      });
      
      if (unitsWithTenants > 0) {
        console.log(`No units with occupied status, but found ${unitsWithTenants} units with tenants`);
        occupiedUnitsCount = unitsWithTenants;
      }
    }
    
    console.log(`📊 Occupied units count: ${occupiedUnitsCount}`);
    
    res.json({
      success: true,
      data: {
        count: occupiedUnitsCount,
        message: occupiedUnitsCount > 0 
          ? `${occupiedUnitsCount} occupied rental units found` 
          : 'No occupied rental units found. Please assign tenants to rental units first.'
      }
    });
  } catch (error) {
    console.error('Get occupied units count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/invoices/cron-status
// @desc    Get cron job status for rent generation
// @access  Private
router.get('/cron-status', auth, async (req, res) => {
  try {
    const cronService = require('../services/cronService');
    
    // Get settings info for debugging
    const settingsInfo = await cronService.getSettingsInfo();
    console.log('Settings info:', settingsInfo);
    
    // Ensure the job is running
    await cronService.ensureJobRunning();
    
    const status = cronService.getJobStatus();
    console.log('Cron status:', status);
    
    res.json({
      success: true,
      data: {
        ...status,
        settingsInfo: settingsInfo
      }
    });
  } catch (error) {
    console.error('Get cron status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/invoices
// @desc    Create new invoice
// @access  Private
router.post('/', auth, [
  body('property').isMongoId().withMessage('Valid property ID is required'),
  body('rentalUnit').isMongoId().withMessage('Valid rental unit ID is required'),
  body('tenant').isMongoId().withMessage('Valid tenant ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('period.startDate').isISO8601().withMessage('Valid period start date is required'),
  body('period.endDate').isISO8601().withMessage('Valid period end date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Item amount must be positive'),
  body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('total').isFloat({ min: 0 }).withMessage('Total must be positive'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const invoiceData = {
      ...req.body,
      createdBy: req.user._id,
      subtotal: req.body.items.reduce((sum, item) => sum + item.amount, 0),
      tax: req.body.tax || 0
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/invoices/:id
// @desc    Update invoice
// @access  Private
router.put('/:id', auth, [
  body('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'check', 'online', 'other']).withMessage('Invalid payment method'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const updateData = { ...req.body };
    
    // If marking as paid, set paid date
    if (req.body.status === 'paid' && !req.body.paidDate) {
      updateData.paidDate = new Date();
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/invoices/:id
// @desc    Delete invoice
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be deleted'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/invoices/trigger-monthly-generation
// @desc    Manually trigger monthly rent generation
// @access  Private
router.post('/trigger-monthly-generation', auth, async (req, res) => {
  try {
    const cronService = require('../services/cronService');
    await cronService.triggerManualGeneration();
    
    res.json({
      success: true,
      message: 'Monthly rent generation triggered successfully'
    });
  } catch (error) {
    console.error('Trigger monthly generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/invoices/generate-rent
// @desc    Generate rent invoices for all occupied units
// @access  Private
router.post('/generate-rent', auth, async (req, res) => {
  try {
    const { periodStart, periodEnd, dueDate } = req.body;
    
    console.log('Generate rent request body:', req.body);
    console.log('Period start:', periodStart, 'Period end:', periodEnd, 'Due date:', dueDate);
    
    if (!periodStart || !periodEnd || !dueDate) {
      console.log('Missing required fields - periodStart:', !!periodStart, 'periodEnd:', !!periodEnd, 'dueDate:', !!dueDate);
      return res.status(400).json({
        success: false,
        message: 'Period start, end, and due date are required'
      });
    }

    // Debug: Check all rental units first
    const allUnits = await RentalUnit.find({}).populate('tenant', 'firstName lastName');
    console.log('🔍 All rental units in database:');
    allUnits.forEach((unit, index) => {
      console.log(`   ${index + 1}. Unit ${unit.unitNumber} - Status: ${unit.status} - Tenant: ${unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : 'NONE'}`);
    });

    // Find all occupied rental units
    const occupiedUnits = await RentalUnit.find({ 
      status: 'occupied',
      tenant: { $ne: null }
    })
      .populate('property', 'name address')
      .populate('tenant', 'firstName lastName email phone')
      .populate('assets.asset', 'name category');

    console.log(`Found ${occupiedUnits.length} occupied rental units`);
    
    // Also try alternative query in case status is wrong
    const unitsWithTenants = await RentalUnit.find({ 
      tenant: { $ne: null }
    }).populate('tenant', 'firstName lastName');
    
    console.log(`Found ${unitsWithTenants.length} units with tenants assigned`);
    console.log('Units with tenants:', unitsWithTenants.map(u => ({
      unitNumber: u.unitNumber,
      status: u.status,
      tenant: u.tenant ? `${u.tenant.firstName} ${u.tenant.lastName}` : 'NONE'
    })));
    
    // If no units found with strict criteria, try with just tenant assignment
    let finalOccupiedUnits = occupiedUnits;
    if (occupiedUnits.length === 0 && unitsWithTenants.length > 0) {
      console.log('No units with occupied status found, but found units with tenants. Using units with tenants.');
      finalOccupiedUnits = await RentalUnit.find({ 
        tenant: { $ne: null }
      })
        .populate('property', 'name address')
        .populate('tenant', 'firstName lastName email phone')
        .populate('assets.asset', 'name category');
    }
    
    if (finalOccupiedUnits.length === 0) {
      console.log('No occupied rental units found - returning 400 error');
      return res.status(400).json({
        success: false,
        message: 'No occupied rental units found. Please ensure there are units with tenants assigned.'
      });
    }

    console.log(`Found ${finalOccupiedUnits.length} occupied rental units for invoice generation`);

    const generatedInvoices = [];
    const skippedUnits = [];

    for (const unit of finalOccupiedUnits) {
      try {
        // Validate unit has required financial data
        if (!unit.financial || !unit.financial.rentAmount || unit.financial.rentAmount <= 0) {
          console.log(`Skipping unit ${unit.unitNumber} - missing or invalid rent amount`);
          skippedUnits.push({
            unitNumber: unit.unitNumber,
            property: unit.property?.name,
            reason: 'Missing or invalid rent amount'
          });
          continue;
        }

        // Check if invoice already exists for this period
        const existingInvoice = await Invoice.findOne({
          rentalUnit: unit._id,
          'period.startDate': new Date(periodStart),
          'period.endDate': new Date(periodEnd)
        });

        if (existingInvoice) {
          console.log(`Invoice already exists for unit ${unit.unitNumber} (${unit.property?.name})`);
          skippedUnits.push({
            unitNumber: unit.unitNumber,
            property: unit.property?.name,
            reason: 'Invoice already exists for this period'
          });
          continue; // Skip if invoice already exists
        }

        // Create rent item
        const rentItem = {
          description: `Rent for ${unit.unitNumber}, Floor ${unit.floorNumber}`,
          amount: unit.financial.rentAmount,
          quantity: 1,
          unitPrice: unit.financial.rentAmount
        };

        // Generate unique invoice number
        const invoiceNumber = await generateInvoiceNumber();
        
        const invoiceData = {
          invoiceNumber: invoiceNumber,
          property: unit.property._id,
          rentalUnit: unit._id,
          tenant: unit.tenant._id,
          invoiceDate: new Date(),
          dueDate: new Date(dueDate),
          period: {
            startDate: new Date(periodStart),
            endDate: new Date(periodEnd)
          },
          items: [rentItem],
          subtotal: unit.financial.rentAmount,
          tax: 0,
          total: unit.financial.rentAmount,
          currency: unit.financial.currency || 'MVR',
          status: 'draft',
          createdBy: req.user._id,
          isAutoGenerated: false // Manual generation
        };

        const invoice = new Invoice(invoiceData);
        await invoice.save();

        const populatedInvoice = await Invoice.findById(invoice._id)
          .populate('property', 'name address')
          .populate('rentalUnit', 'unitNumber floorNumber')
          .populate('tenant', 'firstName lastName email phone')
          .populate('createdBy', 'name email');

        generatedInvoices.push(populatedInvoice);
        console.log(`✅ Generated invoice ${invoice.invoiceNumber} for unit ${unit.unitNumber} (${unit.property?.name})`);
      } catch (unitError) {
        console.error(`❌ Error generating invoice for unit ${unit.unitNumber}:`, unitError.message);
      }
    }

    res.json({
      success: true,
      message: `Generated ${generatedInvoices.length} rent invoices${skippedUnits.length > 0 ? `, skipped ${skippedUnits.length} units` : ''}`,
      data: generatedInvoices,
      skippedUnits: skippedUnits,
      summary: {
        totalUnits: finalOccupiedUnits.length,
        generated: generatedInvoices.length,
        skipped: skippedUnits.length
      }
    });
  } catch (error) {
    console.error('Generate rent invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/invoices/overdue
// @desc    Get overdue invoices
// @access  Private
router.get('/overdue', auth, async (req, res) => {
  try {
    const today = new Date();
    
    const overdueInvoices = await Invoice.find({
      status: { $in: ['sent', 'draft'] },
      dueDate: { $lt: today }
    })
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: overdueInvoices
    });
  } catch (error) {
    console.error('Get overdue invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/invoices/:id/pdf
// @desc    Generate and download PDF for invoice
// @access  Private
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const pdfResult = await pdfService.generateInvoicePDF(invoice);
    
    // Update invoice with PDF path
    await Invoice.findByIdAndUpdate(req.params.id, {
      pdfGenerated: true,
      pdfPath: pdfResult.filePath
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
    res.send(pdfResult.buffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
});

// @route   POST /api/invoices/:id/send-email
// @desc    Send invoice via email
// @access  Private
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('property', 'name address')
      .populate('rentalUnit', 'unitNumber floorNumber')
      .populate('tenant', 'firstName lastName email phone')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (!invoice.tenant?.email) {
      return res.status(400).json({
        success: false,
        message: 'Tenant email not found'
      });
    }

    // Generate PDF if not already generated
    let pdfPath = invoice.pdfPath;
    if (!pdfPath) {
      const pdfResult = await pdfService.generateInvoicePDF(invoice);
      pdfPath = pdfResult.filePath;
      
      await Invoice.findByIdAndUpdate(req.params.id, {
        pdfGenerated: true,
        pdfPath: pdfPath
      });
    }

    // Send email
    await emailService.sendInvoiceEmail(invoice, pdfPath, invoice.tenant.email);
    
    // Update invoice status
    await Invoice.findByIdAndUpdate(req.params.id, {
      emailSent: true,
      emailSentDate: new Date(),
      status: 'sent'
    });

    res.json({
      success: true,
      message: 'Invoice sent successfully'
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email'
    });
  }
});

module.exports = router;
