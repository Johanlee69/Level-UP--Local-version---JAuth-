const express = require('express');
const { register, login, googleAuth, getMe, logout } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Input validation middleware
const { body } = require('express-validator');

// Registration validation
const registerValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .escape(),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must include lowercase, uppercase, number, and special character')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router; 