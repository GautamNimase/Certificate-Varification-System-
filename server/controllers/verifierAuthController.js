const { Verifier, VerificationLog } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Register a new verifier
 * POST /api/verifier/register
 */
exports.register = async (req, res) => {
    try {
        const { organization_name, verifier_name, email, password, wallet_address } = req.body;

        // Check if verifier already exists
        const existingVerifier = await Verifier.findOne({ where: { email } });
        if (existingVerifier) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered as a verifier'
            });
        }

        // Check if email is already used by a regular user
        const { User } = require('../models');
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered as a user'
            });
        }

        // Create new verifier
        const verifier = await Verifier.create({
            organization_name,
            verifier_name,
            email,
            password,
            wallet_address: wallet_address || null
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: verifier.id, 
                email: verifier.email, 
                role: 'verifier',
                organization_name: verifier.organization_name
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Verifier registered successfully',
            data: {
                verifier: verifier.toSafeObject(),
                token
            }
        });
    } catch (error) {
        console.error('Verifier Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering verifier',
            error: error.message
        });
    }
};

/**
 * Login verifier
 * POST /api/verifier/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find verifier by email
        const verifier = await Verifier.findOne({ where: { email } });
        
        if (!verifier) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await verifier.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: verifier.id, 
                email: verifier.email, 
                role: 'verifier',
                organization_name: verifier.organization_name
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                verifier: verifier.toSafeObject(),
                token
            }
        });
    } catch (error) {
        console.error('Verifier Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

/**
 * Get verifier profile
 * GET /api/verifier/profile
 */
exports.getProfile = async (req, res) => {
    try {
        const verifier = await Verifier.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!verifier) {
            return res.status(404).json({
                success: false,
                message: 'Verifier not found'
            });
        }

        // Get verification stats
        const totalVerifications = await VerificationLog.count({
            where: { verified_by: verifier.id }
        });

        const validVerifications = await VerificationLog.count({
            where: { 
                verified_by: verifier.id,
                verification_result: 'VALID'
            }
        });

        const revokedDetected = await VerificationLog.count({
            where: { 
                verified_by: verifier.id,
                verification_result: 'REVOKED'
            }
        });

        const notFound = await VerificationLog.count({
            where: { 
                verified_by: verifier.id,
                verification_result: 'NOT_FOUND'
            }
        });

        res.json({
            success: true,
            data: {
                verifier: verifier.toSafeObject(),
                stats: {
                    totalVerifications,
                    validVerifications,
                    revokedDetected,
                    notFound
                }
            }
        });
    } catch (error) {
        console.error('Get Verifier Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting profile',
            error: error.message
        });
    }
};

/**
 * Update verifier profile
 * PUT /api/verifier/profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const { organization_name, verifier_name, wallet_address } = req.body;
        
        const verifier = await Verifier.findByPk(req.user.id);

        if (!verifier) {
            return res.status(404).json({
                success: false,
                message: 'Verifier not found'
            });
        }

        // Update fields
        if (organization_name) verifier.organization_name = organization_name;
        if (verifier_name) verifier.verifier_name = verifier_name;
        if (wallet_address) verifier.wallet_address = wallet_address;

        await verifier.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                verifier: verifier.toSafeObject()
            }
        });
    } catch (error) {
        console.error('Update Verifier Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

/**
 * Get verification history
 * GET /api/verifier/history
 */
exports.getVerificationHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: history } = await VerificationLog.findAndCountAll({
            where: { verified_by: req.user.id },
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: history,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get Verification History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting verification history',
            error: error.message
        });
    }
};

/**
 * Get verification statistics
 * GET /api/verifier/stats
 */
exports.getStats = async (req, res) => {
    try {
        const totalVerifications = await VerificationLog.count({
            where: { verified_by: req.user.id }
        });

        const validVerifications = await VerificationLog.count({
            where: { 
                verified_by: req.user.id,
                verification_result: 'VALID'
            }
        });

        const revokedDetected = await VerificationLog.count({
            where: { 
                verified_by: req.user.id,
                verification_result: 'REVOKED'
            }
        });

        const notFound = await VerificationLog.count({
            where: { 
                verified_by: req.user.id,
                verification_result: 'NOT_FOUND'
            }
        });

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentVerifications = await VerificationLog.count({
            where: {
                verified_by: req.user.id,
                timestamp: {
                    [Op.gte]: sevenDaysAgo
                }
            }
        });

        res.json({
            success: true,
            data: {
                totalVerifications,
                validVerifications,
                revokedDetected,
                notFound,
                recentVerifications
            }
        });
    } catch (error) {
        console.error('Get Verifier Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting statistics',
            error: error.message
        });
    }
};

