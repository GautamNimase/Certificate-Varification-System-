// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing academic certificates on the blockchain
 * with indexed revocation mechanism for O(1) lookup time
 */
contract CertificateRegistry {
    // Struct to store certificate information
    struct Certificate {
        bytes32 certificateHash;
        string ipfsCID;
        address student;
        string issuer;
        uint256 timestamp;
        bool revoked;
    }

    // Mapping from certificate hash to Certificate struct
    mapping(bytes32 => Certificate) public certificates;

    // Mapping for indexed revocation lookup - O(1) time complexity
    mapping(bytes32 => bool) public revocationIndex;

    // Array to track all certificate hashes for iteration
    bytes32[] private certificateIds;

    // Counter for total certificates
    uint256 private certificateCount;

    // Events for tracking certificate actions
    event CertificateIssued(
        bytes32 indexed certificateHash,
        address indexed student,
        string ipfsCID,
        string issuer,
        uint256 timestamp
    );

    event CertificateRevoked(
        bytes32 indexed certificateHash,
        uint256 timestamp
    );

    // Modifier to check if certificate exists
    modifier certExists(bytes32 certificateHash) {
        require(
            certificates[certificateHash].timestamp != 0,
            "Certificate does not exist"
        );
        _;
    }

    // Modifier to check if certificate is not revoked
    modifier notRevoked(bytes32 certificateHash) {
        require(
            !revocationIndex[certificateHash],
            "Certificate has been revoked"
        );
        _;
    }

    /**
     * @dev Issue a new certificate
     * @param certificateHash The SHA256 hash of the certificate
     * @param ipfsCID The IPFS Content Identifier
     * @param student The Ethereum address of the student
     * @param issuer The name of the issuing authority
     */
    function issueCertificate(
        bytes32 certificateHash,
        string memory ipfsCID,
        address student,
        string memory issuer
    ) public returns (bool) {
        // Check that certificate doesn't already exist
        require(
            certificates[certificateHash].timestamp == 0,
            "Certificate already exists"
        );

        // Check that student address is valid
        require(student != address(0), "Invalid student address");

        // Create new certificate
        certificates[certificateHash] = Certificate({
            certificateHash: certificateHash,
            ipfsCID: ipfsCID,
            student: student,
            issuer: issuer,
            timestamp: block.timestamp,
            revoked: false
        });

        // Add to certificate IDs array
        certificateIds.push(certificateHash);
        certificateCount++;

        // Emit event
        emit CertificateIssued(
            certificateHash,
            student,
            ipfsCID,
            issuer,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Verify a certificate
     * @param certificateHash The SHA256 hash of the certificate
     * @return isValid Whether the certificate is valid
     * @return isRevoked Whether the certificate has been revoked
     * @return ipfsCID The IPFS Content Identifier
     * @return student The student address
     * @return issuer The issuer name
     * @return timestamp The issue timestamp
     * @return revoked Whether the certificate is marked as revoked
     */
    function verifyCertificate(
        bytes32 certificateHash
    )
        public
        view
        returns (
            bool isValid,
            bool isRevoked,
            string memory ipfsCID,
            address student,
            string memory issuer,
            uint256 timestamp,
            bool revoked
        )
    {
        // Check revocation status using indexed lookup - O(1)
        isRevoked = revocationIndex[certificateHash];

        // Get certificate from storage
        Certificate memory cert = certificates[certificateHash];

        // Check if certificate exists
        if (cert.timestamp == 0) {
            return (false, false, "", address(0), "", 0, false);
        }

        // Return verification result
        return (
            !isRevoked,  // isValid is true if not revoked
            isRevoked,
            cert.ipfsCID,
            cert.student,
            cert.issuer,
            cert.timestamp,
            cert.revoked
        );
    }

    /**
     * @dev Revoke a certificate
     * @param certificateHash The SHA256 hash of the certificate
     */
    function revokeCertificate(
        bytes32 certificateHash
    ) public certExists(certificateHash) returns (bool) {
        // Check that certificate is not already revoked
        require(
            !revocationIndex[certificateHash],
            "Certificate already revoked"
        );

        // Update revocation index - O(1) operation
        revocationIndex[certificateHash] = true;

        // Update certificate revoked status
        certificates[certificateHash].revoked = true;

        // Emit event
        emit CertificateRevoked(certificateHash, block.timestamp);

        return true;
    }

    /**
     * @dev Get certificate by hash
     * @param certificateHash The SHA256 hash of the certificate
     */
    function getCertificate(
        bytes32 certificateHash
    )
        public
        view
        returns (
            bytes32,
            string memory,
            address,
            string memory,
            uint256,
            bool
        )
    {
        Certificate memory cert = certificates[certificateHash];
        return (
            cert.certificateHash,
            cert.ipfsCID,
            cert.student,
            cert.issuer,
            cert.timestamp,
            cert.revoked
        );
    }

    /**
     * @dev Get total number of certificates
     */
    function getCertificateCount() public view returns (uint256) {
        return certificateCount;
    }

    /**
     * @dev Get certificate by index
     * @param index The index of the certificate
     */
    function getCertificateByIndex(
        uint256 index
    )
        public
        view
        returns (
            bytes32,
            string memory,
            address,
            string memory,
            uint256,
            bool
        )
    {
        require(index < certificateCount, "Index out of bounds");
        bytes32 certHash = certificateIds[index];
        Certificate memory cert = certificates[certHash];
        return (
            cert.certificateHash,
            cert.ipfsCID,
            cert.student,
            cert.issuer,
            cert.timestamp,
            cert.revoked
        );
    }

    /**
     * @dev Check if certificate exists
     * @param certificateHash The SHA256 hash of the certificate
     */
    function certificateExists(
        bytes32 certificateHash
    ) public view returns (bool) {
        return certificates[certificateHash].timestamp != 0;
    }

    /**
     * @dev Check revocation status using indexed lookup
     * @param certificateHash The SHA256 hash of the certificate
     */
    function checkRevocationStatus(
        bytes32 certificateHash
    ) public view returns (bool) {
        return revocationIndex[certificateHash];
    }
}

