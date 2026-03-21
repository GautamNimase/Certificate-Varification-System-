# Student Module - Database Schema

## MySQL Database Schema for Student Module

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS certificate_verification;
USE certificate_verification;

-- Students Table (using existing users table with role='student')
-- The users table already has:
-- id, name, email, password, role, wallet_address, created_at, updated_at

-- Certificates Table (already exists)
-- id, certificate_hash, ipfs_cid, student_id, issuer_name, issuer_wallet_address,
-- blockchain_tx, blockchain_tx_hash, certificate_name, certificate_description,
-- file_path, revoked, revoked_at, created_at, updated_at

-- Verification Logs Table (already exists)
-- id, certificate_hash, verified_by, verifier_wallet_address, verification_result,
-- ipfs_cid, issuer_name, student_name, timestamp
```

## API Endpoints for Student Module

### POST /api/student/register
Register a new student
- Request: `{ name, email, password, wallet_address }`
- Response: `{ success: true, data: { user } }`

### POST /api/student/login
Login student
- Request: `{ email, password }`
- Response: `{ success: true, data: { token, user } }`

### GET /api/student/profile
Get student profile (protected)
- Headers: `Authorization: Bearer <token>`
- Response: `{ success: true, data: { user } }`

### GET /api/student/certificates
Get all certificates for logged-in student (protected)
- Headers: `Authorization: Bearer <token>`
- Response: `{ success: true, data: { certificates: [] } }`

### GET /api/student/certificate/:hash
Get certificate details by hash (protected)
- Headers: `Authorization: Bearer <token>`
- Response: `{ success: true, data: { certificate, blockchainStatus, verificationHistory } }`

### GET /api/student/download/:hash
Download certificate from IPFS (protected)
- Headers: `Authorization: Bearer <token>`
- Response: Binary PDF file

### GET /api/student/verification-history/:hash
Get verification history for a certificate (protected)
- Headers: `Authorization: Bearer <token>`
- Response: `{ success: true, data: { history: [] } }`

