# Student Module - Certificate Verification System

## Overview

This module provides a complete student interface for the blockchain-based academic certificate verification system. Students can register, login, view their certificates, download them, and share verification links.

## Features

### 1. Registration & Login
- Student registration with email, password, and optional wallet address
- Login with email/password
- Integration with MetaMask for wallet connection
- JWT-based authentication

### 2. Dashboard
- View all certificates (total, valid, revoked counts)
- Certificate listing with status indicators
- Real-time blockchain verification status
- Quick actions: Download, Share, View QR Code

### 3. Certificate Management
- View certificate details (hash, IPFS CID, blockchain transaction)
- Download certificates from IPFS
- Share verification links
- View QR codes for easy verification
- Track verification history

### 4. Blockchain Integration
- MetaMask wallet connection
- View blockchain transaction details
- Etherscan transaction links
- Real-time verification status from smart contract

## API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student/register` | Register new student |
| POST | `/api/student/login` | Login student |

### Protected Endpoints (Require JWT Token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/profile` | Get student profile |
| GET | `/api/student/certificates` | Get all student certificates |
| GET | `/api/student/certificate/:hash` | Get certificate details |
| GET | `/api/student/download/:hash` | Download certificate from IPFS |
| GET | `/api/student/verification-history/:hash` | Get verification history |
| PUT | `/api/student/wallet` | Update wallet address |

## Frontend Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/student-login` | StudentLogin | Student login/registration page |
| `/student` | StudentDashboard | Student dashboard (protected) |

## Database Schema

The student module uses the existing database schema:
- `users` table - Stores student information (role='student')
- `certificates` table - Stores certificate data with student references
- `verification_logs` table - Tracks all verification attempts

## Files Created

### Backend
- `server/routes/studentRoutes.js` - Student API routes
- `server/controllers/studentController.js` - Student controller logic

### Frontend
- `client/src/pages/StudentLogin.jsx` - Login/Registration page
- `client/src/pages/StudentDashboard.jsx` - Dashboard with all features

## Setup Instructions

1. Install dependencies:
```bash
cd server
npm install express-validator jsonwebtoken
```

2. Ensure the server is running:
```bash
cd server
npm start
```

3. Start the frontend:
```bash
cd client
npm run dev
```

4. Access the student module:
   - Login/Register: http://localhost:5173/student-login
   - Dashboard: http://localhost:5173/student

## Usage Flow

1. **Registration**: Student registers with email, password, and optionally connects MetaMask wallet
2. **Login**: Student logs in with credentials
3. **Dashboard**: Student sees all their certificates with verification status
4. **View Details**: Click on a certificate to see full details including blockchain transaction
5. **Download**: Download certificate PDF from IPFS
6. **Share**: Copy verification link or scan QR code to share certificate

## Blockchain Integration

- Smart Contract: CertificateRegistry (deployed on Sepolia testnet)
- Storage: IPFS for certificate files
- Verification: Real-time blockchain lookup for certificate validity
- Transactions: All certificate operations recorded on blockchain

## Security Features

- JWT authentication
- Password hashing (bcrypt)
- Input validation (express-validator)
- CORS protection
- Protected routes

## Error Handling

All API endpoints return consistent JSON responses:
```json
{
  "success": true/false,
  "message": "...",
  "data": { ... }
}
```

