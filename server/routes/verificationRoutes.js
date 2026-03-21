const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

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

// POST /api/verify/by-hash - Verify certificate by hash (public)
router.post('/by-hash', [
    body('certificateHash').optional().trim(),
    body('certificateUrl').optional().trim()
], validate, verificationController.verifyByHash);

// GET /api/verify/public/:hash - Get public verification data
router.get('/public/:hash', verificationController.getPublicVerification);

// GET /api/verify/ipfs/:cid - Get certificate from IPFS
router.get('/ipfs/:cid', verificationController.getFromIPFS);

// ==================== PROTECTED ROUTES ====================

// POST /api/verify/upload - Verify certificate by file upload (requires auth)
router.post('/upload', 
    authenticate,
    upload.single('certificate'),
    verificationController.verifyByUpload
);

// POST /api/verify/by-hash-auth - Verify certificate by hash (with auth - logs to history)
router.post('/by-hash-auth', 
    authenticate,
    [
        body('certificateHash').trim().notEmpty().withMessage('Certificate hash is required')
    ],
    validate,
    verificationController.verifyByHash
);

module.exports = router;

