const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
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

// POST/register - Register a /api/student new student
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 255 }),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('wallet_address').optional().isEthereumAddress().withMessage('Invalid Ethereum wallet address')
], validate, studentController.register);

// POST /api/student/login - Login student
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], validate, studentController.login);

// ==================== PROTECTED ROUTES ====================

// All routes below require authentication

// GET /api/student/profile - Get student profile
router.get('/profile', authenticate, studentController.getProfile);

// GET /api/student/certificates - Get all certificates for logged-in student
router.get('/certificates', authenticate, studentController.getCertificates);

// GET /api/student/certificate/:hash - Get certificate details by hash
router.get('/certificate/:hash', [
    param('hash').notEmpty().withMessage('Certificate hash is required')
], validate, authenticate, studentController.getCertificateDetails);

// GET /api/student/download/:hash - Download certificate from IPFS
router.get('/download/:hash', [
    param('hash').notEmpty().withMessage('Certificate hash is required')
], validate, authenticate, studentController.downloadCertificate);

// GET /api/student/verification-history/:hash - Get verification history
router.get('/verification-history/:hash', [
    param('hash').notEmpty().withMessage('Certificate hash is required')
], validate, authenticate, studentController.getVerificationHistory);

// PUT /api/student/wallet - Update wallet address
router.put('/wallet', authenticate, [
    body('wallet_address').isEthereumAddress().withMessage('Invalid Ethereum wallet address')
], validate, studentController.updateWallet);

module.exports = router;

