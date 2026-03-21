const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/verify', upload.single('certificate'), certificateController.verifyCertificate);

// Protected routes - Admin only
router.post('/issue', authenticate, requireAdmin, upload.single('certificate'), certificateController.issueCertificate);
router.post('/revoke', authenticate, requireAdmin, certificateController.revokeCertificate);
router.get('/all', authenticate, requireAdmin, certificateController.getAllCertificates);
router.get('/verification-logs', authenticate, requireAdmin, certificateController.getVerificationLogs);

// Protected routes - Student
router.get('/student/:studentId', authenticate, certificateController.getStudentCertificates);

// Protected routes - All authenticated users
router.get('/:id', authenticate, certificateController.getCertificate);
router.get('/:id/download', authenticate, certificateController.downloadCertificate);

module.exports = router;

