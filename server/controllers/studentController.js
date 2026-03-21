const { User, Certificate, VerificationLog } = require('../models');
const { verifyCertificate } = require('../services/blockchainService');
const { getFromIPFS } = require('../services/ipfsService');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Register a new student
 * POST /api/student/register
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password, wallet_address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if wallet address is already used (if provided)
        if (wallet_address) {
            const existingWallet = await User.findOne({ 
                where: { wallet_address } 
            });
            if (existingWallet) {
                return res.status(400).json({
                    success: false,
                    message: 'Wallet address already registered'
                });
            }
        }

        // Create new student
        const student = await User.create({
            name,
            email,
            password,
            role: 'student',
            wallet_address: wallet_address || null
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: student.id, email: student.email, role: student.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: {
                user: student.toSafeObject(),
                token
            }
        });
    } catch (error) {
        console.error('Student Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering student',
            error: error.message
        });
    }
};

/**
 * Login student
 * POST /api/student/login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const student = await User.findOne({ where: { email, role: 'student' } });
        
        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await student.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: student.id, email: student.email, role: student.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: student.toSafeObject(),
                token
            }
        });
    } catch (error) {
        console.error('Student Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

/**
 * Get student profile
 * GET /api/student/profile
 */
exports.getProfile = async (req, res) => {
    try {
        const student = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get certificate stats
        const certificateCount = await Certificate.count({
            where: { student_id: student.id }
        });

        const validCertificateCount = await Certificate.count({
            where: { 
                student_id: student.id,
                revoked: false
            }
        });

        const revokedCount = await Certificate.count({
            where: { 
                student_id: student.id,
                revoked: true
            }
        });

        res.json({
            success: true,
            data: {
                user: student.toSafeObject(),
                stats: {
                    totalCertificates: certificateCount,
                    validCertificates: validCertificateCount,
                    revokedCertificates: revokedCount
                }
            }
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting profile',
            error: error.message
        });
    }
};

/**
 * Get all certificates for logged-in student
 * GET /api/student/certificates
 */
exports.getCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.findAll({
            where: { student_id: req.user.id },
            order: [['created_at', 'DESC']]
        });

        // Add verification links and blockchain status to each certificate
        const certificatesWithLinks = await Promise.all(
            certificates.map(async (cert) => {
                let blockchainStatus = null;
                
                // Try to get blockchain verification status
                try {
                    blockchainStatus = await verifyCertificate(cert.certificate_hash);
                } catch (err) {
                    console.error('Blockchain verification error:', err.message);
                }

                return {
                    ...cert.toJSON(),
                    verificationLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify?hash=${cert.certificate_hash}`,
                    blockchainStatus: blockchainStatus ? {
                        isValid: blockchainStatus.result === 'VALID',
                        isRevoked: blockchainStatus.isRevoked,
                        result: blockchainStatus.result
                    } : null
                };
            })
        );

        res.json({
            success: true,
            data: certificatesWithLinks
        });
    } catch (error) {
        console.error('Get Certificates Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting certificates',
            error: error.message
        });
    }
};

/**
 * Get certificate details by hash
 * GET /api/student/certificate/:hash
 */
exports.getCertificateDetails = async (req, res) => {
    try {
        const { hash } = req.params;

        // Find certificate
        const certificate = await Certificate.findOne({
            where: { 
                certificate_hash: hash,
                student_id: req.user.id
            },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email', 'wallet_address']
                }
            ]
        });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Get blockchain verification status
        let blockchainStatus = null;
        try {
            blockchainStatus = await verifyCertificate(hash);
        } catch (err) {
            console.error('Blockchain verification error:', err.message);
        }

        // Get verification history - use 'user' alias as defined in models
        const verificationHistory = await VerificationLog.findAll({
            where: { certificate_hash: hash },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: 20
        });

        // Generate explorer link
        const explorerBaseUrl = process.env.BLOCKCHAIN_EXPLORER_URL || 'https://sepolia.etherscan.io';
        const explorerLink = certificate.blockchain_tx_hash 
            ? `${explorerBaseUrl}/tx/${certificate.blockchain_tx_hash}`
            : null;

        res.json({
            success: true,
            data: {
                certificate: {
                    ...certificate.toJSON(),
                    verificationLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify?hash=${certificate.certificate_hash}`,
                    explorerLink
                },
                blockchainStatus,
                verificationHistory: verificationHistory.map(log => ({
                    id: log.id,
                    result: log.verification_result,
                    timestamp: log.timestamp,
                    verifier: log.user ? {
                        name: log.user.name,
                        role: log.user.role
                    } : null
                }))
            }
        });
    } catch (error) {
        console.error('Get Certificate Details Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting certificate details',
            error: error.message
        });
    }
};

