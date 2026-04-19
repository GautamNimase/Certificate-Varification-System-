const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { Certificate, User, VerificationLog } = require('../models');
const { uploadToIPFS, uploadJSONToIPFS } = require('../services/ipfsService');
const {
    issueCertificate,
    verifyCertificate,
    revokeCertificate,
    generateCertificateHash
} = require('../services/blockchainService');

/**
 * Issue a new certificate
 * POST /api/certificate/issue
 * Admin only
 */
exports.issueCertificate = async (req, res) => {
    try {
        const { studentId, certificateName, certificateDescription } = req.body;

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a certificate PDF file'
            });
        }

        // Validate required fields
        if (!studentId || !certificateName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide student ID and certificate name'
            });
        }

        // Get student information
        const student = await User.findByPk(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Generate SHA256 hash of the certificate file
        const fileBuffer = fs.readFileSync(req.file.path);
        const certificateHash = generateCertificateHash(fileBuffer);

        console.log('Generated Certificate Hash:', certificateHash);

        // Check if certificate with this hash already exists
        const existingCert = await Certificate.findOne({
            where: { certificate_hash: certificateHash }
        });

        if (existingCert) {
            return res.status(400).json({
                success: false,
                message: 'This certificate has already been issued'
            });
        }

        // Upload certificate to IPFS
        console.log('Uploading certificate to IPFS...');
        const ipfsCID = await uploadToIPFS(fileBuffer, req.file.originalname);
        console.log('Certificate uploaded to IPFS with CID:', ipfsCID);

        // Create metadata JSON
        const metadata = {
            certificateName,
            certificateDescription: certificateDescription || '',
            studentName: student.name,
            studentEmail: student.email,
            issuerName: req.user.name,
            issuerEmail: req.user.email,
            issueDate: new Date().toISOString(),
            ipfsCID,
            certificateHash
        };

        // Upload metadata to IPFS
        const metadataCID = await uploadJSONToIPFS(metadata);

        // Get student wallet address - validate it exists
        const studentWalletAddress = student.wallet_address;

        // Validate student has connected their wallet
        if (!studentWalletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Student has not registered their wallet address. Please ask the student to connect their MetaMask wallet first to receive blockchain certificates.',
                hint: 'Students must connect their wallet via /student-dashboard or the connect-wallet API before certificates can be issued.'
            });
        }

        // Validate that the wallet address is not a placeholder/zero address
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        if (studentWalletAddress.toLowerCase() === zeroAddress.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: 'Student has not registered their wallet address. Please ask the student to connect their MetaMask wallet first to receive blockchain certificates.',
                hint: 'The default wallet address is not valid. Students must connect their real MetaMask wallet.'
            });
        }

        // Issue certificate on blockchain
        console.log('Issuing certificate on blockchain...');
        let blockchainResult;
        try {
            blockchainResult = await issueCertificate(
                certificateHash,
                ipfsCID,
                studentWalletAddress,
                req.user.name
            );
        } catch (blockchainError) {
            console.error('Blockchain issuance failed:', blockchainError.message);
            // Return error to client - don't store locally without blockchain
            return res.status(503).json({
                success: false,
                message: 'Failed to issue certificate on blockchain. Please check blockchain configuration.',
                error: blockchainError.message,
                hint: 'Make sure: 1) Blockchain RPC URL is correct, 2) Private key is valid, 3) Smart contract is deployed'
            });
        }

        // Store certificate in database
        const certificate = await Certificate.create({
            certificate_hash: certificateHash,
            ipfs_cid: ipfsCID,
            student_id: studentId,
            issuer_name: req.user.name,
            issuer_wallet_address: req.user.wallet_address || '0x0000000000000000000000000000000000000000',
            blockchain_tx: blockchainResult.transactionHash,
            blockchain_tx_hash: blockchainResult.transactionHash,
            certificate_name: certificateName,
            certificate_description: certificateDescription || '',
            file_path: req.file.path,
            revoked: false,
            issue_date: new Date()
        });

        // Generate QR code for verification link
        const verificationLink = `${process.env.CLIENT_URL}/verify?hash=${certificateHash}`;
        const qrCodeDataURL = await QRCode.toDataURL(verificationLink);

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: {
                certificate: {
                    id: certificate.id,
                    certificateHash: certificate.certificate_hash,
                    ipfsCID: certificate.ipfs_cid,
                    studentName: student.name,
                    studentEmail: student.email,
                    certificateName: certificate.certificate_name,
                    issuerName: certificate.issuer_name,
                    blockchainTx: certificate.blockchain_tx,
                    createdAt: certificate.createdAt
                },
                verificationLink,
                qrCode: qrCodeDataURL,
                blockchainResult
            }
        });
    } catch (error) {
        console.error('Issue Certificate Error:', error.message);

        // Clean up uploaded file if there was an error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error issuing certificate',
            error: error.message
        });
    }
};

