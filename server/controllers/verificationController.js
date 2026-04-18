const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Certificate, User, VerificationLog, Verifier } = require('../models');
const { verifyCertificate, generateCertificateHash } = require('../services/blockchainService');
const { getFromIPFS } = require('../services/ipfsService');

/**
 * Verify certificate by hash
 * POST /api/verify/by-hash
 */
exports.verifyByHash = async (req, res) => {
    try {
        let { certificateHash } = req.body;

        if (!certificateHash) {
            return res.status(400).json({
                success: false,
                message: 'Please provide certificate hash'
            });
        }

        // Extract hash from URL if a verification link is provided
        if (certificateHash.includes('verify?hash=')) {
            const url = new URL(certificateHash);
            certificateHash = url.searchParams.get('hash');
        }

        console.log('Verifying certificate with hash:', certificateHash);

        // Verify on blockchain
        let blockchainResult;
        try {
            blockchainResult = await verifyCertificate(certificateHash);
        } catch (blockchainError) {
            console.error('Blockchain verification error:', blockchainError.message);
            blockchainResult = {
                success: false,
                result: 'ERROR',
                message: 'Blockchain verification failed: ' + blockchainError.message
            };
        }

        // Get certificate from database
        const certificate = await Certificate.findOne({
            where: { certificate_hash: certificateHash },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        // Determine verifier ID and type (from JWT or verifier table)
        let verifierId = null;
        let verifierInfo = null;
        let verifierType = null;

        if (req.user) {
            // Check if it's a verifier (from verifiers table)
            const verifier = await Verifier.findByPk(req.user.id);
            if (verifier) {
                verifierId = verifier.id;
                verifierType = 'verifier';
                verifierInfo = {
                    name: verifier.verifier_name,
                    organization: verifier.organization_name
                };
            } else {
                // It's a regular user (could be admin or student with verifier role)
                verifierId = req.user.id;
                verifierType = 'user';
                verifierInfo = {
                    name: req.user.name,
                    organization: req.user.role
                };
            }
        }

        // Log verification attempt
        if (verifierId) {
            await VerificationLog.create({
                certificate_hash: certificateHash,
                verified_by: verifierId,
                verifier_type: verifierType,
                verifier_wallet_address: req.user?.wallet_address || null,
                verification_result: blockchainResult.result || 'NOT_FOUND',
                ipfs_cid: certificate ? certificate.ipfs_cid : null,
                issuer_name: certificate ? certificate.issuer_name : null,
                student_name: certificate && certificate.student ? certificate.student.name : null
            });
        }

        // Prepare response
        const response = {
            success: true,
            result: blockchainResult.result || 'NOT_FOUND',
            certificate: certificate ? {
                certificateHash: certificate.certificate_hash,
                ipfsCID: certificate.ipfs_cid,
                certificateName: certificate.certificate_name,
                certificateDescription: certificate.certificate_description,
                student: certificate.student ? {
                    name: certificate.student.name,
                    email: certificate.student.email
                } : null,
                issuerName: certificate.issuer_name,
                issuerWallet: certificate.issuer_wallet_address,
                issueDate: certificate.createdAt && new Date(certificate.createdAt).getTime() > 0
                    ? certificate.createdAt
                    : null, revoked: certificate.revoked,
                revokedAt: certificate.revoked_at,
                blockchainTxHash: certificate.blockchain_tx_hash
            } : null,
            blockchain: blockchainResult,
            message: blockchainResult.message || 'Verification complete',
            verifierInfo
        };

        res.json(response);
    } catch (error) {
        console.error('Verify Certificate Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error verifying certificate',
            error: error.message
        });
    }
};

/**
 * Verify certificate by file upload
 * POST /api/verify/upload
 */
exports.verifyByUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a certificate PDF file'
            });
        }

        // Generate SHA256 hash of the uploaded file
        const fileBuffer = fs.readFileSync(req.file.path);
        const certificateHash = generateCertificateHash(fileBuffer);

        console.log('Verifying uploaded certificate with hash:', certificateHash);

        // Clean up uploaded file after processing
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError.message);
        }

        // Verify on blockchain
        let blockchainResult;
        try {
            blockchainResult = await verifyCertificate(certificateHash);
        } catch (blockchainError) {
            console.error('Blockchain verification error:', blockchainError.message);
            blockchainResult = {
                success: false,
                result: 'ERROR',
                message: 'Blockchain verification failed: ' + blockchainError.message
            };
        }

        // Get certificate from database
        const certificate = await Certificate.findOne({
            where: { certificate_hash: certificateHash },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        // Determine verifier ID and type
        let verifierId = null;
        let verifierType = null;

        if (req.user) {
            // Check if it's a verifier (from verifiers table)
            const verifier = await Verifier.findByPk(req.user.id);
            if (verifier) {
                verifierId = verifier.id;
                verifierType = 'verifier';
            } else {
                // It's a regular user
                verifierId = req.user.id;
                verifierType = 'user';
            }
        }

        // Log verification attempt
        if (verifierId) {
            await VerificationLog.create({
                certificate_hash: certificateHash,
                verified_by: verifierId,
                verifier_type: verifierType,
                verifier_wallet_address: req.user?.wallet_address || null,
                verification_result: blockchainResult.result || 'NOT_FOUND',
                ipfs_cid: certificate ? certificate.ipfs_cid : null,
                issuer_name: certificate ? certificate.issuer_name : null,
                student_name: certificate && certificate.student ? certificate.student.name : null
            });
        }

        // Prepare response
        const response = {
            success: true,
            result: blockchainResult.result || 'NOT_FOUND',
            certificate: certificate ? {
                certificateHash: certificate.certificate_hash,
                ipfsCID: certificate.ipfs_cid,
                certificateName: certificate.certificate_name,
                certificateDescription: certificate.certificate_description,
                student: certificate.student ? {
                    name: certificate.student.name,
                    email: certificate.student.email
                } : null,
                issuerName: certificate.issuer_name,
                issuerWallet: certificate.issuer_wallet_address,
                issueDate: certificate.createdAt?.toISOString(), 
                    revoked: certificate.revoked,
                revokedAt: certificate.revoked_at,
                blockchainTxHash: certificate.blockchain_tx_hash
            } : null,
            blockchain: blockchainResult,
            message: blockchainResult.message || 'Verification complete'
        };

        res.json(response);
    } catch (error) {
        console.error('Verify Certificate Upload Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error verifying certificate',
            error: error.message
        });
    }
};

