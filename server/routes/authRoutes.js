const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// limiter - Login rate specifically for /api/auth/login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // limit each IP to 5000 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes
router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/wallet', authenticate, authController.updateWallet);

// Admin only routes
router.get('/users', authenticate, requireAdmin, authController.getAllUsers);

module.exports = router;

