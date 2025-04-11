const express = require('express');
const { 
  updateProfile, 
  changePassword, 
  deleteAccount 
} = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Input validation
const { body } = require('express-validator');

// Password validation
const passwordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must include lowercase, uppercase, number, and special character')
];

// Profile validation
const profileValidation = [
  body('name')
    .optional()
    .notEmpty().withMessage('Name cannot be empty if provided')
    .trim()
    .escape(),
  body('email')
    .optional()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
];

// Routes
router.put('/profile', protect, profileValidation, updateProfile);
router.put('/password', protect, passwordValidation, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router; 