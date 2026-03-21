const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Middleware to check if user is student
const requireStudent = (req, res, next) => {
    if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student privileges required.'
        });
    }
    next();
};

// Middleware to check if user is verifier
const requireVerifier = (req, res, next) => {
    if (!req.user || req.user.role !== 'verifier') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Verifier privileges required.'
        });
    }
    next();
};

// Middleware to allow multiple roles
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient privileges.'
            });
        }
        next();
    };
};

module.exports = {
    authenticate,
    requireAdmin,
    requireStudent,
    requireVerifier,
    requireRoles
};

