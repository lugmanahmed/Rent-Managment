const express = require('express');
const { body, validationResult } = require('express-validator');
const Settings = require('../models/Settings');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');
const cronService = require('../services/cronService');

const router = express.Router();

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne({ isActive: true })
      .populate('company', 'companyName gstTin');

    if (!settings) {
      // Create default settings if none exist
      const defaultCompany = await Company.findOne({ isActive: true });
      if (!defaultCompany) {
        return res.status(404).json({ message: 'No company found. Please create a company first.' });
      }

      settings = new Settings({
        company: defaultCompany._id,
        globalSettings: {
          defaultCurrency: 'MVR',
          dateFormat: 'DD/MM/YYYY',
          timezone: 'Indian/Maldives',
          language: 'en'
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          rentReminderDays: 7,
          maintenanceReminderDays: 3,
          overdueReminderDays: 3,
          leaseExpiryReminderDays: 30
        },
        leaseSettings: {
          defaultLeaseDuration: 12,
          leaseDurationPresets: [
            { name: '6 Months', months: 6 },
            { name: '1 Year', months: 12 },
            { name: '2 Years', months: 24 },
            { name: '3 Years', months: 36 }
          ],
          autoRenewal: false,
          gracePeriodDays: 5
        },
        financialSettings: {
          lateFeePercentage: 5,
          lateFeeFixedAmount: 0,
          securityDepositMonths: 1,
          petDepositAmount: 0
        },
        systemSettings: {
          maxFileUploadSize: 10485760,
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
          backupFrequency: 'weekly',
          sessionTimeout: 480
        },
        rentSettings: {
          autoGenerateRent: false,
          rentGenerationDay: 1,
          rentDueDays: 7,
          includeUtilities: false,
          utilitiesPercentage: 0
        }
      });

      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (Admin only)
router.put('/', auth, authorize('admin'), [
  body('globalSettings.defaultCurrency').optional().isIn(['MVR', 'USD', 'EUR']).withMessage('Invalid currency'),
  body('globalSettings.dateFormat').optional().isIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).withMessage('Invalid date format'),
  body('globalSettings.language').optional().isIn(['en', 'dv']).withMessage('Invalid language'),
  body('notificationSettings.emailNotifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('notificationSettings.smsNotifications').optional().isBoolean().withMessage('SMS notifications must be boolean'),
  body('notificationSettings.rentReminderDays').optional().isInt({ min: 1, max: 30 }).withMessage('Rent reminder days must be between 1 and 30'),
  body('leaseSettings.defaultLeaseDuration').optional().isInt({ min: 1 }).withMessage('Default lease duration must be a positive integer'),
  body('financialSettings.lateFeePercentage').optional().isFloat({ min: 0, max: 20 }).withMessage('Late fee percentage must be between 0 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let settings = await Settings.findOne({ isActive: true });

    if (!settings) {
      // Create new settings if none exist
      const defaultCompany = await Company.findOne({ isActive: true });
      if (!defaultCompany) {
        return res.status(400).json({ message: 'No company found. Please create a company first.' });
      }

      settings = new Settings({
        company: defaultCompany._id,
        ...req.body
      });
    } else {
      // Update existing settings
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          settings[key] = { ...settings[key], ...req.body[key] };
        }
      });
    }

    await settings.save();

    // Restart cron job if rent settings changed
    if (req.body.rentSettings) {
      try {
        await cronService.restartRentGenerationJob();
        console.log('Rent generation cron job restarted due to settings change');
      } catch (error) {
        console.error('Error restarting cron job:', error);
      }
    }

    res.json({ 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/settings/dropdowns
// @desc    Get dropdown options for forms
// @access  Private
router.get('/dropdowns', auth, async (req, res) => {
  try {
    const dropdownOptions = {
      cities: [
        'Malé',
        'Addu',
        'Fuvahmulah',
        'Kulhudhuffushi',
        'Thinadhoo',
        'Eydhafushi',
        'Rasdhoo',
        'Mahibadhoo',
        'Dhigurah',
        'Dharavandhoo'
      ],
      islands: {
        'Malé': ['Malé', 'Hulhumalé', 'Vilimalé'],
        'Addu': ['Addu City', 'Hithadhoo', 'Maradhoo', 'Feydhoo', 'Hulhudhoo', 'Meedhoo'],
        'Fuvahmulah': ['Fuvahmulah'],
        'Kulhudhuffushi': ['Kulhudhuffushi'],
        'Thinadhoo': ['Thinadhoo'],
        'Eydhafushi': ['Eydhafushi'],
        'Rasdhoo': ['Rasdhoo'],
        'Mahibadhoo': ['Mahibadhoo'],
        'Dhigurah': ['Dhigurah'],
        'Dharavandhoo': ['Dharavandhoo']
      },
      currencies: ['MVR', 'USD', 'EUR'],
      roomNumbers: Array.from({ length: 10 }, (_, i) => i + 1),
      toiletNumbers: Array.from({ length: 5 }, (_, i) => i + 1),
      assetTypes: [
        'AC',
        'Fridge',
        'Sofa',
        'TV',
        'Washing Machine',
        'Microwave',
        'Dining Table',
        'Bed',
        'Wardrobe',
        'Other'
      ],
      propertyTypes: ['house', 'apartment', 'commercial'],
      unitStatuses: ['available', 'occupied', 'maintenance', 'renovation'],
      propertyStatuses: ['occupied', 'vacant', 'maintenance', 'renovation'],
      tenantStatuses: ['active', 'inactive', 'evicted', 'moved_out'],
      paymentMethods: ['bank_transfer', 'cash', 'check', 'online', 'other'],
      paymentStatuses: ['pending', 'paid', 'overdue', 'partial', 'cancelled'],
      maintenancePriorities: ['low', 'medium', 'high', 'emergency'],
      maintenanceCategories: ['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'cosmetic', 'other'],
      maintenanceStatuses: ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'],
      userRoles: ['admin', 'property_manager', 'accountant']
    };

    res.json({ dropdownOptions });
  } catch (error) {
    console.error('Get dropdown options error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