/**
 * Revoke a certificate
 * POST /api/certificate/revoke
 * Admin only
 */
exports.revokeCertificate = async (req, res) => {
    try {
        const { certificateId } = req.body;

        if (!certificateId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide certificate ID'
            });
        }

        // Find certificate
        const certificate = await Certificate.findByPk(certificateId);

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        if (certificate.revoked) {
            return res.status(400).json({
                success: false,
                message: 'Certificate is already revoked'
            });
        }

        // Check if certificate has a valid blockchain transaction
        if (!certificate.blockchain_tx || certificate.blockchain_tx === '0x0000000000000000000000000000000000000000') {
            // Certificate was never issued on blockchain - just mark as revoked locally
            certificate.revoked = true;
            certificate.revoked_at = new Date();
            await certificate.save();

            return res.json({
                success: true,
                message: 'Certificate revoked locally (was never issued on blockchain)',
                data: {
                    certificateId: certificate.id,
                    certificateHash: certificate.certificate_hash,
                    revokedAt: certificate.revoked_at,
                    blockchainResult: {
                        success: false,
                        message: 'Certificate was not issued on blockchain - only local record updated'
                    }
                }
            });
        }

        // Revoke on blockchain
        let blockchainResult;
        try {
            blockchainResult = await revokeCertificate(certificate.certificate_hash);
        } catch (blockchainError) {
            console.error('Blockchain revocation failed:', blockchainError.message);

            // If certificate doesn't exist on blockchain, still allow local revocation
            if (blockchainError.message.includes('Certificate does not exist')) {
                certificate.revoked = true;
                certificate.revoked_at = new Date();
                await certificate.save();

                return res.json({
                    success: true,
                    message: 'Certificate revoked locally (not found on blockchain)',
                    data: {
                        certificateId: certificate.id,
                        certificateHash: certificate.certificate_hash,
                        revokedAt: certificate.revoked_at,
                        blockchainResult: {
                            success: false,
                            message: 'Certificate not found on blockchain - local record updated'
                        }
                    }
                });
            }

            blockchainResult = {
                success: false,
                message: 'Blockchain revocation failed: ' + blockchainError.message
            };
        }

        // Update in database
        certificate.revoked = true;
        certificate.revoked_at = new Date();
        await certificate.save();

        res.json({
            success: true,
            message: 'Certificate revoked successfully',
            data: {
                certificateId: certificate.id,
                certificateHash: certificate.certificate_hash,
                revokedAt: certificate.revoked_at,
                blockchainResult
            }
        });
    } catch (error) {
        console.error('Revoke Certificate Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error revoking certificate',
            error: error.message
        });
    }
};

/**
 * Verify a certificate
 * POST /api/certificate/verify
 * Public endpoint
 */