/**
 * Get certificate from IPFS
 * GET /api/verify/ipfs/:cid
 */
exports.getFromIPFS = async (req, res) => {
    try {
        const { cid } = req.params;

        if (!cid) {
            return res.status(400).json({
                success: false,
                message: 'IPFS CID is required'
            });
        }

        // Get file from IPFS
        const ipfsData = await getFromIPFS(cid);

        if (ipfsData) {
            // If it's a buffer, send it as a file
            if (Buffer.isBuffer(ipfsData)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.send(ipfsData);
            } else if (typeof ipfsData === 'string') {
                // Convert base64 to buffer if needed
                const buffer = Buffer.from(ipfsData, 'base64');
                res.setHeader('Content-Type', 'application/pdf');
                res.send(buffer);
            } else {
                res.json(ipfsData);
            }
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found on IPFS'
            });
        }
    } catch (error) {
        console.error('Get from IPFS Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error retrieving file from IPFS',
            error: error.message
        });
    }
};

/**
 * Get public verification page data (no auth required)
 * GET /api/verify/public/:hash
 */
exports.getPublicVerification = async (req, res) => {
    try {
        const { hash } = req.params;

        // Verify on blockchain
        let blockchainResult;
        try {
            blockchainResult = await verifyCertificate(hash);
        } catch (blockchainError) {
            blockchainResult = {
                success: false,
                result: 'ERROR',
                message: 'Blockchain verification failed'
            };
        }

        // Get certificate from database
        const certificate = await Certificate.findOne({
            where: { certificate_hash: hash },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        res.json({
            success: true,
            result: blockchainResult.result || 'NOT_FOUND',
            certificate: certificate ? {
                certificateHash: certificate.certificate_hash,
                ipfsCID: certificate.ipfs_cid,
                certificateName: certificate.certificate_name,
                student: certificate.student ? {
                    name: certificate.student.name
                } : null,
                issuerName: certificate.issuer_name,
                issueDate: certificate.createdAt && new Date(certificate.createdAt).getTime() > 0
                    ? certificate.createdAt
                    : null,
                revoked: certificate.revoked
            } : null,
            blockchain: blockchainResult
        });
    } catch (error) {
        console.error('Public Verification Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error getting verification data',
            error: error.message
        });
    }
};

