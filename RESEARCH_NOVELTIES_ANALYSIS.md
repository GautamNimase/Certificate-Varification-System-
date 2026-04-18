# Research Novelties Analysis - Certificate Verification System

**Date:** $(date)  
**Purpose:** Codebase analysis for research paper/viva justification, mapping claimed novelties to exact implementations.

## 1. Deterministic Certificate Lookup (O(1))
**Exact file:** `blockchain/contracts/CertificateRegistry.sol`  
**Function/Code Snippet:**
```solidity
mapping(bytes32 => Certificate) public certificates;
mapping(bytes32 => bool) public revocationIndex;  // Indexed revocation lookup - O(1)
```
**Implementation:** Direct key-based lookup using certificate hash (bytes32) as mapping key. `verifyCertificate()` first checks `revocationIndex[certificateHash]` (O(1)), then `certificates[certificateHash]`.  
**Why better:** Avoids O(n) linear search over certificate arrays. Traditional systems scan revocation lists; this uses hash table for constant-time access even with millions of certificates.

## 2. Certificate Hashing Mechanism
**Exact file:** `server/services/blockchainService.js`  
**Function/Code Snippet:**
```javascript
const generateCertificateHash = (fileBuffer) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');  // Unique SHA-256 identifier
};
```
**Implementation:** SHA-256 hash of entire PDF file buffer → stored as unique key in blockchain/DB. Referenced in controllers as `certificateHash = generateCertificateHash(fileBuffer)`.  
**Role:** Acts as tamper-proof unique identifier. Any file modification changes hash, enabling instant integrity verification without storing full content on-chain.

## 3. Hybrid Storage (IPFS + Blockchain)
**Exact files:** 
- `blockchain/contracts/CertificateRegistry.sol` (struct: `string ipfsCID`)
- `server/services/ipfsService.js` (`uploadToIPFS()` via Pinata)
- `server/models/Certificate.js` (`ipfs_cid: STRING(255)`)

**Code Snippets:**
```solidity
struct Certificate {
    bytes32 certificateHash;
    string ipfsCID;  // Large files off-chain
    ...
}
```
```javascript
const ipfsCID = await uploadToIPFS(fileBuffer, req.file.originalname);  // Pinata
```
**Implementation:** Large PDFs → IPFS (CID stored), hash + metadata → blockchain/DB. Retrieval: verify hash on-chain → fetch from IPFS.  
**Why better:** Blockchain stores integrity (immutable, O(1)), IPFS handles storage (cheap, decentralized). Separates concerns: integrity vs. availability.

## 4. Certificate Revocation Logic
**Exact files:**
- `blockchain/contracts/CertificateRegistry.sol` (`revokeCertificate()`)
- `server/services/blockchainService.js` (`revokeCertificate()`)
- `server/models/Certificate.js` (`markAsRevoked()`)

**Code Snippets:**
```solidity
function revokeCertificate(bytes32 certificateHash) public ... {
    revocationIndex[certificateHash] = true;  // O(1) flag
    certificates[certificateHash].revoked = true;
}
```
```javascript
exports.revokeCertificate = async (req, res) => {
    blockchainResult = await revokeCertificate(cert.certificate_hash);
    certificate.revoked = true;  // Sync to DB
};
```
**Implementation:** Sets atomic flag `revocationIndex[hash] = true` (no deletion). Backend syncs DB `revoked=true`. Verification checks flag first.  
**Why better:** Immutable history preserved, instant O(1) check. Traditional delete loses audit trail; this flags without data loss.

## 5. Pluggable Architecture
**Separation identified across layers:**
- **Database (MySQL):** `server/models/Certificate.js` (Sequelize ORM), `database/schema.sql` → mutable metadata, revocation logs.
- **Backend (Node.js):** Controllers/services → orchestrates flow (hashing, IPFS, blockchain calls).
- **Blockchain:** `CertificateRegistry.sol` → immutable integrity layer.

**Code Evidence:**
```javascript
Certificate.create({certificate_hash, ipfs_cid, ...});  // MySQL
await issueCertificate(hash, ipfsCID, ...);  // Blockchain
```
**How pluggable:** System uses existing MySQL DB without migration. Blockchain optional (graceful fallbacks). Layers communicate via APIs/services.

## 6. Verification Flow
**Full trace (all files involved):**
1. **Input:** Hash or file upload (`verificationController.js: verifyByHash/verifyByUpload`)
2. **Hash:** `generateCertificateHash(fileBuffer)` → SHA-256 (`blockchainService.js`)
3. **Blockchain lookup:** `verifyCertificate(hash)` → `contract.revocationIndex[hash]` + `certificates[hash]` (`blockchainService.js` → `CertificateRegistry.sol`)
4. **DB metadata:** `Certificate.findOne({certificate_hash})` (`verificationController.js`)
5. **IPFS retrieval:** `getFromIPFS(cid)` if valid (`verificationController.js`)
6. **Log:** `VerificationLog.create()` (`verificationController.js`)

**Why robust:** Multi-layer: integrity (blockchain) + metadata (DB) + content (IPFS). Failures isolated.

## 7. Absence of Probabilistic Structures
**Confirmed:** No mentions of Bloom filter, Cuckoo filter, or probabilistic data structures in any searched/analyzed files.  
**Why deterministic:** Pure hash tables/mappings ensure 100% accuracy, no false positives. Probabilistic filters used in high-volume systems for space savings, but introduce errors unsuitable for legal/academic verification.

## Summary Contribution
| Feature | Code Location | Novelty Contribution |
|---------|---------------|---------------------|
| O(1) Lookup | CertificateRegistry.sol | Deterministic vs O(n) scan |
| SHA-256 Hash | blockchainService.js | Tamper-proof ID |
| Hybrid Storage | ipfsService.js + .sol | Cost-effective scaling |
| Revocation | revokeCertificate() | Immutable flagging |
| Pluggable | MySQL + Node + Solidity | Legacy integration |
| Flow | verificationController.js | Multi-layer verification |
| Deterministic | No probabilistic structs | Zero false positives |

**All novelties implemented.** Ready for research paper/viva defense.


