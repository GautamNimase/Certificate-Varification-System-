const express = require('express');
const router = express.Router();
const verifierAuthController = require('../controllers/verifierAuthController');
const { authenticate } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    next();
};

// ==================== PUBLIC ROUTES ====================

// POST /api/verifier/register - Register a new verifier
router.post('/register', [
    body('organization_name').trim().notEmpty().withMessage('Organization name is required'),
    body('verifier_name').trim().notEmpty().withMessage('Verifier name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('wallet_address').optional().isEthereumAddress().withMessage('Invalid Ethereum wallet address')
], validate, verifierAuthController.register);

// POST /api/verifier/login - Login verifier
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], validate, verifierAuthController.login);

// ==================== PROTECTED ROUTES ====================

// All routes below require authentication

// GET /api/verifier/profile - Get verifier profile
router.get('/profile', authenticate, verifierAuthController.getProfile);

// PUT /api/verifier/profile - Update verifier profile
router.put('/profile', authenticate, [
    body('organization_name').optional().trim().notEmpty().withMessage('Organization name cannot be empty'),
    body('verifier_name').optional().trim().notEmpty().withMessage('Verifier name cannot be empty'),
    body('wallet_address').optional().isEthereumAddress().withMessage('Invalid Ethereum wallet address')
], validate, verifierAuthController.updateProfile);

// GET /api/verifier/history - Get verification history
router.get('/history', authenticate, verifierAuthController.getVerificationHistory);

// GET /api/verifier/stats - Get verification statistics
router.get('/stats', authenticate, verifierAuthController.getStats);

module.exports = router;

