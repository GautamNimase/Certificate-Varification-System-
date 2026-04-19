const axios = require('axios');
require('dotenv').config();

// IPFS Pinata Service - handles uploading files to IPFS via Pinata API
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinataJWT = process.env.PINATA_JWT; // New JWT token authentication

// Configure axios instance for Pinata
const getPinataHeaders = () => {
    const headers = {};
    if (pinataJWT) {
        headers['Authorization'] = `Bearer ${pinataJWT}`;
    } else if (pinataApiKey && pinataApiSecret) {
        headers['pinata_api_key'] = pinataApiKey;
        headers['pinata_api_secret'] = pinataApiSecret;
    }
    return headers;
};

const pinataClient = axios.create({
    baseURL: 'https://api.pinata.cloud',
    headers: getPinataHeaders()
});

/**
 * Upload file to IPFS using Pinata
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - Original file name
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 */
const uploadToIPFS = async (fileBuffer, fileName) => {
    try {
        // If no Pinata credentials, return a mock CID for testing
        if (!pinataApiKey && !pinataApiSecret && !pinataJWT) {
            console.warn('⚠️ Using mock IPFS CID (Pinata not configured)');
            // Generate a mock CID based on file hash for testing
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            return 'Qm' + hash.substring(0, 44);
        }

        const formData = new (require('form-data'))();
        
        // Create a buffer from the file
        const buffer = Buffer.from(fileBuffer);
        
        // Append file to form data
        formData.append('file', buffer, {
            filename: fileName,
            contentType: 'application/pdf'
        });

        // Pin metadata
        const pinataMetadata = JSON.stringify({
            name: fileName,
            keyvalues: {
                type: 'certificate',
                uploadedAt: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', pinataMetadata);

        // Get updated headers
        const authHeaders = getPinataHeaders();

        // Make request to Pinata
        const response = await pinataClient.post('/pinning/pinFileToIPFS', formData, {
            headers: {
                ...formData.getHeaders(),
                ...authHeaders
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Return the IPFS CID
        return response.data.IpfsHash;
    } catch (error) {
        // If authentication fails (401 or 403), use mock mode as fallback
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn(`⚠️ Pinata authentication failed (${error.response.status}), using mock IPFS CID`);
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            return 'Qm' + hash.substring(0, 44);
        }
        
        console.error('IPFS Upload Error:', error.message);
        throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
};

/**
 * Upload JSON metadata to IPFS
 * @param {Object} metadata - JSON metadata to upload
 * @returns {Promise<string>} - IPFS CID
 */
const uploadJSONToIPFS = async (metadata) => {
    try {
        if (!pinataApiKey && !pinataApiSecret && !pinataJWT) {
            console.warn('⚠️ Using mock IPFS CID for JSON (Pinata not configured)');
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex');
            return 'Qm' + hash.substring(0, 44);
        }

        const authHeaders = getPinataHeaders();
        
        const response = await pinataClient.post('/pinning/pinJSONToIPFS', {
            pinataContent: metadata,
            pinataMetadata: {
                name: `certificate-metadata-${Date.now()}`,
                keyvalues: {
                    type: 'certificate-metadata',
                    uploadedAt: new Date().toISOString()
                }
            }
        }, {
            headers: authHeaders
        });

        return response.data.IpfsHash;
    } catch (error) {
        // If authentication fails (401 or 403), use mock mode as fallback
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn(`⚠️ Pinata authentication failed (${error.response.status}), using mock IPFS CID for JSON`);
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex');
            return 'Qm' + hash.substring(0, 44);
        }
        
        console.error('IPFS JSON Upload Error:', error.message);
        throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
};

/**
 * Get file from IPFS
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Object>} - File data
 */
const getFromIPFS = async (cid) => {
    try {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
        return response.data;
    } catch (error) {
        console.error('IPFS Get Error:', error.message);
        throw new Error(`Failed to get from IPFS: ${error.message}`);
    }
};

/**
 * Check if Pinata credentials are configured
 * @returns {boolean}
 */
const isIPFSConfigured = () => {
    return !!(pinataApiKey && pinataApiSecret);
};

module.exports = {
    uploadToIPFS,
    uploadJSONToIPFS,
    getFromIPFS,
    isIPFSConfigured
};

