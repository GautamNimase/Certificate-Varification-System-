const { ethers } = require('ethers');
require('dotenv').config();

// Blockchain network configuration
const NETWORK = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// ABI for CertificateRegistry smart contract
const CONTRACT_ABI = [
    // Events
    "event CertificateIssued(bytes32 indexed certificateHash, address indexed student, string ipfsCID, string issuer, uint256 timestamp)",
    "event CertificateRevoked(bytes32 indexed certificateHash, uint256 timestamp)",
    // Read functions
    "function certificates(bytes32) view returns (bytes32, string, address, string, uint256, bool)",
    "function revocationIndex(bytes32) view returns (bool)",
    "function getCertificateCount() view returns (uint256)",
    "function getCertificateByIndex(uint256) view returns (bytes32, string, address, string, uint256, bool)",
    "function verifyCertificate(bytes32) view returns (bool, bool, string, address, string, uint256, bool)",
    "function certificateExists(bytes32) view returns (bool)",
    "function checkRevocationStatus(bytes32) view returns (bool)",
    "function getCertificate(bytes32) view returns (bytes32, string, address, string, uint256, bool)",
    // Write functions
    "function issueCertificate(bytes32 certificateHash, string ipfsCID, address student, string issuer) returns (bool)",
    "function revokeCertificate(bytes32 certificateHash) returns (bool)"
];

// Initialize provider (blockchain connection)
let provider;
let wallet;
let contract;

// Initialize blockchain connection
const initBlockchain = () => {
    try {
        // Connect to Ethereum network
        provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        
        // Create wallet from private key (only if valid)
        if (PRIVATE_KEY && PRIVATE_KEY.startsWith('0x') && PRIVATE_KEY.length === 66) {
            wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            console.log('✅ Blockchain wallet loaded:', wallet.address);
        } else {
            console.warn('⚠️ No valid private key provided. Blockchain transactions will not work.');
        }
        
        // Initialize contract instance
        if (CONTRACT_ADDRESS && ethers.utils.isAddress(CONTRACT_ADDRESS)) {
            if (wallet) {
                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
                console.log('✅ Smart contract initialized at:', CONTRACT_ADDRESS);
            } else {
                // Read-only contract (without wallet)
                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                console.log('✅ Smart contract initialized (read-only) at:', CONTRACT_ADDRESS);
            }
        } else {
            console.warn('⚠️ No valid contract address provided.');
        }
        
        console.log('✅ Blockchain configuration loaded for network:', NETWORK);
    } catch (error) {
        console.error('❌ Blockchain initialization error:', error.message);
    }
};

// Get provider
const getProvider = () => provider;

// Get wallet
const getWallet = () => wallet;

// Get contract instance
const getContract = () => contract;

// Get network name
const getNetwork = () => NETWORK;

// Check if blockchain is properly configured
const isBlockchainConfigured = () => {
    return CONTRACT_ADDRESS && (PRIVATE_KEY || provider);
};

module.exports = {
    initBlockchain,
    getProvider,
    getWallet,
    getContract,
    getNetwork,
    isBlockchainConfigured,
    CONTRACT_ABI
};

