const { ethers } = require('ethers');
const { getContract, getWallet, getProvider, CONTRACT_ABI } = require('../config/blockchain');
require('dotenv').config();

// Blockchain Service - handles all interactions with the smart contract

// Timeout wrapper for blockchain calls
const withTimeout = (promise, ms = 60000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Blockchain request timed out after ${ms/1000} seconds`)), ms)
        )
    ]);
};

/**
 * Issue a new certificate on the blockchain
 * @param {string} certificateHash - SHA256 hash of the certificate
 * @param {string} ipfsCID - IPFS Content Identifier
 * @param {string} studentAddress - Ethereum address of the student
 * @param {string} issuerName - Name of the issuing authority
 * @returns {Promise<Object>} - Transaction receipt
 */
const issueCertificate = async (certificateHash, ipfsCID, studentAddress, issuerName) => {
    try {
        const contract = getContract();
        const wallet = getWallet();

        if (!contract || !wallet) {
            throw new Error('Blockchain not properly configured. Please check PRIVATE_KEY and CONTRACT_ADDRESS in .env file.');
        }

        // Convert certificate hash to bytes32 properly
        const certificateHashBytes32 = convertToBytes32(certificateHash);

        // Ensure student address is valid
        if (!ethers.utils.isAddress(studentAddress)) {
            throw new Error('Invalid student Ethereum address');
        }

        console.log('Issuing certificate on blockchain...');
        console.log('Certificate Hash (bytes32):', certificateHashBytes32);
        console.log('IPFS CID:', ipfsCID);
        console.log('Student Address:', studentAddress);
        console.log('Issuer:', issuerName);

        // Call the smart contract function with timeout
        const tx = await withTimeout(
            contract.issueCertificate(
                certificateHashBytes32,
                ipfsCID,
                studentAddress,
                issuerName
            ),
            120000 // 2 minute timeout
        );

        console.log('Transaction sent:', tx.hash);

        // Wait for transaction confirmation with timeout
        const receipt = await withTimeout(tx.wait(), 120000);

        console.log('Transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            events: receipt.events
        };
    } catch (error) {
        console.error('Blockchain Issue Certificate Error:', error.message);
        
        // Provide more helpful error messages
        if (error.message.includes('timed out')) {
            throw new Error('Blockchain network is slow. Please try again later.');
        } else if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient funds in the blockchain wallet. Please add ETH to your wallet.');
        } else if (error.message.includes('nonce too low')) {
            throw new Error('Transaction conflict. Please try again.');
        }
        
        throw new Error(`Failed to issue certificate on blockchain: ${error.message}`);
    }
};

/**
 * Convert certificate hash to bytes32 for blockchain
 * @param {string} certificateHash - SHA256 hash of the certificate
 * @returns {string} - bytes32 formatted hash
 */
const convertToBytes32 = (certificateHash) => {
    // If it's already a valid 64-character hex string, convert directly
    if (/^[0-9a-fA-F]{64}$/.test(certificateHash)) {
        return ethers.utils.hexZeroPad('0x' + certificateHash, 32);
    }
    // Otherwise, treat as regular string and hash
    return ethers.utils.keccak256(ethers.utils.toUtf8String(certificateHash));
};

/**
 * Verify a certificate on the blockchain
 * @param {string} certificateHash - SHA256 hash of the certificate
 * @returns {Promise<Object>} - Verification result
 */
const verifyCertificate = async (certificateHash) => {
    try {
        const contract = getContract();
        const provider = getProvider();

        if (!contract || !provider) {
            throw new Error('Blockchain not properly configured. Please check BLOCKCHAIN_RPC_URL and CONTRACT_ADDRESS in environment variables.');
        }

        // Convert certificate hash to bytes32 properly
        const certificateHashBytes32 = convertToBytes32(certificateHash);

        console.log('Verifying certificate on blockchain...');
        console.log('Certificate Hash (original):', certificateHash);
        console.log('Certificate Hash (bytes32):', certificateHashBytes32);

        // First check revocation index (O(1) lookup)
        const isRevoked = await contract.revocationIndex(certificateHashBytes32);
        
        console.log('Revocation Index:', isRevoked);

        // Get certificate details from contract
        const certData = await contract.certificates(certificateHashBytes32);
        
        // Parse the certificate data
        const [storedHash, ipfsCID, student, issuer, timestamp, revoked] = certData;

        // Check if certificate exists (hash is not zero)
        if (storedHash === ethers.utils.hexZeroPad('0x0', 32)) {
            return {
                success: true,
                exists: false,
                result: 'NOT_FOUND',
                message: 'Certificate not found in blockchain'
            };
        }

        // Determine verification result
        const result = isRevoked ? 'REVOKED' : 'VALID';

        return {
            success: true,
            exists: true,
            result: result,
            isRevoked: isRevoked,
            certificate: {
                certificateHash: storedHash,
                ipfsCID: ipfsCID,
                student: student,
                issuer: issuer,
                timestamp: timestamp.toString(),
                revoked: revoked
            },
            message: result === 'VALID' ? 'Certificate is valid' : 'Certificate has been revoked'
        };
    } catch (error) {
        console.error('Blockchain Verify Certificate Error:', error.message);
        
        // If blockchain is not available, return a more informative error
        if (error.message.includes('not properly configured') || error.message.includes('network')) {
            throw new Error('Blockchain network is not available. Please contact administrator.');
        }
        
        throw new Error(`Failed to verify certificate on blockchain: ${error.message}`);
    }
};

/**
 * Revoke a certificate on the blockchain
 * @param {string} certificateHash - SHA256 hash of the certificate
 * @returns {Promise<Object>} - Transaction receipt
 */
const revokeCertificate = async (certificateHash) => {
    try {
        const contract = getContract();
        const wallet = getWallet();

        if (!contract || !wallet) {
            throw new Error('Blockchain not properly configured');
        }

        // Convert certificate hash to bytes32 properly
        const certificateHashBytes32 = convertToBytes32(certificateHash);

        console.log('Revoking certificate on blockchain...');
        console.log('Certificate Hash (bytes32):', certificateHashBytes32);

        // Call the smart contract function
        const tx = await contract.revokeCertificate(certificateHashBytes32);

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        console.log('Transaction confirmed in block:', receipt.blockNumber);

        return {
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };
    } catch (error) {
        console.error('Blockchain Revoke Certificate Error:', error.message);
        throw new Error(`Failed to revoke certificate on blockchain: ${error.message}`);
    }
};

/**
 * Get certificate count from blockchain
 * @returns {Promise<number>} - Number of certificates
 */
const getCertificateCount = async () => {
    try {
        const contract = getContract();

        if (!contract) {
            throw new Error('Blockchain not properly configured');
        }

        const count = await contract.getCertificateCount();
        return count.toNumber();
    } catch (error) {
        console.error('Get Certificate Count Error:', error.message);
        throw new Error(`Failed to get certificate count: ${error.message}`);
    }
};

/**
 * Get all certificates from blockchain
 * @returns {Promise<Array>} - Array of certificates
 */
const getAllCertificates = async () => {
    try {
        const contract = getContract();

        if (!contract) {
            throw new Error('Blockchain not properly configured');
        }

        const count = await contract.getCertificateCount();
        const certificates = [];

        for (let i = 0; i < count.toNumber(); i++) {
            const certData = await contract.getCertificateByIndex(i);
            certificates.push({
                certificateHash: certData[0],
                ipfsCID: certData[1],
                student: certData[2],
                issuer: certData[3],
                timestamp: certData[4].toString(),
                revoked: certData[5]
            });
        }

        return certificates;
    } catch (error) {
        console.error('Get All Certificates Error:', error.message);
        throw new Error(`Failed to get all certificates: ${error.message}`);
    }
};

/**
 * Generate SHA256 hash of certificate file
 * @param {Buffer} fileBuffer - Certificate file buffer
 * @returns {string} - SHA256 hash
 */
const generateCertificateHash = (fileBuffer) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
};

/**
 * Check if blockchain is properly configured
 * @returns {boolean}
 */
const isBlockchainConfigured = () => {
    return !!(getContract());
};

module.exports = {
    issueCertificate,
    verifyCertificate,
    revokeCertificate,
    getCertificateCount,
    getAllCertificates,
    generateCertificateHash,
    isBlockchainConfigured
};

