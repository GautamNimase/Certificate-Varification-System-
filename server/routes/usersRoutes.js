const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

/**
 * Connect wallet address for logged-in user
 * POST /api/users/connect-wallet
 * 
 * This endpoint stores the student's MetaMask wallet address in the database
 * so that admins can issue certificates without requiring the student to be online.
 * 
 * Request body:
 * {
 *   "walletAddress": "0x123..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Wallet address connected successfully",
 *   "data": {
 *     "wallet_address": "0x123..."
 *   }
 * }
 */
router.post('/connect-wallet', authenticate, authController.connectWallet);

module.exports = router;

