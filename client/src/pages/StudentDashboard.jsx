import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, type = "button", className = "" }) => {
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Helper function to get IPFS URL
const getIPFSUrl = (cid) => {
  if (!cid) return null;
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};

// Check if CID is valid (not mock or empty)
const isValidIPFSCID = (cid) => {
  if (!cid) return false;
  // Check for common mock CID patterns
  const mockPatterns = ['mock', 'test', 'example', 'placeholder', 'demo', ''];
  const cidString = String(cid).toLowerCase().trim();
  return !mockPatterns.some(pattern => cidString === pattern || cidString.includes(pattern));
};

function StudentDashboard() {
  const { user, logout, getToken, API_URL, walletAddress, connectWallet, isMetaMaskInstalled } = useContext(AuthContext);
  
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`${API_URL}/student/certificates`, {
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
    setLoading(false);
  };

  const fetchCertificateDetails = async (certHash) => {
    console.log('Fetching certificate details for:', certHash);
    try {
      // Encode the certificate hash to handle special characters
      const encodedHash = encodeURIComponent(certHash);
      const response = await fetch(`${API_URL}/student/certificate/${encodedHash}`, {
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Certificate details response:', data);
      if (data.success) {
        setSelectedCert(data.data.certificate);
        setVerificationHistory(data.data.verificationHistory || []);
        setShowDetails(true);
      } else {
        alert('Error: ' + (data.message || 'Failed to fetch certificate details'));
      }
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      alert('Error fetching certificate details: ' + error.message);
    }
  };

  const handleDownload = async (certificate) => {
    setDownloading(true);
    try {
      // Encode the certificate hash to handle special characters
      const encodedHash = encodeURIComponent(certificate.certificate_hash);
      const response = await fetch(`${API_URL}/student/download/${encodedHash}`, {
        headers: { 
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificate.certificate_name.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const errorData = await response.json();
        alert('Download failed: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate');
    }
    setDownloading(false);
  };

  const copyVerificationLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Verification link copied to clipboard!');
  };

  const getExplorerUrl = (txHash) => {
    const baseUrl = 'https://sepolia.etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-gray-500">Your Academic Certificates</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button onClick={logout} variant="secondary">Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!walletAddress && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-yellow-800">Connect your MetaMask wallet to view blockchain-verified certificates.</p>
              <Button onClick={connectWallet} disabled={!isMetaMaskInstalled}>
                {isMetaMaskInstalled ? 'Connect Wallet' : 'Install MetaMask'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
                <p className="text-sm text-gray-500">Total Certificates</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{certificates.filter(c => !c.revoked).length}</p>
                <p className="text-sm text-gray-500">Valid Certificates</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{certificates.filter(c => c.revoked).length}</p>
                <p className="text-sm text-gray-500">Revoked Certificates</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-bold mb-6">Your Certificates</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">No certificates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((cert) => (
                    <tr 
                      key={cert.id} 
                      className={`hover:bg-gray-50 ${cert.revoked ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cert.certificate_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{cert.certificate_hash}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cert.issuer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {/* Handle blockchain timestamps (in seconds) - convert to milliseconds */}
                          {cert.created_at > 9999999999 
                            ? new Date(parseInt(cert.created_at) * 1000).toLocaleDateString()
                            : new Date(cert.created_at).toLocaleDateString()
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cert.revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {cert.revoked ? 'Revoked' : 'Valid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => fetchCertificateDetails(cert.certificate_hash)}
                            variant="secondary"
                            className="text-xs px-3 py-1"
                          >
                            Details
                          </Button>
                          <Button 
                            onClick={() => handleDownload(cert)}
                            variant="secondary"
                            disabled={downloading}
                            className="text-xs px-3 py-1"
                          >
                            {downloading ? 'Downloading...' : 'Download'}
                          </Button>
                          <Button 
                            onClick={() => copyVerificationLink(cert.verificationLink)}
                            className="text-xs px-3 py-1"
                          >
                            Share
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {showDetails && selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Certificate Details</h3>
                <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Revoked Warning Message */}
                {selectedCert.revoked && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-red-800 font-medium">
                        This certificate has been revoked by the issuer.
                      </p>
                    </div>
                    {selectedCert.revoked_at && (
                      <p className="text-xs text-red-600 mt-2">
                        Revoked on: {
                          selectedCert.revoked_at > 9999999999
                            ? new Date(parseInt(selectedCert.revoked_at) * 1000).toLocaleDateString()
                            : new Date(selectedCert.revoked_at).toLocaleDateString()
                        }
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Certificate Name</p>
                    <p className="font-medium">{selectedCert.certificate_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedCert.revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedCert.revoked ? 'Revoked' : 'Valid'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issuer</p>
                    <p className="font-medium">{selectedCert.issuer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium">
                      {/* Handle both seconds (blockchain) and milliseconds (database) timestamps */}
                      {selectedCert.created_at > 9999999999 
                        ? new Date(parseInt(selectedCert.created_at) * 1000).toLocaleDateString()
                        : new Date(selectedCert.created_at).toLocaleDateString()
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Certificate Hash</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{selectedCert.certificate_hash}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">IPFS CID</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{selectedCert.ipfs_cid}</p>
                </div>

                {/* View Certificate on IPFS button */}
                {selectedCert.ipfs_cid && isValidIPFSCID(selectedCert.ipfs_cid) && (
                  <div>
                    <a 
                      href={getIPFSUrl(selectedCert.ipfs_cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Certificate on IPFS
                    </a>
                  </div>
                )}

                {selectedCert.blockchain_tx_hash && (
                  <div>
                    <p className="text-sm text-gray-500">Blockchain Transaction</p>
                    <a 
                      href={getExplorerUrl(selectedCert.blockchain_tx_hash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-mono text-xs bg-gray-100 p-2 rounded break-all text-primary-600 hover:underline"
                    >
                      {selectedCert.blockchain_tx_hash}
                    </a>
                  </div>
                )}
              </div>

              {/* Action buttons - always show for all certificate statuses */}
              <div className="flex space-x-4 mb-6">
                <Button onClick={() => handleDownload(selectedCert)} disabled={downloading}>
                  {downloading ? 'Downloading...' : 'Download Certificate'}
                </Button>
                <Button onClick={() => copyVerificationLink(selectedCert.verificationLink)} variant="secondary">
                  Copy Verification Link
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-bold mb-4">Verification History</h4>
                {verificationHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No verification attempts yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {verificationHistory.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            <span className={`px-2 py-1 rounded text-xs ${
                              log.result === 'VALID' ? 'bg-green-100 text-green-800' : 
                              log.result === 'REVOKED' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.result}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.verifier ? log.verifier.name : 'Unknown'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;

