const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/companies
// @desc    Get all companies
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .sort({ companyName: 1 });

    res.json({ companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/companies/:id
// @desc    Get single company
// @access  Private (Admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/companies
// @desc    Create new company
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('companyName').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('companyAddress.street').trim().isLength({ min: 1 }).withMessage('Street address is required'),
  body('companyAddress.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('companyAddress.island').trim().isLength({ min: 1 }).withMessage('Island is required'),
  body('gstTin').trim().isLength({ min: 1 }).withMessage('GST TIN is required'),
  body('contactInfo.telephone').trim().isLength({ min: 1 }).withMessage('Telephone is required'),
  body('contactInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = new Company(req.body);
    await company.save();

    res.status(201).json({ 
      message: 'Company created successfully',
      company 
    });
  } catch (error) {
    console.error('Create company error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Company with this GST TIN already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update company
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), [
  body('companyName').optional().trim().isLength({ min: 1 }).withMessage('Company name cannot be empty'),
  body('contactInfo.email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ 
      message: 'Company updated successfully',
      company 
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/companies/:id
// @desc    Delete company
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
