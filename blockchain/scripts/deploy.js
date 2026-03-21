const hre = require("hardhat");
require("dotenv").config();

/**
 * Deployment script for CertificateRegistry smart contract
 * Deploys to localhost, sepolia, or polygon testnet
 */
async function main() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   Deploying CertificateRegistry Smart Contract");
    console.log("═══════════════════════════════════════════════════════════\n");

    // Get network name
    const networkName = hre.network.name;
    console.log(`📍 Deploying to network: ${networkName}\n`);

    // Get signers (deployer account)
    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Deployer address: ${deployer.address}`);
    
    const balance = await deployer.getBalance();
    console.log(`💰 Deployer balance: ${hre.ethers.utils.formatEther(balance)} ETH\n`);

    // Deploy CertificateRegistry contract
    console.log("🚀 Deploying CertificateRegistry...");
    
    const CertificateRegistry = await hre.ethers.getContractFactory(
        "CertificateRegistry"
    );
    
    const certificateRegistry = await CertificateRegistry.deploy();
    
    await certificateRegistry.deployed();
    
    console.log("✅ Contract deployed successfully!");
    console.log(`📄 Contract address: ${certificateRegistry.address}\n`);

    // Save deployment info
    const deploymentInfo = {
        network: networkName,
        contractAddress: certificateRegistry.address,
        deployerAddress: deployer.address,
        timestamp: new Date().toISOString(),
        transactionHash: certificateRegistry.deployTransaction.hash
    };

    // Verify contract deployment
    console.log("🔍 Verifying contract deployment...");
    const code = await hre.ethers.provider.getCode(certificateRegistry.address);
    if (code === "0x") {
        console.error("❌ Contract deployment verification failed!");
        process.exit(1);
    }
    console.log("✅ Contract verified on network\n");

    // Test contract functions (only on local network)
    if (networkName === "localhost") {
        console.log("🧪 Running contract tests...");
        
        try {
            // Test issuing a certificate
            const testHash = hre.ethers.utils.keccak256(
                hre.ethers.utils.toUtf8String("test-certificate-hash-123")
            );
            const testIpfsCid = "QmTest123456789";
            const testStudent = deployer.address;
            const testIssuer = "Test University";

            console.log("  - Testing issueCertificate...");
            const tx = await certificateRegistry.issueCertificate(
                testHash,
                testIpfsCid,
                testStudent,
                testIssuer
            );
            await tx.wait();
            console.log("  ✅ Certificate issued successfully");

            // Test verification
            console.log("  - Testing verifyCertificate...");
            const verifyResult = await certificateRegistry.verifyCertificate(testHash);
            console.log(`  ✅ Verification result: ${verifyResult.isValid ? "VALID" : "INVALID"}`);

            // Test revocation
            console.log("  - Testing revokeCertificate...");
            const revokeTx = await certificateRegistry.revokeCertificate(testHash);
            await revokeTx.wait();
            console.log("  ✅ Certificate revoked successfully");

            // Verify revocation
            const revokedResult = await certificateRegistry.verifyCertificate(testHash);
            console.log(`  ✅ After revocation: ${revokedResult.isRevoked ? "REVOKED" : "NOT REVOKED"}`);

            console.log("\n✅ All tests passed!\n");
        } catch (error) {
            console.error("❌ Test failed:", error.message);
        }
    }

    // Print summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("   Deployment Summary");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Network:           ${deploymentInfo.network}`);
    console.log(`Contract Address:  ${deploymentInfo.contractAddress}`);
    console.log(`Deployer:          ${deploymentInfo.deployerAddress}`);
    console.log(`Transaction:       ${deploymentInfo.transactionHash}`);
    console.log(`Timestamp:        ${deploymentInfo.timestamp}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    // Update .env file with contract address (only for non-production)
    if (networkName !== "mainnet") {
        const fs = require("fs");
        const envPath = "../server/.env";
        
        try {
            let envContent = fs.readFileSync(envPath, "utf8");
            
            // Replace or add CONTRACT_ADDRESS
            if (envContent.includes("CONTRACT_ADDRESS=")) {
                envContent = envContent.replace(
                    /CONTRACT_ADDRESS=.*/,
                    `CONTRACT_ADDRESS=${certificateRegistry.address}`
                );
            } else {
                envContent += `\nCONTRACT_ADDRESS=${certificateRegistry.address}`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log("💾 Updated server/.env with contract address");
        } catch (error) {
            console.log("⚠️ Could not update .env file:", error.message);
        }
    }

    console.log("🎉 Deployment completed successfully!");
    
    return certificateRegistry.address;
}

// Handle errors
main()
    .then((address) => {
        console.log(`\n📝 Contract address for configuration: ${address}`);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