exports.verifyCertificate = async (req, res) => {
    try {
        let { certificateHash } = req.body;

        // If file is uploaded, generate hash from file
        if (req.file) {
            const fileBuffer = fs.readFileSync(req.file.path);
            certificateHash = generateCertificateHash(fileBuffer);

            // Clean up uploaded file
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError.message);
            }
        }

        if (!certificateHash) {
            return res.status(400).json({
                success: false,
                message: 'Please provide certificate hash or upload a certificate file'
            });
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

        // Log verification attempt
        if (req.user) {
            await VerificationLog.create({
                certificate_hash: certificateHash,
                verified_by: req.user.id,
                verifier_wallet_address: req.user.wallet_address,
                verification_result: blockchainResult.result || 'NOT_FOUND',
                ipfs_cid: certificate ? certificate.ipfs_cid : null,
                issuer_name: certificate ? certificate.issuer_name : null,
                student_name: certificate ? certificate.student.name : null
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
                issueDate: certificate.issue_date,
                revoked: certificate.revoked,
                revokedAt: certificate.revoked_at
            } : null,
            blockchain: blockchainResult,
            message: blockchainResult.message || 'Verification complete'
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
 * Get certificate by ID
 * GET /api/certificate/:id
 */
exports.getCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const certificate = await Certificate.findByPk(id, {
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

        // Generate verification link and QR code
        const verificationLink = `${process.env.CLIENT_URL}/verify?hash=${certificate.certificate_hash}`;
        const qrCodeDataURL = await QRCode.toDataURL(verificationLink);

        res.json({
            success: true,
            data: {
                certificate,
                verificationLink,
                qrCode: qrCodeDataURL
            }
        });
    } catch (error) {
        console.error('Get Certificate Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error getting certificate',
            error: error.message
        });
    }
};
exports.getStudentCertificates = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own certificates'
            });
        }

        const certificates = await Certificate.findAll({
            where: { student_id: studentId },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const certificatesWithLinks = await Promise.all(
            certificates.map(async (cert) => {
                const verificationLink = `${process.env.CLIENT_URL}/verify?hash=${cert.certificate_hash}`;
                const qrCodeDataURL = await QRCode.toDataURL(verificationLink);

                return {
                    ...cert.toJSON(),
                    created_at: cert.createdAt, // ✅ IMPORTANT FIX
                    verificationLink,
                    qrCode: qrCodeDataURL
                };
            })
        );

        res.json({
            success: true,
            data: certificatesWithLinks
        });

    } catch (error) {
        console.error('Get Student Certificates Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error getting student certificates',
            error: error.message
        });
    }
};

/**
 * Get all certificates (admin only)
 * GET /api/certificate/all
 */
exports.getAllCertificates = async (req, res) => {
    try {
        const { page = 1, limit = 10, revoked } = req.query;

        const whereClause = {};
        if (revoked !== undefined) {
            whereClause.revoked = revoked === 'true';
        }

        const offset = (page - 1) * limit;

        const { count, rows: certificates } = await Certificate.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']], // ✅ FIXED
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const formattedCertificates = certificates.map(cert => ({
            ...cert.toJSON(),
            created_at: cert.createdAt // ✅ FIXED
        }));

        res.json({
            success: true,
            data: formattedCertificates,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Get All Certificates Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error getting all certificates',
            error: error.message
        });
    }
};

/**
 * Download certificate file
 * GET /api/certificate/:id/download
 */
exports.downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const certificate = await Certificate.findByPk(id);

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Verify the requesting user is either admin or the certificate owner
        if (req.user.role !== 'admin' && req.user.id !== certificate.student_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only download your own certificates'
            });
        }

        // Check if file exists
        if (!certificate.file_path || !fs.existsSync(certificate.file_path)) {
            return res.status(404).json({
                success: false,
                message: 'Certificate file not found'
            });
        }

        res.download(certificate.file_path, `certificate-${certificate.certificate_hash}.pdf`);
    } catch (error) {
        console.error('Download Certificate Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error downloading certificate',
            error: error.message
        });
    }
};

/**
 * Get verification logs (admin only)
 * GET /api/certificate/verification-logs
 */
exports.getVerificationLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: logs } = await VerificationLog.findAndCountAll({
            include: [
                {
                    model: User,
                    as: 'verifier',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: logs,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get Verification Logs Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error getting verification logs',
            error: error.message
        });
    }
};

