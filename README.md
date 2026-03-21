# Blockchain-Based Academic Certificate Verification System

A full-stack application for issuing, managing, and verifying academic certificates on the blockchain with indexed revocation mechanism and student dashboard.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │    Login    │  │    Admin    │  │   Student   │  │  Verifier   │  │
│  │   Page     │  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js + Express)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Auth API  │  │ Certificate │  │    IPFS     │  │  Blockchain │  │
│  │            │  │    API      │  │   Service   │  │   Service   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │    MySQL    │ │    IPFS    │ │  Ethereum   │
            │  Database   │ │  (Pinata)  │ │ Blockchain  │
            └─────────────┘ └─────────────┘ └─────────────┘
```

## 📋 Features

### Admin Features
- ✅ Issue certificates with PDF upload
- ✅ Generate SHA256 hash of certificates
- ✅ Upload certificates to IPFS (Pinata)
- ✅ Store certificate metadata on blockchain
- ✅ Revoke certificates
- ✅ View all issued certificates

### Student Features
- ✅ View certificates issued to them
- ✅ Download certificates
- ✅ View blockchain transaction IDs
- ✅ View verification status
- ✅ Share certificate verification links with QR codes

### Verifier Features
- ✅ Register as an authorized verifier
- ✅ Login with email and password
- ✅ Upload certificate file for verification
- ✅ Verify authenticity via blockchain
- ✅ Check revocation status
- ✅ Verify using certificate hash or link
- ✅ Verify using QR code scanning
- ✅ View verification history
- ✅ View verification statistics

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Ethers.js
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Sequelize ORM)
- **Blockchain**: Solidity, Hardhat, Ethereum/Polygon Testnet
- **Decentralized Storage**: IPFS (Pinata API)
- **Wallet Integration**: MetaMask

## 📁 Project Structure

```
certificate-verification/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/             # React pages
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── VerifierDashboard.jsx
│   │   │   └── VerifyCertificate.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                    # Node.js backend
│   ├── config/
│   │   ├── database.js        # MySQL configuration
│   │   └── blockchain.js      # Blockchain configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   └── certificateController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── upload.js          # Multer file upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Certificate.js
│   │   ├── VerificationLog.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── certificateRoutes.js
│   ├── services/
│   │   ├── ipfsService.js     # IPFS upload service
│   │   └── blockchainService.js # Blockchain interactions
│   ├── index.js
│   └── package.json
│
├── blockchain/                # Smart contracts
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── hardhat.config.js
│   └── package.json
│
├── database/
│   └── schema.sql             # MySQL schema
│
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- MetaMask Browser Extension
- npm or yarn

### Step 1: Database Setup

1. Install MySQL Server
2. Create a new database:
```sql
CREATE DATABASE certificate_verification;
```

3. Import the schema:
```bash
mysql -u root -p certificate_verification < database/schema.sql
```

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Update .env file with your configuration
# See server/.env.example for reference

# Start the backend server
npm run dev
```

The server will run on `http://localhost:5000`

### Step 3: Blockchain Setup

```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Copy .env.example to .env and fill in your values
cp .env.example .env

# Start local Hardhat node
npx hardhat node

# In a new terminal, deploy the contract
npx hardhat run scripts/deploy.js --network localhost
```

### Step 4: Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=certificate_verification
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_ID
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret
CLIENT_URL=http://localhost:5173
```

#### Blockchain (.env)
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_ID
PRIVATE_KEY=your_wallet_private_key
```

## 📱 Usage Guide

### 1. Access the Application
Open `http://localhost:5173` in your browser

### 2. Login
Use demo credentials:
- **Admin**: admin@test.com / Admin@123
- **Student**: student@test.com / Student@123
- **Verifier**: verifier@test.com / Verifier@123

### 3. Connect MetaMask
Click "Connect Wallet" to connect your MetaMask wallet

### 4. Admin: Issue Certificate
1. Login as admin
2. Go to "Issue Certificate" tab
3. Select student, enter certificate name
4. Upload PDF certificate
5. Click "Issue Certificate"

### 5. Student: View Certificates
1. Login as student
2. View all issued certificates
3. Download or share verification links

### 6. Verifier: Verify Certificate
1. Login as verifier
2. Upload certificate PDF or enter hash
3. View verification result

## 🔗 Smart Contract Details

### CertificateRegistry.sol

The smart contract includes:

- **Certificate Struct**: Stores certificate hash, IPFS CID, student address, issuer, timestamp, and revoked status
- **Indexed Revocation**: Uses `mapping(bytes32 => bool) revocationIndex` for O(1) lookup
- **Functions**:
  - `issueCertificate()`: Issues new certificate
  - `verifyCertificate()`: Verifies certificate authenticity
  - `revokeCertificate()`: Revokes a certificate

### Events
- `CertificateIssued`: Emitted when certificate is issued
- `CertificateRevoked`: Emitted when certificate is revoked

## 🔒 Security Features

- JWT authentication for all protected routes
- Role-based access control (Admin, Student, Verifier)
- PDF file validation (only .pdf allowed)
- Duplicate certificate hash prevention
- Admin-only certificate issuance and revocation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/wallet` - Update wallet address

### Certificates
- `POST /api/certificate/issue` - Issue certificate (Admin)
- `POST /api/certificate/revoke` - Revoke certificate (Admin)
- `POST /api/certificate/verify` - Verify certificate
- `GET /api/certificate/student/:id` - Get student certificates
- `GET /api/certificate/all` - Get all certificates (Admin)
- `GET /api/certificate/:id` - Get certificate by ID
- `GET /api/certificate/:id/download` - Download certificate

### Verifier
- `POST /api/verifier/register` - Register new verifier
- `POST /api/verifier/login` - Verifier login
- `GET /api/verifier/profile` - Get verifier profile
- `PUT /api/verifier/profile` - Update verifier profile
- `GET /api/verifier/history` - Get verification history
- `GET /api/verifier/stats` - Get verification statistics

### Verification
- `POST /api/verify/by-hash` - Verify certificate by hash (public)
- `POST /api/verify/by-hash-auth` - Verify certificate by hash (authenticated)
- `POST /api/verify/upload` - Verify certificate by file upload
- `GET /api/verify/public/:hash` - Get public verification data
- `GET /api/verify/ipfs/:cid` - Get certificate from IPFS

## 🧪 Testing

### Test Certificate Issuance
1. Connect MetaMask wallet
2. Login as admin
3. Navigate to Admin Dashboard
4. Fill in certificate details and upload PDF
5. Submit and wait for blockchain confirmation

### Test Verification
1. Login as verifier (or use public verification page)
2. Upload certificate PDF or enter hash
3. View verification result

## 📦 Deployment

### Production Considerations
1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure SSL/HTTPS
4. Use mainnet or production testnet
5. Set up proper database backups
6. Configure firewall rules

## 🤝 License

MIT License - Feel free to use this project for educational and commercial purposes.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check smart contract documentation in `/blockchain/contracts/`

---

Built with ❤️ using React, Node.js, Solidity, and Ethereum