/**
 * Download certificate from IPFS
 * GET /api/student/download/:hash
 */
exports.downloadCertificate = async (req, res) => {
    try {
        const { hash } = req.params;

        // Find certificate
        const certificate = await Certificate.findOne({
            where: { 
                certificate_hash: hash,
                student_id: req.user.id
            }
        });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        const ipfsCID = certificate.ipfs_cid;

        // Try to download from IPFS
        try {
            const ipfsData = await getFromIPFS(ipfsCID);
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="certificate-${hash}.pdf"`);
            
            // If IPFS returns a buffer/base64, send it
            if (Buffer.isBuffer(ipfsData)) {
                res.send(ipfsData);
            } else if (typeof ipfsData === 'string') {
                // Convert base64 to buffer if needed
                const buffer = Buffer.from(ipfsData, 'base64');
                res.send(buffer);
            } else {
                // If it's JSON, stringify and send
                res.json(ipfsData);
            }
        } catch (ipfsError) {
            console.error('IPFS Download Error:', ipfsError.message);
            
            // If IPFS fails, try to serve from local storage
            if (certificate.file_path) {
                const fs = require('fs');
                if (fs.existsSync(certificate.file_path)) {
                    return res.download(certificate.file_path, `certificate-${hash}.pdf`);
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to download certificate from IPFS',
                error: ipfsError.message
            });
        }
    } catch (error) {
        console.error('Download Certificate Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading certificate',
            error: error.message
        });
    }
};

/**
 * Get verification history for a certificate
 * GET /api/student/verification-history/:hash
 */
exports.getVerificationHistory = async (req, res) => {
    try {
        const { hash } = req.params;

        // Verify certificate belongs to this student
        const certificate = await Certificate.findOne({
            where: { 
                certificate_hash: hash,
                student_id: req.user.id
            }
        });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Get verification history
        const history = await VerificationLog.findAll({
            where: { certificate_hash: hash },
            include: [
                {
                    model: User,
                    as: 'verifier',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ],
            order: [['timestamp', 'DESC']]
        });

        // Get stats
        const stats = {
            total: history.length,
            valid: history.filter(h => h.verification_result === 'VALID').length,
            revoked: history.filter(h => h.verification_result === 'REVOKED').length,
            notFound: history.filter(h => h.verification_result === 'NOT_FOUND').length
        };

        res.json({
            success: true,
            data: {
                certificate: {
                    hash: certificate.certificate_hash,
                    name: certificate.certificate_name
                },
                stats,
                history: history.map(log => ({
                    id: log.id,
                    result: log.verification_result,
                    timestamp: log.timestamp,
                    verifier: log.verifier ? {
                        name: log.verifier.name,
                        email: log.verifier.email,
                        role: log.verifier.role
                    } : null,
                    verifierWallet: log.verifier_wallet_address
                }))
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
 * Update wallet address
 * PUT /api/student/wallet
 */
exports.updateWallet = async (req, res) => {
    try {
        const { wallet_address } = req.body;

        // Check if wallet is already used by another user
        const existingWallet = await User.findOne({
            where: { 
                wallet_address,
                id: { [Op.ne]: req.user.id }
            }
        });

        if (existingWallet) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address already registered to another user'
            });
        }

        // Update wallet address
        const student = await User.findByPk(req.user.id);
        await student.update({ wallet_address });

        res.json({
            success: true,
            message: 'Wallet address updated successfully',
            data: {
                user: student.toSafeObject()
            }
        });
    } catch (error) {
        console.error('Update Wallet Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating wallet address',
            error: error.message
        });
    }
};

